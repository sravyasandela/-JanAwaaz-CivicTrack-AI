
import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv(Path(__file__).resolve().parent / ".env")

# Use cloud database URL when deployed.
DATABASE_URL = os.getenv("DATABASE_URL")

# Otherwise use your existing local PostgreSQL database.
if not DATABASE_URL:
    DB_PASSWORD = os.getenv("DB_PASSWORD")

    if not DB_PASSWORD:
        raise RuntimeError("Database credentials are missing")

    DATABASE_URL = (
        f"postgresql+psycopg2://postgres:{quote_plus(DB_PASSWORD)}"
        "@localhost:5432/janawaaz_db"
    )

# Handle older PostgreSQL URL formats.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://", "postgresql://", 1
    )

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

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
