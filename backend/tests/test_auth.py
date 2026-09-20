from fastapi import status
from app.database.models import User, UserRole


def test_auth_me_unauthorized(client):
    """Calling /api/auth/me without authorization header should return 401."""
    response = client.get("/api/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_auth_me_authorized_customer(client, auth_customer_headers):
    """Calling /api/auth/me with customer token should auto-create/return customer user."""
    response = client.get("/api/auth/me", headers=auth_customer_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["role"] == "customer"
    assert "firebase_uid" in data


def test_auth_sync_profile(client, auth_customer_headers):
    """Updating profile name and role via /api/auth/sync."""
    response = client.post(
        "/api/auth/sync",
        json={"name": "Rohit Sharma", "role": "customer"},
        headers=auth_customer_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Rohit Sharma"
    assert data["role"] == "customer"


def test_role_enforcement_forbidden(client, auth_customer_headers):
    """Customer attempting to access worker-only endpoint receives 403 Forbidden."""
    response = client.get("/api/workers/me", headers=auth_customer_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
