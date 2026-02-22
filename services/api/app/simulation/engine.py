"""
SimulationEngine — central world-state manager.

Maintains a shared state (time-of-day, weather, operational load) that all
domain modules read from.  Supports scenario injection and configurable tick rate.
"""

import asyncio
import logging
import math
import random
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Coroutine, Dict, List, Optional

from app.simulation.profiles import (
    diurnal_temperature,
    diurnal_pressure,
    operational_load_curve,
    poisson_event,
)

logger = logging.getLogger("plainview.simulation")


@dataclass
class WorldState:
    """Snapshot of the simulated world at a point in time."""

    tick: int = 0
    sim_time: float = 0.0  # seconds since sim start
    time_of_day_hours: float = 8.0  # 0–24
    weather_factor: float = 1.0  # 1.0 = clear, <1 = adverse
    operational_load: float = 0.7  # 0–1

    # Derived environment values (updated each tick)
    ambient_temperature_c: float = 25.0
    base_pressure_pa: float = 2500000
    wind_speed_mps: float = 3.0
    visibility_km: float = 10.0

    # Scenario overrides
    active_scenario: Optional[str] = None
    scenario_step: int = 0
    force_leak: bool = False
    force_valve_fault: bool = False
    force_camera_offline: bool = False
    shutdown_active: bool = False

    # Leak probability multiplier (scenario can increase)
    leak_lambda: float = 0.008  # base Poisson λ per tick


@dataclass
class SimulationEngine:
    """Singleton simulation engine driving all modules."""

    tick_interval: float = 5.0  # seconds
    state: WorldState = field(default_factory=WorldState)
    _running: bool = False
    _task: Optional[asyncio.Task] = None
    _listeners: List[Callable[[WorldState], Coroutine]] = field(default_factory=list)
    _scenario_queue: List[Dict[str, Any]] = field(default_factory=list)

    # ---- lifecycle ----

    def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("Simulation engine started (tick=%.1fs)", self.tick_interval)

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            self._task = None
        logger.info("Simulation engine stopped")

    # ---- tick loop ----

    async def _loop(self):
        try:
            while self._running:
                self._advance_tick()
                await self._run_scenario_step()
                await self._notify_listeners()
                await asyncio.sleep(self.tick_interval)
        except asyncio.CancelledError:
            pass

    def _advance_tick(self):
        s = self.state
        s.tick += 1
        s.sim_time += self.tick_interval

        # Advance time-of-day (1 real second = 1 sim-minute by default)
        s.time_of_day_hours = (s.time_of_day_hours + self.tick_interval / 60.0) % 24.0

        # Update environment from profiles
        s.ambient_temperature_c = diurnal_temperature(s.time_of_day_hours, base=25.0)
        s.base_pressure_pa = diurnal_pressure(s.time_of_day_hours, base=2500000)
        s.operational_load = operational_load_curve(s.time_of_day_hours)

        # Weather drift
        s.weather_factor = max(0.3, min(1.0, s.weather_factor + (random.random() - 0.5) * 0.02))
        s.wind_speed_mps = max(0, 3.0 + (1.0 - s.weather_factor) * 15 + (random.random() - 0.5) * 2)
        s.visibility_km = max(0.5, 10.0 * s.weather_factor + (random.random() - 0.5))

    async def _run_scenario_step(self):
        if not self._scenario_queue:
            return
        step = self._scenario_queue[0]
        trigger_tick = step.get("at_tick", 0)
        if self.state.tick >= trigger_tick:
            self._scenario_queue.pop(0)
            mutations = step.get("mutations", {})
            for key, value in mutations.items():
                if hasattr(self.state, key):
                    setattr(self.state, key, value)
            logger.info("Scenario step applied: %s", mutations)

    async def _notify_listeners(self):
        for fn in self._listeners:
            try:
                await fn(self.state)
            except Exception as exc:
                logger.warning("Listener error: %s", exc)

    # ---- public API ----

    def on_tick(self, callback: Callable[[WorldState], Coroutine]):
        """Register an async callback invoked every tick."""
        self._listeners.append(callback)

    def inject_scenario(self, steps: List[Dict[str, Any]]):
        """Inject a scenario (list of {at_tick, mutations} dicts)."""
        base = self.state.tick
        for step in steps:
            step["at_tick"] = base + step.get("delay_ticks", 0)
        self._scenario_queue = sorted(
            self._scenario_queue + steps, key=lambda s: s["at_tick"]
        )
        if steps:
            name = steps[0].get("name", "custom")
            self.state.active_scenario = name
            self.state.scenario_step = 0
            logger.info("Scenario injected: %s (%d steps)", name, len(steps))

    def clear_scenario(self):
        self._scenario_queue.clear()
        self.state.active_scenario = None
        self.state.scenario_step = 0
        self.state.force_leak = False
        self.state.force_valve_fault = False
        self.state.force_camera_offline = False
        self.state.shutdown_active = False

    def should_generate_leak(self) -> bool:
        """Ask the engine whether a leak should occur this tick."""
        if self.state.force_leak:
            return True
        return poisson_event(self.state.leak_lambda)

    def get_valve_temperature(self, base: float) -> float:
        """Return a coherent valve temperature."""
        ambient = self.state.ambient_temperature_c
        load = self.state.operational_load
        noise = (random.random() - 0.5) * 1.5
        return base * 0.3 + ambient * 0.3 + (base * load) * 0.4 + noise

    def get_valve_pressure(self, base: int) -> int:
        """Return a coherent valve pressure."""
        load = self.state.operational_load
        noise = (random.random() - 0.5) * 30000
        return int(base * (0.85 + load * 0.15) + noise)

    def get_flow_metrics(self, baseline: dict) -> dict:
        """Return coherent flow metrics based on world state."""
        load = self.state.operational_load
        weather = self.state.weather_factor
        return {
            "flow_rate_lpm": max(
                50,
                baseline["flow_rate_lpm"] * load
                + (random.random() - 0.5) * 8,
            ),
            "pressure_pa": max(
                2000000,
                int(
                    baseline["pressure_pa"] * (0.9 + load * 0.1)
                    + (random.random() - 0.5) * 30000
                ),
            ),
            "temperature_c": max(
                15,
                self.state.ambient_temperature_c
                + baseline["temperature_c"] * 0.4
                + (random.random() - 0.5) * 2,
            ),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def should_camera_degrade(self) -> bool:
        if self.state.force_camera_offline:
            return True
        # Bad weather → higher chance
        return random.random() < (0.03 + (1 - self.state.weather_factor) * 0.1)

    def get_detection_confidence(self) -> float:
        """Return detection confidence adjusted for visibility."""
        base = 0.7 + random.random() * 0.3
        return max(0.3, base * min(1.0, self.state.visibility_km / 5.0))

    def snapshot(self) -> dict:
        """Return JSON-serializable snapshot of current state."""
        s = self.state
        return {
            "tick": s.tick,
            "simTime": s.sim_time,
            "timeOfDay": round(s.time_of_day_hours, 2),
            "weatherFactor": round(s.weather_factor, 3),
            "operationalLoad": round(s.operational_load, 3),
            "ambientTemperature": round(s.ambient_temperature_c, 1),
            "basePressure": s.base_pressure_pa,
            "windSpeed": round(s.wind_speed_mps, 1),
            "visibility": round(s.visibility_km, 1),
            "activeScenario": s.active_scenario,
            "forceLeak": s.force_leak,
            "forceValveFault": s.force_valve_fault,
            "forceCameraOffline": s.force_camera_offline,
            "shutdownActive": s.shutdown_active,
        }


# Global singleton
sim_engine = SimulationEngine()
