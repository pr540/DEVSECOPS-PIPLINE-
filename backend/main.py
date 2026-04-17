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

import sys
# Dynamic path resolution for Vercel
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    import database
    import auth_utils
    import storage
except ImportError:
    from . import database
    from . import auth_utils
    from . import storage

from database import get_db, Movie, User, Category, WatchHistory, favorites, init_db, _seed
from auth_utils import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user, get_current_admin, ACCESS_TOKEN_EXPIRE_MINUTES
)
from storage import generate_presigned_url

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
api = APIRouter()

@api.get("/health")
def health():
    return {"status": "Operational", "timestamp": datetime.now()}

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

# Initialize DB lazily to prevent cold start timeouts
_db_ready = False

def get_db_session():
    global _db_ready
    from .database import SessionLocal, init_db
    if not _db_ready:
        try:
            init_db()
            _db_ready = True
        except Exception as e:
            print(f"Lazy Init Error: {e}")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Use our high-res dependency for all endpoints
DB = Depends(get_db_session)

@api.get("/movies", response_model=List[MovieSchema])
def list_movies(
    category_id: Optional[int] = None,
    language: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    q: Optional[str] = None,
    db: Session = DB
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
    # Auto-seed fallback ONLY if database is empty and no filter is active
    if not movies and not category_id and not q and db.query(Movie).count() == 0:
        try:
            from .database import _seed
            _seed(db)
            movies = db.query(Movie).all()
        except: pass
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

# API Inclusion
app.include_router(api)




app.include_router(api)

