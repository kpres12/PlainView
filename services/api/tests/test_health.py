import pytest


async def test_health_ok(client):
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert isinstance(data["uptime_sec"], int)


async def test_modules_list(client):
    r = await client.get("/modules")
    assert r.status_code == 200
    mods = r.json()
    assert isinstance(mods, list) and len(mods) >= 4
    assert any(m.get("key") == "valve-ops" for m in mods)