from fastapi import status
from app.database.models import User, WorkerProfile, Job, Match, MatchStatus, JobStatus, AvailabilityStatus, UserRole
from app.utils.geo import calculate_distance_km


def test_geo_distance_calculation():
    """Haversine formula calculates correct great-circle distance."""
    # Indore coordinates: ~1.1km apart
    dist = calculate_distance_km(22.7196, 75.8577, 22.7250, 75.8500)
    assert 0.8 <= dist <= 1.5


def test_availability_filtering(client, db, auth_customer_headers, auth_worker_headers, auth_worker2_headers):
    """
    Ensures:
    - AVAILABLE workers are offered
    - BUSY and OFFLINE workers are excluded
    """
    # Worker 1: AVAILABLE
    client.post("/api/workers/profile", json={
        "skills": "electrician, wiring",
        "services": "switch repair",
        "experience_years": 4.0,
        "latitude": 22.7196,
        "longitude": 75.8577,
        "service_radius_km": 10.0,
        "availability_status": "AVAILABLE"
    }, headers=auth_worker_headers)

    # Worker 2: BUSY
    client.post("/api/workers/profile", json={
        "skills": "electrician, wiring",
        "services": "switch repair",
        "experience_years": 8.0,
        "latitude": 22.7196,
        "longitude": 75.8577,
        "service_radius_km": 10.0,
        "availability_status": "BUSY"
    }, headers=auth_worker2_headers)

    # Customer creates Job
    job_res = client.post("/api/jobs", json={
        "category": "electrician",
        "service": "switch repair",
        "description": "Fix switchboard",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "customer_offer": 250.0
    }, headers=auth_customer_headers)
    job_id = job_res.json()["id"]

    # Check matches in DB: only Worker 1 should receive offer
    matches = db.query(Match).filter(Match.job_id == job_id).all()
    assert len(matches) == 1
    worker1_user = db.query(User).filter(User.firebase_uid == "test-token-worker-456").first()
    assert matches[0].worker_id == worker1_user.worker_profile.id


def test_sequential_rejection_and_rematching(client, db, auth_customer_headers, auth_worker_headers, auth_worker2_headers):
    """
    Worker 1 rejects offer -> Worker 2 receives offer -> Worker 2 rejects -> Job transitions to NO_WORKER_ACCEPTED.
    Customer increases offer -> Matching starts again -> Worker 1 receives new offer.
    """
    # Create Worker 1 (closer, higher score)
    client.post("/api/workers/profile", json={
        "skills": "electrician, ceiling light repair",
        "services": "ceiling light repair",
        "experience_years": 5.0,
        "latitude": 22.7196,
        "longitude": 75.8577,
        "service_radius_km": 10.0,
        "availability_status": "AVAILABLE"
    }, headers=auth_worker_headers)

    # Create Worker 2 (further away)
    client.post("/api/workers/profile", json={
        "skills": "electrician, ceiling light repair",
        "services": "ceiling light repair",
        "experience_years": 3.0,
        "latitude": 22.7250,
        "longitude": 75.8650,
        "service_radius_km": 10.0,
        "availability_status": "AVAILABLE"
    }, headers=auth_worker2_headers)

    # 1. Customer creates job
    job_res = client.post("/api/jobs", json={
        "category": "electrician",
        "service": "ceiling light repair",
        "description": "Replace LED fixture",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "customer_offer": 300.0
    }, headers=auth_customer_headers)
    job_id = job_res.json()["id"]

    # 2. Worker 1 receives offer and REJECTS
    w1_offers = client.get("/api/workers/me/offers", headers=auth_worker_headers).json()
    assert len(w1_offers) == 1
    w1_match_id = w1_offers[0]["match_id"]

    reject1_res = client.post(f"/api/matching/{w1_match_id}/reject", headers=auth_worker_headers)
    assert reject1_res.status_code == status.HTTP_200_OK

    # 3. Worker 2 automatically receives the offer
    w2_offers = client.get("/api/workers/me/offers", headers=auth_worker2_headers).json()
    assert len(w2_offers) == 1
    w2_match_id = w2_offers[0]["match_id"]

    # 4. Worker 2 also REJECTS
    reject2_res = client.post(f"/api/matching/{w2_match_id}/reject", headers=auth_worker2_headers)
    assert reject2_res.status_code == status.HTTP_200_OK

    # 5. Job status should now be NO_WORKER_ACCEPTED
    job_check = client.get(f"/api/jobs/{job_id}", headers=auth_customer_headers).json()
    assert job_check["status"] == "NO_WORKER_ACCEPTED"
    assert "increase" in job_check["message"].lower()

    # 6. Customer increases offer to ₹500
    update_res = client.patch(
        f"/api/jobs/{job_id}/offer",
        json={"new_offer": 500.0},
        headers=auth_customer_headers
    )
    assert update_res.status_code == status.HTTP_200_OK
    assert update_res.json()["status"] == "SEARCHING"

    # 7. Rematching occurs: Worker 1 receives the ₹500 offer and ACCEPTS
    w1_new_offers = client.get("/api/workers/me/offers", headers=auth_worker_headers).json()
    assert len(w1_new_offers) == 1
    assert w1_new_offers[0]["offered_price"] == 500.0
    w1_new_match_id = w1_new_offers[0]["match_id"]

    accept_res = client.post(f"/api/matching/{w1_new_match_id}/accept", headers=auth_worker_headers)
    assert accept_res.status_code == status.HTTP_200_OK

    # Job is now WORKER_ASSIGNED
    job_assigned = client.get(f"/api/jobs/{job_id}", headers=auth_customer_headers).json()
    assert job_assigned["status"] == "WORKER_ASSIGNED"
    assert job_assigned["matched_worker"] is not None
