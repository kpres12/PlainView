import asyncio
import random
import uuid as uuid_module
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.events import event_bus

router = APIRouter(prefix="/pipeline", tags=["PipelineGuard"])

PIPELINE_SECTIONS = ["A-North", "B-Central", "C-South", "D-East", "E-West"]
leaks_history = []


def generate_simulated_leak():
    """Generate a simulated leak with 10% probability."""
    if random.random() > 0.1:
        return None
    
    section = random.choice(PIPELINE_SECTIONS)
    severity = random.choice(["minor", "major", "critical"])
    
    return {
        "id": str(uuid_module.uuid4()),
        "severity": severity,
        "location": {
            "latitude": 40 + random.random() * 2,
            "longitude": -120 + random.random() * 2,
            "section": section,
        },
        "volume_estimate": (
            500 + random.random() * 1000 if severity == "critical"
            else 100 + random.random() * 200 if severity == "major"
            else 10 + random.random() * 30
        ),
        "detected_at": datetime.utcnow().isoformat(),
        "status": "active",
    }


# Start monitoring
def start_monitoring():
    async def monitor():
        while True:
            leak = generate_simulated_leak()
            if leak:
                leaks_history.append(leak);
                if len(leaks_history) > 100:
                    leaks_history.pop(0)
                
                await event_bus.emit({
                    "type": "alert.created",
                    "severity": "critical" if leak["severity"] == "critical" else "warning",
                    "message": f"{leak['severity'].upper()} leak in {leak['location']['section']}. Volume: {leak['volume_estimate']:.1f}L",
                    "timestamp": datetime.utcnow().isoformat(),
                })

                # Publish to Summit via MQTT if available
                try:
                    from app.integrations.summit import summit_client
                    if summit_client:
                        payload = {
                            "id": leak.get("id"),
                            "ts": datetime.utcnow().timestamp(),
                            "source": "plainview",
                            "asset_id": leak.get("location", {}).get("section"),
                            "location": {
                                "lat": leak.get("location", {}).get("latitude"),
                                "lon": leak.get("location", {}).get("longitude"),
                            },
                            "class": "UNKNOWN",
                            "confidence": 0.8,
                            "severity": leak.get("severity", "minor").upper(),
                        }
                        summit_client.publish_leak(payload)
                except Exception:
                    pass
            
            await asyncio.sleep(10)
    
    asyncio.create_task(monitor())


@router.get("/alerts")
async def get_alerts():
    """GET /pipeline/alerts - active and recent leaks."""
    active = [l for l in leaks_history if l["status"] == "active"]
    recent = leaks_history[-10:]
    
    integrity = max(0, 100 - (len(active) * 10) - (len([l for l in active if l["severity"] == "critical"]) * 30))
    return {
        # snake_case
        "active_leak_count": len(active),
        "critical_count": len([l for l in active if l["severity"] == "critical"]),
        "active_leaks": active[-20:],
        "recent_history": recent,
        "integrity": integrity,
        # camelCase aliases
        "activeLeakCount": len(active),
        "criticalCount": len([l for l in active if l["severity"] == "critical"]),
        "activeLeaks": active[-20:],
        "recentHistory": recent,
    }


@router.get("/health")
async def get_health():
    """GET /pipeline/health - overall health report."""
    active = [l for l in leaks_history if l["status"] == "active"]
    total_volume = sum(l.get("volume_estimate", 0) for l in active)
    
    integrity_score = max(0, 100 - (len(active) * 5))
    payload = {
        "timestamp": datetime.utcnow().isoformat(),
        "integrity_score": integrity_score,
        "active_leaks": len(active),
        "last_inspection": datetime.utcnow().isoformat(),
        "maintenance_due": datetime.utcnow().isoformat(),
        "estimated_volume_lost": total_volume,
        "pressure_profile": [
            {"location": section, "pressure_pa": 2500000 - random.random() * 200000}
            for section in PIPELINE_SECTIONS
        ],
    }
    # Add camelCase aliases
    payload.update({
        "integrityScore": integrity_score,
        "activeLeaks": payload["active_leaks"],
        "lastInspection": payload["last_inspection"],
        "maintenanceDue": payload["maintenance_due"],
        "pressureProfile": [
            {"location": p["location"], "pressurePa": p["pressure_pa"]}
            for p in payload["pressure_profile"]
        ],
    })
    return payload


@router.get("/sections/{section}")
async def get_section(section: str):
    """GET /pipeline/sections/:section - section-specific details."""
    section_leaks = [l for l in leaks_history if l["location"]["section"] == section and l["status"] == "active"]
    
    return {
        "section": section,
        "active_leaks": section_leaks,
        "risk_level": "high" if len(section_leaks) > 5 else "medium" if len(section_leaks) > 2 else "low",
        "last_incident": next((l for l in reversed(leaks_history) if l["location"]["section"] == section), None),
    }


@router.post("/alerts/{leak_id}/resolve")
async def resolve_leak(leak_id: str):
    """POST /pipeline/alerts/:id/resolve - mark leak as resolved."""
    leak = next((l for l in leaks_history if l["id"] == leak_id), None)
    if not leak:
        raise HTTPException(status_code=404, detail="Leak not found")
    
    leak["status"] = "repaired"
    await event_bus.emit({
        "type": "alert.acknowledged",
        "leak_id": leak_id,
        "timestamp": datetime.utcnow().isoformat(),
    })
    
    return {"ok": True, "leak": leak}


def register_pipelineguard(app):
    """Register PipelineGuard routes."""
    start_monitoring()
    app.include_router(router)
