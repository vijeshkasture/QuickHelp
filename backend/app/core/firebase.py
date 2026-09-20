import os
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

_firebase_app = None


def initialize_firebase() -> Optional[object]:
    """
    Initializes the Firebase Admin SDK using either environment credentials or a credentials file.
    Handles escaped newline characters in private keys safely.
    Does NOT crash on startup if credentials are not configured yet, but logs a clear warning.
    """
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    from app.core.config import settings

    try:
        import firebase_admin
        from firebase_admin import credentials

        # Check if an app is already initialized
        if firebase_admin._apps:
            _firebase_app = firebase_admin.get_app()
            return _firebase_app

        # Option 1: File path
        if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized from credentials file.")
            return _firebase_app

        # Option 2: Environment variables with Service Account Key
        if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
            # Handle escaped newlines in private key
            private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")
            cred_dict = {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key": private_key,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            cred = credentials.Certificate(cred_dict)
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized from environment credentials.")
            return _firebase_app

        # Option 3: Project ID initialization
        if settings.FIREBASE_PROJECT_ID:
            _firebase_app = firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
            logger.info(f"Firebase Admin SDK initialized with Project ID '{settings.FIREBASE_PROJECT_ID}'.")
            return _firebase_app

        logger.warning(
            "Firebase credentials are not configured in .env. "
            "Firebase token verification will fail unless valid credentials are provided."
        )
        return None

    except Exception as exc:
        logger.error(f"Error initializing Firebase Admin SDK: {exc}")
        return None


def get_firebase_app():
    """Returns the initialized Firebase App instance or None."""
    global _firebase_app
    if _firebase_app is None:
        _firebase_app = initialize_firebase()
    return _firebase_app


def verify_firebase_id_token(id_token: str) -> Dict[str, Any]:
    """
    Verifies a Firebase ID token using Firebase Admin SDK.
    Raises ValueError if Firebase is uninitialized or token is invalid/expired.
    """
    from firebase_admin import auth

    app = get_firebase_app()
    if app is None:
        raise ValueError("Firebase Admin SDK is not initialized. Please configure Firebase credentials.")

    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as exc:
        raise ValueError(f"Invalid Firebase ID token: {str(exc)}")
