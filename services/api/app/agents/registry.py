"""
AgentRegistry — tracks all registered agents and manages lifecycle.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from app.agents.base import EdgeAgent
from app.events import event_bus
from app.metrics import agent_count

logger = logging.getLogger("plainview.agents.registry")

HEARTBEAT_TIMEOUT = timedelta(seconds=30)


class AgentRegistry:
    """Singleton registry for all edge agents."""

    def __init__(self):
        self._agents: Dict[str, EdgeAgent] = {}
        self._monitor_task: Optional[asyncio.Task] = None

    def register(self, agent: EdgeAgent):
        self._agents[agent.agent_id] = agent
        self._update_gauges()
        logger.info("Registered agent: %s (%s)", agent.agent_id, agent.agent_type)

    def unregister(self, agent_id: str):
        agent = self._agents.pop(agent_id, None)
        if agent:
            agent.stop()
            self._update_gauges()
            logger.info("Unregistered agent: %s", agent_id)

    def get(self, agent_id: str) -> Optional[EdgeAgent]:
        return self._agents.get(agent_id)

    def list_agents(self, type_filter: Optional[str] = None) -> List[EdgeAgent]:
        agents = list(self._agents.values())
        if type_filter:
            agents = [a for a in agents if a.agent_type == type_filter]
        return agents

    async def start_all(self):
        """Start all registered agents and the health monitor."""
        for agent in self._agents.values():
            await agent.start()
        self._monitor_task = asyncio.create_task(self._health_monitor())

    def stop_all(self):
        for agent in self._agents.values():
            agent.stop()
        if self._monitor_task:
            self._monitor_task.cancel()
            self._monitor_task = None

    async def _health_monitor(self):
        """Periodically check agent heartbeats and mark stale ones offline."""
        try:
            while True:
                await asyncio.sleep(15)
                now = datetime.utcnow()
                for agent in self._agents.values():
                    if agent.last_heartbeat:
                        last = datetime.fromisoformat(agent.last_heartbeat)
                        if now - last > HEARTBEAT_TIMEOUT and agent.status != "offline":
                            old_status = agent.status
                            agent.status = "offline"
                            await event_bus.emit({
                                "type": "ros2.node.offline",
                                "node_id": agent.agent_id,
                                "previousStatus": old_status,
                                "timestamp": now.isoformat(),
                            })
                            logger.warning("Agent %s marked offline (no heartbeat)", agent.agent_id)
                self._update_gauges()
        except asyncio.CancelledError:
            pass

    def _update_gauges(self):
        online = len([a for a in self._agents.values() if a.status == "online"])
        offline = len([a for a in self._agents.values() if a.status == "offline"])
        degraded = len([a for a in self._agents.values() if a.status in ("degraded", "busy")])
        agent_count.labels(status="online").set(online)
        agent_count.labels(status="offline").set(offline)
        agent_count.labels(status="degraded").set(degraded)

    def fleet_health(self) -> dict:
        agents = list(self._agents.values())
        online = [a for a in agents if a.status == "online"]
        return {
            "totalAgents": len(agents),
            "onlineAgents": len(online),
            "offlineAgents": len([a for a in agents if a.status == "offline"]),
            "degradedAgents": len([a for a in agents if a.status in ("degraded", "busy")]),
            "byType": {
                t: len([a for a in agents if a.agent_type == t])
                for t in ("drone", "roustabout", "sensor", "gateway")
            },
            "healthScore": int(len(online) / max(1, len(agents)) * 100),
        }


# Global singleton
agent_registry = AgentRegistry()
