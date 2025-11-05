import asyncio
import random
import uuid as uuid_module
from datetime import datetime
from fastapi import APIRouter
from app.events import event_bus

router = APIRouter(prefix="/flow", tags=["FlowIQ"])

BASELINE_METRICS = {
    "flow_rate_lpm": 150,
    "pressure_pa": 2500000,
    "temperature_c": 45,
}

last_spread_prediction = None
last_prediction_time = 0
PREDICTION_CACHE_MS = 5 * 60 * 1000

metrics_history = []
anomaly_history = []
ros2_active = False


def detect_anomalies(current):
    """Detect anomalies in flow metrics."""
    anomalies = []
    recent = metrics_history[-10:] if len(metrics_history) >= 3 else []
    
    if len(recent) >= 3:
        # Flow rate anomaly
        avg_flow = sum(m["flow_rate_lpm"] for m in recent) / len(recent)
        flow_dev = abs(current["flow_rate_lpm"] - avg_flow)
        if flow_dev > avg_flow * 0.25:
            anomalies.append({
                "id": str(uuid_module.uuid4()),
                "type": "flow_rate_deviation",
                "severity": "high" if flow_dev > avg_flow * 0.5 else "medium",
                "detected_at": datetime.utcnow().isoformat(),
                "metrics": {"flow_rate_lpm": current["flow_rate_lpm"]},
                "expected_range": {"min": avg_flow * 0.75, "max": avg_flow * 1.25},
                "actual_value": current["flow_rate_lpm"],
            })
        
        # Pressure anomaly
        avg_pressure = sum(m["pressure_pa"] for m in recent) / len(recent)
        pressure_dev = abs(current["pressure_pa"] - avg_pressure)
        if pressure_dev > 100000:
            anomalies.append({
                "id": str(uuid_module.uuid4()),
                "type": "pressure_deviation",
                "severity": "high" if pressure_dev > 200000 else "low",
                "detected_at": datetime.utcnow().isoformat(),
                "metrics": {"pressure_pa": current["pressure_pa"]},
                "expected_range": {"min": avg_pressure - 100000, "max": avg_pressure + 100000},
                "actual_value": current["pressure_pa"],
            })
        
        # Temperature anomaly
        avg_temp = sum(m["temperature_c"] for m in recent) / len(recent)
        temp_dev = abs(current["temperature_c"] - avg_temp)
        if temp_dev > 10:
            anomalies.append({
                "id": str(uuid_module.uuid4()),
                "type": "temperature_spike",
                "severity": "high" if temp_dev > 20 else "medium",
                "detected_at": datetime.utcnow().isoformat(),
                "metrics": {"temperature_c": current["temperature_c"]},
                "expected_range": {"min": avg_temp - 5, "max": avg_temp + 5},
                "actual_value": current["temperature_c"],
            })
    
    return anomalies


# Simulate metrics collection
def start_collection():
    async def collect():
        global ros2_active, metrics_history, anomaly_history
        
        while True:
            if not ros2_active:
                noise = {
                    "flow": (random.random() - 0.5) * 10,
                    "pressure": (random.random() - 0.5) * 50000,
                    "temp": (random.random() - 0.5) * 3,
                }
                
                current = {
                    "flow_rate_lpm": max(100, BASELINE_METRICS["flow_rate_lpm"] + noise["flow"]),
                    "pressure_pa": max(2300000, BASELINE_METRICS["pressure_pa"] + noise["pressure"]),
                    "temperature_c": max(20, BASELINE_METRICS["temperature_c"] + noise["temp"]),
                    "timestamp": datetime.utcnow().isoformat(),
                }
                
                metrics_history.append(current)
                if len(metrics_history) > 100:
                    metrics_history.pop(0)
                
                anomalies = detect_anomalies(current)
                for anom in anomalies:
                    anomaly_history.append(anom)
                    asyncio.create_task(event_bus.emit({
                        "type": "anomaly.detected",
                        "asset_id": "flow-system",
                        "anomaly_type": anom["type"],
                        "confidence": 0.95 if anom["severity"] == "high" else 0.7,
                        "at": int(datetime.utcnow().timestamp() * 1000),
                    }))
                
                asyncio.create_task(event_bus.emit({
                    "type": "flow.metrics.updated",
                    "metrics": current,
                }))
            
            await asyncio.sleep(5)
    
    asyncio.create_task(collect())


