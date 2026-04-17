from sqlalchemy import create_all, Column, Integer, String, Float, ForeignKey, DateTime, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Use PostgreSQL if env var is set, otherwise fallback for local dev
# Use SQLite by default for local dev, PostgreSQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/cinebook.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

print(f"Neural Engine: Targeting Archive Core... (Type: {'Postgres (pg8000)' if 'pg8000' in DATABASE_URL else 'SQLite'})")

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

def _seed(db):
    try:
        # Precise Era Sync
        cat_names = ["Golden Archive (1990-2000)", "Modern Era (2001-2026)", "Upcoming Nodes"]
        cats = {}
        for name in cat_names:
            cat = db.query(Category).filter(Category.name == name).first()
            if not cat:
                try:
                    cat = Category(name=name)
                    db.add(cat)
                    db.commit()
                    db.refresh(cat)
                except Exception:
                    db.rollback()
                    cat = db.query(Category).filter(Category.name == name).first()
            cats[name] = cat
        
        seed_data = [
            {"title": "Jurassic Park", "year": 1993, "language": "English", "cat": "Golden Archive (1990-2000)"},
            {"title": "Titanic", "year": 1997, "language": "English", "cat": "Golden Archive (1990-2000)"},
            {"title": "DDLJ", "year": 1995, "language": "Hindi", "cat": "Golden Archive (1990-2000)"},
            {"title": "Baashha", "year": 1995, "language": "Tamil", "cat": "Golden Archive (1990-2000)"},
            {"title": "Shiva", "year": 1989, "language": "Telugu", "cat": "Golden Archive (1990-2000)"},
            {"title": "Vishwambhara", "year": 2025, "language": "Telugu", "cat": "Modern Era (2001-2026)"},
            {"title": "Pushpa 2", "year": 2024, "language": "Telugu", "cat": "Modern Era (2001-2026)"},
            {"title": "Kalki 2898 AD", "year": 2024, "language": "Telugu", "cat": "Modern Era (2001-2026)"},
            {"title": "Animal", "year": 2023, "language": "Hindi", "cat": "Modern Era (2001-2026)"},
            {"title": "Dune 2", "year": 2024, "language": "English", "cat": "Modern Era (2001-2026)"},
            {"title": "RRR", "year": 2022, "language": "Telugu", "cat": "Modern Era (2001-2026)"},
            {"title": "Devara Part 2", "year": 2026, "language": "Telugu", "cat": "Upcoming Nodes"},
            {"title": "Spirit", "year": 2025, "language": "Telugu", "cat": "Upcoming Nodes"},
            {"title": "The Avatar Core", "year": 2026, "language": "English", "cat": "Upcoming Nodes"},
        ]

        for m in seed_data:
            if not db.query(Movie).filter(Movie.title == m["title"]).first():
                cat = cats.get(m["cat"])
                if cat:
                    try:
                        db.add(Movie(
                            title=m["title"], description=f"Premium 1080p archival segment for {m['title']}.", rating=9.0,
                            image=f"https://images.unsplash.com/photo-{1540000000000 + m['year']}", language=m["language"], quality="1080p",
                            video_url=f"movies/{m['title'].lower().replace(' ', '_')}.m3u8",
                            download_url=f"https://archive.org/details/{m['title'].lower().replace(' ', '_')}",
                            year=m["year"], category_id=cat.id
                        ))
                        db.commit()
                    except Exception:
                        db.rollback()
    except Exception as e:
        print(f"Neural Seed Error: {e}")
        db.rollback()

# Create tables and auto-seed
def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            _seed(db)
        finally:
            db.close()
    except Exception as e:
        print(f"DB Init Error: {e}")
