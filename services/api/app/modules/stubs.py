from fastapi import APIRouter
from datetime import datetime

def register_rigsight(app):
    """Register RigSight camera module."""
    router = APIRouter(prefix="/rig", tags=["RigSight"])
    
    @router.get("/cameras")
    async def list_cameras():
        return {
            "cameras": [
                {"id": "cam-1", "name": "North Tower", "status": "online", "location": "Tower 1"},
                {"id": "cam-2", "name": "South Tower", "status": "online", "location": "Tower 2"},
            ]
        }
    
    app.include_router(router)


def register_incidents(app):
    """Register Incidents module."""
    router = APIRouter(prefix="/incidents", tags=["Incidents"])
    
    @router.get("")
    async def list_incidents():
        return {
            "incidents": [],
            "total": 0,
        }
    
    @router.get("/{incident_id}")
    async def get_incident(incident_id: str):
        return {"error": "not_found"}
    
    app.include_router(router)


def register_missions(app):
    """Register Missions module."""
    router = APIRouter(prefix="/missions", tags=["Missions"])
    
    @router.get("")
    async def list_missions():
        return {
            "missions": [],
            "total": 0,
        }
    
    @router.post("")
    async def create_mission(payload: dict):
        return {"id": "mission-1", "status": "created"}
    
    app.include_router(router)


def register_ros2_bridge(app):
    """Register ROS2 Bridge module."""
    router = APIRouter(prefix="/ros2", tags=["ROS2Bridge"])
    
    @router.get("/nodes")
    async def list_nodes():
        return {
            "nodes": [],
            "active": 0,
        }
    
    @router.post("/nodes/register")
    async def register_node(payload: dict):
        return {"status": "registered", "node_id": payload.get("node_id")}
    
    app.include_router(router)
