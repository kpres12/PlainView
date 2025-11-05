import asyncio
import json
from pathlib import Path

from app.events import event_bus

DATA_DIR = Path(__file__).resolve().parents[2] / "services" / "api" / "data"
INC_PATH = DATA_DIR / "incidents.json"


async def wait_until(predicate, timeout=2.0, interval=0.05):
    end = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < end:
        if await predicate():
            return True
        await asyncio.sleep(interval)
    return False


async def test_incident_persist_create_and_update(client):
    # Backup and reset incidents.json
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    original = INC_PATH.read_text("utf-8") if INC_PATH.exists() else "[]"
    INC_PATH.write_text("[]", encoding="utf-8")

    try:
        # Emit an alert to create an incident
        await event_bus.emit({
            "type": "alert.created",
            "severity": "warning",
            "message": "Test alert",
            "moduleKey": "valve-ops",
        })

        # Wait until incident appears via API and is persisted
        async def has_incident():
            r = await client.get("/incidents")
            if r.status_code != 200:
                return False
            data = r.json()
            return (data.get("activeCount") or 0) > 0

        assert await wait_until(has_incident)

        # Read file to ensure persistence
        items = json.loads(INC_PATH.read_text("utf-8"))
        assert isinstance(items, list) and len(items) >= 1
        inc_id = items[-1]["id"]

        # Update incident to resolved via API
        r = await client.post(f"/incidents/{inc_id}/update", json={
            "status": "resolved",
            "resolution": "Test resolution"
        })
        assert r.status_code == 200
        updated = r.json()
        assert updated.get("status") == "resolved"
        assert updated.get("resolvedAt")

        # Verify persisted update
        items2 = json.loads(INC_PATH.read_text("utf-8"))
        match = next((i for i in items2 if i.get("id") == inc_id), None)
        assert match and match.get("status") == "resolved"
    finally:
        # Restore file
        INC_PATH.write_text(original, encoding="utf-8")