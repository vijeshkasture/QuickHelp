import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    func
)
from sqlalchemy.orm import relationship
from app.database.database import Base


class UserRole(str, enum.Enum):
    """Roles supported in KaamSetu."""
    CUSTOMER = "customer"
    WORKER = "worker"


class AvailabilityStatus(str, enum.Enum):
    """Availability states for registered workers."""
    AVAILABLE = "AVAILABLE"
    BUSY = "BUSY"
    OFFLINE = "OFFLINE"


class JobStatus(str, enum.Enum):
    """Lifecycle status of a service request/job."""
    CREATED = "CREATED"
    PRICE_ESTIMATED = "PRICE_ESTIMATED"
    SEARCHING = "SEARCHING"
    WORKER_ASSIGNED = "WORKER_ASSIGNED"
    WORKER_ON_WAY = "WORKER_ON_WAY"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_WORKER_ACCEPTED = "NO_WORKER_ACCEPTED"


class MatchStatus(str, enum.Enum):
    """Status of an offer sent to a worker."""
    OFFERED = "OFFERED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class User(Base):
    """
    User model storing core identity and authorization role.
    Firebase UID links authentication securely.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firebase_uid = Column(String(128), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), index=True, nullable=False)
    role = Column(
        SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x]),
        default=UserRole.CUSTOMER,
        nullable=False
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship to WorkerProfile (1-to-1 if worker)
    worker_profile = relationship(
        "WorkerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="WorkerProfile.user_id"
    )

    # Jobs created by this user as customer
    customer_jobs = relationship(
        "Job",
        back_populates="customer",
        foreign_keys="Job.customer_id",
        cascade="all, delete-orphan"
    )

    # Ratings given by this user
    ratings_given = relationship(
        "Rating",
        back_populates="customer",
        foreign_keys="Rating.customer_id"
    )

    def __repr__(self):
        return f"<User id={self.id} email='{self.email}' role='{self.role}'>"


class WorkerProfile(Base):
    """
    Worker profile storing skills, service areas, live availability, and metrics.
    No permanent worker price is stored here; pricing is dynamically job-specific.
    """
    __tablename__ = "worker_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    skills = Column(Text, nullable=True)  # JSON or comma-separated list of skills
    services = Column(Text, nullable=True)  # JSON or comma-separated list of services offered
    experience_years = Column(Float, default=0.0, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    service_radius_km = Column(Float, default=5.0, nullable=False)
    availability_status = Column(
        SQLEnum(AvailabilityStatus, values_callable=lambda x: [e.value for e in x]),
        default=AvailabilityStatus.AVAILABLE,
        nullable=False
    )
    rating = Column(Float, default=0.0, nullable=False)  # 0.0 to 5.0
    completed_jobs = Column(Integer, default=0, nullable=False)
    reliability_score = Column(Float, default=100.0, nullable=False)  # 0 to 100
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="worker_profile", foreign_keys=[user_id])
    assigned_jobs = relationship("Job", back_populates="matched_worker", foreign_keys="Job.matched_worker_id")
    matches = relationship("Match", back_populates="worker", cascade="all, delete-orphan", foreign_keys="Match.worker_id")
    job_histories = relationship("JobHistory", back_populates="worker", foreign_keys="JobHistory.worker_id")
    ratings = relationship("Rating", back_populates="worker", foreign_keys="Rating.worker_id")

    def __repr__(self):
        return f"<WorkerProfile id={self.id} user_id={self.user_id} status='{self.availability_status}'>"


class Job(Base):
    """
    Job entity representing a hyperlocal service request.
    Recommended price and customer offer are strictly decoupled.
    """
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    service = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_text = Column(String(255), nullable=True)
    urgency = Column(String(50), default="immediate", nullable=False)
    status = Column(
        SQLEnum(JobStatus, values_callable=lambda x: [e.value for e in x]),
        default=JobStatus.CREATED,
        nullable=False,
        index=True
    )
    recommended_price = Column(Float, nullable=True)
    customer_offer = Column(Float, nullable=True)
    price_adjustment_count = Column(Integer, default=0, nullable=False)
    matched_worker_id = Column(Integer, ForeignKey("worker_profiles.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    customer = relationship("User", back_populates="customer_jobs", foreign_keys=[customer_id])
    matched_worker = relationship("WorkerProfile", back_populates="assigned_jobs", foreign_keys=[matched_worker_id])
    matches = relationship("Match", back_populates="job", cascade="all, delete-orphan", foreign_keys="Match.job_id")
    job_history = relationship("JobHistory", back_populates="job", uselist=False, cascade="all, delete-orphan", foreign_keys="JobHistory.job_id")
    rating = relationship("Rating", back_populates="job", uselist=False, foreign_keys="Rating.job_id")

    def __repr__(self):
        return f"<Job id={self.id} service='{self.service}' status='{self.status}' offer={self.customer_offer}>"


class Match(Base):
    """
    Tracks offers dispatched to eligible workers and their responses.
    """
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("worker_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    offered_price = Column(Float, nullable=False)
    match_score = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    skill_match_score = Column(Float, nullable=False)
    rating_score = Column(Float, nullable=False)
    reliability_score = Column(Float, nullable=False)
    status = Column(
        SQLEnum(MatchStatus, values_callable=lambda x: [e.value for e in x]),
        default=MatchStatus.OFFERED,
        nullable=False,
        index=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    job = relationship("Job", back_populates="matches", foreign_keys=[job_id])
    worker = relationship("WorkerProfile", back_populates="matches", foreign_keys=[worker_id])

    def __repr__(self):
        return f"<Match id={self.id} job_id={self.job_id} worker_id={self.worker_id} status='{self.status}'>"


class JobHistory(Base):
    """
    Historical execution record for completed or lifecycle-tracked jobs.
    """
    __tablename__ = "job_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("worker_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    final_price = Column(Float, nullable=False)
    status = Column(String(50), nullable=False)

    # Relationships
    job = relationship("Job", back_populates="job_history", foreign_keys=[job_id])
    worker = relationship("WorkerProfile", back_populates="job_histories", foreign_keys=[worker_id])

    def __repr__(self):
        return f"<JobHistory id={self.id} job_id={self.job_id} final_price={self.final_price}>"


class Rating(Base):
    """
    Customer review and rating given to the matched worker upon job completion.
    """
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    worker_id = Column(Integer, ForeignKey("worker_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    job = relationship("Job", back_populates="rating", foreign_keys=[job_id])
    customer = relationship("User", back_populates="ratings_given", foreign_keys=[customer_id])
    worker = relationship("WorkerProfile", back_populates="ratings", foreign_keys=[worker_id])

    def __repr__(self):
        return f"<Rating id={self.id} worker_id={self.worker_id} rating={self.rating}>"


class PriceHistory(Base):
    """
    Historical completed job prices used by the Fair-Price Estimation Engine.
    """
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    service = Column(String(150), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    final_price = Column(Float, nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<PriceHistory id={self.id} service='{self.service}' price={self.final_price}>"
