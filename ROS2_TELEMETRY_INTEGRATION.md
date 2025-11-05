# ROS2 Telemetry Integration & Unified SSE Bus

## Overview
Hooked ROS2 telemetry streams into the unified SSE event bus (`/events`), enabling real-time dashboard visualization of edge agent data. Flow sensors now feed directly into FlowIQ analytics instead of using mock data.

## Architecture Changes

### 1. **ROS2 Bridge → SSE Event Emission** (`src/ros2-bridge.ts`)

#### New Event Types Propagated
- `ros2.telemetry` — Raw sensor data (IMU, LIDAR, pressure, flow)
- `ros2.node.discovered` — Node registration with type & location
- `ros2.node.offline` — Node heartbeat timeout

#### Registration Flow
```typescript
registerNode(node: ROS2Node) {
  // ... store node ...
  bus.emit("event", {
    type: "ros2.node.discovered",
    nodeId,
    nodeType: node.type,
    location: node.location,
    at: Date.now()
  });
}
```

#### Telemetry Stream to Bus
```typescript
subscribeTelemetry(nodeId, topic) {
  setInterval(() => {
    const data = this.generateMockTelemetry(topic);
    
    // Emit to SSE for dashboard
    bus.emit("event", {
      type: "ros2.telemetry",
      nodeId,
      topic,
      data,
      at: Date.now()
    });
    
    // Smart ingestion: flow data → FlowIQ
    if (topic.includes("flow") && data.flowRateLpm) {
      ingestFlowTelemetry(data);
    }
  }, 5000);
}
```

### 2. **FlowIQ Ingestion from ROS2** (`src/modules/flowiq.ts`)

#### New Export Function
```typescript
export async function ingestFlowTelemetry(
  sample: Partial<FlowMetrics> & { timestamp?: number | string }
) {
  ros2Active = true; // Disables mock generation
  // Process telemetry, persist to DB, emit anomalies
}
```

#### Behavior
- **ROS2 Active**: When real telemetry detected, disables mock 5-second generator
- **Persistent**: Ingested samples go through anomaly detection pipeline
- **Event Propagation**: Detected anomalies → SSE bus (`anomaly.detected`)
- **Data Source Endpoint**: `GET /flow/source` returns `"ros2"` or `"mock"`

### 3. **SSE Type Extension** (`src/sse.ts`)

New union types added to `PlainviewEvent`:
```typescript
| { type: "ros2.telemetry"; nodeId: string; topic: string; data: any; at: number }
| { type: "ros2.node.discovered"; nodeId: string; nodeType: string; location?: { lat: number; lon: number }; at: number }
| { type: "ros2.node.offline"; nodeId: string; at: number }
| { type: "flow.metrics.updated"; metrics: any }
```

## Data Flow

```
ROS2 Sensors (LIDAR, IMU, Pressure, Flow)
       ↓
ros2-bridge (subscribeTelemetry)
       ↓ (5s heartbeat)
[emit ros2.telemetry to SSE bus]
       ├→ Dashboard (AIAssistant, visualizations)
       └→ [if flow topic] → FlowIQ.ingestFlowTelemetry()
              ↓
          [anomaly detection]
              ↓
          [emit anomaly.detected to SSE]
              ├→ Dashboard alerts
              └→ TimescaleDB persistence
```

## Endpoint Coverage

### ROS2 Bridge Endpoints
- `GET /ros2/nodes` — All discovered nodes
- `GET /ros2/nodes/:nodeId` — Node details
- `POST /ros2/subscribe` — Subscribe to telemetry topic
- `POST /ros2/command` — Publish command to node
- `GET /ros2/command/:commandId` — Command status
- `GET /ros2/telemetry` — Recent telemetry by node/topic

### FlowIQ Endpoints (Updated)
- `GET /flow/health` — Current metrics + anomalies
- `GET /flow/metrics` — History with stats
- `GET /flow/anomalies` — Query anomalies by severity/type
- `GET /flow/history` — Aggregated stats over N hours
- `GET /flow/range` — Time-range query with aggregation
- **`GET /flow/source`** — ✨ New: Current data source (mock vs ros2)
- `GET /flow/export` — CSV export
- `GET /flow/prediction` — Sentinel spread prediction

## Pre-Registered Edge Agents (Mocked)

### Robot
- **Node**: `/fleet/robots/robot_01`
- **Type**: `robot`
- **Location**: 40.7128°N, -74.006°W
- **Subscribes to**: `/tf`, `/sensor_data/imu`, `/sensor_data/lidar`
- **Publishes**: `/cmd/velocity`, `/cmd/mission`

### Sensor Gateway
- **Node**: `/field/sensors/sensor_gateway_01`
- **Type**: `gateway`
- **Location**: 40.7129°N, -74.005°W
- **Subscribes to**: `/sensor_data/pressure`, `/sensor_data/flow`
- **Publishes**: `/alert/pressure_anomaly`, `/alert/flow_anomaly`

## Testing the Integration

### 1. Start API
```bash
npm run dev -w @plainview/api
```

### 2. Subscribe to SSE Stream
```bash
curl -N http://localhost:4000/events
```

### 3. Trigger ROS2 Subscription (in another terminal)
```bash
curl -X POST http://localhost:4000/ros2/subscribe \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "/field/sensors/sensor_gateway_01", "topic": "/sensor_data/flow"}'
```

### 4. Observe SSE Output
- `ros2.telemetry` events appear every 5s with flow/pressure data
- `anomaly.detected` events trigger when deviations exceed thresholds
- `flow.metrics.updated` events show ingested metrics

### 5. Check FlowIQ Source
```bash
curl http://localhost:4000/flow/source
# → {"source": "ros2"}  (once telemetry flows)
```

## Production Considerations

1. **Real ROS2 Integration**: Replace mock `generateMockTelemetry()` with rcljs subscription
2. **Heartbeat Threshold**: Currently 60s; adjust for network latency
3. **Telemetry Buffer**: Keeps 1000 samples; tune for memory constraints
4. **Anomaly Thresholds**: Flow >25%, Pressure >100kPa, Temp >10°C; calibrate for field conditions
5. **Persistence**: In-memory DB mock; switch to TimescaleDB + Drizzle ORM for production

## Deployment Checklist

- [x] ROS2 bridge scaffolded with node discovery
- [x] Telemetry streaming to SSE bus
- [x] FlowIQ ingestion from ROS2 data streams
- [x] Mock data disabled when ROS2 active
- [x] All builds pass (API, Dashboard, Shared)
- [ ] Connect to real ROS2 master node
- [ ] Deploy to edge gateway (Ubuntu 22.04 + ROS2 Humble)
- [ ] Configure PostgreSQL for persistence
- [ ] Add authentication & rate limiting
- [ ] Monitor heartbeat timeouts in production
