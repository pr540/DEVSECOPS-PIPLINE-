import os
import time
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from .database import get_db, MovieModel

app = FastAPI(title="CineBook DevSecOps API")

# Monitoring state
start_time = time.time()
request_count = 0

# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-key-for-local-use-only")

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
async def monitor_request(request, call_next):
    global request_count
    request_count += 1
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

@app.get("/")
def read_root():
    return {"message": "Welcome to TicketBooking DevSecOps API", "status": "operational"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "uptime": f"{int(time.time() - start_time)}s",
        "requests": request_count,
        "database": "connected"
    }

@app.get("/movies", response_model=List[MovieSchema])
def get_movies(db: Session = Depends(get_db)):
    movies = db.query(MovieModel).all()
    
    # Seed data if empty
    if not movies:
        seed_data = [
            MovieModel(title="Interstellar", description="A team of explorers...", rating=8.7, image="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", genre="Sci-Fi"),
            MovieModel(title="The Dark Knight", description="Batman vs Joker", rating=9.0, image="https://images.unsplash.com/photo-1478720568477-152d9b164e26", genre="Action"),
            MovieModel(title="Inception", description="Dream within a dream", rating=8.8, image="https://images.unsplash.com/photo-1536440136628-849c177e76a1", genre="Sci-Fi")
        ]
        db.add_all(seed_data)
        db.commit()
        movies = db.query(MovieModel).all()
        
    return movies

@app.post("/movies", response_model=MovieSchema)
def create_movie(movie: MovieSchema, db: Session = Depends(get_db)):
    db_movie = MovieModel(**movie.dict(exclude={'id'}))
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
