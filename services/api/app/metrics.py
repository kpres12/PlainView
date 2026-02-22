"""
Prometheus metrics for Plainview.

Defines counters, histograms, and gauges for HTTP traffic and domain events.
Exposes GET /metrics in Prometheus exposition format.
"""

import os
from prometheus_client import (
    Counter,
    Gauge,
    Histogram,
    generate_latest,
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    REGISTRY,
)
from fastapi import APIRouter, Response

# ---- HTTP metrics ----

http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "path"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# ---- Domain counters ----

valve_actuations_total = Counter(
    "valve_actuations_total",
    "Total valve actuations completed",
    ["valve_id", "success"],
)

leak_detections_total = Counter(
    "leak_detections_total",
    "Total leak detections",
    ["severity"],
)

anomalies_detected_total = Counter(
    "anomalies_detected_total",
    "Total flow anomalies detected",
    ["type", "severity"],
)

incidents_created_total = Counter(
    "incidents_created_total",
    "Total incidents created",
    ["severity"],
)

camera_detections_total = Counter(
    "camera_detections_total",
    "Total camera/vision detections",
    ["detection_type"],
)

# ---- Domain histograms ----

valve_actuation_duration_seconds = Histogram(
    "valve_actuation_duration_seconds",
    "Valve actuation duration in seconds",
    ["valve_id"],
    buckets=[0.5, 1.0, 1.5, 2.0, 3.0, 5.0],
)

# ---- Domain gauges ----

active_incidents = Gauge(
    "active_incidents",
    "Number of currently active incidents",
)

active_leaks = Gauge(
    "active_leaks",
    "Number of currently active leaks",
)

flow_health_score = Gauge(
    "flow_health_score",
    "Current FlowIQ health score (0–100)",
)

connected_cameras = Gauge(
    "connected_cameras",
    "Number of online cameras",
)

simulation_tick = Gauge(
    "simulation_tick",
    "Current simulation engine tick",
)

agent_count = Gauge(
    "agent_count",
    "Number of registered edge agents",
    ["status"],
)


# ---- /metrics endpoint ----

router = APIRouter(tags=["Metrics"])


@router.get("/metrics")
async def metrics_endpoint():
    """Prometheus exposition endpoint."""
    return Response(
        content=generate_latest(REGISTRY),
        media_type=CONTENT_TYPE_LATEST,
    )


def register_metrics(app):
    """Register /metrics route."""
    app.include_router(router)
