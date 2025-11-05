"""
Intelligence module for Plainview.

Receives AI insights from Summit.OS Intelligence via the adapter.
"""

from datetime import datetime
from fastapi import APIRouter
from app.events import event_bus

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

# In-memory storage for insights (replace with DB in production)
insights_store = []


@router.post("/insights")
async def receive_insight(payload: dict):
    """
    Receive AI insight from Summit.OS Intelligence adapter.
    
    Expected payload:
    {
        "type": "intelligence.insight",
        "insight_type": "flow_anomaly" | "valve_health" | "pipeline_integrity",
        "severity": "low" | "medium" | "high" | "critical",
        "title": str,
        "description": str,
        "confidence": float,
        "asset_id": str | null,
        "recommendations": list[str],
        "timestamp": str,
        "source": "summit-os-intelligence"
    }
    """
    # Store insight
    insight = {
        "id": f"insight-{len(insights_store) + 1}",
        "type": payload.get("insight_type"),
        "severity": payload.get("severity"),
        "title": payload.get("title"),
        "description": payload.get("description"),
        "confidence": payload.get("confidence"),
        "asset_id": payload.get("asset_id"),
        "recommendations": payload.get("recommendations", []),
        "timestamp": payload.get("timestamp"),
        "source": payload.get("source", "unknown"),
        "received_at": datetime.utcnow().isoformat()
    }
    
    insights_store.append(insight)
    
    # Keep only last 100 insights
    if len(insights_store) > 100:
        insights_store.pop(0)
    
    # Emit to SSE stream
    await event_bus.emit({
        "type": "intelligence.insight.received",
        "insight": insight,
        "at": int(datetime.utcnow().timestamp() * 1000)
    })
    
    return {"status": "ok", "insight_id": insight["id"]}


@router.get("/insights")
async def list_insights(limit: int = 20, severity: str = None):
    """List recent AI insights."""
    results = insights_store
    
    if severity:
        results = [i for i in results if i["severity"] == severity]
    
    # Return most recent first
    return list(reversed(results[-limit:]))


@router.get("/insights/{insight_id}")
async def get_insight(insight_id: str):
    """Get a specific insight by ID."""
    for insight in insights_store:
        if insight["id"] == insight_id:
            return insight
    
    return {"error": "Insight not found"}, 404


def register_intelligence(app):
    """Register intelligence routes."""
    app.include_router(router)
