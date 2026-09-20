import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.firebase import initialize_firebase
from app.database.database import create_tables
from app.routers import (
    auth_router,
    workers_router,
    jobs_router,
    matching_router,
    pricing_router,
    ratings_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("kaamsetu")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Initializes database tables and sets up Firebase Admin SDK.
    """
    logger.info("Initializing database tables...")
    create_tables()
    logger.info("Database tables initialized successfully.")

    logger.info("Checking Firebase configuration...")
    initialize_firebase()

    yield

    logger.info("Shutting down KaamSetu Backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="KaamSetu — Connecting Work. Connecting People. Hyperlocal workforce matching & fair pricing platform.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"], status_code=status.HTTP_200_OK)
def read_root():
    """Root endpoint welcoming clients and confirming API availability."""
    return {
        "project": "KaamSetu",
        "tagline": "Connecting Work. Connecting People.",
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }


@app.get("/health", tags=["General"], status_code=status.HTTP_200_OK)
def health_check():
    """Health check endpoint to verify backend service operational status."""
    return {
        "status": "healthy",
        "service": "KaamSetu Backend API"
    }


# Include Routers under the configured API prefix (/api)
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(workers_router, prefix=settings.API_PREFIX)
app.include_router(jobs_router, prefix=settings.API_PREFIX)
app.include_router(matching_router, prefix=settings.API_PREFIX)
app.include_router(pricing_router, prefix=settings.API_PREFIX)
app.include_router(ratings_router, prefix=settings.API_PREFIX)
