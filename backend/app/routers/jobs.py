from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database.database import get_db
from app.database.models import (
    User,
    WorkerProfile,
    Job,
    JobStatus,
    UserRole
)
from app.dependencies.auth import get_current_user, require_customer, require_worker
from app.schemas.job import (
    JobCreate,
    JobResponse,
    JobDetailResponse,
    JobOfferUpdate
)
from app.schemas.worker import WorkerPublicResponse
from app.services.job_service import JobService
from app.services.matching_service import MatchingService
from app.utils.geo import calculate_distance_km

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


class JobCompletePayload(BaseModel):
    actual_price: Optional[float] = Field(default=None, ge=50.0, description="Final agreed price in INR (if different from customer offer)")


@router.post("", response_model=JobDetailResponse, status_code=status.HTTP_201_CREATED, summary="Create a new service request")
def create_job(
    payload: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new service request for the authenticated user (customer).
    Automatically runs fair price estimation and sets initial recommended price.
    Automatically kicks off matching search.
    """
    # Auto-assign customer role if needed
    if current_user.role != UserRole.CUSTOMER and current_user.role != UserRole.WORKER:
        current_user.role = UserRole.CUSTOMER
        db.commit()

    job = JobService.create_job(
        db=db,
        customer_id=current_user.id,
        category=payload.category,
        service=payload.service,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        location_text=payload.location_text,
        urgency=payload.urgency,
        customer_offer=payload.customer_offer
    )

    # Immediately start matching dispatch
    MatchingService.dispatch_next_offer(db, job)
    db.refresh(job)

    message = f"Job created. Recommended price: ₹{job.recommended_price}. Current offer: ₹{job.customer_offer}."
    if job.status == JobStatus.NO_WORKER_ACCEPTED:
        message = f"No currently available worker accepted ₹{job.customer_offer}. You may increase your offer."

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
        message=message
    )


@router.get("/my", response_model=List[JobResponse], summary="Get customer's posted jobs")
def get_my_jobs(
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    """Returns list of jobs created by the authenticated customer."""
    jobs = db.query(Job).filter(Job.customer_id == current_user.id).order_by(Job.created_at.desc()).all()
    return jobs


@router.get("/{job_id}", response_model=JobDetailResponse, summary="Get full job details")
def get_job_details(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves complete details for a specific job.
    Includes matched worker profile if a worker has accepted.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found."
        )

    # Authorization check: user must be customer, matched worker, or worker with an active offer
    worker_profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    is_owner = (job.customer_id == current_user.id)
    is_matched_worker = (worker_profile and job.matched_worker_id == worker_profile.id)

    if not is_owner and not is_matched_worker and current_user.role != UserRole.CUSTOMER:
        # Check if worker has an active offer for this job
        if not worker_profile:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    matched_worker_info = None
    if job.matched_worker:
        dist = calculate_distance_km(
            job.latitude, job.longitude,
            job.matched_worker.latitude, job.matched_worker.longitude
        )
        matched_worker_info = WorkerPublicResponse(
            id=job.matched_worker.id,
            name=job.matched_worker.user.name if job.matched_worker.user else "Assigned Worker",
            skills=job.matched_worker.skills,
            services=job.matched_worker.services,
            experience_years=job.matched_worker.experience_years,
            rating=job.matched_worker.rating,
            completed_jobs=job.matched_worker.completed_jobs,
            reliability_score=job.matched_worker.reliability_score,
            distance_km=dist
        )

    msg = None
    if job.status == JobStatus.NO_WORKER_ACCEPTED:
        msg = f"No suitable worker accepted the offer of ₹{job.customer_offer}. You may increase your offer."
    elif job.status == JobStatus.WORKER_ASSIGNED:
        msg = f"Worker matched! {job.matched_worker.user.name if job.matched_worker and job.matched_worker.user else 'Worker'} will assist you."

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
        matched_worker=matched_worker_info,
        message=msg
    )


@router.patch("/{job_id}/offer", response_model=JobDetailResponse, summary="Increase customer offer on job")
def update_job_offer(
    job_id: int,
    payload: JobOfferUpdate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    """
    Customer increases the offered price on an existing job.
    Increments price_adjustment_count and restarts matching search cycle.
    """
    success, msg, job = JobService.update_offer_and_rematch(
        db=db,
        job_id=job_id,
        customer_id=current_user.id,
        new_offer=payload.new_offer
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

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
        message=f"Offer increased to ₹{job.customer_offer}. Matching search restarted."
    )


@router.post("/{job_id}/on-way", response_model=JobResponse, summary="Worker marks status as ON_WAY")
def mark_job_on_way(
    job_id: int,
    current_user: User = Depends(require_worker),
    db: Session = Depends(get_db)
):
    """Worker indicates they are en route to the customer's location."""
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker profile not found.")

    success, msg, job = JobService.mark_on_way(db=db, job_id=job_id, worker_id=worker.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return job


@router.post("/{job_id}/start", response_model=JobResponse, summary="Worker marks job as IN_PROGRESS")
def mark_job_in_progress(
    job_id: int,
    current_user: User = Depends(require_worker),
    db: Session = Depends(get_db)
):
    """Worker starts executing the job at the customer location."""
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker profile not found.")

    success, msg, job = JobService.mark_in_progress(db=db, job_id=job_id, worker_id=worker.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return job


@router.post("/{job_id}/complete", response_model=JobResponse, summary="Worker marks job as COMPLETED")
def complete_job(
    job_id: int,
    payload: Optional[JobCompletePayload] = None,
    current_user: User = Depends(require_worker),
    db: Session = Depends(get_db)
):
    """
    Worker marks the job as successfully completed.
    Records final price, updates price history dataset, and sets worker back to AVAILABLE.
    """
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker profile not found.")

    actual_price = payload.actual_price if payload else None
    success, msg, job = JobService.mark_completed(
        db=db,
        job_id=job_id,
        worker_id=worker.id,
        actual_price=actual_price
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return job


@router.post("/{job_id}/cancel", response_model=JobResponse, summary="Customer cancels job")
def cancel_job(
    job_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    """Customer cancels a pending or searching service request."""
    success, msg, job = JobService.cancel_job(db=db, job_id=job_id, customer_id=current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return job
