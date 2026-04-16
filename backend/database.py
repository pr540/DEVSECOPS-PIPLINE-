import os
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Use SQLite for local/demo, but prefer environment variable
# Use /tmp for SQLite on Vercel (read-only filesystem workaround)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/cinebook.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class MovieModel(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    rating = Column(Float)
    image = Column(String)
    genre = Column(String)
    language = Column(String, default="English")
    category = Column(String, default="Latest")
    quality = Column(String, default="1080p Full HD")
    video_url = Column(String, nullable=True)
    download_url = Column(String, nullable=True)

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
