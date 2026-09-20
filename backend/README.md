# KaamSetu Backend

> **Connecting Work. Connecting People.**  
> A Hyperlocal workforce matching & fair pricing backend platform connecting customers with immediately available nearby skilled workers.

---

## 1. Problem Being Solved

In urban and semi-urban communities, finding skilled blue-collar workers (electricians, plumbers, carpenters, AC mechanics, appliance technicians) for immediate or short-duration work involves unpredictable pricing, lack of availability visibility, and friction in negotiation.

**KaamSetu solves this by:**
1. Providing transparent, data-driven **Fair Price Estimation** based on real historical completed jobs.
2. Enabling **instant matching** with only currently **AVAILABLE** workers in the vicinity.
3. Decoupling pricing from static worker profile fees — prices belong to individual job offers.
4. Providing an intelligent **Negotiation & Price Adjustment Cycle**: If workers reject an initial offer, the customer is notified and can choose to increase the offer without recreating the job request.
5. Updating worker availability, ratings, and historical pricing datasets in real-time upon job completion.

---

## 2. Technology Stack

- **Framework**: Python 3.14 / FastAPI
- **Database ORM**: SQLAlchemy (SQLite for development / prototype; MySQL-compatible schema)
- **Authentication**: Firebase Authentication & Firebase Admin SDK (ID Token Bearer authentication with server-side role validation)
- **Data Analysis & Pricing**: Pandas & NumPy for localized and distance-weighted price modeling
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Geospatial Calculations**: Haversine distance algorithm (`app/utils/geo.py`)
- **Testing**: Pytest & HTTPX TestClient

---

## 3. Folder Structure

```
backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app instance, CORS, lifespan, router mounting
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                # Pydantic Settings (.env configuration)
│   │   └── firebase.py              # Firebase Admin SDK initialization & token verifier
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── database.py              # Engine, SessionLocal, get_db dependency, create_tables
│   │   └── models.py                # 7 Core SQLAlchemy entities (User, WorkerProfile, Job, Match, JobHistory, Rating, PriceHistory)
│   │
│   ├── dependencies/
│   │   ├── __init__.py
│   │   └── auth.py                  # Token verification, role guards (require_customer, require_worker)
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py                  # User profiles and sync schemas
│   │   ├── worker.py                # Worker profile and availability schemas
│   │   ├── job.py                   # Job creation, offer updates, and response schemas
│   │   ├── matching.py              # Match, offers, and action response schemas
│   │   ├── pricing.py               # Fair price estimation request/response schemas
│   │   └── rating.py                # Review submission and summary schemas
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                  # GET /api/auth/me, POST /api/auth/sync
│   │   ├── workers.py               # /api/workers (profile, availability, jobs, offers)
│   │   ├── jobs.py                  # /api/jobs (create, get, offer increase, lifecycle)
│   │   ├── matching.py              # /api/matching (start, accept, reject, list)
│   │   ├── pricing.py               # POST /api/pricing/estimate
│   │   └── ratings.py               # POST /api/ratings, GET /api/ratings/worker/{id}
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── pricing_service.py       # Historical price engine (Pandas/NumPy)
│   │   ├── matching_service.py      # Multi-factor ranking, offer dispatch, race-condition safety
│   │   └── job_service.py           # Job lifecycle status transitions & history recording
│   │
│   └── utils/
│       ├── __init__.py
│       └── geo.py                   # Haversine distance computation in km
│
├── seed/
│   └── seed_data.py                 # Seeds realistic worker profiles and price history
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                  # In-memory test DB & mock fixtures
│   ├── test_auth.py                 # Auth and role access tests
│   ├── test_workers.py              # Worker profile and availability constraint tests
│   ├── test_jobs.py                 # Job lifecycle, offer updates, and ratings tests
│   ├── test_matching.py             # Matching engine, ranking, rejection, and re-offer tests
│   └── test_pricing.py              # Statistical price estimation tests
│
├── .env                             # Environment configuration (git-ignored)
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore configuration
├── pytest.ini                       # Test runner config
├── requirements.txt                 # Dependencies
└── README.md                        # Documentation
```

---

## 4. Database Architecture & Schema Summary

The database uses 7 core tables designed with SQLAlchemy ORM, fully compatible with SQLite and production MySQL:

1. **`users`**:
   - `id` (PK, int), `firebase_uid` (unique, indexed), `name`, `email` (indexed), `role` (`customer` | `worker`), `created_at`.
2. **`worker_profiles`**:
   - `id` (PK, int), `user_id` (FK -> users.id, unique), `skills` (text), `services` (text), `experience_years` (float), `latitude` (float), `longitude` (float), `service_radius_km` (float), `availability_status` (`AVAILABLE` | `BUSY` | `OFFLINE`), `rating` (float 0.0-5.0), `completed_jobs` (int), `reliability_score` (float 0-100), `created_at`, `updated_at`.
