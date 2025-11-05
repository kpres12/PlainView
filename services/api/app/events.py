import asyncio
import json
from typing import Callable, Any
from datetime import datetime

# Event types matching TypeScript version
EVENT_TYPES = {
    "valve.actuation.requested",
    "valve.actuation.completed",
    "leak.alert",
    "telemetry.tick",
    "anomaly.detected",
    "mission.started",
    "mission.completed",
    "device.status",
    "ros2.telemetry",
    "ros2.node.discovered",
    "ros2.node.offline",
    "flow.metrics.updated",
    "alert.created",
    "alert.acknowledged",
}


class EventBus:
    """Simple event bus for publishing and subscribing to events."""
    
    def __init__(self):
        self._subscribers: dict[str, list[Callable]] = {}
        self._event_queue = asyncio.Queue()
    
    def subscribe(self, event_type: str, callback: Callable) -> None:
        """Subscribe to an event type."""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)
    
    def unsubscribe(self, event_type: str, callback: Callable) -> None:
        """Unsubscribe from an event type."""
        if event_type in self._subscribers:
            self._subscribers[event_type].remove(callback)
    
    async def emit(self, event: dict[str, Any]) -> None:
        """Emit an event to all subscribers."""
        event_type = event.get("type")
        if event_type not in EVENT_TYPES:
            return
        
        # Add timestamp if not present
        if "timestamp" not in event:
            event["timestamp"] = datetime.utcnow().isoformat()
        
        # Broadcast to subscribers
        if event_type in self._subscribers:
            for callback in self._subscribers[event_type]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(event)
                    else:
                        callback(event)
                except Exception as e:
                    print(f"Error in event callback: {e}")
        
        # Enqueue for SSE subscribers
        await self._event_queue.put(event)
    
    async def get_event(self) -> dict[str, Any]:
        """Get next event from queue (for SSE)."""
        return await self._event_queue.get()


# Global event bus instance
event_bus = EventBus()


async def register_events(app):
    """Register the /events SSE endpoint with the app."""
    from fastapi.responses import StreamingResponse
    from fastapi import Request
    
    @app.get("/events")
    async def events_stream(request: Request):
        async def event_generator():
            """Generator for Server-Sent Events."""
            # Create a fresh queue for this subscriber
            queue = asyncio.Queue()
            
            async def event_callback(event: dict[str, Any]):
                try:
                    await queue.put(event)
                except Exception:
                    pass
            
            # Subscribe to all events
            for event_type in EVENT_TYPES:
                event_bus.subscribe(event_type, event_callback)
            
            try:
                # Send initial heartbeat
                yield f"event: telemetry.tick\ndata: {json.dumps({'type': 'telemetry.tick', 'at': int(datetime.utcnow().timestamp() * 1000)})}\n\n"
                
                # Heartbeat every 5 seconds + forward events
                heartbeat_task = asyncio.create_task(heartbeat_generator(queue))
                
                while True:
                    try:
                        event = await asyncio.wait_for(queue.get(), timeout=6)
                    except asyncio.TimeoutError:
                        # Client disconnected or no events
                        break
                    
                    if await request.is_disconnected():
                        break
                    
                    event_type = event.get("type", "unknown")
                    event_data = json.dumps(event)
                    yield f"event: {event_type}\ndata: {event_data}\n\n"
            
            except Exception:
                pass
            finally:
                # Cleanup
                for event_type in EVENT_TYPES:
                    event_bus.unsubscribe(event_type, event_callback)
                heartbeat_task.cancel()
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    
    return app


async def heartbeat_generator(queue: asyncio.Queue):
    """Send heartbeat events every 5 seconds."""
    while True:
        try:
            await asyncio.sleep(5)
            heartbeat = {
                "type": "telemetry.tick",
                "at": int(datetime.utcnow().timestamp() * 1000)
            }
            await queue.put(heartbeat)
        except asyncio.CancelledError:
            break
        except Exception:
            pass
