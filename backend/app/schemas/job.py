from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.worker import WorkerPublicResponse


class JobStatusEnum(str, Enum):
    CREATED = "CREATED"
    PRICE_ESTIMATED = "PRICE_ESTIMATED"
    SEARCHING = "SEARCHING"
    WORKER_ASSIGNED = "WORKER_ASSIGNED"
    WORKER_ON_WAY = "WORKER_ON_WAY"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_WORKER_ACCEPTED = "NO_WORKER_ACCEPTED"


class JobBase(BaseModel):
    category: str = Field(..., max_length=100, description="Work category, e.g. electrician, plumber, appliance repair")
    service: str = Field(..., max_length=150, description="Specific service needed, e.g. ceiling light repair, tap leakage")
    description: str = Field(..., min_length=5, description="Detailed problem description")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location_text: Optional[str] = Field(default=None, max_length=255, description="User friendly address/landmark")
    urgency: str = Field(default="immediate", description="Job urgency: immediate, within_2_hours, flexible")


class JobCreate(JobBase):
    customer_offer: Optional[float] = Field(default=None, ge=50.0, description="Customer initial offer in INR (optional; if omitted, price estimation is used)")


class JobOfferUpdate(BaseModel):
    new_offer: float = Field(..., ge=50.0, description="New increased customer offer amount in INR")


class JobResponse(JobBase):
    id: int
    customer_id: int
    status: JobStatusEnum
    recommended_price: Optional[float] = None
    customer_offer: Optional[float] = None
    price_adjustment_count: int
    matched_worker_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobDetailResponse(JobResponse):
    matched_worker: Optional[WorkerPublicResponse] = None
    message: Optional[str] = None


class NoWorkerAcceptedResponse(BaseModel):
    status: JobStatusEnum = JobStatusEnum.NO_WORKER_ACCEPTED
    current_offer: float
    suggested_offer: float
    message: str = "No suitable worker accepted the current offer. Consider increasing the offer."
    job_id: int
