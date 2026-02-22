"""
Simulated edge agents — concrete implementations for demo/dev.

Each agent integrates with SimulationEngine for coherent behaviour.
"""

import random
from datetime import datetime
from typing import Any, Dict

from app.agents.base import EdgeAgent
from app.simulation.engine import sim_engine


class SimulatedDrone(EdgeAgent):
    """Aerial patrol drone — flies routes, reports thermal/visual detections."""

    def __init__(self, agent_id: str, name: str, patrol_center: Dict[str, float]):
        super().__init__(
            agent_id=agent_id,
            agent_type="drone",
            name=name,
            location=dict(patrol_center),
            capabilities=["thermal_imaging", "visual_inspection", "patrol", "emergency_dispatch"],
        )
        self._patrol_center = patrol_center
        self._patrol_radius = 0.01  # degrees
        self._angle = 0.0

    @property
    def tick_interval(self) -> float:
        return 4.0

    async def tick(self):
        # Fly patrol route (circular)
        import math
        self._angle = (self._angle + 0.3) % (2 * math.pi)
        self.location = {
            "lat": self._patrol_center["lat"] + self._patrol_radius * math.cos(self._angle),
            "lon": self._patrol_center["lon"] + self._patrol_radius * math.sin(self._angle),
        }

        # Thermal/visual scan
        confidence = sim_engine.get_detection_confidence() if sim_engine._running else (0.7 + random.random() * 0.3)
        if random.random() < 0.15:
            detection = random.choice(["thermal_anomaly", "leak_sign", "equipment_damage", "personnel"])
            await self.report_telemetry({
                "type": "drone_detection",
                "detection": detection,
                "confidence": round(confidence, 2),
                "altitude_m": 30 + random.random() * 20,
                "battery_pct": max(10, 100 - sim_engine.state.tick * 0.2) if sim_engine._running else 85,
            })

    async def execute_command(self, cmd: Dict[str, Any]) -> Dict[str, Any]:
        action = cmd.get("action")
        if action == "dispatch":
            self.status = "busy"
            target = cmd.get("target", self._patrol_center)
            self.location = target
            return {"ok": True, "agent_id": self.agent_id, "dispatched_to": target}
        if action == "return_to_base":
            self.location = dict(self._patrol_center)
            self.status = "online"
            return {"ok": True, "agent_id": self.agent_id, "returned": True}
        return await super().execute_command(cmd)


class SimulatedRoustabout(EdgeAgent):
    """Ground robot — dispatched to valve locations for actuation/inspection."""

    def __init__(self, agent_id: str, name: str, home_location: Dict[str, float]):
        super().__init__(
            agent_id=agent_id,
            agent_type="roustabout",
            name=name,
            location=dict(home_location),
            capabilities=["valve_actuation", "visual_inspection", "sample_collection", "emergency_shutoff"],
        )
        self._home = home_location

    @property
    def tick_interval(self) -> float:
        return 5.0

    async def tick(self):
        # Report ground-level telemetry
        load = sim_engine.state.operational_load if sim_engine._running else 0.7
        await self.report_telemetry({
            "type": "roustabout_status",
            "battery_pct": max(10, 95 - random.random() * 5),
            "motor_temp_c": 35 + load * 15 + (random.random() - 0.5) * 3,
            "obstacle_detected": random.random() < 0.05,
            "payload": "none" if self.status != "busy" else "sample",
        })

    async def execute_command(self, cmd: Dict[str, Any]) -> Dict[str, Any]:
        action = cmd.get("action")
        if action == "dispatch":
            self.status = "busy"
            target = cmd.get("target", self._home)
            self.location = target
            return {"ok": True, "agent_id": self.agent_id, "dispatched_to": target}
        if action == "actuate_valve":
            valve_id = cmd.get("valve_id")
            self.status = "busy"
            return {"ok": True, "agent_id": self.agent_id, "actuating": valve_id}
        return await super().execute_command(cmd)


class SimulatedSensor(EdgeAgent):
    """Stationary sensor — streams flow/pressure/temp continuously."""

    def __init__(self, agent_id: str, name: str, location: Dict[str, float]):
        super().__init__(
            agent_id=agent_id,
            agent_type="sensor",
            name=name,
            location=dict(location),
            capabilities=["flow_measurement", "pressure_measurement", "temperature_measurement"],
        )

    @property
    def tick_interval(self) -> float:
        return 5.0

    async def tick(self):
        if sim_engine._running:
            metrics = sim_engine.get_flow_metrics({
                "flow_rate_lpm": 150,
                "pressure_pa": 2500000,
                "temperature_c": 45,
            })
        else:
            metrics = {
                "flow_rate_lpm": 150 + (random.random() - 0.5) * 10,
                "pressure_pa": 2500000 + (random.random() - 0.5) * 50000,
                "temperature_c": 45 + (random.random() - 0.5) * 3,
            }
        await self.report_telemetry({
            "type": "sensor_reading",
            **metrics,
        })


class SimulatedGateway(EdgeAgent):
    """Gateway — aggregates nearby sensor data, acts as communication hub."""

    def __init__(self, agent_id: str, name: str, location: Dict[str, float]):
        super().__init__(
            agent_id=agent_id,
            agent_type="gateway",
            name=name,
            location=dict(location),
            capabilities=["data_aggregation", "mesh_routing", "edge_compute"],
        )
        self._connected_nodes = 0

    @property
    def tick_interval(self) -> float:
        return 10.0

    async def tick(self):
        from app.agents.registry import agent_registry
        nearby = [
            a for a in agent_registry.list_agents()
            if a.agent_id != self.agent_id and a.status != "offline"
        ]
        self._connected_nodes = len(nearby)
        await self.report_telemetry({
            "type": "gateway_status",
            "connected_nodes": self._connected_nodes,
            "uplink_quality": round(0.8 + random.random() * 0.2, 2),
            "cpu_pct": round(20 + random.random() * 30, 1),
            "memory_pct": round(40 + random.random() * 20, 1),
        })


def create_default_fleet() -> list[EdgeAgent]:
    """Create a default fleet of simulated agents."""
    return [
        SimulatedDrone("drone-01", "EmberWing-01", {"lat": 40.5, "lon": -120.2}),
        SimulatedDrone("drone-02", "EmberWing-02", {"lat": 40.7, "lon": -120.4}),
        SimulatedRoustabout("roustabout-01", "FieldBot-01", {"lat": 40.6, "lon": -120.3}),
        SimulatedRoustabout("roustabout-02", "FieldBot-02", {"lat": 40.55, "lon": -120.35}),
        SimulatedSensor("sensor-01", "FlowSensor-North", {"lat": 40.65, "lon": -120.25}),
        SimulatedSensor("sensor-02", "FlowSensor-South", {"lat": 40.45, "lon": -120.15}),
        SimulatedSensor("sensor-03", "PressureSensor-East", {"lat": 40.5, "lon": -120.1}),
        SimulatedGateway("gateway-01", "EdgeGateway-01", {"lat": 40.55, "lon": -120.25}),
    ]
