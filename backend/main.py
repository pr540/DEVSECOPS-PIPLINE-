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

# --- SECURITY ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@router.get("/movies", response_model=List[dict])
def get_movies(db: Session = Depends(get_db)):
    metrics["requests_total"] += 1
    movies = db.query(MovieModel).all()
    if not movies:
        seed_data = [
            MovieModel(title="Interstellar", description="Space exploration", rating=8.7, image="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", genre="Sci-Fi"),
            MovieModel(title="The Dark Knight", description="Batman vs Joker", rating=9.0, image="https://images.unsplash.com/photo-1478720568477-152d9b164e26", genre="Action")
        ]
        db.add_all(seed_data)
        db.commit()
        movies = db.query(MovieModel).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "rating": m.rating,
            "image": m.image,
            "genre": m.genre
        } for m in movies
    ]

# Include router for both / and /api (to handle Vercel rewrites reliably)
app.include_router(router)
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
