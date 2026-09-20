from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.database.models import (
    User,
    WorkerProfile,
    Job,
    Rating,
    JobStatus,
    UserRole
)
from app.dependencies.auth import get_current_user, require_customer
from app.schemas.rating import (
    RatingCreate,
    RatingResponse,
    WorkerRatingsSummaryResponse
)

router = APIRouter(
    prefix="/ratings",
    tags=["Ratings"]
)


@router.post("", response_model=RatingResponse, status_code=status.HTTP_201_CREATED, summary="Submit rating for completed job")
def create_rating(
    payload: RatingCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    """
    Submits a rating (1.0 to 5.0) and optional feedback for a completed job.
    Rules:
    - Only the customer who posted the job can rate.
    - Only jobs with status == COMPLETED can be rated.
    - Only one rating per job.
    - Updates worker's average rating and reliability score.
    """
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    if job.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only rate jobs you created.")

    if job.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot rate job that is not COMPLETED (current status: '{job.status.value}')."
        )

    if not job.matched_worker_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No worker was matched to this job.")

    existing_rating = db.query(Rating).filter(Rating.job_id == payload.job_id).first()
    if existing_rating:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rating already submitted for this job.")

    rating_entry = Rating(
        job_id=job.id,
        customer_id=current_user.id,
        worker_id=job.matched_worker_id,
        rating=round(payload.rating, 1),
        feedback=payload.feedback.strip() if payload.feedback else None
    )
    db.add(rating_entry)
    db.commit()
    db.refresh(rating_entry)

    # Recalculate worker aggregate rating
    worker = db.query(WorkerProfile).filter(WorkerProfile.id == job.matched_worker_id).first()
    if worker:
        avg_rating = db.query(func.avg(Rating.rating)).filter(Rating.worker_id == worker.id).scalar()
        if avg_rating is not None:
            worker.rating = round(float(avg_rating), 2)

        # Update reliability adjustment slightly based on feedback
        if payload.rating >= 4.0:
            worker.reliability_score = min(100.0, worker.reliability_score + 1.0)
        elif payload.rating < 3.0:
            worker.reliability_score = max(50.0, worker.reliability_score - 2.0)

        db.commit()

    return rating_entry


@router.get("/worker/{worker_id}", response_model=WorkerRatingsSummaryResponse, summary="Get worker ratings summary")
def get_worker_ratings(
    worker_id: int,
    db: Session = Depends(get_db)
):
    """Returns all ratings and cumulative rating metrics for a worker."""
    worker = db.query(WorkerProfile).filter(WorkerProfile.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found.")

    ratings = db.query(Rating).filter(Rating.worker_id == worker_id).order_by(Rating.created_at.desc()).all()

    return WorkerRatingsSummaryResponse(
        worker_id=worker.id,
        average_rating=worker.rating,
        total_ratings=len(ratings),
        completed_jobs=worker.completed_jobs,
        reliability_score=worker.reliability_score,
        ratings=ratings
    )
