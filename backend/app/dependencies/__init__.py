"""Dependencies package initialization."""
from app.dependencies.auth import (
    get_current_user,
    require_role,
    require_customer,
    require_worker
)

__all__ = [
    "get_current_user",
    "require_role",
    "require_customer",
    "require_worker"
]
