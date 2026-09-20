from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Configure connect_args specifically for SQLite
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# SQLAlchemy Engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base model class for all SQLAlchemy entities
Base = declarative_base()


def get_db():
    """
    Dependency generator that provides a database session to FastAPI route handlers.
    Ensures the session is always closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Creates all database tables defined in SQLAlchemy models."""
    Base.metadata.create_all(bind=engine)
