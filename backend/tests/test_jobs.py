from fastapi import status
from app.database.models import User, WorkerProfile, Job, Rating, PriceHistory, UserRole, AvailabilityStatus, JobStatus


def test_customer_create_job(client, auth_customer_headers):
    """Customer creates a service request; price estimate is attached."""
    payload = {
        "category": "electrician",
        "service": "ceiling light repair",
        "description": "Short circuit in living room light fixture",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "location_text": "MG Road, Indore",
        "urgency": "immediate",
        "customer_offer": 350.0
    }
    response = client.post("/api/jobs", json=payload, headers=auth_customer_headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["customer_offer"] == 350.0
    assert data["recommended_price"] is not None
    assert data["status"] in ["SEARCHING", "NO_WORKER_ACCEPTED"]


def test_customer_get_my_jobs(client, auth_customer_headers):
    """Customer retrieves own jobs."""
    client.post("/api/jobs", json={
        "category": "plumber",
        "service": "tap leakage",
        "description": "Kitchen sink tap leaking continuously",
        "latitude": 22.7196,
        "longitude": 75.8577
    }, headers=auth_customer_headers)

    res = client.get("/api/jobs/my", headers=auth_customer_headers)
    assert res.status_code == status.HTTP_200_OK
    jobs = res.json()
    assert len(jobs) == 1
    assert jobs[0]["category"] == "plumber"


def test_customer_increase_offer(client, db, auth_customer_headers):
    """Customer increases offer amount on an existing job and increments adjustment count."""
    res = client.post("/api/jobs", json={
        "category": "electrician",
        "service": "switch repair",
        "description": "Sparking switch",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "customer_offer": 200.0
    }, headers=auth_customer_headers)
    job_id = res.json()["id"]

    # Update offer
    update_res = client.patch(
        f"/api/jobs/{job_id}/offer",
        json={"new_offer": 400.0},
        headers=auth_customer_headers
    )
    assert update_res.status_code == status.HTTP_200_OK
    data = update_res.json()
    assert data["customer_offer"] == 400.0
    assert data["price_adjustment_count"] == 1


def test_complete_job_lifecycle_and_rating(client, db, auth_customer_headers, auth_worker_headers):
    """
    Complete lifecycle:
    1. Worker registers
    2. Customer posts job
    3. Worker accepts offer
    4. Worker goes ON_WAY -> IN_PROGRESS -> COMPLETED
    5. Price history is recorded
    6. Customer rates worker (1-5)
    7. Worker average rating is updated
    """
    # 1. Setup Worker
    client.post("/api/workers/profile", json={
        "skills": "electrician, wiring, ceiling light repair",
        "services": "ceiling light repair",
        "experience_years": 5.0,
        "latitude": 22.7196,
        "longitude": 75.8577,
        "service_radius_km": 10.0,
        "availability_status": "AVAILABLE"
    }, headers=auth_worker_headers)

    # 2. Customer creates Job
    job_res = client.post("/api/jobs", json={
        "category": "electrician",
        "service": "ceiling light repair",
        "description": "Fix ceiling light",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "customer_offer": 300.0
    }, headers=auth_customer_headers)
    job_id = job_res.json()["id"]

    # 3. Worker checks offers and accepts
    offers_res = client.get("/api/workers/me/offers", headers=auth_worker_headers)
    assert offers_res.status_code == status.HTTP_200_OK
    offers = offers_res.json()
    assert len(offers) > 0
    match_id = offers[0]["match_id"]

    accept_res = client.post(f"/api/matching/{match_id}/accept", headers=auth_worker_headers)
    assert accept_res.status_code == status.HTTP_200_OK

    # 4. Worker transitions lifecycle
    on_way_res = client.post(f"/api/jobs/{job_id}/on-way", headers=auth_worker_headers)
    assert on_way_res.status_code == status.HTTP_200_OK
    assert on_way_res.json()["status"] == "WORKER_ON_WAY"

    start_res = client.post(f"/api/jobs/{job_id}/start", headers=auth_worker_headers)
    assert start_res.status_code == status.HTTP_200_OK
    assert start_res.json()["status"] == "IN_PROGRESS"

    complete_res = client.post(f"/api/jobs/{job_id}/complete", json={"actual_price": 300.0}, headers=auth_worker_headers)
    assert complete_res.status_code == status.HTTP_200_OK
    assert complete_res.json()["status"] == "COMPLETED"

    # Worker profile should be back to AVAILABLE with completed_jobs = 1
    worker_prof = client.get("/api/workers/me", headers=auth_worker_headers).json()
    assert worker_prof["availability_status"] == "AVAILABLE"
    assert worker_prof["completed_jobs"] == 1

    # Price history should have record
    price_records = db.query(PriceHistory).filter(PriceHistory.job_id == job_id).all()
    assert len(price_records) == 1
    assert price_records[0].final_price == 300.0

    # 5. Customer rates Worker
    rating_res = client.post("/api/ratings", json={
        "job_id": job_id,
        "rating": 5.0,
        "feedback": "Punctual, fast, and excellent work!"
    }, headers=auth_customer_headers)
    assert rating_res.status_code == status.HTTP_201_CREATED
    assert rating_res.json()["rating"] == 5.0

    # Worker updated rating
    worker_prof_after_rating = client.get("/api/workers/me", headers=auth_worker_headers).json()
    assert worker_prof_after_rating["rating"] == 5.0
