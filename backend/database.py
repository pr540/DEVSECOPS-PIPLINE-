import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv

load_dotenv()

# Use SQLite for local/demo, but prefer environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///cinebook.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Association table for User Favorites
favorites = Table(
    "favorites",
    Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("movie_id", ForeignKey("movies.id"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user") # admin/user
    
    favorite_movies = relationship("Movie", secondary=favorites, backref="favorited_by")

class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    rating = Column(Float)
    image = Column(String)
    genre = Column(String)
    language = Column(String, default="English")
    quality = Column(String, default="1080p Full HD")
    video_url = Column(String, nullable=True) # Relative path in MinIO
    download_url = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    collection = Column(String, default="All") # 90s, Modern, etc.


# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

