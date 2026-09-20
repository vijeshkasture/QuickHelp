from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import (
    User,
    WorkerProfile,
    Job,
    Match,
    AvailabilityStatus,
    JobStatus,
    MatchStatus,
    UserRole
)
from app.dependencies.auth import get_current_user, require_worker
from app.schemas.worker import (
    WorkerProfileCreate,
    WorkerProfileUpdate,
    WorkerAvailabilityUpdate,
    WorkerProfileResponse
)
from app.schemas.job import JobResponse
from app.schemas.matching import WorkerOfferResponse

router = APIRouter(
    prefix="/workers",
    tags=["Workers"]
)


@router.post("/profile", response_model=WorkerProfileResponse, status_code=status.HTTP_201_CREATED, summary="Create or initialize worker profile")
def create_worker_profile(
    payload: WorkerProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates worker profile for authenticated user. Automatically updates user role to 'worker'.
    """
    # Enforce role
    if current_user.role != UserRole.WORKER:
        current_user.role = UserRole.WORKER

    existing_profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Worker profile already exists for this user. Use PATCH to update."
        )

    profile = WorkerProfile(
        user_id=current_user.id,
        skills=payload.skills,
        services=payload.services,
        experience_years=payload.experience_years,
        latitude=payload.latitude,
        longitude=payload.longitude,
        service_radius_km=payload.service_radius_km,
        availability_status=AvailabilityStatus(payload.availability_status.value) if payload.availability_status else AvailabilityStatus.AVAILABLE,
        rating=0.0,
        completed_jobs=0,
        reliability_score=100.0
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me", response_model=WorkerProfileResponse, summary="Get own worker profile")
def get_my_worker_profile(
    current_user: User = Depends(require_worker),
    db: Session = Depends(get_db)
):
    """Returns the worker profile for the authenticated worker."""
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found. Please create your profile first."
        )
    return profile


@router.patch("/profile", response_model=WorkerProfileResponse, summary="Update own worker profile")
def update_worker_profile(
    payload: WorkerProfileUpdate,
    current_user: User = Depends(require_worker),
    db: Session = Depends(get_db)
):
    """Updates profile attributes for the authenticated worker."""
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found."
        )

    if payload.skills is not None:
        profile.skills = payload.skills
    if payload.services is not None:
        profile.services = payload.services
    if payload.experience_years is not None:
        profile.experience_years = payload.experience_years
    if payload.latitude is not None:
        profile.latitude = payload.latitude
    if payload.longitude is not None:
        profile.longitude = payload.longitude
    if payload.service_radius_km is not None:
        profile.service_radius_km = payload.service_radius_km
    if payload.availability_status is not None:
        profile.availability_status = AvailabilityStatus(payload.availability_status.value)

    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/availability", response_model=WorkerProfileResponse, summary="Toggle worker availability status")
def update_worker_availability(
    payload: WorkerAvailabilityUpdate,
    current_user: User = Depends(require_worker),
    db: Session = Depends(get_db)
):
    """
    Explicitly updates worker availability status (AVAILABLE, BUSY, OFFLINE).
    Enforces business rule: Worker cannot manually switch to AVAILABLE if they are currently assigned to an active job.
    """
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found."
        )

    target_status = AvailabilityStatus(payload.availability_status.value)

    if target_status == AvailabilityStatus.AVAILABLE:
        # Verify no active assigned jobs
        active_job = db.query(Job).filter(
            Job.matched_worker_id == profile.id,
            Job.status.in_([JobStatus.WORKER_ASSIGNED, JobStatus.WORKER_ON_WAY, JobStatus.IN_PROGRESS])
        ).first()

        if active_job:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot set status to AVAILABLE while actively engaged in Job #{active_job.id} ({active_job.status.value})."
            )

    profile.availability_status = target_status
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me/jobs", response_model=List[JobResponse], summary="Get worker assigned and past jobs")
def get_my_jobs(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_worker),
    db: Session = Depends(get_db)
):
    """Returns list of jobs assigned to the authenticated worker."""
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found."
        )

    query = db.query(Job).filter(Job.matched_worker_id == profile.id)
    if status_filter:
        query = query.filter(Job.status == status_filter)

    jobs = query.order_by(Job.created_at.desc()).all()
    return jobs


@router.get("/me/offers", response_model=List[WorkerOfferResponse], summary="Get active job offers waiting for response")
def get_my_job_offers(
    current_user: User = Depends(require_worker),
    db: Session = Depends(get_db)
):
    """
    Returns pending job offers (MatchStatus == OFFERED) currently waiting for this worker's accept/reject decision.
    """
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found."
        )

    matches = db.query(Match).join(Job).filter(
        Match.worker_id == profile.id,
        Match.status == MatchStatus.OFFERED,
        Job.status == JobStatus.SEARCHING
    ).order_by(Match.created_at.desc()).all()

    offers = []
    for m in matches:
        offers.append(
            WorkerOfferResponse(
                match_id=m.id,
                job_id=m.job.id,
                category=m.job.category,
                service=m.job.service,
                description=m.job.description,
                location_text=m.job.location_text,
                distance_km=m.distance_km,
                offered_price=m.offered_price,
                urgency=m.job.urgency,
                match_score=m.match_score,
                status=m.status,
                created_at=m.created_at
            )
        )
    return offers
