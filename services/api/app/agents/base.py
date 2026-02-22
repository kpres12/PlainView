"""
EdgeAgent — abstract base class for all edge agents.
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from app.events import event_bus

logger = logging.getLogger("plainview.agents")

AgentType = Literal["drone", "roustabout", "sensor", "gateway"]
AgentStatus = Literal["online", "offline", "degraded", "busy"]


@dataclass
class EdgeAgent(ABC):
    """Base class for edge agents (drones, robots, sensors, gateways)."""

    agent_id: str
    agent_type: AgentType
    name: str
    status: AgentStatus = "online"
    location: Dict[str, float] = field(default_factory=lambda: {"lat": 40.0, "lon": -120.0})
    capabilities: List[str] = field(default_factory=list)
    last_heartbeat: Optional[str] = None
    telemetry_history: List[Dict[str, Any]] = field(default_factory=list)
    _task: Optional[asyncio.Task] = None

    async def start(self):
        """Start the agent's background loop."""
        self._task = asyncio.create_task(self._run_loop())
        await event_bus.emit({
            "type": "ros2.node.discovered",
            "node_id": self.agent_id,
            "node_type": self.agent_type,
            "location": self.location,
            "timestamp": datetime.utcnow().isoformat(),
        })
        logger.info("Agent started: %s (%s)", self.agent_id, self.agent_type)

    def stop(self):
        """Stop the agent."""
        if self._task:
            self._task.cancel()
            self._task = None
        self.status = "offline"

    async def _run_loop(self):
        try:
            while True:
                await self.heartbeat()
                await self.tick()
                await asyncio.sleep(self.tick_interval)
        except asyncio.CancelledError:
            pass

    @property
    def tick_interval(self) -> float:
        """Seconds between ticks. Override in subclass."""
        return 5.0

    async def heartbeat(self):
        """Publish heartbeat / status event."""
        self.last_heartbeat = datetime.utcnow().isoformat()
        await event_bus.emit({
            "type": "device.status",
            "agentId": self.agent_id,
            "agentType": self.agent_type,
            "status": self.status,
            "location": self.location,
            "timestamp": self.last_heartbeat,
        })

    @abstractmethod
    async def tick(self):
        """Main agent logic — called every tick_interval."""
        ...

    async def execute_command(self, cmd: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle a command sent to this agent. Override in subclass.
        Default: log and return ack.
        """
        logger.info("Agent %s received command: %s", self.agent_id, cmd.get("action"))
        return {"ok": True, "agent_id": self.agent_id, "ack": cmd.get("action")}

    async def report_telemetry(self, data: Dict[str, Any]):
        """Push telemetry to event bus and local history."""
        data["agentId"] = self.agent_id
        data["timestamp"] = datetime.utcnow().isoformat()
        self.telemetry_history.append(data)
        if len(self.telemetry_history) > 100:
            self.telemetry_history.pop(0)
        await event_bus.emit({
            "type": "ros2.telemetry",
            **data,
        })

    def to_dict(self) -> dict:
        """JSON-serializable agent summary."""
        return {
            "agentId": self.agent_id,
            "agentType": self.agent_type,
            "name": self.name,
            "status": self.status,
            "location": self.location,
            "capabilities": self.capabilities,
            "lastHeartbeat": self.last_heartbeat,
        }
