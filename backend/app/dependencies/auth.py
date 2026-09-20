import os
import logging
from typing import Optional
from fastapi import Depends, HTTPException, Security, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, UserRole, WorkerProfile
from app.core.firebase import verify_firebase_id_token, get_firebase_app
from app.core.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db),
    x_dev_uid: Optional[str] = Header(default=None, alias="X-Dev-Firebase-Uid"),
    x_dev_email: Optional[str] = Header(default=None, alias="X-Dev-Email"),
    x_dev_name: Optional[str] = Header(default=None, alias="X-Dev-Name"),
    x_dev_role: Optional[str] = Header(default=None, alias="X-Dev-Role")
) -> User:
    """
    Extracts and validates user credentials from Firebase ID token or dev testing headers.
    Resolves the user against the database and returns the User model instance.
    """
    firebase_uid = None
    email = None
    name = None
    role = UserRole.CUSTOMER

    if auth_header and auth_header.credentials:
        token = auth_header.credentials
        
        # Check if this is a development test token (format: "test-token-uid:<role>")
        if token.startswith("test-token-"):
            parts = token.split(":")
            firebase_uid = parts[0]
            role = parts[1] if len(parts) > 1 else UserRole.CUSTOMER
            email = f"{firebase_uid}@kaamsetu.local"
            name = f"User {firebase_uid}"
        else:
            try:
                decoded = verify_firebase_id_token(token)
                firebase_uid = decoded.get("uid")
                email = decoded.get("email", f"{firebase_uid}@firebase.user")
                name = decoded.get("name", "KaamSetu User")
            except Exception as exc:
                logger.warning(f"Firebase token verification failed: {exc}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Authentication failed: {str(exc)}",
                    headers={"WWW-Authenticate": "Bearer"}
                )

    elif x_dev_uid and settings.DEBUG:
        # Development / Testing bypass header when Firebase credentials are not yet configured
        firebase_uid = x_dev_uid
        email = x_dev_email or f"{x_dev_uid}@example.com"
        name = x_dev_name or f"Dev User {x_dev_uid}"
        if x_dev_role and x_dev_role.lower() == "worker":
            role = UserRole.WORKER
        else:
            role = UserRole.CUSTOMER

    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header or Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials."
        )

    # Look up user in database
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        # Create user record in SQLite / MySQL
        user = User(
            firebase_uid=firebase_uid,
            name=name or "KaamSetu User",
            email=email or f"{firebase_uid}@kaamsetu.local",
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def require_role(required_role: UserRole):
    """
    Dependency factory ensuring the authenticated user has the specified role.
    """
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: '{required_role.value}', but user has role: '{user.role.value}'."
            )
        return user
    return role_checker


def require_customer(user: User = Depends(get_current_user)) -> User:
    """Dependency ensuring caller is an authenticated CUSTOMER."""
    if user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Customer access only."
        )
    return user


def require_worker(user: User = Depends(get_current_user)) -> User:
    """Dependency ensuring caller is an authenticated WORKER."""
    if user.role != UserRole.WORKER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Worker access only."
        )
    return user
