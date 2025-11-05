# Plainview Post-MVP Roadmap & Implementation Guide

This document provides architectural guidance and implementation patterns for the remaining post-v1.0 features.

## Status Summary

| Feature | Status | Effort | Priority |
|---------|--------|--------|----------|
| ✅ Sentinel Integration | Complete | - | - |
| ✅ WebSocket Bidirectional | Complete | - | - |
| ⏸️ TimescaleDB Persistence | Designed | 2-3 hrs | HIGH |
| ⏸️ ROS2 Bridge | Scaffolded | 4-6 hrs | MEDIUM |
| ⏸️ Mission Replay & AI | Designed | 2-3 hrs | MEDIUM |

---

## 1. WebSocket Control System (✅ COMPLETE)

**Location**: `src/ws-server.ts`

### Features Implemented
- Bidirectional command handling (valve.actuate, alert.resolve, detection.ack)
- Real-time event broadcasting to all connected clients
- Command history and audit trail
- Client subscription management
- Graceful error handling

### Client Example

```typescript
// Connect
const ws = new WebSocket("ws://localhost:4000/control");

// Receive connection handshake
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === "event" && msg.data.type === "connected") {
    console.log("Connected! Features:", msg.data.features);
  }
};

// Send command
ws.send(JSON.stringify({
  type: "valve.actuate",
  valveId: "v-101"
}));

// Receive acknowledgment + events
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === "ack") {
    console.log("Command accepted:", msg.data.action);
  }
  if (msg.type === "event") {
    console.log("Event:", msg.data);
  }
};
```

### API Endpoint
```
GET /ws/status
```
Returns: `{ connectedClients: number, recentCommands: CommandRecord[] }`

---

## 2. TimescaleDB Persistence (⏸️ TODO)

### Architecture

```
┌─────────────────────────────────────┐
│ Domain Modules (ValveOps, FlowIQ)   │
└──────────────┬──────────────────────┘
               │ emit events
               ↓
┌──────────────────────────────────────┐
│ Persistence Layer                     │
│  - TimescaleDB Adapter                │
│  - Event Hooks                        │
│  - Query Builder                      │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│ TimescaleDB (PostgreSQL)              │
│  - Time-series tables                 │
│  - Hypertables for metrics            │
│  - Continuous aggregates              │
└──────────────────────────────────────┘
```

### Implementation Steps

**1. Install dependencies**
```bash
npm install pg drizzle-orm drizzle-kit
```

**2. Create DB schema** (`src/db/timescale-schema.ts`)
```typescript
import { pgTable, timestamp, real, text } from "drizzle-orm/pg-core";

export const flowMetricsHyper = pgTable("flow_metrics_1h", {
  time: timestamp().notNull(),
  flowRateLpm: real().notNull(),
  pressurePa: real().notNull(),
  temperatureC: real().notNull(),
  bucket: text()
});

// Setup as hypertable via SQL:
// SELECT create_hypertable('flow_metrics_1h', 'time', if_not_exists => true);
```

**3. Create persistence hooks** (`src/db/hooks.ts`)
```typescript
import { db } from "./client";
import { flowMetricsHyper } from "./timescale-schema";

export const persistMetric = (metric: FlowMetric) => {
  return db.insert(flowMetricsHyper).values({
    time: new Date(metric.timestamp),
    flowRateLpm: metric.flowRateLpm,
    pressurePa: metric.pressurePa,
    temperatureC: metric.temperatureC
  });
};
```

**4. Wire into modules** (`src/modules/flowiq.ts`)
```typescript
import { persistMetric } from "../db/hooks";

// In metric collection loop:
metricsHistory.push(current);
await persistMetric(current); // New line
```

**5. Add query endpoints**
```typescript
app.get("/metrics/range", async (req: any) => {
  const { start, end } = req.query;
  return db.select()
    .from(flowMetricsHyper)
    .where(
      and(
        gte(flowMetricsHyper.time, new Date(start)),
        lte(flowMetricsHyper.time, new Date(end))
      )
    );
});
```

### Database Setup (Production)

