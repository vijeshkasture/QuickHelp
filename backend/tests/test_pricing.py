from fastapi import status
from datetime import datetime, timezone
from app.database.models import PriceHistory


def test_price_estimate_baseline(client):
    """When no historical records exist, baseline heuristic price is returned."""
    payload = {
        "category": "electrician",
        "service": "ceiling light repair",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "urgency": "immediate"
    }
    response = client.post("/api/pricing/estimate", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "recommended_price" in data
    assert data["currency"] == "INR"
    assert data["basis"] == "category_baseline_heuristic"
    assert data["sample_size"] == 0


def test_price_estimate_with_historical_data(client, db):
    """When historical data exists, recommendation is based on similar jobs."""
    now = datetime.now(timezone.utc)
    # Seed historical records
    records = [
        PriceHistory(category="electrician", service="ceiling light repair", latitude=22.7190, longitude=75.8570, final_price=300.0, completed_at=now),
        PriceHistory(category="electrician", service="ceiling light repair", latitude=22.7200, longitude=75.8580, final_price=320.0, completed_at=now),
        PriceHistory(category="electrician", service="ceiling light repair", latitude=22.7180, longitude=75.8560, final_price=280.0, completed_at=now),
    ]
    db.add_all(records)
    db.commit()

    payload = {
        "category": "electrician",
        "service": "ceiling light repair",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "urgency": "flexible"
    }
    response = client.post("/api/pricing/estimate", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["basis"] == "historical_similar_jobs"
    assert data["sample_size"] == 3
    assert 280.0 <= data["recommended_price"] <= 330.0