@router.get("/health")
async def get_health():
    """GET /flow/health - current system health."""
    current = metrics_history[-1] if metrics_history else BASELINE_METRICS
    one_hour_ago = datetime.utcnow().timestamp() - 3600
    anomalies = [a for a in anomaly_history if datetime.fromisoformat(a["detected_at"]).timestamp() > one_hour_ago]
    
    health_score = 100
    if len(anomalies) > 3:
        health_score -= 20
    if any(a["severity"] == "high" for a in anomalies):
        health_score -= 30
    
    payload = {
        "timestamp": datetime.utcnow().isoformat(),
        "current_metrics": current,
        "anomaly_count": len(anomalies),
        "recent_anomalies": anomalies[-5:],
        "health_score": max(0, health_score),
    }
    # CamelCase aliases
    payload.update({
        "currentMetrics": {
            "flowRateLpm": current.get("flow_rate_lpm"),
            "pressurePa": current.get("pressure_pa"),
            "temperatureC": current.get("temperature_c"),
            "timestamp": current.get("timestamp"),
        },
        "anomalyCount": len(anomalies),
        "recentAnomalies": [
            {
                **a,
                "detectedAt": a.get("detected_at"),
                "expectedRange": a.get("expected_range"),
                "actualValue": a.get("actual_value"),
            }
            for a in anomalies[-5:]
        ],
        "healthScore": max(0, health_score),
    })
    return payload


@router.get("/metrics")
async def get_metrics():
    """GET /flow/metrics - metrics history and stats."""
    current = metrics_history[-1] if metrics_history else BASELINE_METRICS
    flows = [m["flow_rate_lpm"] for m in metrics_history]
    pressures = [m["pressure_pa"] for m in metrics_history]
    temps = [m["temperature_c"] for m in metrics_history]
    
    return {
        "current": current,
        "history": metrics_history[-20:],
        "stats": {
            "flow": {"min": min(flows) if flows else 0, "max": max(flows) if flows else 0, "avg": sum(flows) / len(flows) if flows else 0},
            "pressure": {"min": min(pressures) if pressures else 0, "max": max(pressures) if pressures else 0, "avg": sum(pressures) / len(pressures) if pressures else 0},
            "temperature": {"min": min(temps) if temps else 0, "max": max(temps) if temps else 0, "avg": sum(temps) / len(temps) if temps else 0},
        },
        # CamelCase aliases for metrics arrays
        "historyCamel": [
            {
                "flowRateLpm": m.get("flow_rate_lpm"),
                "pressurePa": m.get("pressure_pa"),
                "temperatureC": m.get("temperature_c"),
                "timestamp": m.get("timestamp"),
            }
            for m in metrics_history[-20:]
        ],
    }


@router.get("/anomalies")
async def get_anomalies(severity: str = None, type_: str = None):
    """GET /flow/anomalies - historical anomalies."""
    results = anomaly_history
    if severity:
        results = [a for a in results if a["severity"] == severity]
    if type_:
        results = [a for a in results if a["type"] == type_]
    return results[-50:]


@router.get("/source")
async def get_source():
    """GET /flow/source - show current data source (mock vs ROS2)."""
    return {"source": "ros2" if ros2_active else "mock"}


@router.get("/prediction")
async def get_prediction():
    global last_spread_prediction, last_prediction_time
    now_ms = int(datetime.utcnow().timestamp() * 1000)
    if last_spread_prediction and (now_ms - last_prediction_time) < PREDICTION_CACHE_MS:
        return {"cached": True, "hasPrediction": True, "prediction": last_spread_prediction}

    recent_anoms = anomaly_history[-5:]
    if not recent_anoms:
        return {"hasPrediction": False, "reason": "No recent anomalies"}

    # Build a simple synthetic prediction
    last_spread_prediction = {
        "confidence": {"overall_confidence": 0.82},
        "spread": {
            "centroid": {"lat": 40.0, "lon": -120.0},
            "radius_m": 750,
        },
        "generatedAt": datetime.utcnow().isoformat(),
    }
    last_prediction_time = now_ms

    await event_bus.emit({
        "type": "anomaly.detected",
        "asset_id": "flow-system",
        "anomaly_type": "spread_prediction",
        "confidence": last_spread_prediction["confidence"]["overall_confidence"],
        "at": now_ms,
    })

    return {"hasPrediction": True, "prediction": last_spread_prediction, "anomalyCount": len(recent_anoms)}


def register_flowiq(app):
    """Register FlowIQ routes."""
    start_collection()
    app.include_router(router)
