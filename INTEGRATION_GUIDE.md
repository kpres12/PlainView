# Plainview Integration Guide (v1.0)

## Overview

This document covers the new features added post-MVP:
1. **Sentinel Integration** — Predictive fire spread & triangulation
2. **WebSocket Control** — Bidirectional valve commands
3. **SQLite Persistence** — Durable data storage

---

## 1. Sentinel Integration

### Setup

Ensure Sentinel API is running on your network:

```bash
# In Sentinel repo
docker compose -f infra/docker/docker-compose.dev.yml up -d
# API available at http://localhost:8000
```

### Configuration

Set the Sentinel endpoint in your environment:

```bash
export SENTINEL_API_URL=http://localhost:8000
```

### Usage

#### Predictive Flow Analysis

When FlowIQ detects anomalies, it automatically queries Sentinel for spread predictions:

```bash
curl http://localhost:4000/flow/prediction
```

Response:
```json
{
  "hasPrediction": true,
  "prediction": {
    "simulation_id": "sim_12345",
    "total_area_hectares": 100.0,
    "max_spread_rate_mph": 5.5,
    "isochrones": [
      {
        "hours_from_start": 6,
        "area_hectares": 50.0,
        "perimeter_km": 2.5
      }
    ],
    "confidence": {
      "overall_confidence": 0.8,
      "weather_confidence": 0.9,
      "fuel_confidence": 0.7,
      "terrain_confidence": 0.8
    }
  },
  "anomalyCount": 3,
  "cached": false
}
```

#### Triangulation (Future)

When multiple cameras detect the same object, call triangulation:

```typescript
// In your module
import { sentinelClient } from '../sentinel-client';

const results = await sentinelClient.triangulate({
  observations: [
    {
      device_id: "cam-101",
      timestamp: "2024-01-01T00:00:00Z",
      device_latitude: 40.0,
      device_longitude: -120.0,
      device_altitude: 1000.0,
      camera_heading: 0,
      camera_pitch: 0,
      bearing: 45,
      confidence: 0.9,
      detection_id: "det_001"
    }
  ]
});
```

### Event Stream

Sentinel prediction results are emitted on SSE:

```bash
curl http://localhost:4000/events

# Listen for:
event: anomaly.detected
data: {"type":"anomaly.detected","assetId":"flow-system","anomalyType":"spread_prediction","confidence":0.8,"at":1701000000000}
```

---

## 2. WebSocket Control Channel

### Connect

```typescript
const ws = new WebSocket("ws://localhost:4000/control");

ws.onopen = () => {
  console.log("Connected to Plainview control channel");
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === "connected") {
    console.log("Features:", msg.features);
    // Send commands
  }
};
```

### Commands

#### Actuate Valve

```typescript
ws.send(JSON.stringify({
  type: "valve.actuate",
  valveId: "v-101"
}));

// Response:
// {
//   "type": "ack",
//   "command": { "type": "valve.actuate", "valveId": "v-101" },
//   "timestamp": "2024-01-01T00:00:00Z"
// }
```

### Event Stream (Automatic)

After connecting, receive live events:

```typescript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === "event") {
    console.log("Event:", msg.data);
    // {
    //   "type": "valve.actuation.completed",
    //   "valveId": "v-101",
    //   "torqueNm": 52,
    //   "completedAt": 1701000000000
    // }
  }
};
```

---

## 3. SQLite Persistence

### Setup

Plainview now uses SQLite with Drizzle ORM for persistent storage.

#### Initialize Database

```bash
# Database file: data/plainview.db
npm run dev -w @plainview/api

# On startup, schema is auto-created
# ✓ Database initialized successfully
```

#### Configure Location

```bash
export DATABASE_PATH=/path/to/plainview.db
npm run dev -w @plainview/api
```

### Schema

All domain entities are persisted:

- **valves** — equipment with health metrics
- **valve_actuations** — historical actuation records
- **detections** — camera/sensor observations
- **alerts** — system alerts with status
- **incidents** — correlated events with timeline
- **flow_metrics** — time-series flow data
- **anomalies** — detected deviations
- **leak_detections** — pipeline leaks with history

### Queries (Type-Safe)

```typescript
import { db, valves, eq } from './db';

// Get valve by ID
const valve = await db.query.valves.findFirst({
  where: eq(valves.id, "v-101")
});

// List all active incidents
const activeIncidents = await db.query.incidents.findMany({
  where: eq(incidents.status, "active")
});

// Get recent metrics
const metrics = await db.query.flowMetrics.findMany({
  orderBy: desc(flowMetrics.createdAt),
  limit: 100
});
```

