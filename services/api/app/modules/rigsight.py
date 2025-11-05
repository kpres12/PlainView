import asyncio
import random
import uuid as uuid_module
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import Optional
from app.events import event_bus

router = APIRouter(prefix="/rig", tags=["RigSight"])

CAMERAS = [
    {
        "id": "cam-101",
        "name": "Wellhead North",
        "location": "North Section",
        "status": "online",
        "resolution": "1920x1080",
        "frame_rate": 30,
        "last_frame": {
            "url": "https://via.placeholder.com/1920x1080?text=Wellhead+North",
            "timestamp": datetime.utcnow().isoformat(),
            "anomalies": [],
        },
    },
    {
        "id": "cam-102",
        "name": "Pipeline Manifold",
        "location": "Central Section",
        "status": "online",
        "resolution": "1920x1080",
        "frame_rate": 30,
        "last_frame": {
            "url": "https://via.placeholder.com/1920x1080?text=Pipeline+Manifold",
            "timestamp": datetime.utcnow().isoformat(),
            "anomalies": [],
        },
    },
    {
        "id": "cam-103",
        "name": "Tank Farm East",
        "location": "East Section",
        "status": "degraded",
        "resolution": "1280x720",
        "frame_rate": 15,
        "last_frame": {
            "url": "https://via.placeholder.com/1280x720?text=Tank+Farm+East",
            "timestamp": datetime.utcnow().isoformat(),
            "anomalies": ["Low frame rate"],
        },
    },
]

DETECTIONS: list[dict] = []


def start_detection_simulation():
    async def simulate():
        while True:
            camera = random.choice(CAMERAS)
            if camera.get("status") != "offline" and random.random() < 0.2:
                detection_type = random.choice(["pressure_deviation", "corrosion", "leak_sign", "thermal_anomaly"])
                confidence = 0.7 + random.random() * 0.3

                event = {
                    "id": str(uuid_module.uuid4()),
                    "cameraId": camera["id"],
                    "type": detection_type,
                    "confidence": confidence,
                    "timestamp": datetime.utcnow().isoformat(),
                    "region": {
                        "x": random.randint(0, 1920),
                        "y": random.randint(0, 1080),
                        "width": 100 + random.random() * 200,
                        "height": 100 + random.random() * 200,
                    },
                }

                DETECTIONS.append(event)
                if len(DETECTIONS) > 500:
                    DETECTIONS.pop(0)

                # Update camera last frame anomalies
                if camera.get("last_frame"):
                    anomalies = camera["last_frame"].setdefault("anomalies", [])
                    anomalies.append(f"{detection_type} ({int(confidence * 100)}%)")
                    if len(anomalies) > 3:
                        anomalies.pop(0)

                await event_bus.emit({
                    "type": "detection.made",
                    "sourceId": camera["id"],
                    "detectionType": detection_type,
                    "confidence": confidence,
                    "timestamp": datetime.utcnow().isoformat(),
                })

            # Occasional degradation/restore
            if random.random() < 0.05:
                random_camera = random.choice(CAMERAS)
                random_camera["status"] = "degraded" if random_camera["status"] == "online" else "online"

            await asyncio.sleep(3)

    asyncio.create_task(simulate())


@router.get("/cameras")
async def list_cameras():
    return {
        "totalCameras": len(CAMERAS),
        "onlineCameras": len([c for c in CAMERAS if c["status"] == "online"]),
        "cameras": [
            {
                "id": c["id"],
                "name": c["name"],
                "location": c["location"],
                "status": c["status"],
                "resolution": c["resolution"],
                "frameRate": c["frame_rate"],
                "lastUpdate": c.get("last_frame", {}).get("timestamp"),
            }
            for c in CAMERAS
        ],
    }


@router.get("/cameras/{camera_id}")
async def get_camera(camera_id: str):
    camera = next((c for c in CAMERAS if c["id"] == camera_id), None)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    recent = [e for e in DETECTIONS if e["cameraId"] == camera_id][-10:]
    return {**camera, "recentDetections": recent}


@router.get("/cameras/{camera_id}/stream")
async def get_stream(camera_id: str):
    camera = next((c for c in CAMERAS if c["id"] == camera_id), None)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    return {
        "cameraId": camera["id"],
        "status": camera["status"],
        "resolution": camera["resolution"],
        "frameRate": camera["frame_rate"],
        "streamUrl": f"/stream/{camera['id']}.webrtc",
        "lastFrame": camera.get("last_frame"),
        "uptime": "99.2%",
        "bandwidth": "2.5 Mbps",
    }


@router.get("/detections")
async def list_detections(cameraId: Optional[str] = None, type: Optional[str] = None, confidence_min: Optional[float] = None):
    results = DETECTIONS
    if cameraId:
        results = [d for d in results if d["cameraId"] == cameraId]
    if type:
        results = [d for d in results if d["type"] == type]
    if confidence_min is not None:
        results = [d for d in results if d["confidence"] >= float(confidence_min)]
    return {"count": len(results), "detections": results[-50:]}


@router.get("/health")
async def rig_health():
    online = len([c for c in CAMERAS if c["status"] == "online"])
    degraded = len([c for c in CAMERAS if c["status"] == "degraded"])
    last_hour = datetime.utcnow().timestamp() - 3600
    recent_dets = [d for d in DETECTIONS if datetime.fromisoformat(d["timestamp"]).timestamp() > last_hour]
    avg_conf = sum(d["confidence"] for d in DETECTIONS[-100:]) / min(100, len(DETECTIONS)) if DETECTIONS else 0
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "onlineCameras": online,
        "degradedCameras": degraded,
        "offlineCameras": len(CAMERAS) - online - degraded,
        "coverageScore": (online / len(CAMERAS)) * 100 if CAMERAS else 0,
        "recentDetectionsCount": len(recent_dets),
        "averageConfidence": avg_conf,
    }


def register_rigsight(app):
    start_detection_simulation()
    app.include_router(router)