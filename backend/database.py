
import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from backend/.env
load_dotenv(Path(__file__).resolve().parent / ".env")

# Read database password securely
DB_PASSWORD = os.getenv("DB_PASSWORD")

if not DB_PASSWORD:
    raise RuntimeError("DB_PASSWORD is missing from .env")

# Create database connection
DATABASE_URL = (
    f"postgresql+psycopg://postgres:{quote_plus(DB_PASSWORD)}"
    "@localhost:5432/janawaaz_db"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
