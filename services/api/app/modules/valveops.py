import asyncio
import random
import uuid as uuid_module
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.models import ValveStatus, ValveHealthReport
from app.database import valve_actuations
from app.events import event_bus

router = APIRouter(prefix="/valves", tags=["ValveOps"])

# Valve inventory with health thresholds
VALVE_INVENTORY = [
    {
        "id": "v-101",
        "name": "Wellhead A1",
        "status": "ok",
        "temperature": 45,
        "pressure_pa": 2500000,
        "estimated_maintenance": "2025-12-05T00:00:00Z",
    },
    {
        "id": "v-102",
        "name": "Manifold B2",
        "status": "warning",
        "last_torque_nm": 48,
        "temperature": 62,
        "pressure_pa": 2800000,
        "estimated_maintenance": "2025-11-12T00:00:00Z",
    },
    {
        "id": "v-103",
        "name": "Isolation C3",
        "status": "ok",
        "temperature": 42,
        "pressure_pa": 2400000,
        "estimated_maintenance": "2025-12-20T00:00:00Z",
    },
]

THRESHOLDS = {
    "temp_warning": 60,  # °C
    "temp_critical": 75,
    "pressure_warning": 2800000,  # Pa (28 bar)
    "pressure_critical": 3000000,  # Pa (30 bar)
    "torque_variance": 5,  # Nm
}

from app import store

# Initialize file-backed store
store.init()


def update_valve_health(valve: dict) -> dict:
    """Update valve health based on metrics and return updated status."""
    status = "ok"
    alerts = []

    if valve.get("temperature") and valve["temperature"] > THRESHOLDS["temp_critical"]:
        status = "offline"
        alerts.append(f"Critical temperature: {valve['temperature']}°C")
    elif valve.get("temperature") and valve["temperature"] > THRESHOLDS["temp_warning"]:
        status = "warning"
        alerts.append(f"High temperature: {valve['temperature']}°C")

    if valve.get("pressure_pa") and valve["pressure_pa"] > THRESHOLDS["pressure_critical"]:
        status = "offline"
        alerts.append(f"Critical pressure: {valve['pressure_pa'] / 1e5:.1f} bar")
    elif valve.get("pressure_pa") and valve["pressure_pa"] > THRESHOLDS["pressure_warning"]:
        if status != "offline":
            status = "warning"
        alerts.append(f"High pressure: {valve['pressure_pa'] / 1e5:.1f} bar")

    # Check if maintenance is due
    if valve.get("estimated_maintenance"):
        est_date = datetime.fromisoformat(valve["estimated_maintenance"].replace("Z", "+00:00"))
        if est_date <= datetime.now(est_date.tzinfo):
            status = "maintenance"
            alerts.append("Maintenance overdue")

    # Emit alerts if status changed
    if status != valve.get("status") and alerts:
        asyncio.create_task(event_bus.emit({
            "type": "alert.created",
            "valve_id": valve["id"],
            "severity": "critical" if status == "offline" else "warning",
            "message": "; ".join(alerts),
            "timestamp": datetime.utcnow().isoformat(),
        }))

    return {**valve, "status": status}


@router.get("")
async def list_valves():
    """GET /valves - list all valves with current health."""
    result = []
    stored_all = store.get_valves()
    for v in VALVE_INVENTORY:
        stored = stored_all.get(v["id"], {})
        updated = {
            **v,
            "last_torque_nm": stored.get("last_torque_nm", v.get("last_torque_nm")),
            "last_actuation_time": stored.get("last_actuation_time"),
        }

        # Simulate temperature/pressure drift
        if random.random() < 0.3:
            updated["temperature"] = (updated.get("temperature", 50) or 50) + (random.random() - 0.5) * 2

        updated = update_valve_health(updated)
        # Add camelCase aliases for UI compatibility
        result.append({
            **updated,
            "lastTorqueNm": updated.get("last_torque_nm"),
            "lastActuationTime": updated.get("last_actuation_time"),
            "pressurePa": updated.get("pressure_pa"),
            "estimatedMaintenance": updated.get("estimated_maintenance"),
        })

    return result


@router.get("/{valve_id}")
async def get_valve(valve_id: str):
    """GET /valves/:id - get single valve with history."""
    valve = next((v for v in VALVE_INVENTORY if v["id"] == valve_id), None)
    if not valve:
        raise HTTPException(status_code=404, detail="Valve not found")

    stored_all = store.get_valves()
    stored = stored_all.get(valve_id, {})
    updated = {
        **valve,
        "last_torque_nm": stored.get("last_torque_nm", valve.get("last_torque_nm")),
        "last_actuation_time": stored.get("last_actuation_time"),
    }

    updated = update_valve_health(updated)
    return {
        **updated,
        "lastTorqueNm": updated.get("last_torque_nm"),
        "lastActuationTime": updated.get("last_actuation_time"),
        "pressurePa": updated.get("pressure_pa"),
        "estimatedMaintenance": updated.get("estimated_maintenance"),
    }


