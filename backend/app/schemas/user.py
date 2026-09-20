from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class UserRoleEnum(str, Enum):
    CUSTOMER = "customer"
    WORKER = "worker"


class UserBase(BaseModel):
    name: str
    email: str
    role: UserRoleEnum = UserRoleEnum.CUSTOMER

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip()
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email format.")
        return v


class UserCreate(UserBase):
    firebase_uid: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


class UserSync(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRoleEnum] = None


class UserResponse(BaseModel):
    id: int
    firebase_uid: str
    name: str
    email: str
    role: UserRoleEnum
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