3. **`jobs`**:
   - `id` (PK, int), `customer_id` (FK -> users.id), `category`, `service`, `description`, `latitude`, `longitude`, `location_text`, `urgency`, `status` (`CREATED` | `PRICE_ESTIMATED` | `SEARCHING` | `WORKER_ASSIGNED` | `WORKER_ON_WAY` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED` | `NO_WORKER_ACCEPTED`), `recommended_price` (float), `customer_offer` (float), `price_adjustment_count` (int), `matched_worker_id` (FK -> worker_profiles.id), `created_at`, `updated_at`.
4. **`matches`**:
   - `id` (PK, int), `job_id` (FK -> jobs.id), `worker_id` (FK -> worker_profiles.id), `offered_price` (float), `match_score` (float), `distance_km` (float), `skill_match_score` (float), `rating_score` (float), `reliability_score` (float), `status` (`OFFERED` | `ACCEPTED` | `REJECTED` | `EXPIRED` | `CANCELLED`), `created_at`, `responded_at`.
5. **`job_history`**:
   - `id` (PK, int), `job_id` (FK -> jobs.id), `worker_id` (FK -> worker_profiles.id), `started_at`, `completed_at`, `final_price`, `status`.
6. **`ratings`**:
   - `id` (PK, int), `job_id` (FK -> jobs.id, unique), `customer_id` (FK -> users.id), `worker_id` (FK -> worker_profiles.id), `rating` (1.0 to 5.0), `feedback` (text), `created_at`.
7. **`price_history`**:
   - `id` (PK, int), `job_id` (FK -> jobs.id, nullable), `category`, `service`, `latitude`, `longitude`, `final_price` (float), `completed_at`.

---

## 5. List of Implemented API Endpoints

All endpoints are registered under the `/api` prefix:

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/auth/me` | Fetch authenticated user profile & role | Bearer Token |
| `POST` | `/api/auth/sync` | Sync user name & role onboarding | Bearer Token |

### Worker Management (`/api/workers`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/workers/profile` | Create worker profile | Worker |
| `GET` | `/api/workers/me` | Get own worker profile | Worker |
| `PATCH` | `/api/workers/profile` | Update skills, location, radius | Worker |
| `PATCH` | `/api/workers/availability` | Set status: AVAILABLE / BUSY / OFFLINE | Worker |
| `GET` | `/api/workers/me/jobs` | View assigned & completed jobs | Worker |
| `GET` | `/api/workers/me/offers` | View pending job offers awaiting response | Worker |

### Jobs (`/api/jobs`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/jobs` | Create service request & trigger matching | Customer |
| `GET` | `/api/jobs/my` | View all customer jobs | Customer |
| `GET` | `/api/jobs/{job_id}` | View detailed job & matched worker | Customer / Assigned Worker |
| `PATCH` | `/api/jobs/{job_id}/offer` | Increase offer & restart matching search | Customer |
| `POST` | `/api/jobs/{job_id}/on-way` | Worker marks status: `WORKER_ON_WAY` | Assigned Worker |
| `POST` | `/api/jobs/{job_id}/start` | Worker marks status: `IN_PROGRESS` | Assigned Worker |
| `POST` | `/api/jobs/{job_id}/complete` | Worker completes job, records final price | Assigned Worker |
| `POST` | `/api/jobs/{job_id}/cancel` | Customer cancels job | Customer |

### Price Estimation (`/api/pricing`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/pricing/estimate` | Data-driven fair price recommendation in INR | Public / Customer |

### Matching Engine (`/api/matching`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/matching/start/{job_id}` | Initiate or restart matching cycle | Customer |
| `POST` | `/api/matching/{match_id}/accept` | Worker accepts job offer | Worker |
| `POST` | `/api/matching/{match_id}/reject` | Worker rejects offer, triggers next candidate | Worker |
| `GET` | `/api/matching/job/{job_id}` | List all offers/matches for a job | Customer / Worker |

### Ratings & Reputation (`/api/ratings`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/ratings` | Submit review (1-5 stars) for completed job | Customer |
| `GET` | `/api/ratings/worker/{worker_id}` | View worker reviews and cumulative score | Public |

---

## 6. How to Configure Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create or open your project.
2. Enable **Firebase Authentication** (Email/Password or Phone Auth).
3. Generate a Service Account Private Key:
   - Navigate to **Project Settings** > **Service Accounts**.
   - Click **Generate New Private Key** to download the JSON credentials file.
4. Set credentials in your `.env` file via either of two methods:

**Method A (Direct Environment Variables):**
```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Method B (File Path):**
```env
FIREBASE_CREDENTIALS_PATH="./firebase-credentials.json"
```

*Note: In development and test mode, test authorization tokens (e.g. `Bearer test-token-worker-1:worker`) or `X-Dev-Firebase-Uid` headers can be used for rapid local verification.*

---

## 7. Installation & Running the Backend

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- `pip`

### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Configure Environment
```bash
copy .env.example .env
```

### Step 3: Seed Real Benchmark Data
```bash
python seed/seed_data.py
```

### Step 4: Start the FastAPI Server
```bash
uvicorn app.main:app --reload --port 8000
```

### Step 5: Verify Live Endpoints
- **Root**: [http://localhost:8000/](http://localhost:8000/)
- **Health**: [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 8. Running Automated Tests

Run the complete test suite with Pytest:
```bash
pytest -v
```

All 17 integration and business logic tests will execute against an isolated in-memory SQLite database, covering:
- Authentication and role restrictions
- Worker profile creation and availability constraints
- Multi-factor worker ranking and Haversine distance scoring
- Sequential rejection flow and transition to `NO_WORKER_ACCEPTED`
- Customer offer increase and re-matching cycle
- Race-condition safe offer acceptance (409 Conflict check)
- Full job lifecycle (`WORKER_ASSIGNED` -> `WORKER_ON_WAY` -> `IN_PROGRESS` -> `COMPLETED`)
- Post-job rating and dynamic price history recording

---

## 9. Core Business Flows Explained

### A. Pricing Flow (`PricingService`)
1. Customer selects a category (e.g. `electrician`) and specific service (e.g. `ceiling light repair`) with coordinates.
2. `PricingService` queries the `price_history` table for historical completed jobs.
3. If matching jobs exist:
   - Evaluates records using Pandas & NumPy.
   - Computes Haversine distance from customer to historical jobs.
   - Weights historical prices inversely proportional to distance.
   - Returns a transparent estimate: `{ "recommended_price": 325, "currency": "INR", "basis": "historical_similar_jobs", "sample_size": 5 }`.
4. If no historical jobs exist:
   - Uses category benchmark baseline heuristics and returns `{ "basis": "category_baseline_heuristic" }`.

### B. Matching & Worker Ranking Flow (`MatchingService`)
1. Filters workers:
   - `availability_status == 'AVAILABLE'` (strictly excludes `BUSY` and `OFFLINE` workers).
   - Within `worker.service_radius_km` of the customer.
   - Skills/services contain relevant category or service keywords.
   - Has not already rejected this specific price offer.
2. Computes multi-factor score:
   - **Skill Match Score** ($35\%$): Exact service match ($100$), category match ($75$), partial keyword match ($65$).
   - **Distance Score** ($25\%$): Linear decay from $100$ at $0\text{ km}$ to $0$ at `service_radius_km`.
   - **Rating Score** ($20\%$): Worker rating out of 5 mapped to 100 ($80$ default for new workers).
   - **Reliability Score** ($20\%$): Historical job fulfillment score ($0-100$).
3. Creates a `Match` record with status `OFFERED` for the top-ranked candidate and transitions Job to `SEARCHING`.

### C. Worker Acceptance Flow
1. Worker sees incoming offer in `GET /api/workers/me/offers`.
2. Worker clicks ACCEPT (`POST /api/matching/{match_id}/accept`).
3. Backend validates transactionally:
   - Match is still `OFFERED`.
   - Job is still `SEARCHING`.
   - Worker is still `AVAILABLE`.
4. State updates:
   - Match marked `ACCEPTED`.
   - Job marked `WORKER_ASSIGNED` and linked to `worker.id`.
   - Worker status set to `BUSY`.
   - Any other open offers for that job are `CANCELLED`.
5. Customer sees worker profile, ratings, and contact info.

### D. Worker Rejection & Price Increase Flow
1. Worker clicks REJECT (`POST /api/matching/{match_id}/reject`).
2. Match marked `REJECTED`. Worker remains `AVAILABLE`.
3. Backend immediately searches for the next best candidate and dispatches the offer at the same customer price.
4. If all suitable available workers reject:
   - Job transitions to `NO_WORKER_ACCEPTED`.
   - Frontend displays: *"No suitable worker accepted the current offer of ₹300. Consider increasing your offer."*
5. Customer updates offer to ₹500 via `PATCH /api/jobs/{job_id}/offer`.
6. Job increments `price_adjustment_count`, reverts status to `SEARCHING`, and dispatches the fresh ₹500 offer to eligible workers.

### E. Job Lifecycle & Completion
1. Worker on way: `POST /api/jobs/{job_id}/on-way` -> status `WORKER_ON_WAY`.
2. Worker begins: `POST /api/jobs/{job_id}/start` -> status `IN_PROGRESS`, starts `job_history`.
3. Worker completes: `POST /api/jobs/{job_id}/complete` -> status `COMPLETED`:
   - Records final price in `job_history`.
   - Inserts record into `price_history` for learning.
   - Sets worker back to `AVAILABLE` and increments `completed_jobs`.
4. Customer rates worker: `POST /api/ratings` (1 to 5 stars + feedback), updating worker's aggregate rating.
