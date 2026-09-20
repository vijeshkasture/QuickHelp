from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PriceEstimateRequest(BaseModel):
    category: str = Field(..., max_length=100, description="Work category, e.g. electrician, plumber")
    service: str = Field(..., max_length=150, description="Specific service, e.g. ceiling light repair")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    urgency: Optional[str] = Field(default="immediate")


class PriceEstimateResponse(BaseModel):
    recommended_price: float
    min_recommended_price: float
    max_recommended_price: float
    currency: str = "INR"
    basis: str
    sample_size: int
    note: Optional[str] = None
