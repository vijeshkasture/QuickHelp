from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.pricing import PriceEstimateRequest, PriceEstimateResponse
from app.services.pricing_service import PricingService

router = APIRouter(
    prefix="/pricing",
    tags=["Pricing"]
)


@router.post("/estimate", response_model=PriceEstimateResponse, summary="Estimate fair price for a service request")
def estimate_price(
    payload: PriceEstimateRequest,
    db: Session = Depends(get_db)
):
    """
    Computes a data-driven fair price estimate in INR for a given work category, service, and location.
    Uses historical completed job records analyzed via Pandas & NumPy.
    """
    result = PricingService.estimate_price(
        db=db,
        category=payload.category,
        service=payload.service,
        latitude=payload.latitude,
        longitude=payload.longitude,
        urgency=payload.urgency
    )
    return PriceEstimateResponse(**result)
