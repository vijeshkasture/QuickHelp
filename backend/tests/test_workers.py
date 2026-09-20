from fastapi import status
from app.database.models import User, WorkerProfile, Job, UserRole, AvailabilityStatus, JobStatus


def test_create_and_get_worker_profile(client, auth_worker_headers):
    """Worker can create profile and fetch own details."""
    payload = {
        "skills": "electrical repair, wiring, ceiling light repair",
        "services": "ceiling light repair, fan installation",
        "experience_years": 5.0,
        "latitude": 22.7196,
        "longitude": 75.8577,
        "service_radius_km": 10.0,
        "availability_status": "AVAILABLE"
    }
    create_res = client.post("/api/workers/profile", json=payload, headers=auth_worker_headers)
    assert create_res.status_code == status.HTTP_201_CREATED
    data = create_res.json()
    assert data["skills"] == payload["skills"]
    assert data["experience_years"] == 5.0
    assert data["availability_status"] == "AVAILABLE"
    assert data["rating"] == 0.0

    # Fetch profile
    get_res = client.get("/api/workers/me", headers=auth_worker_headers)
    assert get_res.status_code == status.HTTP_200_OK
    assert get_res.json()["id"] == data["id"]


def test_update_worker_profile(client, auth_worker_headers):
    """Worker can update skills, radius, and experience."""
    client.post("/api/workers/profile", json={
        "skills": "plumbing",
        "experience_years": 2.0,
        "latitude": 22.7196,
        "longitude": 75.8577
    }, headers=auth_worker_headers)

    update_res = client.patch(
        "/api/workers/profile",
        json={"experience_years": 4.5, "service_radius_km": 15.0},
        headers=auth_worker_headers
    )
    assert update_res.status_code == status.HTTP_200_OK
    data = update_res.json()
    assert data["experience_years"] == 4.5
    assert data["service_radius_km"] == 15.0


def test_toggle_worker_availability(client, auth_worker_headers):
    """Worker can toggle availability status."""
    client.post("/api/workers/profile", json={
        "skills": "wiring",
        "latitude": 22.7196,
        "longitude": 75.8577
    }, headers=auth_worker_headers)

    # Set BUSY
    res = client.patch(
        "/api/workers/availability",
        json={"availability_status": "BUSY"},
        headers=auth_worker_headers
    )
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["availability_status"] == "BUSY"

    # Set OFFLINE
    res2 = client.patch(
        "/api/workers/availability",
        json={"availability_status": "OFFLINE"},
        headers=auth_worker_headers
    )
    assert res2.status_code == status.HTTP_200_OK
    assert res2.json()["availability_status"] == "OFFLINE"


def test_cannot_set_available_while_active_job(client, db, auth_worker_headers):
    """Worker engaged in an active job cannot switch status to AVAILABLE."""
    client.post("/api/workers/profile", json={
        "skills": "wiring",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "availability_status": "BUSY"
    }, headers=auth_worker_headers)

    worker_user = db.query(User).filter(User.role == UserRole.WORKER).first()
    worker_profile = worker_user.worker_profile

    # Create dummy customer and active job
    customer = User(firebase_uid="cust_test_1", name="Cust", email="cust@test.com", role=UserRole.CUSTOMER)
    db.add(customer)
    db.commit()

    active_job = Job(
        customer_id=customer.id,
        category="electrician",
        service="wiring",
        description="Fix main line",
        latitude=22.7196,
        longitude=75.8577,
        status=JobStatus.WORKER_ASSIGNED,
        matched_worker_id=worker_profile.id,
        customer_offer=500.0
    )
    db.add(active_job)
    db.commit()

    # Attempt to switch to AVAILABLE
    res = client.patch(
        "/api/workers/availability",
        json={"availability_status": "AVAILABLE"},
        headers=auth_worker_headers
    )
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "actively engaged" in res.json()["detail"]
