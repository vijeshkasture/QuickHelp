from datetime import datetime
from enum import Enum
from typing import Optional, List, Union
from pydantic import BaseModel, Field, ConfigDict, field_validator
import json


class AvailabilityStatusEnum(str, Enum):
    AVAILABLE = "AVAILABLE"
    BUSY = "BUSY"
    OFFLINE = "OFFLINE"


class WorkerProfileBase(BaseModel):
    skills: Optional[str] = Field(default=None, description="Comma-separated or JSON list of skills (e.g. electrical repair, wiring)")
    services: Optional[str] = Field(default=None, description="Comma-separated or JSON list of services (e.g. ceiling light repair, fan installation)")
    experience_years: float = Field(default=0.0, ge=0.0, description="Years of professional experience")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Current latitude")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Current longitude")
    service_radius_km: float = Field(default=5.0, gt=0.0, le=50.0, description="Service coverage radius in km")
    availability_status: AvailabilityStatusEnum = Field(default=AvailabilityStatusEnum.AVAILABLE)


class WorkerProfileCreate(BaseModel):
    skills: Optional[str] = Field(default=None, description="Skills (comma-separated or text)")
    services: Optional[str] = Field(default=None, description="Services offered (comma-separated or text)")
    experience_years: float = Field(default=0.0, ge=0.0)
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    service_radius_km: float = Field(default=5.0, gt=0.0, le=50.0)
    availability_status: Optional[AvailabilityStatusEnum] = AvailabilityStatusEnum.AVAILABLE


class WorkerProfileUpdate(BaseModel):
    skills: Optional[str] = None
    services: Optional[str] = None
    experience_years: Optional[float] = Field(default=None, ge=0.0)
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    service_radius_km: Optional[float] = Field(default=None, gt=0.0, le=50.0)
    availability_status: Optional[AvailabilityStatusEnum] = None


class WorkerAvailabilityUpdate(BaseModel):
    availability_status: AvailabilityStatusEnum


class WorkerProfileResponse(WorkerProfileBase):
    id: int
    user_id: int
    rating: float
    completed_jobs: int
    reliability_score: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkerPublicResponse(BaseModel):
    """Sanitized worker profile displayed to customers upon match."""
    id: int
    name: str
    skills: Optional[str] = None
    services: Optional[str] = None
    experience_years: float
    rating: float
    completed_jobs: int
    reliability_score: float
    distance_km: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