```bash
# Create database and enable TimescaleDB
createdb plainview
psql -d plainview -c "CREATE EXTENSION timescaledb;"

# Run migrations
npx drizzle-kit migrate
```

### Configuration

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/plainview
npm run dev
```

---

## 3. ROS2 Bridge (⏸️ TODO)

### Architecture

```
┌─────────────────────────────┐
│ Plainview API               │
├─────────────────────────────┤
│ ROS2 Bridge Service         │
│ - Node Discovery            │
│ - Command Publisher         │
│ - Telemetry Subscriber      │
└──────────┬──────────────────┘
           │ ROS2/DDS over LAN
           ↓
┌─────────────────────────────────────────┐
│ Edge Nodes (Roustabout, Rigsight, etc)  │
├─────────────────────────────────────────┤
│ - ROS2 Agents                            │
│ - Local Mission Execution                │
│ - Sensor Fusion                          │
└─────────────────────────────────────────┘
```

### Implementation Steps

**1. Create ROS2 bridge service** (`src/services/ros2-bridge.ts`)
```typescript
import * as rclnodejs from "rclnodejs";

class ROS2Bridge {
  private node: any;
  private nodeRegistry = new Map<string, NodeInfo>();

  async init() {
    await rclnodejs.init();
    this.node = new rclnodejs.Node("plainview_bridge");
    
    // Subscribe to device telemetry
    this.node.createSubscription(
      "plainview_msgs/Telemetry",
      "/devices/+/telemetry",
      (msg: any) => this.handleTelemetry(msg)
    );

    // Publish commands
    this.cmdPublisher = this.node.createPublisher(
      "plainview_msgs/Command",
      "/devices/+/command"
    );

    this.node.spin();
  }

  private handleTelemetry(msg: any) {
    bus.emit("event", {
      type: "device.telemetry",
      deviceId: msg.device_id,
      data: msg,
      at: Date.now()
    });
    this.nodeRegistry.set(msg.device_id, msg);
  }

  publishCommand(deviceId: string, cmd: any) {
    this.cmdPublisher.publish({
      device_id: deviceId,
      command: cmd,
      timestamp: Date.now()
    });
  }
}

export const ros2Bridge = new ROS2Bridge();
```

**2. Expose API endpoints**
```typescript
// GET /ros2/nodes
app.get("/nodes", async () => {
  return Array.from(ros2Bridge.nodeRegistry.values());
});

// POST /ros2/nodes/:id/command
app.post<{ Params: { id: string }; Body: any }>("/nodes/:id/command", async (req) => {
  ros2Bridge.publishCommand(req.params.id, req.body);
  return { ok: true };
});
```

**3. Build ROS2 message definitions** (`.../plainview_msgs/msg/Telemetry.msg`)
```
string device_id
string device_type   # roustabout, rigsight, etc
float64 latitude
float64 longitude
float64 altitude
float64 battery
int32[] sensor_readings
```

### Prerequisites
- ROS2 Humble or later
- DDS middleware (Fast-DDS recommended for LAN broadcast)
- Python 3.10+ (for message generation)

---

## 4. Mission Replay & AI Assistant (⏸️ TODO)

### Mission Replay Architecture

```
┌────────────────────────────────┐
│ Incident Timeline (from DB)    │
└────────────┬───────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│ Mission State Machine              │
│ - Draft → Active → Paused →        │
│ - Completed/Failed                 │
└────────────┬───────────────────────┘
             │
             ├─→ Real-time replay
             ├─→ Scenario branching (what-if)
             └─→ Automation testing
```

**Endpoints to Implement**

```typescript
// Create replay from incident
POST /missions
Body: {
  title: "Incident 2024-01 Replay",
  type: "replay",
  sourceIncidentId: "inc-123"
}

// Control playback
POST /missions/:id/start
POST /missions/:id/pause
POST /missions/:id/resume
POST /missions/:id/stop

// Adjust speed
POST /missions/:id/setspeed
Body: { speed: 2.0 } // 2x real-time

