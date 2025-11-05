async def test_flow_health(client):
    r = await client.get("/flow/health")
    assert r.status_code == 200
    data = r.json()
    assert "current_metrics" in data
    assert isinstance(data.get("health_score"), int)


async def test_flow_metrics(client):
    r = await client.get("/flow/metrics")
    assert r.status_code == 200
    data = r.json()
    assert "current" in data and "history" in data and "stats" in data