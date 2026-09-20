"""API Routers package initialization."""
from app.routers.auth import router as auth_router
from app.routers.workers import router as workers_router
from app.routers.jobs import router as jobs_router
from app.routers.matching import router as matching_router
from app.routers.pricing import router as pricing_router
from app.routers.ratings import router as ratings_router

__all__ = [
    "auth_router",
    "workers_router",
    "jobs_router",
    "matching_router",
    "pricing_router",
    "ratings_router"
]
