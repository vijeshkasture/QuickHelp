from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, UserRole, WorkerProfile, AvailabilityStatus
from app.dependencies.auth import get_current_user
from app.schemas.user import UserResponse, UserSync

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user")
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the currently authenticated user's profile and assigned role.
    Role is verified server-side.
    """
    return current_user


@router.post("/sync", response_model=UserResponse, summary="Sync or update user role and profile")
def sync_user_profile(
    payload: UserSync,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Synchronizes user profile after Firebase registration/login.
    Allows user to claim a role (customer/worker) during initial onboarding.
    """
    if payload.name:
        current_user.name = payload.name.strip()

    if payload.role:
        new_role = UserRole(payload.role.value)
        current_user.role = new_role

        # If switching to worker, ensure a WorkerProfile shell exists
        if new_role == UserRole.WORKER and not current_user.worker_profile:
            profile = WorkerProfile(
                user_id=current_user.id,
                availability_status=AvailabilityStatus.AVAILABLE
            )
            db.add(profile)

    db.commit()
    db.refresh(current_user)
    return current_user
