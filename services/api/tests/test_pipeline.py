async def test_pipeline_alerts(client):
    r = await client.get("/pipeline/alerts")
    assert r.status_code == 200
    data = r.json()
    # Keys presence
    assert "active_leak_count" in data or "activeLeakCount" in data
    assert "activeLeaks" in data or "active_leaks" in data