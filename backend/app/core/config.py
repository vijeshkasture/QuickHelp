from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional, Union
from pydantic import field_validator
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    PROJECT_NAME: str = "KaamSetu Backend"
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    # Database settings (SQLite by default, MySQL compatible)
    DATABASE_URL: str = "sqlite:///./kaamsetu.db"

    # Firebase Configuration
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_CLIENT_EMAIL: Optional[str] = None
    FIREBASE_PRIVATE_KEY: Optional[str] = None
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None

    # CORS Configuration
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
