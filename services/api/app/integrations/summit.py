import json
import threading
import time
import logging
from dataclasses import dataclass
from typing import Optional, Callable
from urllib.parse import urlparse

import paho.mqtt.client as mqtt

from app.events import event_bus

logger = logging.getLogger("plainview.summit")


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
        self._reconnect_attempts = 0
        self._max_reconnect_delay = 60  # Max 60 seconds between retries
        self._should_reconnect = True

    def connect(self):
        """Connect to MQTT broker with exponential backoff retry."""
        parsed = urlparse(self.cfg.mqtt_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or (443 if parsed.scheme == "wss" else 1883)
        transport = "websockets" if parsed.scheme in ("ws", "wss") else "tcp"

        try:
            self.client = mqtt.Client(transport=transport)
            # Use API key as password if provided
            if self.cfg.api_key:
                self.client.username_pw_set(username="plainview", password=self.cfg.api_key)
            
            # Attach callbacks
            self.client.on_connect = self._on_connect
            self.client.on_message = self._on_message
            self.client.on_disconnect = self._on_disconnect

            # Enable automatic reconnection
            self.client.reconnect_delay_set(min_delay=1, max_delay=self._max_reconnect_delay)
            
            # Connect
            logger.info(f"Connecting to MQTT broker at {host}:{port}")
            self.client.connect(host, port, keepalive=60)
            self.client.loop_start()
            self._thread_started = True
            
            # Wait briefly for connection
            if self._connected.wait(timeout=5.0):
                logger.info("MQTT connection established")
                self._reconnect_attempts = 0
                
                # Subscribe to mission updates
                try:
                    self.client.subscribe("missions/updates", qos=1)
                    logger.info("Subscribed to missions/updates")
                except Exception as e:
                    logger.warning(f"Failed to subscribe: {e}")
            else:
                logger.warning("MQTT connection timeout - will retry in background")
                
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
            self._schedule_reconnect()

    def disconnect(self):
        """Gracefully disconnect from MQTT broker."""
        self._should_reconnect = False
        try:
            if self.client and self._thread_started:
                logger.info("Disconnecting from MQTT broker")
                self.client.loop_stop()
                self.client.disconnect()
        except Exception as e:
            logger.error(f"Error during MQTT disconnect: {e}")

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
        """Callback when connected to MQTT broker."""
        if rc == 0:
            logger.info("MQTT connected successfully")
            self._connected.set()
            self._reconnect_attempts = 0
            
            # Resubscribe to topics after reconnection
            try:
                self.client.subscribe("missions/updates", qos=1)
                self.client.subscribe("valves/+/command", qos=1)
            except Exception as e:
                logger.warning(f"Failed to resubscribe: {e}")
        else:
            logger.error(f"MQTT connection failed with code {rc}")
            self._schedule_reconnect()

    def _on_disconnect(self, _client, _userdata, rc, *args, **kwargs):
        """Callback when disconnected from MQTT broker."""
        self._connected.clear()
        
        if rc != 0:
            logger.warning(f"MQTT disconnected unexpectedly (code {rc})")
            if self._should_reconnect:
                self._schedule_reconnect()
        else:
            logger.info("MQTT disconnected gracefully")

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
    
    def _schedule_reconnect(self):
        """Schedule reconnection with exponential backoff."""
        if not self._should_reconnect:
            return
        
        self._reconnect_attempts += 1
        # Exponential backoff: 2^n seconds, capped at max_reconnect_delay
        delay = min(2 ** self._reconnect_attempts, self._max_reconnect_delay)
        
        logger.info(f"Scheduling MQTT reconnection in {delay}s (attempt {self._reconnect_attempts})")
        
        def reconnect():
            time.sleep(delay)
            if self._should_reconnect and not self._connected.is_set():
                try:
                    logger.info("Attempting MQTT reconnection...")
                    self.connect()
                except Exception as e:
                    logger.error(f"Reconnection attempt failed: {e}")
        
        thread = threading.Thread(target=reconnect, daemon=True)
        thread.start()


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