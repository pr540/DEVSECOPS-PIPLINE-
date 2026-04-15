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

# Monitoring state (Prometheus Style)
start_time = time.time()
metrics = {
    "requests_total": 0,
    "db_status": "healthy",
    "last_error": None
}

# --- SECURITY ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Security Headers Middleware
@app.middleware("http")
async def monitor_request(request, call_next):
    metrics["requests_total"] += 1
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

class MovieSchema(BaseModel):
    id: Optional[int]
    title: str
    description: str
    rating: float
    image: str
    genre: str

    class Config:
        from_attributes = True

# --- API ENDPOINTS ---

@app.get("/api")
def read_root():
    return {"message": "Welcome to CineBook API", "status": "operational"}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "uptime": f"{int(time.time() - start_time)}s",
        "requests": metrics["requests_total"],
        "database": metrics["db_status"]
    }

@app.get("/api/metrics")
def get_prometheus_metrics():
    # Format for Grafana/Prometheus
    uptime = int(time.time() - start_time)
    return (
        f"# HELP requests_total Total number of requests processed\n"
        f"requests_total {metrics['requests_total']}\n"
        f"# HELP uptime_seconds Total uptime in seconds\n"
        f"uptime_seconds {uptime}\n"
    )

@app.get("/api/movies", response_model=List[MovieSchema])
def get_movies(db: Session = Depends(get_db)):
    movies = db.query(MovieModel).all()
    
    # Seed data if empty
    if not movies:
        seed_data = [
            MovieModel(title="Interstellar", description="Space exploration", rating=8.7, image="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", genre="Sci-Fi"),
            MovieModel(title="The Dark Knight", description="Batman vs Joker", rating=9.0, image="https://images.unsplash.com/photo-1478720568477-152d9b164e26", genre="Action"),
            MovieModel(title="Inception", description="Dream robbery", rating=8.8, image="https://images.unsplash.com/photo-1536440136628-849c177e76a1", genre="Sci-Fi")
        ]
        db.add_all(seed_data)
        db.commit()
        movies = db.query(MovieModel).all()
        
    return movies

@app.post("/api/movies", response_model=MovieSchema)
def create_movie(movie: MovieSchema, db: Session = Depends(get_db)):
    db_movie = MovieModel(**movie.dict(exclude={'id'}))
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
