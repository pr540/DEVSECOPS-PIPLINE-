import os
import time
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from .database import get_db, MovieModel

app = FastAPI(
    title="CineBook DevSecOps API",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs"
)

# Monitoring state
start_time = time.time()
metrics = {"requests_total": 0, "db_status": "healthy"}

# --- SECURITY & CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class MovieSchema(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    rating: float
    image: str
    genre: str
    language: Optional[str] = "English"
    category: Optional[str] = "Latest"

    class Config:
        from_attributes = True

# --- DUMMY AUDIT LOGS ---
audit_logs = [
    {"id": 1, "action": "DATABASE_SEED", "user": "System", "timestamp": "2026-04-15 12:00:01", "status": "Success"},
    {"id": 2, "action": "SAST_SCAN_INIT", "user": "CI/CD", "timestamp": "2026-04-15 12:05:22", "status": "Passed"},
    {"id": 3, "action": "SCA_SCAN_RUN", "user": "Actions", "timestamp": "2026-04-15 12:06:45", "status": "Completed"},
    {"id": 4, "action": "UNAUTHORIZED_ACCESS_BLOCKED", "user": "Unknown", "timestamp": "2026-04-15 12:10:11", "status": "Alert"}
]

# --- ROUTES ---
router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Welcome to CineBook API", "status": "operational"}

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "uptime": f"{int(time.time() - start_time)}s",
        "requests": metrics["requests_total"],
        "database": metrics["db_status"]
    }

@router.get("/audit", response_model=List[dict])
def get_audit_logs():
    return audit_logs

@router.get("/movies", response_model=List[MovieSchema])
def get_movies(db: Session = Depends(get_db)):
    metrics["requests_total"] += 1
    movies = db.query(MovieModel).all()
    if not movies:
        seed_data = [
            MovieModel(title="Interstellar", description="Space exploration", rating=8.7, image="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", genre="Sci-Fi"),
            MovieModel(title="The Dark Knight", description="Batman vs Joker", rating=9.0, image="https://images.unsplash.com/photo-1478720568477-152d9b164e26", genre="Action"),
            MovieModel(title="Pushpa 2", description="The Rule begins", rating=8.5, image="https://images.unsplash.com/photo-1594909122845-11baa439b7bf", genre="Action")
        ]
        db.add_all(seed_data)
        db.commit()
        movies = db.query(MovieModel).all()
    return movies

@router.post("/movies", response_model=MovieSchema)
def create_movie(movie: MovieSchema, db: Session = Depends(get_db)):
    db_movie = MovieModel(**movie.dict(exclude={'id'}))
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie

# Include router
app.include_router(router)
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
