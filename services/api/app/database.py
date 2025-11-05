import os
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Boolean, MetaData, Table, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from app.config import settings

# Database metadata
metadata = MetaData()

# Tables
flow_metrics = Table(
    "flow_metrics",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("flow_rate_lpm", Float, nullable=False),
    Column("pressure_pa", Integer, nullable=False),
    Column("temperature_c", Float, nullable=False),
    Column("viscosity", Float, nullable=True),
    Column("timestamp", String(64), nullable=False),
    Column("created_at", DateTime, default=datetime.utcnow),
)

flow_anomalies = Table(
    "flow_anomalies",
    metadata,
    Column("id", String(256), primary_key=True),
    Column("type", String(64), nullable=False),
    Column("severity", String(32), nullable=False),
    Column("detected_at", String(64), nullable=False),
    Column("metrics", JSON, nullable=True),
    Column("expected_range", JSON, nullable=True),
    Column("actual_value", Float, nullable=True),
    Column("created_at", DateTime, default=datetime.utcnow),
)

valve_actuations = Table(
    "valve_actuations",
    metadata,
    Column("id", String(256), primary_key=True),
    Column("valve_id", String(128), nullable=False),
    Column("requested_at", String(64), nullable=False),
    Column("completed_at", String(64), nullable=True),
    Column("torque_nm", Float, nullable=True),
    Column("success", Boolean, nullable=False),
    Column("duration", Integer, nullable=True),
    Column("created_at", DateTime, default=datetime.utcnow),
)

leak_detections = Table(
    "leak_detections",
    metadata,
    Column("id", String(256), primary_key=True),
    Column("severity", String(32), nullable=False),
    Column("location", JSON, nullable=False),
    Column("volume_estimate", Float, nullable=True),
    Column("detected_at", String(64), nullable=False),
    Column("status", String(32), nullable=False),
    Column("created_at", DateTime, default=datetime.utcnow),
)

missions = Table(
    "missions",
    metadata,
    Column("id", String(256), primary_key=True),
    Column("name", String(256), nullable=False),
    Column("status", String(32), nullable=False),
    Column("created_at", String(64), nullable=False),
    Column("started_at", String(64), nullable=True),
    Column("completed_at", String(64), nullable=True),
    Column("objectives", JSON, nullable=True),
    Column("assets", JSON, nullable=True),
)

incidents = Table(
    "incidents",
    metadata,
    Column("id", String(256), primary_key=True),
    Column("title", String(512), nullable=False),
    Column("severity", String(32), nullable=False),
    Column("status", String(32), nullable=False),
    Column("started_at", String(64), nullable=False),
    Column("resolved_at", String(64), nullable=True),
    Column("affected_modules", JSON, nullable=True),
    Column("detection_ids", JSON, nullable=True),
    Column("alert_ids", JSON, nullable=True),
    Column("root_cause", String(1024), nullable=True),
    Column("resolution", String(1024), nullable=True),
    Column("timeline", JSON, nullable=True),
)

# Global DB engine and session factory
from typing import Optional
engine: Optional[AsyncEngine] = None
AsyncSessionLocal: Optional[sessionmaker] = None


async def init_db():
    """Initialize database engine and create tables."""
    global engine, AsyncSessionLocal
    
    postgres_url = settings.postgres_url
    if postgres_url.startswith("postgresql://"):
        postgres_url = postgres_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    create_kwargs = {
        "echo": False,
        "future": True,
    }
    # Only apply pooling options for non-sqlite drivers
    if not postgres_url.startswith("sqlite+"):
        create_kwargs.update({
            "pool_size": 10,
            "max_overflow": 20,
        })

    engine = create_async_engine(
        postgres_url,
        **create_kwargs,
    )
    
    AsyncSessionLocal = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        future=True,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)


async def close_db():
    """Close database engine."""
    global engine
    if engine:
        await engine.dispose()


async def get_session():
    """Dependency for FastAPI to get async session."""
    global AsyncSessionLocal
    if not AsyncSessionLocal:
        raise RuntimeError("Database not initialized")
    
    async with AsyncSessionLocal() as session:
        yield session
