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
            # 2024 - 2026 LATEST RELEASES
            MovieModel(title="Pushpa 2: The Rule (2025)", description="The clash continues in this high-octane action sequel.", rating=9.5, image="https://images.unsplash.com/photo-1594909122845-11baa439b7bf", genre="Action", language="Telugu", category="Latest", quality="1080p Ultra HD", video_url="https://vidsrc.xyz/embed/movie/872585", download_url="https://minomedia.cine/link/p2_tel_1080"),
            MovieModel(title="Kalki 2898 AD (2024)", description="A modern avatar of Vishnu descends to Earth.", rating=8.9, image="https://images.unsplash.com/photo-1536440136628-849c177e76a1", genre="Sci-Fi", language="Telugu", category="Latest", quality="1080p BluRay", video_url="https://vidsrc.xyz/embed/movie/766507", download_url="https://minomedia.cine/link/kalki_4k_tel"),
            MovieModel(title="Devara: Part 1 (2024)", description="An epic saga of a warrior protecting his people.", rating=8.7, image="https://images.unsplash.com/photo-1535016120720-40c646bebbcf", genre="Action", language="Telugu", category="Latest", quality="1080p WEB-DL", video_url="https://vidsrc.xyz/embed/movie/1125217", download_url="https://minomedia.cine/link/devara_tel_hd"),
            MovieModel(title="Stree 2 (2024)", description="The town of Chanderi is haunted again.", rating=8.4, image="https://images.unsplash.com/photo-1509347528160-9a9e33742cdb", genre="Horror", language="Hindi", category="Latest", quality="1080p Full HD", video_url="https://vidsrc.xyz/embed/movie/1243615", download_url="https://minomedia.cine/link/stree2_hindi_hd"),
            MovieModel(title="Deadpool & Wolverine (2024)", description="A chaotic duo joins the MCU.", rating=9.0, image="https://images.unsplash.com/photo-1509347528160-9a9e33742cdb", genre="Action", language="English", category="Latest", quality="1080p DTS-X", video_url="https://vidsrc.xyz/embed/movie/533535", download_url="https://minomedia.cine/link/dw_eng_1080"),

            # PRESENT (2020 - 2023)
            MovieModel(title="Leo (2023)", description="A cafe owner becomes the target of a drug cartel.", rating=8.3, image="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", genre="Action", language="Tamil", category="Present", quality="1080p HD", video_url="https://vidsrc.xyz/embed/movie/951491", download_url="https://minomedia.cine/link/leo_tam_hd"),
            MovieModel(title="Jailer (2023)", description="A retired jailer goes on a manhunt.", rating=8.5, image="https://images.unsplash.com/photo-1536440136628-849c177e76a1", genre="Action", language="Tamil", category="Present", quality="1080p WEB", video_url="https://vidsrc.xyz/embed/movie/980145", download_url="https://minomedia.cine/link/jailer_tam_1080"),
            MovieModel(title="Manjummel Boys (2024)", description="A group of friends gets trapped in Guna Caves.", rating=9.1, image="https://images.unsplash.com/photo-1535016120720-40c646bebbcf", genre="Survival", language="Malayalam", category="Present", quality="1080p BluRay", video_url="https://vidsrc.xyz/embed/movie/1220456", download_url="https://minomedia.cine/link/mboy_mal_hd"),
            MovieModel(title="Kantara (2022)", description="A conflict between humanity and nature.", rating=8.8, image="https://images.unsplash.com/photo-1594909122845-11baa439b7bf", genre="Thriller", language="Kannada", category="Present", quality="1080p Ultra", video_url="https://vidsrc.xyz/embed/movie/1020612", download_url="https://minomedia.cine/link/kantara_kan_hd"),
            MovieModel(title="RRR (2022)", description="Two revolutionaries fight against British Raj.", rating=8.9, image="https://images.unsplash.com/photo-1594909122845-11baa439b7bf", genre="Epic", language="Telugu", category="Present", quality="1080p IMAX", video_url="https://vidsrc.xyz/embed/movie/579047", download_url="https://minomedia.cine/link/rrr_tel_1080"),

            # 90s & CLASSICS
            MovieModel(title="Shiva (1989/90)", description="A student stands up against corruption.", rating=8.5, image="https://images.unsplash.com/photo-1535016120720-40c646bebbcf", genre="Action", language="Telugu", category="Classic", quality="1080p Remastered", video_url="https://vidsrc.xyz/embed/movie/39116", download_url="https://minomedia.cine/link/shiva_90s_hd"),
            MovieModel(title="Dilwale Dulhania Le Jayenge (1995)", description="The definitive Bollywood love story.", rating=8.2, image="https://images.unsplash.com/photo-1509347528160-9a9e33742cdb", genre="Romance", language="Hindi", category="Classic", quality="1080p HD", video_url="https://vidsrc.xyz/embed/movie/19404", download_url="https://minomedia.cine/link/ddlj_hd"),
            MovieModel(title="Baasha (1995)", description="An auto driver with a dark past.", rating=9.0, image="https://images.unsplash.com/photo-1536440136628-849c177e76a1", genre="Action", language="Tamil", category="Classic", quality="1080p HD", video_url="https://vidsrc.xyz/embed/movie/86828", download_url="https://minomedia.cine/link/baasha_tam_hd"),
            MovieModel(title="Manichitrathazhu (1993)", description="A psychological horror masterpiece.", rating=9.4, image="https://images.unsplash.com/photo-1594909122845-11baa439b7bf", genre="Horror", language="Malayalam", category="Classic", quality="1080p Remastered", video_url="https://vidsrc.xyz/embed/movie/43000", download_url="https://minomedia.cine/link/mani_mal_hd"),
            MovieModel(title="Jurassic Park (1993)", description="Dinosaurs roam the Earth again.", rating=8.2, image="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", genre="Sci-Fi", language="English", category="Classic", quality="1080p BluRay", video_url="https://vidsrc.xyz/embed/movie/329", download_url="https://minomedia.cine/link/jp_93_hd"),
            MovieModel(title="Pulp Fiction (1994)", description="Non-linear crime story by Tarantino.", rating=8.9, image="https://images.unsplash.com/photo-1535016120720-40c646bebbcf", genre="Crime", language="English", category="Classic", quality="1080p 4K Scan", video_url="https://vidsrc.xyz/embed/movie/680", download_url="https://minomedia.cine/link/pulp_f_hd")
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
