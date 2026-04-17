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
    if q:
        search = f"%{q}%"
        query = query.filter((Movie.title.ilike(search)) | (Movie.description.ilike(search)) | (Movie.language.ilike(search)))
    
    movies = query.all()
    # Auto-seed ONLY if the ENTIRE database is empty, to avoid infinite loops on valid empty searches
    if not movies and db.query(Movie).count() == 0 and not category_id:
        _seed(db)
        movies = db.query(Movie).all()
    return movies

@api.post("/movies/seed")
def force_seed(db: Session = Depends(get_db)):
    _seed(db)
    return {"status": "Database synchronization triggered"}

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
    # Precise Era Sync
    cat_names = ["Golden Archive (1990-2000)", "Modern Era (2001-2026)", "Upcoming Nodes"]
    for name in cat_names:
        if not db.query(Category).filter(Category.name == name).first():
            db.add(Category(name=name))
            db.commit()
    
    golden_cat = db.query(Category).filter(Category.name == "Golden Archive (1990-2000)").first()
    modern_cat = db.query(Category).filter(Category.name == "Modern Era (2001-2026)").first()
    upcoming_cat = db.query(Category).filter(Category.name == "Upcoming Nodes").first()

    # Re-seed with Exact Epochs
    seed_movies = [
        # --- 1990 - 2000 ---
        {"title": "Jurassic Park", "description": "Classic dinosaur adventure.", "rating": 9.3, "image": "https://images.unsplash.com/photo-1542204172-3c1f837066ad", "language": "English", "quality": "1080p", "year": 1993, "cat": golden_cat},
        {"title": "DDLJ", "description": "Iconic Bollywood romance.", "rating": 9.5, "image": "https://images.unsplash.com/photo-1536440136628-849c177e76a1", "language": "Hindi", "quality": "1080p", "year": 1995, "cat": golden_cat},
        {"title": "Baashha", "description": "Rajinikanth's cult classic.", "rating": 9.4, "image": "https://images.unsplash.com/photo-1531259683007-016a7b628fc3", "language": "Tamil", "quality": "1080p", "year": 1995, "cat": golden_cat},
        {"title": "Shiva", "description": "Intense college drama.", "rating": 9.2, "image": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb", "language": "Telugu", "quality": "1080p", "year": 1989, "cat": golden_cat},
        {"title": "Titanic", "description": "Epic tragedy.", "rating": 8.8, "image": "https://images.unsplash.com/photo-1594909122845-11baa439b7bf", "language": "English", "quality": "1080p", "year": 1997, "cat": golden_cat},

        # --- 2001 - 2026 ---
        {"title": "Vishwambhara", "description": "Megastar Chiranjeevi's epic.", "rating": 9.6, "image": "https://images.unsplash.com/photo-1542204172-3c1f837066ad", "language": "Telugu", "quality": "1080p", "year": 2025, "cat": modern_cat},
        {"title": "Pushpa 2", "description": "The rule begins.", "rating": 9.4, "image": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb", "language": "Telugu", "quality": "1080p", "year": 2024, "cat": modern_cat},
        {"title": "Kalki 2898 AD", "description": "Mythology sci-fi.", "rating": 9.2, "image": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", "language": "Telugu", "quality": "1080p", "year": 2024, "cat": modern_cat},
        {"title": "Animal", "description": "Dark thriller.", "rating": 8.5, "image": "https://images.unsplash.com/photo-1534447677768-be436bb09401", "language": "Hindi", "quality": "1080p", "year": 2023, "cat": modern_cat},
        {"title": "Dune 2", "description": "Interstellar journey.", "rating": 9.3, "image": "https://images.unsplash.com/photo-1535016120720-40c646bebbcf", "language": "English", "quality": "1080p", "year": 2024, "cat": modern_cat},
        {"title": "RRR", "description": "Revolutionary epic.", "rating": 9.0, "image": "https://images.unsplash.com/photo-1531259683007-016a7b628fc3", "language": "Telugu", "quality": "1080p", "year": 2022, "cat": modern_cat},
        
        # --- UPCOMING ---
        {"title": "Devara Part 2", "description": "Coastal war continues.", "rating": 9.7, "image": "https://images.unsplash.com/photo-1536440136628-849c177e76a1", "language": "Telugu", "quality": "1080p", "year": 2026, "cat": upcoming_cat},
        {"title": "The Avatar Core", "description": "Deep sea exploration.", "rating": 8.9, "image": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", "language": "English", "quality": "1080p", "year": 2026, "cat": upcoming_cat},
        {"title": "Spirit", "description": "Prabhas in intense cop role.", "rating": 9.8, "image": "https://images.unsplash.com/photo-1509248961158-e54f6934749c", "language": "Telugu", "quality": "1080p", "year": 2025, "cat": upcoming_cat},
    ]

    for m in seed_movies:
        if not db.query(Movie).filter(Movie.title == m["title"]).first():
            if m["cat"]:
                db.add(Movie(
                    title=m["title"], description=m["description"], rating=m["rating"],
                    image=m["image"], language=m["language"], quality="1080p",
                    video_url=f"movies/{m['title'].lower().replace(' ', '_')}.m3u8",
                    download_url=f"https://archive.org/details/{m['title'].lower().replace(' ', '_')}",
                    year=m["year"], category_id=m["cat"].id
                ))
    db.commit()




app.include_router(api)

