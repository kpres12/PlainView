from datetime import datetime
from typing import Optional, Literal, Any
from pydantic import BaseModel, Field


# ==================== Shared Models ====================

class Health(BaseModel):
    status: Literal["ok", "degraded", "down"] = "ok"
    uptime_sec: int


class ModuleDescriptor(BaseModel):
    key: str
    title: str
    description: str


# ==================== Valve Operations ====================

class ValveStatus(BaseModel):
    id: str
    name: str
    status: Literal["ok", "warning", "offline", "maintenance"]
    last_torque_nm: Optional[float] = None
    last_actuation_time: Optional[str] = None
    temperature: Optional[float] = None
    pressure_pa: Optional[int] = None
    estimated_maintenance: Optional[str] = None


class ValveActuation(BaseModel):
    valve_id: str
    requested_at: str
    torque_nm: Optional[float] = None
    completed_at: Optional[str] = None
    success: bool
    duration: Optional[int] = None  # milliseconds


class ValveHealthReport(BaseModel):
    valve_id: str
    status: Literal["ok", "warning", "offline", "maintenance"]
    temperature: Optional[float] = None
    pressure_pa: Optional[int] = None
    last_torque_nm: Optional[float] = None
    last_actuation_time: Optional[str] = None
    estimated_maintenance: Optional[str] = None
    thresholds: dict
    health_score: int


# ==================== Pipeline Guard ====================

class LeakDetection(BaseModel):
    id: str
    severity: Literal["minor", "major", "critical"]
    location: dict  # latitude, longitude, section
    volume_estimate: Optional[float] = None  # liters
    detected_at: str
    status: Literal["active", "contained", "repaired"]


class PipelineHealth(BaseModel):
    timestamp: str
    integrity_score: int
    active_leaks: int
    last_inspection: Optional[str] = None
    maintenance_due: Optional[str] = None
    estimated_volume_lost: float
    pressure_profile: list


class PipelineAlerts(BaseModel):
    active_leak_count: int
    critical_count: int
    active_leaks: list[LeakDetection]
    recent_history: list[LeakDetection]
    integrity: int


# ==================== Flow Metrics ====================

class FlowMetrics(BaseModel):
    flow_rate_lpm: float
    pressure_pa: int
    temperature_c: float
    viscosity: Optional[float] = None
    timestamp: str


class FlowAnomaly(BaseModel):
    id: str
    type: Literal["pressure_deviation", "flow_rate_deviation", "temperature_spike", "viscosity_change"]
    severity: Literal["low", "medium", "high"]
    detected_at: str
    metrics: dict
    expected_range: Optional[dict] = None
    actual_value: Optional[float] = None


class FlowHealth(BaseModel):
    timestamp: str
    current_metrics: FlowMetrics
    anomaly_count: int
    recent_anomalies: list[FlowAnomaly]
    health_score: int


# ==================== Events (SSE) ====================

class PlainviewEvent(BaseModel):
    type: str
    timestamp: Optional[str] = None
    data: Optional[dict] = None

    class Config:
        extra = "allow"


# ==================== Incidents ====================

class TimelineEvent(BaseModel):
    timestamp: str
    type: Literal["detection", "alert", "action", "update"]
    title: str
    description: str
    metadata: Optional[dict] = None


class Incident(BaseModel):
    id: str
    title: str
    severity: Literal["info", "warning", "critical"]
    status: Literal["active", "investigating", "mitigated", "resolved"]
    started_at: str
    resolved_at: Optional[str] = None
    affected_modules: list[str]
    detection_ids: list[str]
    alert_ids: list[str]
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    timeline: list[TimelineEvent]


# ==================== Missions ====================

class Mission(BaseModel):
    id: str
    name: str
    status: Literal["idle", "active", "paused", "completed", "failed"]
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    objectives: list[dict]
    assets: list[str]


# ==================== ROS2 Bridge ====================

class ROS2NodeDiscovery(BaseModel):
    node_id: str
    node_type: str
    location: Optional[dict] = None  # lat, lon
    timestamp: str
