import asyncio
import uuid as uuid_module
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from fastapi import APIRouter, HTTPException, Request

from app.events import event_bus

router = APIRouter(prefix="/incidents", tags=["Incidents"])

# In-memory incident store (backed by disk)
from app import store
incidents: Dict[str, Dict[str, Any]] = {}


def create_timeline_event(type_: str, title: str, description: str, metadata: Optional[Dict[str, Any]] = None):
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "type": type_,
        "title": title,
        "description": description,
        "metadata": metadata or {},
    }


def correlate_alert(new_alert: Dict[str, Any]):
    """Simple correlation: if there's an active incident in last 2 minutes, attach to it."""
    two_minutes_ago = datetime.utcnow() - timedelta(minutes=2)
    for inc in incidents.values():
        if inc.get("status") != "resolved" and datetime.fromisoformat(inc["startedAt"]) > two_minutes_ago:
            return inc
    return None


async def on_alert_created(event: Dict[str, Any]):
    if event.get("type") != "alert.created":
        return

    existing = correlate_alert(event)
    if existing:
        existing.setdefault("alertIds", []).append(event.get("id") or str(uuid_module.uuid4()))
        existing.setdefault("timeline", []).append(create_timeline_event(
            "alert",
            "New alert",
            f"{event.get('severity', 'INFO').upper()}: {event.get('message', 'Alert')}",
            event,
        ))
        # Persist
        store.upsert_incident(existing)

        await event_bus.emit({
            "type": "incident.updated",
            "incidentId": existing["id"],
            "timestamp": datetime.utcnow().isoformat(),
        })
        return

    # Create new
    inc_id = str(uuid_module.uuid4())
    incident = {
        "id": inc_id,
        "title": event.get("message") or "Incident",
        "severity": event.get("severity", "warning"),
        "status": "active",
        "startedAt": datetime.utcnow().isoformat(),
        "affectedModules": [event.get("moduleKey", "valve-ops")],
        "detectionIds": [],
        "alertIds": [event.get("id") or str(uuid_module.uuid4())],
        "timeline": [create_timeline_event("alert", "Incident Started", event.get("message", "Incident"), event)],
    }
    incidents[inc_id] = incident
    # Persist
    store.upsert_incident(incident)

    await event_bus.emit({
        "type": "incident.created",
        "incidentId": inc_id,
        "severity": incident["severity"],
        "timestamp": datetime.utcnow().isoformat(),
    })


def register_incidents(app):
    # Bootstrap from disk
    try:
        existing = store.get_incidents_map()
        incidents.update(existing)
    except Exception:
        pass
    # Subscribe to alert events
    event_bus.subscribe("alert.created", lambda e: asyncio.create_task(on_alert_created(e)))
    app.include_router(router)


@router.get("")
async def list_incidents():
    active = [i for i in incidents.values() if i.get("status") == "active"]
    recent = [i for i in incidents.values() if datetime.fromisoformat(i["startedAt"]) > datetime.utcnow() - timedelta(days=1)]
    recent.sort(key=lambda x: x["startedAt"], reverse=True)
    return {
        "activeCount": len(active),
        "activeIncidents": active,
        "recentIncidents": recent[:20],
    }


@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    inc = incidents.get(incident_id)
    if not inc:
        return {"error": "not_found"}
    return inc


@router.post("/{incident_id}/update")
async def update_incident(incident_id: str, payload: Dict[str, Any]):
    inc = incidents.get(incident_id)
    if not inc:
        return {"error": "not_found"}

    status = payload.get("status")
    root_cause = payload.get("rootCause")
    resolution = payload.get("resolution")

    if status:
        inc["status"] = status
    if root_cause:
        inc["rootCause"] = root_cause
        inc.setdefault("timeline", []).append(create_timeline_event("update", "Root Cause Identified", root_cause))
    if resolution:
        inc["resolution"] = resolution
        inc["status"] = "resolved"
        inc["resolvedAt"] = datetime.utcnow().isoformat()
        inc.setdefault("timeline", []).append(create_timeline_event("action", "Incident Resolved", resolution))

    # Persist
    store.upsert_incident(inc)

    await event_bus.emit({
        "type": "incident.updated",
        "incidentId": inc["id"],
        "timestamp": datetime.utcnow().isoformat(),
    })

    return inc


@router.get("/{incident_id}/timeline")
async def get_incident_timeline(incident_id: str):
    inc = incidents.get(incident_id)
    if not inc:
        return {"error": "not_found"}

    timeline = sorted(inc.get("timeline", []), key=lambda e: e["timestamp"], reverse=True)
    return {
        "incidentId": inc["id"],
        "title": inc["title"],
        "status": inc["status"],
        "startedAt": inc["startedAt"],
        "resolvedAt": inc.get("resolvedAt"),
        "timeline": timeline,
    }


@router.get("/health")
async def incidents_health():
    all_inc = list(incidents.values())
    active = [i for i in all_inc if i.get("status") == "active"]
    critical = [i for i in all_inc if i.get("severity") == "critical"]

    # Average resolution time in minutes
    resolved = [i for i in all_inc if i.get("resolvedAt")]
    if resolved:
        total_min = 0
        for i in resolved:
            start = datetime.fromisoformat(i["startedAt"]).timestamp()
            end = datetime.fromisoformat(i["resolvedAt"]).timestamp()
            total_min += (end - start) / 60
        avg_resolution = round(total_min / max(1, len(resolved)))
    else:
        avg_resolution = 0

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "totalIncidents": len(all_inc),
        "activeIncidents": len(active),
        "criticalIncidents": len(critical),
        "avgResolutionMinutes": avg_resolution,
        "systemHealth": 100 if len(active) == 0 else max(0, 100 - len(active) * 10),
    }