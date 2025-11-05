import json
import threading
import time
from dataclasses import dataclass
from typing import Optional, Callable
from urllib.parse import urlparse

import paho.mqtt.client as mqtt

from app.events import event_bus


@dataclass
class SummitConfig:
    mqtt_url: str
    api_key: Optional[str] = None
    org_id: Optional[str] = None


class SummitClient:
    def __init__(self, cfg: SummitConfig):
        self.cfg = cfg
        self.client = None  # type: Optional[mqtt.Client]
        self._connected = threading.Event()
        self._thread_started = False

    def connect(self):
        parsed = urlparse(self.cfg.mqtt_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or (443 if parsed.scheme == "wss" else 1883)
        transport = "websockets" if parsed.scheme in ("ws", "wss") else "tcp"

        self.client = mqtt.Client(transport=transport)
        # Use API key as password if provided
        if self.cfg.api_key:
            self.client.username_pw_set(username="plainview", password=self.cfg.api_key)
        # Attach callbacks
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

        # Set headers for org id via user properties if needed (MQTT v5) - skipped for simplicity
        # Connect
        self.client.connect(host, port, keepalive=60)
        self.client.loop_start()
        self._thread_started = True
        # Wait briefly for connection
        self._connected.wait(timeout=3.0)
        # Subscribe to mission updates
        try:
            self.client.subscribe("missions/updates", qos=1)
        except Exception:
            pass

    def disconnect(self):
        try:
            if self.client and self._thread_started:
                self.client.loop_stop()
                self.client.disconnect()
        except Exception:
            pass

    # ---- Publishing helpers ----

    def publish_leak(self, leak: dict):
        try:
            if not self.client:
                return
            payload = json.dumps(leak)
            self.client.publish("plainview/leaks", payload, qos=2, retain=False)
        except Exception:
            pass

    def publish_valve_status(self, asset_id: str, status: dict):
        try:
            if not self.client:
                return
            payload = json.dumps(status)
            topic = f"valves/{asset_id}/status"
            self.client.publish(topic, payload, qos=1, retain=False)
        except Exception:
            pass

    # ---- Callbacks ----

    def _on_connect(self, _client, _userdata, _flags, rc, *args, **kwargs):
        self._connected.set()

    def _on_disconnect(self, *_):
        self._connected.clear()

    def _on_message(self, _client, _userdata, msg: mqtt.MQTTMessage):
        try:
            topic = msg.topic or ""
            payload = msg.payload.decode("utf-8") if msg.payload else "{}"
            if topic == "missions/updates":
                data = json.loads(payload)
                # Emit as SSE event for UI
                ev_type = "mission.updated"
                try:
                    state = data.get("state") or data.get("status")
                    if state == "ACTIVE":
                        ev_type = "mission.started"
                    elif state in ("DONE", "COMPLETED"):
                        ev_type = "mission.completed"
                except Exception:
                    pass
                # Forward to event bus
                # Ensure async emit
                import asyncio
                asyncio.get_event_loop().create_task(event_bus.emit({
                    "type": ev_type,
                    "mission": data,
                    "at": int(time.time() * 1000),
                }))
            elif topic.startswith("valves/") and topic.endswith("/command"):
                # Parse valve asset id
                try:
                    parts = topic.split("/")
                    valve_id = parts[1]
                    import asyncio
                    from app.modules.valveops import start_actuation
                    asyncio.get_event_loop().create_task(start_actuation(valve_id))
                except Exception:
                    pass
        except Exception:
            pass


# Singleton holder
summit_client: Optional[SummitClient] = None

def init_summit(cfg: SummitConfig):
    global summit_client
    summit_client = SummitClient(cfg)
    summit_client.connect()
    # Wire event bus forwarding for alerts → Summit leaks
    try:
        def _forward_alert(event: dict):
            try:
                if not summit_client:
                    return
                if event.get("type") != "alert.created":
                    return
                loc = {
                    "lat": event.get("latitude") or (event.get("location") or {}).get("lat"),
                    "lon": event.get("longitude") or (event.get("location") or {}).get("lon"),
                }
                if loc["lat"] is None or loc["lon"] is None:
                    return
                leak = {
                    "id": event.get("id") or f"LEAK-{int(time.time()*1000)}",
                    "ts": time.time(),
                    "source": "plainview",
                    "asset_id": event.get("assetId") or event.get("valveId") or "unknown",
                    "location": loc,
                    "class": "UNKNOWN",
                    "confidence": float(event.get("confidence") or 0.7),
                    "severity": str(event.get("severity") or "warning").upper(),
                }
                summit_client.publish_leak(leak)
            except Exception:
                pass
        event_bus.subscribe("alert.created", _forward_alert)
    except Exception:
        pass
    return summit_client


def shutdown_summit():
    try:
        if summit_client:
            summit_client.disconnect()
    except Exception:
        pass