### Persistence Integration

Data is automatically persisted when events occur:

- Valve actuation → saved to `valve_actuations`
- Detection generated → saved to `detections`
- Alert created → saved to `alerts`
- Incident correlated → saved to `incidents`

Dashboard queries fetch from DB for historical analysis.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                Plainview API (Fastify)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │           Domain Modules                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │ ValveOps │ │PipelineG │ │  FlowIQ  │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘    │  │
│  └─────────────────────────────────────────────┘  │
│                        ↓                           │
│  ┌─────────────────────────────────────────────┐  │
│  │         Event Bus (SSE + WebSocket)         │  │
│  └─────────────────────────────────────────────┘  │
│          ↙                    ↘                   │
│  ┌──────────────┐      ┌──────────────┐          │
│  │ SSE /events  │      │ WS /control  │          │
│  │   (read)     │      │ (bidirectional)         │
│  └──────────────┘      └──────────────┘          │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │   Sentinel Client (Prediction/Triangulation)  │  │
│  │          ↓ HTTP calls ↓                      │  │
│  │   Sentinel API (:8000)                      │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │   SQLite DB (data/plainview.db)             │  │
│  │   via Drizzle ORM                           │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         ↓                ↓                  ↓
    Dashboard         Mobile CLI        External Integrations
```

---

## Roadmap

### Next Steps (v1.1)

- [ ] ROS2 bridge for hardware nodes (Roustabout / Rigsight)
- [ ] TimescaleDB connector for high-volume metrics
- [ ] Mission replay UI with AI co-pilot
- [ ] RBAC authentication (JWT)
- [ ] GraphQL API layer

### Optional (v1.2+)

- [ ] Multi-site federation
- [ ] Edge agent software stack
- [ ] Real-time anomaly models (ML)
- [ ] Custom webhook/IFTTT actions

---

## Troubleshooting

### Sentinel Unavailable

If Sentinel is down, predictions gracefully fail:

```json
{
  "hasPrediction": false,
  "reason": "Sentinel unavailable"
}
```

No production impact; local modules continue normally.

### WebSocket Connection Issues

Check firewall rules allow WebSocket upgrade:

```bash
# Test WebSocket handshake
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
  -H "Sec-WebSocket-Version: 13" \
  http://localhost:4000/control
```

### Database Lock

SQLite can lock if multiple processes write simultaneously. Use WAL mode (default):

```bash
# Check database
file data/plainview.db*

# data/plainview.db:      SQLite 3.x database
# data/plainview.db-shm:  shared memory WAL file
# data/plainview.db-wal:  write-ahead log
```

---

## API Reference

### REST Endpoints

#### ValveOps
- `GET /valves` — list all
- `GET /valves/:id` — detail
- `GET /valves/:id/health` — health report
- `POST /valves/:id/actuate` — actuate valve

#### PipelineGuard
- `GET /pipeline/alerts` — active leaks
- `GET /pipeline/health` — integrity score
- `GET /pipeline/sections/:section` — section detail
- `POST /pipeline/alerts/:id/resolve` — resolve leak

#### FlowIQ
- `GET /flow/health` — current metrics + anomalies
- `GET /flow/metrics` — history + stats
- `GET /flow/anomalies` — filtered anomalies
- `GET /flow/prediction` — Sentinel spread prediction

#### RigSight
- `GET /rig/cameras` — list cameras
- `GET /rig/cameras/:id` — detail
- `GET /rig/detections` — historical detections

#### Incidents
- `GET /incidents` — active + recent
- `GET /incidents/:id` — detail
- `POST /incidents/:id/update` — update status
- `GET /incidents/:id/timeline` — chronological view

### WebSocket Protocol

Message format:
```json
{
  "type": "valve.actuate" | "detection.ack" | "alert.resolve",
  "valveId": "v-101",
  "...": "other fields"
}
```

Response:
```json
{
  "type": "ack" | "event",
  "timestamp": "ISO-8601",
  "data": {}
}
```

### Server-Sent Events

Connect: `curl http://localhost:4000/events`

Event types:
- `valve.actuation.requested`
- `valve.actuation.completed`
- `alert.created`
- `alert.acknowledged`
- `detection.made`
- `flow.metrics.updated`
- `anomaly.detected`
- `incident.created`
- `incident.updated`

---

## Contributing

To add new features:

1. Define schema in `src/db/schema.ts`
2. Create Drizzle operations in module
3. Emit events via `bus.emit('event', ...)`
4. Update this guide

---

**Built with ❤️ for oil & gas autonomy.**
