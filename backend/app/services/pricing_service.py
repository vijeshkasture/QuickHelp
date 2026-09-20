import logging
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.models import PriceHistory, Job
from app.utils.geo import calculate_distance_km

logger = logging.getLogger(__name__)

# Base baseline median price reference when no historical records exist at all
CATEGORY_FALLBACK_BASELINES: Dict[str, float] = {
    "electrician": 300.0,
    "plumber": 350.0,
    "ac repair": 500.0,
    "appliance repair": 400.0,
    "carpentry": 450.0,
    "cleaning": 350.0,
    "painting": 600.0,
}


def get_utc_now():
    return datetime.now(timezone.utc)


class PricingService:
    """
    Fair-Price Estimation Service.
    Analyzes historical completed job data using Pandas and NumPy.
    Provides transparent, data-backed price recommendations for service requests.
    """

    @staticmethod
    def estimate_price(
        db: Session,
        category: str,
        service: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        urgency: Optional[str] = "immediate"
    ) -> Dict[str, Any]:
        """
        Calculates fair recommended price based on historical completed job records.
        Applies geographic proximity weighting when coordinates are provided.
        """
        category_clean = category.strip().lower()
        service_clean = service.strip().lower()

        # Query historical records matching category
        query = db.query(PriceHistory).filter(
            PriceHistory.category.ilike(f"%{category_clean}%")
        )
        records = query.all()

        if not records:
            # Fallback baseline when database has 0 historical entries for category
            baseline = CATEGORY_FALLBACK_BASELINES.get(category_clean, 300.0)
            if urgency == "immediate":
                baseline *= 1.1

            recommended = round(baseline, 0)
            return {
                "recommended_price": recommended,
                "min_recommended_price": round(recommended * 0.85, 0),
                "max_recommended_price": round(recommended * 1.25, 0),
                "currency": "INR",
                "basis": "category_baseline_heuristic",
                "sample_size": 0,
                "note": "Initial benchmark estimate based on standard category rates."
            }

        # Convert records to Pandas DataFrame
        df_records = [
            {
                "id": r.id,
                "category": r.category.lower(),
                "service": r.service.lower(),
                "final_price": r.final_price,
                "lat": r.latitude,
                "lon": r.longitude,
                "completed_at": r.completed_at
            }
            for r in records
        ]
        df = pd.DataFrame(df_records)

        # Filter for exact or close service match
        exact_service_df = df[df["service"].str.contains(service_clean, na=False, regex=False)]
        
        sample_df = exact_service_df if len(exact_service_df) >= 2 else df
        basis = "historical_similar_jobs" if len(exact_service_df) >= 2 else "historical_category_jobs"

        # Apply geographic distance weighting if coordinates supplied
        if latitude is not None and longitude is not None and not sample_df.empty:
            sample_df = sample_df.copy()
            sample_df["distance"] = sample_df.apply(
                lambda row: calculate_distance_km(latitude, longitude, row["lat"], row["lon"]),
                axis=1
            )
            # Weights inversely proportional to distance (max 50km decay)
            sample_df["weight"] = 1.0 / (1.0 + sample_df["distance"] / 10.0)
            weighted_price = np.average(sample_df["final_price"], weights=sample_df["weight"])
            median_price = float(weighted_price)
        else:
            median_price = float(sample_df["final_price"].median())

        # Urgency adjustment
        if urgency == "immediate":
            median_price *= 1.05

        recommended = round(median_price, 0)
        q25 = float(sample_df["final_price"].quantile(0.25)) if len(sample_df) > 1 else recommended * 0.85
        q75 = float(sample_df["final_price"].quantile(0.75)) if len(sample_df) > 1 else recommended * 1.20

        return {
            "recommended_price": recommended,
            "min_recommended_price": round(min(recommended * 0.85, q25), 0),
            "max_recommended_price": round(max(recommended * 1.25, q75), 0),
            "currency": "INR",
            "basis": basis,
            "sample_size": int(len(sample_df)),
            "note": f"Estimated using {len(sample_df)} completed job records."
        }

    @staticmethod
    def record_completed_price(
        db: Session,
        job_id: Optional[int],
        category: str,
        service: str,
        latitude: float,
        longitude: float,
        final_price: float
    ) -> PriceHistory:
        """
        Inserts completed job pricing into price_history table to continuously enrich future estimates.
        """
        price_record = PriceHistory(
            job_id=job_id,
            category=category,
            service=service,
            latitude=latitude,
            longitude=longitude,
            final_price=final_price,
            completed_at=get_utc_now()
        )
        db.add(price_record)
        db.commit()
        db.refresh(price_record)
        return price_record
