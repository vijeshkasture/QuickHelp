from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import (
    User,
    WorkerProfile,
    Job,
    Match,
    JobStatus,
    MatchStatus,
    UserRole
)
from app.dependencies.auth import get_current_user, require_customer, require_worker
from app.schemas.matching import (
    MatchResponse,
    MatchActionResponse
)
from app.schemas.job import JobDetailResponse, WorkerPublicResponse
from app.services.matching_service import MatchingService
from app.utils.geo import calculate_distance_km

router = APIRouter(
    prefix="/matching",
    tags=["Matching"]
)


@router.post("/start/{job_id}", response_model=JobDetailResponse, summary="Start matching search for a job")
def start_matching(
    job_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    """
    Initiates or re-starts worker matching for a customer's job.
    Finds highest ranked available worker and sends offer.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    if job.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this job.")

    if job.status not in [JobStatus.CREATED, JobStatus.PRICE_ESTIMATED, JobStatus.NO_WORKER_ACCEPTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start matching when job status is '{job.status.value}'."
        )

    match = MatchingService.dispatch_next_offer(db, job)
    db.refresh(job)

    msg = "Matching started. Offer sent to suitable available worker."
    if job.status == JobStatus.NO_WORKER_ACCEPTED:
        msg = f"No suitable worker accepted the offer of ₹{job.customer_offer}. You may increase your offer."

    return JobDetailResponse(
        id=job.id,
        customer_id=job.customer_id,
        category=job.category,
        service=job.service,
        description=job.description,
        latitude=job.latitude,
        longitude=job.longitude,
        location_text=job.location_text,
        urgency=job.urgency,
        status=job.status,
        recommended_price=job.recommended_price,
        customer_offer=job.customer_offer,
        price_adjustment_count=job.price_adjustment_count,
        matched_worker_id=job.matched_worker_id,
        created_at=job.created_at,
        updated_at=job.updated_at,
        matched_worker=None,
        message=msg
    )


@router.post("/{match_id}/accept", response_model=MatchActionResponse, summary="Worker accepts a job offer")
def accept_match_offer(
    match_id: int,
    current_user: User = Depends(require_worker),
    db: Session = Depends(get_db)
):
    """
    Worker accepts the offered job and price.
    Marks match ACCEPTED, job WORKER_ASSIGNED, and worker availability BUSY.
    """
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker profile not found.")

    success, msg, job = MatchingService.accept_offer(db=db, match_id=match_id, worker_id=worker.id)
    if not success:
        # Check if conflict / race condition
        if "already" in msg.lower() or "no longer" in msg.lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return MatchActionResponse(
        message=msg,
        match_id=match_id,
        job_id=job.id,
        match_status=MatchStatus.ACCEPTED,
        job_status=job.status.value,
        worker_status="BUSY"
    )


@router.post("/{match_id}/reject", response_model=MatchActionResponse, summary="Worker rejects a job offer")
def reject_match_offer(
    match_id: int,
    current_user: User = Depends(require_worker),
    db: Session = Depends(get_db)
):
    """
    Worker rejects the job offer.
    Worker remains AVAILABLE. System automatically searches for next suitable worker.
    """
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker profile not found.")

    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    job_id = match.job_id
    success, msg, next_match = MatchingService.reject_offer(db=db, match_id=match_id, worker_id=worker.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    job = db.query(Job).filter(Job.id == job_id).first()
    job_status_val = job.status.value if job else "UNKNOWN"

    return MatchActionResponse(
        message=msg + (" Next candidate offered." if next_match else " No more candidates available."),
        match_id=match_id,
        job_id=job_id,
        match_status=MatchStatus.REJECTED,
        job_status=job_status_val,
        worker_status="AVAILABLE"
    )


@router.get("/job/{job_id}", response_model=List[MatchResponse], summary="Get matches history for a job")
def get_job_matches(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all match offers created for a specific job.
    Accessible to the job customer or assigned worker.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    if job.customer_id != current_user.id:
        worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
        if not worker or job.matched_worker_id != worker.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    matches = db.query(Match).filter(Match.job_id == job_id).order_by(Match.created_at.asc()).all()
    return matches
