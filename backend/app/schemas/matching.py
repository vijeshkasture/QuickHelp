from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.job import JobResponse


class MatchStatusEnum(str, Enum):
    OFFERED = "OFFERED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class MatchResponse(BaseModel):
    id: int
    job_id: int
    worker_id: int
    offered_price: float
    match_score: float
    distance_km: float
    skill_match_score: float
    rating_score: float
    reliability_score: float
    status: MatchStatusEnum
    created_at: datetime
    responded_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WorkerOfferResponse(BaseModel):
    match_id: int
    job_id: int
    category: str
    service: str
    description: str
    location_text: Optional[str] = None
    distance_km: float
    offered_price: float
    urgency: str
    match_score: float
    status: MatchStatusEnum
    created_at: datetime


class MatchActionResponse(BaseModel):
    message: str
    match_id: int
    job_id: int
    match_status: MatchStatusEnum
    job_status: str
    worker_status: Optional[str] = None
