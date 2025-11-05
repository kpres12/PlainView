import asyncio


async def test_valves_list(client):
    r = await client.get("/valves")
    assert r.status_code == 200
    valves = r.json()
    assert isinstance(valves, list) and len(valves) >= 1
    assert all("id" in v for v in valves)


async def test_valve_actuation_flow(client):
    r = await client.post("/valves/v-101/actuate")
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    # Wait for async actuation to complete
    await asyncio.sleep(1.8)
    rv = await client.get("/valves/v-101")
    assert rv.status_code == 200
    v = rv.json()
    assert v.get("last_torque_nm") is not None