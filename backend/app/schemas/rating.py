from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class RatingCreate(BaseModel):
    job_id: int
    rating: float = Field(..., ge=1.0, le=5.0, description="Rating score from 1.0 to 5.0")
    feedback: Optional[str] = Field(default=None, max_length=1000)


class RatingResponse(BaseModel):
    id: int
    job_id: int
    customer_id: int
    worker_id: int
    rating: float
    feedback: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkerRatingsSummaryResponse(BaseModel):
    worker_id: int
    average_rating: float
    total_ratings: int
    completed_jobs: int
    reliability_score: float
    ratings: List[RatingResponse]
