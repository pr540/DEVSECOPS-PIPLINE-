import os
import time
from datetime import timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, Security, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .database import get_db, Movie, User, favorites
from .auth_utils import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user, get_current_admin, ACCESS_TOKEN_EXPIRE_MINUTES
)
from .storage import generate_presigned_url

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="CineStream API Pro",
    version="2.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class UserSchema(BaseModel):
    id: Optional[int] = None
    username: str
    email: EmailStr
    role: str = "user"

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserSchema

class MovieSchema(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    rating: float
    image: str
    genre: str
    language: Optional[str] = "English"
    quality: Optional[str] = "1080p Full HD"
    video_url: Optional[str] = None
    download_url: Optional[str] = None
    year: Optional[int] = None
    collection: Optional[str] = "All"

    class Config:
        from_attributes = True

# --- API ROUTES ---
api_router = APIRouter(prefix="/api")

# AUTH
@api_router.post("/auth/signup", response_model=UserSchema)
@limiter.limit("5/minute")
def signup(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        username=user_in.username, 
        email=user_in.email, 
        hashed_password=hashed_pw,
        role="user" # Default
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@api_router.post("/auth/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

@api_router.get("/auth/me", response_model=UserSchema)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# MOVIES
@api_router.get("/movies", response_model=List[MovieSchema])
def get_movies(
    collection: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    query = db.query(Movie)
    if collection and collection != "All":
        query = query.filter(Movie.collection == collection)
    
    movies = query.all()
    
    # Pre-seed if empty
    if not movies and not collection:
        seed = [
            Movie(title="Deadpool & Wolverine", description="MCU chaos.", rating=9.0, image="https://images.unsplash.com/photo-1509347528160-9a9e33742cdb", genre="Action", collection="2000-2026", year=2024, video_url="movies/deadpool.m3u8"),
            Movie(title="Pulp Fiction", description="Tarantino classic.", rating=8.9, image="https://images.unsplash.com/photo-1535016120720-40c646bebbcf", genre="Crime", collection="90s", year=1994, video_url="movies/pulpfiction.m3u8"),
            Movie(title="Pushpa 2", description="The Rule.", rating=9.5, image="https://images.unsplash.com/photo-1594909122845-11baa439b7bf", genre="Action", collection="2000-2026", year=2025, video_url="movies/pushpa2.m3u8")
        ]

        db.add_all(seed)
        db.commit()
        movies = db.query(Movie).all()
        
    return movies

@api_router.get("/movies/{movie_id}/stream")
def get_movie_stream(movie_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # If video_url is a path in MinIO, generate presigned URL
    if movie.video_url and not movie.video_url.startswith("http"):
        stream_url = generate_presigned_url(movie.video_url)
        return {"url": stream_url}
    
    return {"url": movie.video_url}

# FAVORITES
@api_router.post("/movies/{movie_id}/favorite")
def favorite_movie(movie_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    if movie not in current_user.favorite_movies:
        current_user.favorite_movies.append(movie)
        db.commit()
    return {"status": "success"}

@api_router.delete("/movies/{movie_id}/favorite")
def unfavorite_movie(movie_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    if movie in current_user.favorite_movies:
        current_user.favorite_movies.remove(movie)
        db.commit()
    return {"status": "success"}

@api_router.get("/favorites", response_model=List[MovieSchema])
def get_favorites(current_user: User = Depends(get_current_user)):
    return current_user.favorite_movies

# MONITORING & AUDIT
@api_router.get("/health")
def health():
    return {"status": "healthy", "timestamp": time.time()}

@api_router.get("/audit")
def audit():
    return [
        {"id": 1, "action": "LOGIN_SUCCESS", "user": "admin", "status": "Success", "timestamp": "2026-04-16 20:00:00"},
        {"id": 2, "action": "MINIO_OBJ_READ", "user": "system", "status": "Success", "timestamp": "2026-04-16 20:05:00"},
        {"id": 3, "action": "JWT_KEY_ROTATED", "user": "sec-bot", "status": "Success", "timestamp": "2026-04-16 21:00:00"}
    ]

# Include routes
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
