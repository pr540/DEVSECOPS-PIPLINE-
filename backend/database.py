from sqlalchemy import create_all, Column, Integer, String, Float, ForeignKey, DateTime, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Use PostgreSQL if env var is set, otherwise fallback for local dev
# Use SQLite by default for local dev, PostgreSQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cinebook.db")

from sqlalchemy import create_engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Many-to-Many for Watch History (Simplified as a table for tracking)
class WatchHistory(Base):
    __tablename__ = "watch_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    movie_id = Column(Integer, ForeignKey("movies.id"))
    watched_at = Column(DateTime, default=datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    movies = relationship("Movie", back_populates="category")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="user") # admin or user
    
    # Relationships
    favorites = relationship("Movie", secondary="favorites", back_populates="favorited_by")

class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    rating = Column(Float)
    image = Column(String) # Poster URL
    language = Column(String) # Telugu, Hindi, etc.
    quality = Column(String) # 1080p, 720p
    video_url = Column(String) # S3/HLS Path
    download_url = Column(String, nullable=True)
    year = Column(Integer)
    category_id = Column(Integer, ForeignKey("categories.id"))
    
    category = relationship("Category", back_populates="movies")
    favorited_by = relationship("User", secondary="favorites", back_populates="favorites")

# Favorites Association Table
favorites = Table(
    "favorites",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("movie_id", Integer, ForeignKey("movies.id"))
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def init_db():
    Base.metadata.create_all(bind=engine)