async def start_actuation(valve_id: str) -> dict:
    valve = next((v for v in VALVE_INVENTORY if v["id"] == valve_id), None)
    if not valve:
        raise HTTPException(status_code=404, detail="Valve not found")

    actuation_id = str(uuid_module.uuid4())
    requested_at = datetime.utcnow().isoformat()

    await event_bus.emit({
        "type": "valve.actuation.requested",
        "valve_id": valve_id,
        "requested_at": int(datetime.utcnow().timestamp() * 1000),
    })

    async def complete_actuation():
        await asyncio.sleep(1 + random.random() * 0.4)
        base_torque = 50
        torque = base_torque + (random.random() - 0.5) * THRESHOLDS["torque_variance"]
        completed_at = datetime.utcnow().isoformat()
        duration = int(800 + random.random() * 600)

        store.upsert_valve(valve_id, {
            "last_torque_nm": torque,
            "last_actuation_time": completed_at,
            "actuations": [{
                "valve_id": valve_id,
                "requested_at": requested_at,
                "torque_nm": torque,
                "completed_at": completed_at,
                "success": True,
                "duration": duration,
            }],
        })

        await event_bus.emit({
            "type": "valve.actuation.completed",
            "valve_id": valve_id,
            "torque_nm": torque,
            "completed_at": int(datetime.utcnow().timestamp() * 1000),
        })
        try:
            from app.integrations.summit import summit_client
            if summit_client:
                summit_client.publish_valve_status(valve_id, {
                    "state": "DONE",
                    "torque_nm": torque,
                    "completed_at": datetime.utcnow().isoformat(),
                })
        except Exception:
            pass

    asyncio.create_task(complete_actuation())
    return {"ok": True, "actuation_id": actuation_id}


@router.post("/{valve_id}/actuate")
async def actuate_valve(request: Request, valve_id: str, api_key: str = Depends(lambda: None)):
    """POST /valves/:id/actuate - actuate valve with telemetry.
    
    Protected endpoint - requires X-API-Key header when API_KEY_ENABLED=true.
    Rate limited to 10 requests per minute per IP.
    """
    # Rate limit (10 per minute)
    from app.rate_limit import limiter, VALVE_ACTUATION_LIMIT
    await limiter.check(request, VALVE_ACTUATION_LIMIT)
    
    # Auth check
    from app.auth import verify_api_key
    from app.config import settings
    
    if settings.api_key_enabled:
        await verify_api_key(api_key)
    
    return await start_actuation(valve_id)

@router.get("/{valve_id}/health")
async def get_valve_health(valve_id: str):
    """GET /valves/:id/health - detailed health report."""
    valve = next((v for v in VALVE_INVENTORY if v["id"] == valve_id), None)
    if not valve:
        raise HTTPException(status_code=404, detail="Valve not found")

    # Load persisted state
    from app import store
    stored_all = store.get_valves()
    stored = stored_all.get(valve_id, {})

    updated = {
        **valve,
        "last_torque_nm": stored.get("last_torque_nm", valve.get("last_torque_nm")),
        "last_actuation_time": stored.get("last_actuation_time"),
    }
    updated = update_valve_health(updated)

    # Calculate health score
    health_score = 100
    if updated.get("temperature", 0) > THRESHOLDS["temp_warning"]:
        health_score -= 20
    if updated.get("pressure_pa", 0) > THRESHOLDS["pressure_warning"]:
        health_score -= 20
    if updated.get("estimated_maintenance"):
        est_date = datetime.fromisoformat(
            updated["estimated_maintenance"].replace("Z", "+00:00")
        )
        if est_date <= datetime.now(est_date.tzinfo):
            health_score -= 30

    return {
        # snake_case
        "valve_id": valve_id,
        "status": updated["status"],
        "temperature": updated.get("temperature"),
        "pressure_pa": updated.get("pressure_pa"),
        "last_torque_nm": updated.get("last_torque_nm"),
        "last_actuation_time": updated.get("last_actuation_time"),
        "estimated_maintenance": updated.get("estimated_maintenance"),
        "thresholds": THRESHOLDS,
        "health_score": max(0, health_score),
        # camelCase aliases
        "valveId": valve_id,
        "pressurePa": updated.get("pressure_pa"),
        "lastTorqueNm": updated.get("last_torque_nm"),
        "lastActuationTime": updated.get("last_actuation_time"),
        "estimatedMaintenance": updated.get("estimated_maintenance"),
        "healthScore": max(0, health_score),
    }


def register_valveops(app):
    """Register ValveOps routes with the app."""
    store.init()
    app.include_router(router)
