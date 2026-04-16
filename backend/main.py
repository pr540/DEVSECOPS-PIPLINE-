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
# In production, this should be restricted to your domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be os.getenv("ALLOWED_ORIGINS", "*")
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
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
    quality: Optional[str] = "1080p Full HD"
    video_url: Optional[str] = None
    download_url: Optional[str] = None

    class Config:
        from_attributes = True

# --- DUMMY AUDIT LOGS ---
audit_logs = [
    {"id": 1, "action": "DATABASE_SEED", "user": "System", "timestamp": "2026-04-15 12:00:01", "status": "Success"},
    {"id": 2, "action": "SAST_SCAN_INIT", "user": "CI/CD", "timestamp": "2026-04-15 12:05:22", "status": "Passed"},
    {"id": 3, "action": "SCA_SCAN_RUN", "user": "Actions", "timestamp": "2026-04-15 12:06:45", "status": "Completed"},
    {"id": 4, "action": "UNAUTHORIZED_ACCESS_BLOCKED", "user": "WAF", "timestamp": "2026-04-15 12:10:11", "status": "Allowed"},
    {"id": 5, "action": "IP_RESTRICTION_ENFORCED", "user": "SecOps", "timestamp": "2026-04-16 08:30:00", "status": "Resolved"}
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
            # Latest Releases
            MovieModel(title="Interstellar", description="Space exploration epic", rating=8.7, image="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", genre="Sci-Fi", language="English", category="Latest", quality="4K Ultra HD", video_url="https://www.youtube.com/embed/zSWdZVtXT7E", download_url="https://cinestream.hd/dl/interstellar_4k.mkv"),
            MovieModel(title="Pushpa 2", description="The Rule begins", rating=8.5, image="https://images.unsplash.com/photo-1594909122845-11baa439b7bf", genre="Action", language="Hindi", category="Latest", quality="1080p Full HD", video_url="https://www.youtube.com/embed/uPeXv6Kvxw0", download_url="https://cinestream.hd/dl/pushpa2_hd.mp4"),
            
            # Present / Recent
            MovieModel(title="Kalki 2898 AD", description="Mythology meets sci-fi", rating=8.2, image="https://images.unsplash.com/photo-1536440136628-849c177e76a1", genre="Sci-Fi", language="Hindi", category="Present", quality="1080p Full HD", video_url="https://www.youtube.com/embed/WJ6U9Y_m8y4", download_url="https://cinestream.hd/dl/kalki_hd.mp4"),
            MovieModel(title="Dune: Part Two", description="The journey continues", rating=8.9, image="https://images.unsplash.com/photo-1509347528160-9a9e33742cdb", genre="Sci-Fi", language="English", category="Present", quality="4K Ultra HD", video_url="https://www.youtube.com/embed/Way9Dexny3w", download_url="https://cinestream.hd/dl/dune2_4k.mkv"),
            
            # Old / Classics
            MovieModel(title="The Dark Knight", description="Batman vs Joker", rating=9.0, image="https://images.unsplash.com/photo-1478720568477-152d9b164e26", genre="Action", language="English", category="Classic", quality="1080p Full HD", video_url="https://www.youtube.com/embed/EXeTwQWrcwY", download_url="https://cinestream.hd/dl/darkknight_hd.mp4"),
            MovieModel(title="The Godfather", description="Crime family saga", rating=9.2, image="https://images.unsplash.com/photo-1536440136628-849c177e76a1", genre="Crime", language="English", category="Classic", quality="720p BluRay", video_url="https://www.youtube.com/embed/UaVTIH8mujA", download_url="https://cinestream.hd/dl/godfather_720.mp4"),
            MovieModel(title="Sholay", description="Indian action classic", rating=8.8, image="https://images.unsplash.com/photo-1594909122845-11baa439b7bf", genre="Action", language="Hindi", category="Classic", quality="1080p Full HD", video_url="https://www.youtube.com/embed/v9ZlyX2ZtIs", download_url="https://cinestream.hd/dl/sholay_hd.mp4"),
            
            # International
            MovieModel(title="La Casa de Papel", description="Money Heist", rating=8.6, image="https://images.unsplash.com/photo-1535016120720-40c646bebbcf", genre="Crime", language="Spanish", category="Latest", quality="1080p Full HD", video_url="https://www.youtube.com/embed/_InqQJRqGW4", download_url="https://cinestream.hd/dl/moneyheist_hd.mp4")
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
