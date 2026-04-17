import os
import sys
import time
from datetime import timedelta, datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, Security, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from passlib.context import CryptContext

# --- CONFIG & DB ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/cinebook.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    movies = relationship("Movie", back_populates="category")

class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    rating = Column(Float)
    image = Column(String)
    language = Column(String)
    quality = Column(String)
    video_url = Column(String)
    download_url = Column(String, nullable=True)
    year = Column(Integer)
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="movies")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="user")

class WatchHistory(Base):
    __tablename__ = "watch_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    movie_id = Column(Integer, ForeignKey("movies.id"))
    watched_at = Column(DateTime, default=datetime.utcnow)

# --- SCHEMAS ---
class MovieSchema(BaseModel):
    id: int
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
    class Config: from_attributes = True

class CategorySchema(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True

class UserSchema(BaseModel):
    id: int
    username: str
    email: str
    class Config: from_attributes = True

# --- APP ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def _seed(db: Session):
    try:
        cat_names = ["Golden Archive (1990-2000)", "Modern Era (2001-2026)", "Upcoming Nodes"]
        cats = {}
        for name in cat_names:
            cat = db.query(Category).filter(Category.name == name).first()
            if not cat:
                try:
                    cat = Category(name=name); db.add(cat); db.commit(); db.refresh(cat)
                except: db.rollback(); cat = db.query(Category).filter(Category.name == name).first()
            cats[name] = cat
        
        seed_data = [
            {"title": "Jurassic Park", "year": 1993, "language": "English", "cat": "Golden Archive (1990-2000)", 
             "img": "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500"},
            {"title": "Titanic", "year": 1997, "language": "English", "cat": "Golden Archive (1990-2000)",
             "img": "https://images.unsplash.com/photo-1500076656116-558758c991c1?q=80&w=500"},
            {"title": "DDLJ", "year": 1995, "language": "Hindi", "cat": "Golden Archive (1990-2000)",
             "img": "https://images.unsplash.com/photo-1542204172-3c1f837066ad?q=80&w=500"},
            {"title": "Baashha", "year": 1995, "language": "Tamil", "cat": "Golden Archive (1990-2000)",
             "img": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500"},
            {"title": "Vishwambhara", "year": 2025, "language": "Telugu", "cat": "Modern Era (2001-2026)",
             "img": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=500"},
            {"title": "Pushpa 2", "year": 2024, "language": "Telugu", "cat": "Modern Era (2001-2026)",
             "img": "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=500"},
            {"title": "Kalki 2898 AD", "year": 2024, "language": "Telugu", "cat": "Modern Era (2001-2026)",
             "img": "https://images.unsplash.com/photo-1535016120720-40c646bebbcf?q=80&w=500"},
            {"title": "Devara Part 2", "year": 2026, "language": "Telugu", "cat": "Upcoming Nodes",
             "img": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=500"},
            {"title": "Spirit", "year": 2025, "language": "Telugu", "cat": "Upcoming Nodes",
             "img": "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=500"},
        ]
        for m in seed_data:
            existing = db.query(Movie).filter(Movie.title == m["title"]).first()
            if not existing:
                cat = cats.get(m["cat"])
                if cat:
                    try:
                        db.add(Movie(
                            title=m["title"], description=f"Premium 1080p archival segment for {m['title']}.", rating=9.0,
                            image=m["img"], language=m["language"], quality="1080p",
                            video_url=f"movies/{m['title'].lower().replace(' ', '_')}.m3u8",
                            download_url=f"https://archive.org/details/{m['title'].lower().replace(' ', '_')}",
                            year=m["year"], category_id=cat.id
                        )); db.commit()
                    except: db.rollback()
            else:
                # Update image if it was the broken generated one
                if "photo-154" in str(existing.image):
                    existing.image = m["img"]
                    db.commit()
    except: db.rollback()

_db_ready = False
def ensure_db():
    global _db_ready
    if not _db_ready:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try: _seed(db)
        finally: db.close()
        _db_ready = True

# --- ROUTES ---
@app.get("/api/health")
def health(): return {"status": "Operational", "timestamp": datetime.now()}

@app.get("/api/movies", response_model=List[MovieSchema])
def list_movies(category_id: Optional[int] = None, db: Session = Depends(get_db)):
    ensure_db()
    query = db.query(Movie)
    if category_id: query = query.filter(Movie.category_id == category_id)
    movies = query.all()
    if not movies and not category_id:
        _seed(db); movies = db.query(Movie).all()
    return movies

@app.get("/api/categories", response_model=List[CategorySchema])
def list_categories(db: Session = Depends(get_db)):
    ensure_db()
    return db.query(Category).all()

@app.post("/api/movies/seed")
def seed(db: Session = Depends(get_db)):
    _seed(db)
    return {"status": "Database synchronization triggered"}

@app.get("/api/auth/me", response_model=UserSchema)
def me():
    return {"id": 1, "username": "Google Agent", "email": "user@google_core.com", "role": "user"}

handler = app
