import os
import time
from datetime import timedelta, datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, Security, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .database import get_db, Movie, User, Category, WatchHistory, favorites, init_db
from .auth_utils import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user, get_current_admin, ACCESS_TOKEN_EXPIRE_MINUTES
)
from .storage import generate_presigned_url

limiter = Limiter(key_func=get_remote_address)
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app = FastAPI(title="CineStream Pro API", version="3.1.0")
app.add_middleware(SecurityHeadersMiddleware)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def startup():
    init_db()
    from .database import SessionLocal
    db = SessionLocal()
    try:
        _seed(db)
    finally:
        db.close()

# --- Pydantic Schemas ---
class CategoryBase(BaseModel):
    name: str
class CategorySchema(CategoryBase):
    id: int
    class Config: from_attributes = True

class MovieBase(BaseModel):
    title: str
    description: str
    rating: float
    image: str
    language: str
    quality: str
    video_url: str
    download_url: Optional[str] = None
    year: int
    category_id: int

class MovieSchema(MovieBase):
    id: int
    class Config: from_attributes = True

class UserSchema(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    class Config: from_attributes = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserSchema

# --- API ---
api = APIRouter(prefix="/api")

# AUTH
@api.post("/auth/signup", response_model=UserSchema)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username exists")
    new_user = User(
        username=user_in.username, 
        email=user_in.email, 
        password_hash=get_password_hash(user_in.password),
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@api.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "user": user}

@api.get("/auth/me", response_model=UserSchema)
def me(current_user: User = Depends(get_current_user)):
    return current_user

# MOVIES & FILTERS
@api.get("/movies", response_model=List[MovieSchema])
def list_movies(
    category_id: Optional[int] = None,
    language: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Movie)
    if category_id: query = query.filter(Movie.category_id == category_id)
    if language: query = query.filter(Movie.language == language)
    if year_from: query = query.filter(Movie.year >= year_from)
    if year_to: query = query.filter(Movie.year <= year_to)
    if q: query = query.filter(Movie.title.ilike(f"%{q}%"))
    
    movies = query.all()
    if not movies and not category_id: # Seed if empty
        _seed(db)
        movies = db.query(Movie).all()
    return movies

@api.get("/categories", response_model=List[CategorySchema])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@api.get("/movies/{movie_id}", response_model=MovieSchema)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie: raise HTTPException(status_code=404, detail="Not found")
    return movie

# USER HISTORY
@api.get("/history", response_model=List[MovieSchema])
def get_user_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch top 12 most recent movies watched by the user
    history = db.query(WatchHistory).filter(WatchHistory.user_id == user.id).order_by(WatchHistory.watched_at.desc()).limit(12).all()
    movie_ids = [h.movie_id for h in history]
    if not movie_ids: return []
    
    # Efficiently fetch movies and maintain their temporal order
    movies = db.query(Movie).filter(Movie.id.in_(movie_ids)).all()
    movies_dict = {m.id: m for m in movies}
    return [movies_dict[mid] for mid in movie_ids if mid in movies_dict]

# STREAMING
@api.get("/movies/{movie_id}/stream")
def stream(movie_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie: raise HTTPException(status_code=404, detail="Not found")
    
    # Update watch history (only once per movie to avoid duplicates)
    if not db.query(WatchHistory).filter(WatchHistory.user_id == user.id, WatchHistory.movie_id == movie.id).first():
        history = WatchHistory(user_id=user.id, movie_id=movie.id)
        db.add(history)
        db.commit()
    
    url = movie.video_url
    if url and not url.startswith("http"):
        url = generate_presigned_url(url)
    return {"url": url, "quality_options": ["480p", "720p", "1080p"]}

# ADMIN
@api.post("/admin/upload")
def admin_upload(
    title: str = Form(...),
    description: str = Form(...),
    rating: float = Form(...),
    language: str = Form(...),
    year: int = Form(...),
    category_id: int = Form(...),
    video: UploadFile = File(...),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Mock file upload path
    path = f"movies/{video.filename}"
    movie = Movie(
        title=title, description=description, rating=rating,
        image="https://images.unsplash.com/photo-1536440136628-849c177e76a1",
        language=language, quality="1080p", video_url=path, year=year,
        category_id=category_id
    )
    db.add(movie)
    db.commit()
    return {"status": "Movie uploaded successfully", "id": movie.id}

def _seed(db: Session):
    if db.query(Category).count() == 0:
        cats = [
            Category(name="Trending Now"), 
            Category(name="Latest Releases"), 
            Category(name="Global Language Cores"),
            Category(name="Premium Archive"),
            Category(name="IMAX Special Collection")
        ]
        db.add_all(cats)
        db.commit()
    
    trending_cat = db.query(Category).filter(Category.name == "Trending Now").first()
    latest_cat = db.query(Category).filter(Category.name == "Latest Releases").first()
    global_cat = db.query(Category).filter(Category.name == "Global Language Cores").first()

    if db.query(Movie).count() < 15:
        movies = [
            # Telugu (Primary Focus)
            Movie(title="Vishwambhara", description="Socio-fantasy epic starring Chiranjeevi.", rating=9.6, image="https://images.unsplash.com/photo-1542204172-3c1f837066ad", language="Telugu", quality="1080p 10-Bit", video_url="movies/telugu1.m3u8", download_url="https://archive.org/details/vishwambhara_telugu", year=2025, category_id=latest_cat.id),
            Movie(title="Devara: Part 1", description="NTR Jr in a coastal action drama.", rating=8.5, image="https://images.unsplash.com/photo-1536440136628-849c177e76a1", language="Telugu", quality="1080p Full HD", video_url="movies/telugu2.m3u8", download_url="https://archive.org/details/devara_telugu", year=2024, category_id=trending_cat.id),
            Movie(title="Pushpa 2: The Rule", description="Allu Arjun returns as Pushpa Raj.", rating=9.4, image="https://images.unsplash.com/photo-1594909122845-11baa439b7bf", language="Telugu", quality="1080p HDR", video_url="movies/telugu3.m3u8", download_url="https://archive.org/details/pushpa2_telugu", year=2024, category_id=trending_cat.id),
            Movie(title="Kalki 2898 AD", description="Mythology meets sci-fi.", rating=9.2, image="https://images.unsplash.com/photo-1509347528160-9a9e33742cdb", language="Telugu", quality="1080p IMAX", video_url="movies/telugu4.m3u8", download_url="https://archive.org/details/kalki_telugu", year=2024, category_id=latest_cat.id),
            Movie(title="Baahubali: The Conclusion", description="Historical epic masterpiece.", rating=9.5, image="https://images.unsplash.com/photo-1535016120720-40c646bebbcf", language="Telugu", quality="1080p BluRay", video_url="movies/telugu5.m3u8", download_url="https://archive.org/details/baahubali2_telugu", year=2017, category_id=global_cat.id),
            # Hindi
            Movie(title="Jawan", description="SRK in a high-octane thriller.", rating=8.9, image="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", language="Hindi", quality="1080p Full HD", video_url="movies/hindi1.m3u8", download_url="https://archive.org/details/jawan_hindi", year=2023, category_id=trending_cat.id),
            Movie(title="Dangal", description="Inspiring wrestling saga.", rating=9.1, image="https://images.unsplash.com/photo-1536440136628-849c177e76a1", language="Hindi", quality="1080p UHD", video_url="movies/hindi2.m3u8", download_url="https://archive.org/details/dangal_hindi", year=2016, category_id=global_cat.id),
            # English
            Movie(title="Gladiator II", description="The legacy of Rome continues.", rating=8.8, image="https://images.unsplash.com/photo-1594909122845-11baa439b7bf", language="English", quality="1080p Ultra HD", video_url="movies/gladiator.m3u8", download_url="https://archive.org/details/gladiator_ii", year=2024, category_id=trending_cat.id),
            Movie(title="Dune: Part Two", description="Paul Atreides unites with Chani.", rating=9.3, image="https://images.unsplash.com/photo-1536440136628-849c177e76a1", language="English", quality="1080p IMAX", video_url="movies/dune2.m3u8", download_url="https://archive.org/details/dune2_english", year=2024, category_id=latest_cat.id),
            # Other Languages
            Movie(title="Leo", description="Thalapathy Vijay in LCU.", rating=8.7, image="https://images.unsplash.com/photo-1509347528160-9a9e33742cdb", language="Tamil", quality="1080p Full HD", video_url="movies/tamil1.m3u8", download_url="https://archive.org/details/leo_tamil", year=2023, category_id=trending_cat.id),
            Movie(title="Manjummel Boys", description="Survival journey.", rating=9.3, image="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", language="Malayalam", quality="1080p Ultra HD", video_url="movies/manjummel.m3u8", download_url="https://archive.org/details/manjummel_malayalam", year=2024, category_id=latest_cat.id),
            Movie(title="KGF Chapter 2", description="Rocky's empire.", rating=9.4, image="https://images.unsplash.com/photo-1536440136628-849c177e76a1", language="Kannada", quality="1080p IMAX", video_url="movies/kgf2.m3u8", download_url="https://archive.org/details/kgf2_kannada", year=2022, category_id=global_cat.id),
        ]
        db.add_all(movies)
        db.commit()
    
    # Also seed an admin user
    if not db.query(User).filter(User.username == "admin").first():
        admin = User(username="admin", email="admin@cinestream.com", password_hash=get_password_hash("admin123"), role="admin")
        db.add(admin)
        db.commit()

app.include_router(api)
