import logging
from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.database.models import (
    Job,
    WorkerProfile,
    Match,
    JobHistory,
    JobStatus,
    MatchStatus,
    AvailabilityStatus
)
from app.services.pricing_service import PricingService
from app.services.matching_service import MatchingService

logger = logging.getLogger(__name__)


def get_utc_now():
    return datetime.now(timezone.utc)


class JobService:
    """
    Manages Job lifecycle, offer updates, status transitions, and completion pipelines.
    """

    @staticmethod
    def create_job(
        db: Session,
        customer_id: int,
        category: str,
        service: str,
        description: str,
        latitude: float,
        longitude: float,
        location_text: Optional[str] = None,
        urgency: str = "immediate",
        customer_offer: Optional[float] = None
    ) -> Job:
        """
        Creates a new service request and calculates recommended price estimate.
        """
        # Calculate price recommendation
        pricing_est = PricingService.estimate_price(
            db=db,
            category=category,
            service=service,
            latitude=latitude,
            longitude=longitude,
            urgency=urgency
        )
        rec_price = pricing_est["recommended_price"]
        final_offer = customer_offer if customer_offer is not None else rec_price

        job = Job(
            customer_id=customer_id,
            category=category.strip(),
            service=service.strip(),
            description=description.strip(),
            latitude=latitude,
            longitude=longitude,
            location_text=location_text,
            urgency=urgency,
            status=JobStatus.PRICE_ESTIMATED,
            recommended_price=rec_price,
            customer_offer=final_offer,
            price_adjustment_count=0
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def update_offer_and_rematch(
        db: Session,
        job_id: int,
        customer_id: int,
        new_offer: float
    ) -> Tuple[bool, str, Optional[Job]]:
        """
        Updates customer offer on an existing job and restarts matching cycle.
        Allowed when job is in PRICE_ESTIMATED, SEARCHING, or NO_WORKER_ACCEPTED.
        """
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return False, "Job not found.", None

        if job.customer_id != customer_id:
            return False, "Unauthorized: You do not own this job.", None

        if job.status not in [JobStatus.PRICE_ESTIMATED, JobStatus.SEARCHING, JobStatus.NO_WORKER_ACCEPTED]:
            return False, f"Cannot change offer when job status is '{job.status.value}'.", None

        # Cancel previous pending offers
        pending_matches = db.query(Match).filter(
            Match.job_id == job.id,
            Match.status == MatchStatus.OFFERED
        ).all()
        for m in pending_matches:
            m.status = MatchStatus.CANCELLED
            m.responded_at = get_utc_now()

        # Update job offer
        job.customer_offer = new_offer
        job.price_adjustment_count += 1
        job.status = JobStatus.SEARCHING
        db.commit()
        db.refresh(job)

        # Dispatch fresh matching offer at the new price
        MatchingService.dispatch_next_offer(db, job)
        db.refresh(job)

        logger.info(f"Job {job.id} offer increased to ₹{new_offer} (adjustment #{job.price_adjustment_count})")
        return True, "Offer updated and matching restarted.", job

    @staticmethod
    def mark_on_way(db: Session, job_id: int, worker_id: int) -> Tuple[bool, str, Optional[Job]]:
        """Transitions job from WORKER_ASSIGNED to WORKER_ON_WAY."""
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return False, "Job not found.", None

        if job.matched_worker_id != worker_id:
            return False, "Unauthorized: You are not assigned to this job.", None

        if job.status != JobStatus.WORKER_ASSIGNED:
            return False, f"Invalid transition: current status is '{job.status.value}'.", None

        job.status = JobStatus.WORKER_ON_WAY
        db.commit()
        db.refresh(job)
        return True, "Status updated to WORKER_ON_WAY.", job

    @staticmethod
    def mark_in_progress(db: Session, job_id: int, worker_id: int) -> Tuple[bool, str, Optional[Job]]:
        """Transitions job from WORKER_ON_WAY to IN_PROGRESS and initializes JobHistory."""
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return False, "Job not found.", None

        if job.matched_worker_id != worker_id:
            return False, "Unauthorized: You are not assigned to this job.", None

        if job.status != JobStatus.WORKER_ON_WAY:
            return False, f"Invalid transition: current status is '{job.status.value}'.", None

        job.status = JobStatus.IN_PROGRESS

        # Create or update JobHistory
        history = db.query(JobHistory).filter(JobHistory.job_id == job.id).first()
        if not history:
            history = JobHistory(
                job_id=job.id,
                worker_id=worker_id,
                started_at=get_utc_now(),
                final_price=job.customer_offer or job.recommended_price or 0.0,
                status="IN_PROGRESS"
            )
            db.add(history)
        else:
            history.status = "IN_PROGRESS"

        db.commit()
        db.refresh(job)
        return True, "Job is now IN_PROGRESS.", job

    @staticmethod
    def mark_completed(
        db: Session,
        job_id: int,
        worker_id: int,
        actual_price: Optional[float] = None
    ) -> Tuple[bool, str, Optional[Job]]:
        """
        Completes the job:
        - Updates job status to COMPLETED
        - Records final agreed price
        - Updates JobHistory
        - Enriches PriceHistory for future fair price estimates
        - Frees worker back to AVAILABLE and increments completed_jobs counter
        """
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return False, "Job not found.", None

        if job.matched_worker_id != worker_id:
            return False, "Unauthorized: You are not assigned to this job.", None

        if job.status != JobStatus.IN_PROGRESS:
            return False, f"Invalid transition: job must be IN_PROGRESS before completion (currently '{job.status.value}').", None

        final_amount = actual_price if actual_price is not None else (job.customer_offer or job.recommended_price or 0.0)

        # 1. Update Job
        job.status = JobStatus.COMPLETED
        db.commit()

        # 2. Update JobHistory
        history = db.query(JobHistory).filter(JobHistory.job_id == job.id).first()
        if not history:
            history = JobHistory(
                job_id=job.id,
                worker_id=worker_id,
                started_at=job.created_at or get_utc_now(),
                completed_at=get_utc_now(),
                final_price=final_amount,
                status="COMPLETED"
            )
            db.add(history)
        else:
            history.completed_at = get_utc_now()
            history.final_price = final_amount
            history.status = "COMPLETED"

        # 3. Add to PriceHistory for learning
        PricingService.record_completed_price(
            db=db,
            job_id=job.id,
            category=job.category,
            service=job.service,
            latitude=job.latitude,
            longitude=job.longitude,
            final_price=final_amount
        )

        # 4. Set Worker back to AVAILABLE & increment completed jobs
        worker = db.query(WorkerProfile).filter(WorkerProfile.id == worker_id).first()
        if worker:
            worker.availability_status = AvailabilityStatus.AVAILABLE
            worker.completed_jobs += 1

        db.commit()
        db.refresh(job)
        logger.info(f"Job {job.id} completed by Worker {worker_id} for ₹{final_amount}")
        return True, "Job successfully marked as COMPLETED.", job

    @staticmethod
    def cancel_job(db: Session, job_id: int, customer_id: int) -> Tuple[bool, str, Optional[Job]]:
        """Cancels a job if it hasn't reached IN_PROGRESS or COMPLETED."""
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return False, "Job not found.", None

        if job.customer_id != customer_id:
            return False, "Unauthorized: You do not own this job.", None

        if job.status in [JobStatus.IN_PROGRESS, JobStatus.COMPLETED, JobStatus.CANCELLED]:
            return False, f"Cannot cancel job with status '{job.status.value}'.", None

        job.status = JobStatus.CANCELLED

        # Free worker if already assigned
        if job.matched_worker_id:
            worker = db.query(WorkerProfile).filter(WorkerProfile.id == job.matched_worker_id).first()
            if worker and worker.availability_status == AvailabilityStatus.BUSY:
                worker.availability_status = AvailabilityStatus.AVAILABLE

        # Cancel any open matches
        open_matches = db.query(Match).filter(
            Match.job_id == job.id,
            Match.status.in_([MatchStatus.OFFERED])
        ).all()
        for m in open_matches:
            m.status = MatchStatus.CANCELLED
            m.responded_at = get_utc_now()

        db.commit()
        db.refresh(job)
        return True, "Job cancelled successfully.", job
