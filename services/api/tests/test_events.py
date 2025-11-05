import asyncio


async def test_events_stream_initial(client):
    # Verify we can receive at least the first heartbeat event
    async with client.stream("GET", "/events") as resp:
        assert resp.status_code == 200
        assert resp.headers.get("content-type", "").startswith("text/event-stream")
        # Read some bytes and look for telemetry.tick
        found = False
        start = asyncio.get_event_loop().time()
        async for chunk in resp.aiter_lines():
            if "telemetry.tick" in chunk:
                found = True
                break
            if asyncio.get_event_loop().time() - start > 6:
                break
        assert found