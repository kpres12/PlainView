"""
Simulation control endpoints.
"""

from fastapi import APIRouter, HTTPException
from app.simulation.engine import sim_engine
from app.simulation.scenarios import get_scenario, list_scenarios, SCENARIOS

router = APIRouter(prefix="/simulation", tags=["Simulation"])


@router.get("/status")
async def simulation_status():
    """Current simulation state snapshot."""
    return {
        "enabled": sim_engine._running,
        "tickInterval": sim_engine.tick_interval,
        **sim_engine.snapshot(),
    }


@router.get("/scenarios")
async def available_scenarios():
    """List available scenarios."""
    return list_scenarios()


@router.post("/scenario")
async def activate_scenario(payload: dict):
    """
    Activate a named scenario.

    Body: { "name": "cascade_failure" }
    """
    name = payload.get("name")
    if not name or name not in SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario '{name}'. Available: {list(SCENARIOS.keys())}",
        )
    scenario = get_scenario(name)
    sim_engine.clear_scenario()
    sim_engine.inject_scenario(list(scenario["steps"]))
    return {"ok": True, "scenario": name, "steps": len(scenario["steps"])}


@router.post("/reset")
async def reset_simulation():
    """Clear active scenario and return to defaults."""
    sim_engine.clear_scenario()
    return {"ok": True, "message": "Simulation reset to defaults"}


def register_simulation(app):
    """Register simulation routes."""
    app.include_router(router)
