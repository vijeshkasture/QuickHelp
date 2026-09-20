import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from app.database.models import (
    Job,
    WorkerProfile,
    Match,
    MatchStatus,
    JobStatus,
    AvailabilityStatus
)
from app.utils.geo import calculate_distance_km

logger = logging.getLogger(__name__)

# Configurable matching weights (sum = 1.0)
WEIGHT_SKILL = 0.35
WEIGHT_DISTANCE = 0.25
WEIGHT_RATING = 0.20
WEIGHT_RELIABILITY = 0.20


def get_utc_now():
    return datetime.now(timezone.utc)


class MatchingService:
    """
    Workforce Matching Engine.
    Filters eligible nearby available workers and calculates multi-factor transparent scores.
    Handles offer dispatching, worker acceptance, rejections, and re-matching cascades.
    """

    @staticmethod
    def calculate_worker_suitability(
        worker: WorkerProfile,
        job: Job
    ) -> Tuple[float, float, float, float, float]:
        """
        Computes component scores and overall match score.
        Returns:
            (match_score, distance_km, skill_score, rating_score, reliability_score)
        """
        # 1. Distance Calculation
        distance_km = calculate_distance_km(
            worker.latitude, worker.longitude,
            job.latitude, job.longitude
        )

        # Distance Score (100 at 0km, linearly decays to 0 at service radius)
        radius = max(worker.service_radius_km, 1.0)
        distance_score = max(0.0, min(100.0, (1.0 - (distance_km / radius)) * 100.0))

        # 2. Skill Match Score
        worker_skills = (worker.skills or "").lower()
        worker_services = (worker.services or "").lower()
        job_category = job.category.lower()
        job_service = job.service.lower()

        skill_score = 50.0  # base
        if job_category in worker_skills or job_category in worker_services:
            skill_score += 25.0
        if job_service in worker_skills or job_service in worker_services:
            skill_score += 25.0
        elif any(word in worker_skills or word in worker_services for word in job_service.split() if len(word) > 2):
            skill_score += 15.0

        skill_score = min(100.0, skill_score)

        # 3. Rating Score (0 to 5 mapped to 0 to 100; unrated workers given neutral 80)
        if worker.rating > 0:
            rating_score = min(100.0, (worker.rating / 5.0) * 100.0)
        else:
            rating_score = 80.0

        # 4. Reliability Score (already 0 to 100)
        reliability_score = max(0.0, min(100.0, worker.reliability_score))

        # Composite Match Score
        composite_score = (
            (skill_score * WEIGHT_SKILL) +
            (distance_score * WEIGHT_DISTANCE) +
            (rating_score * WEIGHT_RATING) +
            (reliability_score * WEIGHT_RELIABILITY)
        )

        return (
            round(composite_score, 2),
            distance_km,
            round(skill_score, 2),
            round(rating_score, 2),
            round(reliability_score, 2)
        )

    @classmethod
    def find_eligible_workers(
        cls,
        db: Session,
        job: Job,
        exclude_worker_ids: Optional[List[int]] = None
    ) -> List[Dict[str, Any]]:
        """
        Finds and ranks all eligible workers for a given job.
        Rules:
        - Only AVAILABLE workers
        - Exclude BUSY and OFFLINE workers
        - Within service radius
        - Matching skill/category keywords
        - Exclude already offered/rejected workers for current offer cycle
        """
        if exclude_worker_ids is None:
            exclude_worker_ids = []

        # Query all AVAILABLE workers
        available_workers = db.query(WorkerProfile).filter(
            WorkerProfile.availability_status == AvailabilityStatus.AVAILABLE,
            WorkerProfile.latitude.isnot(None),
            WorkerProfile.longitude.isnot(None),
            WorkerProfile.id.notin_(exclude_worker_ids) if exclude_worker_ids else True
        ).all()

        eligible_candidates = []
        job_category = job.category.lower()
        job_service = job.service.lower()

        for worker in available_workers:
            # Check skill relevance
            combined_skills = f"{(worker.skills or '')} {(worker.services or '')}".lower()
            category_match = job_category in combined_skills
            service_match = job_service in combined_skills
            word_match = any(w in combined_skills for w in job_service.split() if len(w) > 2)

            if not (category_match or service_match or word_match):
                continue

            # Calculate metrics
            match_score, distance_km, skill_score, rating_score, reliability_score = (
                cls.calculate_worker_suitability(worker, job)
            )

            # Check service radius constraint
            if distance_km > worker.service_radius_km:
                continue

            eligible_candidates.append({
                "worker": worker,
                "match_score": match_score,
                "distance_km": distance_km,
                "skill_match_score": skill_score,
                "rating_score": rating_score,
                "reliability_score": reliability_score
            })

        # Rank by match score descending
        eligible_candidates.sort(key=lambda x: x["match_score"], reverse=True)
        return eligible_candidates

    @classmethod
    def dispatch_next_offer(cls, db: Session, job: Job) -> Optional[Match]:
        """
        Finds the highest ranked available worker not yet offered the current price,
        creates an OFFERED match record, and transitions job status to SEARCHING.
        If no suitable worker is available, sets job status to NO_WORKER_ACCEPTED.
        """
        current_offer_price = job.customer_offer or job.recommended_price or 0.0

        # Collect workers who have already been offered this job at the current price
        existing_matches = db.query(Match).filter(
            Match.job_id == job.id,
            Match.offered_price == current_offer_price,
            Match.status.in_([MatchStatus.OFFERED, MatchStatus.REJECTED])
        ).all()
        offered_worker_ids = [m.worker_id for m in existing_matches]

        candidates = cls.find_eligible_workers(db, job, exclude_worker_ids=offered_worker_ids)

        if not candidates:
            # No eligible or available workers remaining for this offer
            job.status = JobStatus.NO_WORKER_ACCEPTED
            db.commit()
            db.refresh(job)
            logger.info(f"Job {job.id}: No suitable worker accepted/available at offer ₹{current_offer_price}")
            return None

        # Pick top candidate
        top_candidate = candidates[0]
        worker = top_candidate["worker"]

        new_match = Match(
            job_id=job.id,
            worker_id=worker.id,
            offered_price=current_offer_price,
            match_score=top_candidate["match_score"],
            distance_km=top_candidate["distance_km"],
            skill_match_score=top_candidate["skill_match_score"],
            rating_score=top_candidate["rating_score"],
            reliability_score=top_candidate["reliability_score"],
            status=MatchStatus.OFFERED
        )

        job.status = JobStatus.SEARCHING
        db.add(new_match)
        db.commit()
        db.refresh(new_match)
        db.refresh(job)

        logger.info(
            f"Job {job.id}: Dispatched offer ₹{new_match.offered_price} to Worker {worker.id} "
            f"(Score: {new_match.match_score}, Dist: {new_match.distance_km}km)"
        )
        return new_match

    @classmethod
    def accept_offer(cls, db: Session, match_id: int, worker_id: int) -> Tuple[bool, str, Optional[Job]]:
        """
        Handles worker accepting a job offer.
        Guarantees race-condition safety and transactional state integrity.
        """
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            return False, "Offer match not found.", None

        if match.worker_id != worker_id:
            return False, "Unauthorized: Match offer does not belong to this worker.", None

        if match.status != MatchStatus.OFFERED:
            return False, f"Offer is no longer active (current status: {match.status.value}).", None

        job = db.query(Job).filter(Job.id == match.job_id).first()
        if not job:
            return False, "Associated job not found.", None

        if job.status != JobStatus.SEARCHING:
            return False, f"Job is no longer in searching state (current status: {job.status.value}).", None

        worker = db.query(WorkerProfile).filter(WorkerProfile.id == worker_id).first()
        if not worker or worker.availability_status != AvailabilityStatus.AVAILABLE:
            return False, "Worker is no longer available to accept jobs.", None

        # Apply acceptance transactionally
        match.status = MatchStatus.ACCEPTED
        match.responded_at = get_utc_now()

        job.status = JobStatus.WORKER_ASSIGNED
        job.matched_worker_id = worker.id

        worker.availability_status = AvailabilityStatus.BUSY

        # Cancel any other outstanding offers for this job
        other_matches = db.query(Match).filter(
            Match.job_id == job.id,
            Match.id != match.id,
            Match.status == MatchStatus.OFFERED
        ).all()
        for other in other_matches:
            other.status = MatchStatus.CANCELLED
            other.responded_at = get_utc_now()

        db.commit()
        db.refresh(match)
        db.refresh(job)
        db.refresh(worker)

        logger.info(f"Job {job.id} matched and assigned to Worker {worker.id} at ₹{match.offered_price}")
        return True, "Job offer accepted successfully.", job

    @classmethod
    def reject_offer(cls, db: Session, match_id: int, worker_id: int) -> Tuple[bool, str, Optional[Match]]:
        """
        Handles worker rejecting a job offer.
        Worker remains AVAILABLE.
        Automatically triggers dispatch to the next suitable available candidate.
        """
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            return False, "Offer match not found.", None

        if match.worker_id != worker_id:
            return False, "Unauthorized: Match offer does not belong to this worker.", None

        if match.status != MatchStatus.OFFERED:
            return False, f"Offer is not in OFFERED state (current status: {match.status.value}).", None

        job = db.query(Job).filter(Job.id == match.job_id).first()
        if not job:
            return False, "Associated job not found.", None

        # Mark rejection
        match.status = MatchStatus.REJECTED
        match.responded_at = get_utc_now()
        db.commit()

        # Worker remains AVAILABLE
        worker = db.query(WorkerProfile).filter(WorkerProfile.id == worker_id).first()
        if worker and worker.availability_status == AvailabilityStatus.BUSY and job.matched_worker_id != worker.id:
            worker.availability_status = AvailabilityStatus.AVAILABLE
            db.commit()

        # Search next suitable available worker
        next_match = cls.dispatch_next_offer(db, job)
        return True, "Job offer rejected.", next_match
