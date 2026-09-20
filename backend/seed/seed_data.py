"""
Seed script for KaamSetu.
Populates realistic benchmark workers and completed job price history
to demonstrate matching and data-driven price estimation.
"""
import sys
import os
from datetime import datetime, timezone, timedelta

# Add parent directory to sys.path so app modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.database import SessionLocal, create_tables, engine, Base
from app.database.models import (
    User,
    WorkerProfile,
    PriceHistory,
    UserRole,
    AvailabilityStatus
)


def seed_database():
    print("==================================================")
    print("KaamSetu - Database Seeding")
    print("Connecting Work. Connecting People.")
    print("==================================================")

    # Recreate all tables cleanly
    Base.metadata.drop_all(bind=engine)
    create_tables()
    db = SessionLocal()

    try:
        print("1. Seeding Benchmark Workers across Trades...")

        # Base central coordinate (Indore / Central City: 22.7196, 75.8577)
        BASE_LAT = 22.7196
        BASE_LON = 75.8577

        worker_data = [
            # Electricians
            {
                "name": "Ramesh Sharma",
                "email": "ramesh.electrician@kaamsetu.demo",
                "firebase_uid": "worker_uid_ramesh_01",
                "skills": "electrical repair, wiring, switch repair, ceiling light repair, fan installation, mcb repair",
                "services": "ceiling light repair, switch/socket repair, fan installation, wiring, mcb replacement",
                "experience_years": 8.5,
                "lat_offset": 0.005,
                "lon_offset": 0.004,
                "radius": 10.0,
                "status": AvailabilityStatus.AVAILABLE,
                "rating": 4.8,
                "completed_jobs": 142,
                "reliability_score": 96.0
            },
            {
                "name": "Suresh Patel",
                "email": "suresh.patel@kaamsetu.demo",
                "firebase_uid": "worker_uid_suresh_02",
                "skills": "ceiling light repair, electrical wiring, led panel fitting, inverter setup",
                "services": "ceiling light repair, led light installation, inverter repair",
                "experience_years": 4.0,
                "lat_offset": -0.008,
                "lon_offset": 0.006,
                "radius": 8.0,
                "status": AvailabilityStatus.AVAILABLE,
                "rating": 4.5,
                "completed_jobs": 68,
                "reliability_score": 92.0
            },
            {
                "name": "Amit Verma",
                "email": "amit.electrician@kaamsetu.demo",
                "firebase_uid": "worker_uid_amit_03",
                "skills": "industrial electrical, wiring, ceiling light repair, switchboard replacement",
                "services": "ceiling light repair, switchboard installation, commercial wiring",
                "experience_years": 12.0,
                "lat_offset": 0.015,
                "lon_offset": -0.012,
                "radius": 12.0,
                "status": AvailabilityStatus.BUSY,
                "rating": 4.9,
                "completed_jobs": 210,
                "reliability_score": 98.0
            },
            {
                "name": "Dinesh Gupta",
                "email": "dinesh.electrician@kaamsetu.demo",
                "firebase_uid": "worker_uid_dinesh_04",
                "skills": "electrical repair, wiring, fan repair, light fitting",
                "services": "ceiling light repair, fan repair, emergency wiring",
                "experience_years": 3.0,
                "lat_offset": 0.002,
                "lon_offset": -0.003,
                "radius": 6.0,
                "status": AvailabilityStatus.OFFLINE,
                "rating": 4.2,
                "completed_jobs": 29,
                "reliability_score": 88.0
            },

            # Plumbers
            {
                "name": "Manoj Kumar",
                "email": "manoj.plumber@kaamsetu.demo",
                "firebase_uid": "worker_uid_manoj_05",
                "skills": "plumbing repair, pipe fitting, tap leakage, water tank cleaning, toilet flush repair",
                "services": "tap leakage repair, pipe replacement, water tank repair, drain blockage",
                "experience_years": 7.0,
                "lat_offset": 0.003,
                "lon_offset": -0.005,
                "radius": 10.0,
                "status": AvailabilityStatus.AVAILABLE,
                "rating": 4.7,
                "completed_jobs": 115,
                "reliability_score": 95.0
            },
            {
                "name": "Rajesh Yadav",
                "email": "rajesh.plumber@kaamsetu.demo",
                "firebase_uid": "worker_uid_rajesh_06",
                "skills": "tap repair, pipe leakage, sanitary fitting, geyser connection",
                "services": "tap leakage repair, geyser plumbing, bathroom pipe fitting",
                "experience_years": 5.5,
                "lat_offset": -0.006,
                "lon_offset": -0.004,
                "radius": 9.0,
                "status": AvailabilityStatus.AVAILABLE,
                "rating": 4.6,
                "completed_jobs": 84,
                "reliability_score": 94.0
            },

            # AC Technicians
            {
                "name": "Vikram Singh",
                "email": "vikram.ac@kaamsetu.demo",
                "firebase_uid": "worker_uid_vikram_07",
                "skills": "ac servicing, gas charging, split ac installation, cooling issue repair, filter cleaning",
                "services": "ac repair, ac filter cleaning, split ac installation, gas leak repair",
                "experience_years": 9.0,
                "lat_offset": 0.008,
                "lon_offset": 0.009,
                "radius": 15.0,
                "status": AvailabilityStatus.AVAILABLE,
                "rating": 4.9,
                "completed_jobs": 178,
                "reliability_score": 97.0
            },

            # Appliance Repair
            {
                "name": "Kailash Joshi",
                "email": "kailash.appliance@kaamsetu.demo",
                "firebase_uid": "worker_uid_kailash_08",
                "skills": "washing machine repair, refrigerator repair, microwave servicing, mixer grinder",
                "services": "washing machine drum repair, refrigerator cooling issue, microwave heating repair",
                "experience_years": 6.0,
                "lat_offset": -0.010,
                "lon_offset": 0.002,
                "radius": 10.0,
                "status": AvailabilityStatus.AVAILABLE,
                "rating": 4.6,
                "completed_jobs": 92,
                "reliability_score": 93.0
            },

            # Carpentry
            {
                "name": "Prakash Prajapat",
                "email": "prakash.carpenter@kaamsetu.demo",
                "firebase_uid": "worker_uid_prakash_09",
                "skills": "door lock repair, hinge fitting, furniture assembly, wooden cabinet repair",
                "services": "door lock replacement, bed assembly, wardrobe hinge repair",
                "experience_years": 10.0,
                "lat_offset": 0.004,
                "lon_offset": 0.008,
                "radius": 8.0,
                "status": AvailabilityStatus.AVAILABLE,
                "rating": 4.8,
                "completed_jobs": 130,
                "reliability_score": 95.0
            }
        ]

        for w in worker_data:
            user = User(
                firebase_uid=w["firebase_uid"],
                name=w["name"],
                email=w["email"],
                role=UserRole.WORKER
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            profile = WorkerProfile(
                user_id=user.id,
                skills=w["skills"],
                services=w["services"],
                experience_years=w["experience_years"],
                latitude=round(BASE_LAT + w["lat_offset"], 6),
                longitude=round(BASE_LON + w["lon_offset"], 6),
                service_radius_km=w["radius"],
                availability_status=w["status"],
                rating=w["rating"],
                completed_jobs=w["completed_jobs"],
                reliability_score=w["reliability_score"]
            )
            db.add(profile)
            db.commit()

        print(f"[OK] Created {len(worker_data)} worker profiles.")

        # 2. Seed Demo Customer
        print("2. Seeding Demo Customer...")
        customer_user = User(
            firebase_uid="customer_uid_priya_01",
            name="Priya Sharma",
            email="priya.customer@kaamsetu.demo",
            role=UserRole.CUSTOMER
        )
        db.add(customer_user)
        db.commit()
        print("[OK] Created demo customer: Priya Sharma (customer_uid_priya_01)")

        # 3. Seed Price History (Historical Completed Jobs for Price Engine)
        print("3. Seeding Real Price History Benchmarks for Price Estimation...")

        historical_jobs = [
            # Electrician - Ceiling light repair
            ("electrician", "ceiling light repair", 280.0, 0.002, 0.003, 10),
            ("electrician", "ceiling light repair", 300.0, -0.004, 0.001, 8),
            ("electrician", "ceiling light repair", 320.0, 0.006, -0.002, 5),
            ("electrician", "ceiling light repair", 300.0, 0.001, 0.004, 3),
            ("electrician", "ceiling light repair", 350.0, -0.002, -0.005, 1),
            # Electrician - Fan installation
            ("electrician", "fan installation", 250.0, 0.003, 0.002, 12),
            ("electrician", "fan installation", 300.0, -0.001, 0.005, 7),
            ("electrician", "fan installation", 280.0, 0.004, -0.003, 4),
            # Electrician - Switch / Socket repair
            ("electrician", "switch repair", 200.0, 0.001, 0.001, 14),
            ("electrician", "switch repair", 220.0, -0.003, 0.002, 9),
            ("electrician", "switchboard installation", 450.0, 0.005, -0.004, 6),
            ("electrician", "wiring", 800.0, -0.002, 0.006, 11),
            ("electrician", "mcb replacement", 350.0, 0.004, 0.002, 4),

            # Plumber
            ("plumber", "tap leakage repair", 250.0, 0.002, -0.004, 15),
            ("plumber", "tap leakage repair", 300.0, -0.003, 0.003, 10),
            ("plumber", "tap leakage repair", 280.0, 0.005, 0.001, 6),
            ("plumber", "pipe replacement", 500.0, -0.004, -0.002, 8),
            ("plumber", "water tank repair", 650.0, 0.006, 0.004, 5),
            ("plumber", "toilet flush repair", 350.0, 0.001, -0.003, 7),
            ("plumber", "drain blockage", 400.0, -0.002, 0.005, 3),

            # AC Repair
            ("ac repair", "ac filter cleaning", 400.0, 0.003, 0.004, 12),
            ("ac repair", "ac servicing", 600.0, -0.002, 0.006, 9),
            ("ac repair", "ac servicing", 650.0, 0.004, -0.001, 4),
            ("ac repair", "split ac installation", 1200.0, 0.007, 0.003, 6),
            ("ac repair", "gas leak repair", 1500.0, -0.005, -0.004, 2),

            # Appliance Repair
            ("appliance repair", "washing machine drum repair", 600.0, -0.001, 0.003, 11),
            ("appliance repair", "refrigerator cooling issue", 750.0, 0.004, -0.002, 7),
            ("appliance repair", "microwave heating repair", 500.0, -0.003, 0.005, 5),

            # Carpentry
            ("carpentry", "door lock replacement", 350.0, 0.002, 0.001, 10),
            ("carpentry", "bed assembly", 600.0, -0.004, 0.003, 8),
            ("carpentry", "wardrobe hinge repair", 400.0, 0.005, -0.002, 4)
        ]

        now = datetime.now(timezone.utc)
        for cat, srv, price, lat_off, lon_off, days_ago in historical_jobs:
            hist = PriceHistory(
                category=cat,
                service=srv,
                latitude=round(BASE_LAT + lat_off, 6),
                longitude=round(BASE_LON + lon_off, 6),
                final_price=price,
                completed_at=now - timedelta(days=days_ago)
            )
            db.add(hist)

        db.commit()
        print(f"[OK] Created {len(historical_jobs)} historical price records.")

        print("==================================================")
        print("Seeding completed successfully!")
        print("Ready for live matching and fair price estimation.")
        print("==================================================")

    except Exception as exc:
        print(f"Error during seeding: {exc}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
