import json
import os
from pathlib import Path
from typing import Any, Dict

DATA_DIR = Path(__file__).resolve().parents[2] / "services" / "api" / "data"
FILES = {
    "incidents": DATA_DIR / "incidents.json",
    "valves": DATA_DIR / "valves.json",
}


def _ensure():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not FILES["incidents"].exists():
        FILES["incidents"].write_text("[]", encoding="utf-8")
    if not FILES["valves"].exists():
        FILES["valves"].write_text("{}\n", encoding="utf-8")


def _read_json(path: Path, fallback: Any):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def _write_json(path: Path, data: Any):
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def init():
    _ensure()


def list_incidents() -> list[dict]:
    _ensure()
    return _read_json(FILES["incidents"], [])


def add_incident(inc: Dict[str, Any]):
    _ensure()
    all_inc = _read_json(FILES["incidents"], [])
    all_inc.append(inc)
    _write_json(FILES["incidents"], all_inc)


def get_incidents_map() -> Dict[str, Dict[str, Any]]:
    """Return incidents keyed by id."""
    items = list_incidents()
    result: Dict[str, Dict[str, Any]] = {}
    for inc in items:
        if isinstance(inc, dict) and inc.get("id"):
            result[inc["id"]] = inc
    return result


def upsert_incident(inc: Dict[str, Any]):
    """Insert or replace an incident by id."""
    _ensure()
    items = _read_json(FILES["incidents"], [])
    found = False
    for i, existing in enumerate(items):
        if isinstance(existing, dict) and existing.get("id") == inc.get("id"):
            items[i] = inc
            found = True
            break
    if not found:
        items.append(inc)
    _write_json(FILES["incidents"], items)


def get_valves() -> Dict[str, Dict[str, Any]]:
    """Return valves state, normalizing camelCase and snake_case keys."""
    _ensure()
    raw = _read_json(FILES["valves"], {})
    result: Dict[str, Dict[str, Any]] = {}
    for vid, v in raw.items():
        norm = dict(v)
        # Normalize to include snake_case mirrors
        if "lastTorqueNm" in v:
            norm.setdefault("last_torque_nm", v["lastTorqueNm"])
        if "lastActuationTime" in v:
            norm.setdefault("last_actuation_time", v["lastActuationTime"])
        if "updatedAt" in v:
            norm.setdefault("updated_at", v["updatedAt"])
        result[vid] = norm
    return result


def upsert_valve(valve_id: str, patch: Dict[str, Any]):
    """Merge patch into valve record and persist (camelCase preferred on disk)."""
    _ensure()
    data = _read_json(FILES["valves"], {})
    current = data.get(valve_id, {})

    # Map snake_case inputs to camelCase for storage
    if "last_torque_nm" in patch:
        patch["lastTorqueNm"] = patch.pop("last_torque_nm")
    if "last_actuation_time" in patch:
        patch["lastActuationTime"] = patch.pop("last_actuation_time")
    if "updated_at" in patch:
        patch["updatedAt"] = patch.pop("updated_at")

    # Merge and set updatedAt
    merged = {**current, **patch}
    merged["updatedAt"] = merged.get("updatedAt") or int(__import__("time").time() * 1000)

    data[valve_id] = merged
    _write_json(FILES["valves"], data)