// Create what-if scenario
POST /missions/:id/branch
Body: {
  title: "What if we actuated v-102 at t=5min?",
  modifications: [
    {
      eventIndex: 5,
      changes: {
        type: "valve.actuation",
        target: "v-102",
        timestamp: "T+5min"
      }
    }
  ]
}

// Query outcomes
GET /missions/:id/predictions
Returns: { expectedOutcome, timelineDeltas, etc }
```

### AI Assistant (React Component)

**Location**: `apps/dashboard/src/components/ui/AIAssistant.tsx`

```typescript
import React, { useState } from "react";
import { useSSE } from "../hooks/useSSE";

export const AIAssistant: React.FC = () => {
  const [insights, setInsights] = useState<string[]>([]);
  const events = useSSE();

  React.useEffect(() => {
    // Analyze anomalies and generate insights
    events.forEach((e) => {
      if (e.type === "anomaly.detected") {
        const insight = generateInsight(e);
        setInsights((prev) => [...prev, insight].slice(-5));
      }
    });
  }, [events]);

  return (
    <div className="ai-assistant">
      <h3>FlowIQ Co-Pilot</h3>
      <ul>
        {insights.map((i, idx) => (
          <li key={idx} className="insight">{i}</li>
        ))}
      </ul>
      <button onClick={() => setInsights([])}>Clear</button>
    </div>
  );
};

function generateInsight(event: any): string {
  if (event.anomalyType === "spread_prediction") {
    return `⚠️ Predicted spread: ${event.data.total_area_hectares}ha in 6h`;
  }
  if (event.anomalyType === "pressure_deviation") {
    return `📈 Pressure trend detected: ${event.data.actualValue} Pa`;
  }
  return "New anomaly detected";
}
```

---

## Deployment Checklist

### Development
- ✅ WebSocket server running on :4000/control
- ⏳ TimescaleDB local instance (optional for dev)
- ⏳ ROS2 nodes (optional for dev)
- ⏳ Mission replay scaffolded

### Staging / Production

```bash
# 1. Database setup
createdb plainview
psql plainview -c "CREATE EXTENSION timescaledb;"

# 2. Environment variables
export DATABASE_URL=postgresql://...
export SENTINEL_API_URL=http://sentinel:8000
export ROS2_DOMAIN_ID=1

# 3. Start services
docker compose up -d timescaledb redis
npm run build -w @plainview/api
npm start -w @plainview/api

# 4. Verify
curl http://localhost:4000/health
curl http://localhost:4000/ws/status
```

---

## Testing Strategy

### WebSocket
```bash
# Test handshake
wscat -c ws://localhost:4000/control

# Send command
> {"type":"valve.actuate","valveId":"v-101"}
< {"type":"ack","commandId":"...","status":"success"}
< {"type":"event","data":{"type":"valve.actuation.requested",...}}
```

### TimescaleDB
```bash
# Query metrics
SELECT time_bucket('1 minute', time) AS bucket,
       AVG(flow_rate_lpm) AS avg_flow
FROM flow_metrics_1h
WHERE time > now() - interval '1 hour'
GROUP BY bucket
ORDER BY bucket DESC;
```

### ROS2
```bash
ros2 node list  # Verify bridge registered
ros2 topic list  # See /devices/*/telemetry
ros2 topic echo /devices/roustabout-01/telemetry
```

---

## Performance Benchmarks (Target)

| Component | Metric | Target |
|-----------|--------|--------|
| WebSocket | Latency (round-trip) | < 50ms |
| WebSocket | Throughput | 1000 cmd/sec |
| TimescaleDB | Metric Insert | < 5ms |
| TimescaleDB | Query (1h range) | < 100ms |
| ROS2 | Discovery time | < 2s |
| Mission Replay | Playback speed | 0.1–10x |

---

## Future Enhancements (v1.2+)

- **GraphQL API** for complex queries
- **Multi-site federation** (mesh topology)
- **RBAC authentication** (JWT + OAuth)
- **Real-time anomaly detection** (ML models)
- **Custom webhooks/IFTTT** actions
- **Mobile companion app** (React Native)
- **Federated learning** across sites

---

**Questions?** See `INTEGRATION_GUIDE.md` for Sentinel setup and WebSocket usage.
