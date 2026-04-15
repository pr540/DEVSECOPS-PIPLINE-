import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta

app = FastAPI(title="CineBook DevSecOps API")

# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-key-for-local-use-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Security Headers & CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

class Movie(BaseModel):
    id: int
    title: str
    description: str
    rating: float
    image: str
    genre: str

# Mock Data
MOVIES = [
    {
        "id": 1,
        "title": "Interstellar",
        "description": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        "rating": 8.7,
        "image": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa",
        "genre": "Sci-Fi"
    },
    {
        "id": 2,
        "title": "The Dark Knight",
        "description": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham.",
        "rating": 9.0,
        "image": "https://images.unsplash.com/photo-1478720568477-152d9b164e26",
        "genre": "Action"
    },
    {
        "id": 3,
        "title": "Inception",
        "description": "A thief who steals corporate secrets through the use of dream-sharing technology.",
        "rating": 8.8,
        "image": "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
        "genre": "Action"
    }
]

@app.get("/")
def read_root():
    return {"message": "Welcome to TicketBooking DevSecOps API"}

@app.get("/movies", response_model=List[Movie])
def get_movies():
    return MOVIES

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
