"""
Edge Agent API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from app.agents.registry import agent_registry
from app.auth import require_write_access

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.get("")
async def list_agents(type: Optional[str] = None):
    """GET /agents — list all registered agents."""
    agents = agent_registry.list_agents(type_filter=type)
    return {
        "count": len(agents),
        "agents": [a.to_dict() for a in agents],
    }


@router.get("/health")
async def fleet_health():
    """GET /agents/health — fleet-wide health summary."""
    return agent_registry.fleet_health()


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """GET /agents/:id — agent detail with recent telemetry."""
    agent = agent_registry.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {
        **agent.to_dict(),
        "recentTelemetry": agent.telemetry_history[-20:],
    }


@router.post("/{agent_id}/command")
async def send_command(
    agent_id: str,
    payload: dict,
    _user: dict = Depends(require_write_access),
):
    """POST /agents/:id/command — send command to an agent. Protected."""
    agent = agent_registry.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    result = await agent.execute_command(payload)
    return result


def register_agents(app):
    """Register agent routes."""
    app.include_router(router)
