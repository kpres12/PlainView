# Plainview — Build Summary

Built comprehensive oilfield autonomy & control platform combining **Summit.OS + Industry Modules + Edge Agents** into a cohesive mission-control interface.

## What's Built

### Frontend Dashboard (`apps/dashboard`)

#### Core Tech Stack
- **React 18** + Vite (HMR dev experience)
- **Tailwind CSS** + custom design tokens (industrial dark theme)
- **Framer Motion** (smooth state transitions, data pulses)
- **Recharts** (trend visualization with gradient fills)
- **Zustand** (lightweight app state)
- **Lucide Icons** (semantic iconography)
- **Three.js / React-Three-Fiber** (ready for 3D map layer)

#### Design System
- **Color Palette**: Matte black (`#0C0C0E`) + amber accent (`#F5A623`) + steel blue (`#2E9AFF`)
- **Typography**: Inter/Eurostile with wide letter-spacing for industrial aesthetic
- **Components**:
  - `Button` (primary, secondary, danger, ghost variants with motion)
  - `Card` (animated entry, clickable)
  - `Badge` (color-coded by severity)
  - `Alert` (auto-dismissing notifications)
  - `Tabs` (smooth transitions)
  - `Slider` (timeline scrubbing)

#### Views Implemented

1. **Command Center** (Main Dashboard)
   - Left sidebar: Asset tree (Roustabots, Drones, WatchTowers, Sensors)
   - Center: 3D map placeholder (ready for Three.js/Cesium integration)
   - Right: Telemetry panel with live metrics (Pressure, Temperature, Torque, Vibration)
   - Bottom: Event timeline with hourly scrubber
   - Status indicators with color-coded health (🟢 online, 🟡 warning, 🔴 offline)

2. **Mission Planner**
   - Mission list with progress bars and status badges
   - DAG flow editor placeholder (Detect → Verify → Actuate → Log)
   - Simulate & Deploy buttons for autonomy workflows

3. **FlowIQ Analytics**
   - Pressure trend chart (24h area graph with amber gradient)
   - Torque trend chart (line graph with blue accent)
   - AI insights panel with predictive maintenance alerts
   - Anomaly detection display

4. **Alert Console**
   - Real-time alert stack with severity filtering (All, Unread, Critical)
   - Color-coded by type (error, warning, success, info)
   - Acknowledge & dismiss actions
   - Auto-formatting of timestamps ("2m ago", "1h ago")

5. **Asset Detail View** (Drill-down)
   - Live camera feed placeholder (RGB + Thermal)
   - Key metrics grid (Status, Uptime, Last Update, Location)
   - Health bar with 24h trend chart
   - Mission history with completion status

6. **Mission Replay / Compliance**
   - Playback controls (Play/Pause, Skip ±5s)
   - Timeline scrubber with duration display
   - Camera stream sync with telemetry
   - Event timeline with color-coded markers
   - PDF/Video export buttons

#### Navigation
- Sticky navbar with logo + online status indicator
- Main nav: COMMAND CENTER | MISSIONS | FLOWIQ | ALERTS
- Active tab highlighted with underline animation

---

### API Backend (`services/api`)

#### Architecture
- **Fastify** (lightweight, fast HTTP framework)
- **CORS** enabled for localhost dev (port 4000)
- **SSE** (Server-Sent Events) for real-time telemetry streaming
- **File-based state** (JSON persistence in `data/` directory)

#### Endpoints

**Core**
- `GET /health` → System uptime & status
- `GET /` → API info & version
- `GET /modules` → List domain modules (PipelineGuard, RigSight, ValveOps, FlowIQ)

**ValveOps Module**
- `GET /valves` → List all valves with last torque reading
- `POST /valves/:id/actuate` → Simulate valve rotation (1.2s latency, random torque 40–60 Nm)

**PipelineGuard Module**
- `GET /pipeline/alerts` → Leak/spill incidents

**RigSight Module**
- `GET /rig/cameras` → Camera list with thermal status

**FlowIQ Module**
- `GET /flow/health` → Component health scores & trends

**Real-Time Events**
- `GET /events` → SSE stream (5s heartbeat + event broadcasts)

#### Event Types
```typescript
type PlainviewEvent =
  | { type: "valve.actuation.requested"; valveId: string; requestedAt: number }
  | { type: "valve.actuation.completed"; valveId: string; torqueNm: number; completedAt: number }
  | { type: "leak.alert"; assetId: string; severity: "low" | "med" | "high"; at: number }
  | { type: "telemetry.tick"; at: number }
  | { type: "anomaly.detected"; assetId: string; type: string; confidence: number; at: number }
  | { type: "mission.started"; missionId: string; missionName: string; at: number }
  | { type: "mission.completed"; missionId: string; duration: number; status: "success" | "failure"; at: number }
  | { type: "device.status"; deviceId: string; status: "online" | "offline"; at: number }
```

#### Data Persistence
- `store.ts`: File-based JSON storage for incidents & valve state
- Auto-init of `data/` directory on first run
- Atomic writes with prettified JSON

---

### Shared Types (`packages/shared`)

```typescript
export type ModuleKey = "pipeline-guard" | "rig-sight" | "valve-ops" | "flow-iq"

export interface Health {
  status: "ok" | "degraded" | "down"
  uptimeSec: number
}

export interface ModuleDescriptor {
  key: ModuleKey
  title: string
  description: string
}
```

---

## Running the Project

### Install Dependencies
```bash
npm install
```

### Development

**All services (concurrent)**
```bash
npm run dev
```

**Per workspace**
```bash
npm run dev -w @plainview/api          # Port 4000
npm run dev -w @plainview/dashboard    # Port 5173
npm run dev -w @plainview/shared       # Watch compile
```

### Build

```bash
npm run build                           # All
npm run build -w @plainview/api         # API
npm run build -w @plainview/dashboard   # Dashboard
npm run build -w @plainview/shared      # Types
```

### Test

```bash
npm run test                            # All (dashboard: 0 tests, API: 2 tests, shared: 0 tests)
npm run test -w @plainview/api -- -t "MODULES"  # Single test
```

### Type Check

```bash
npm run typecheck                       # All workspaces
```

---

## Design Philosophy

### Aesthetic
- **Dark mode by default**: Matte black background with minimal bright accents
- **Amber accent**: Golden data flows, pulse on anomalies
- **Steel blue**: Secondary data streams, cool contrast
- **Typography**: Wide tracking, all-caps system names (PLAINVIEW, ASSET TREE, FLOWIQ)
- **Motion**: Framer Motion transitions (data pulses, card entries, tab animations)
- **Emotion**: Calm but powerful—like watching a live mission interface

### Information Architecture
1. **Centralized situational awareness** (Command Center 3D map)
2. **Drill-down exploration** (click asset → detail view)
3. **Autonomous mission control** (Mission Planner DAG editor)
4. **Predictive intelligence** (FlowIQ anomaly insights)
5. **Real-time alerting** (Alert Console with severity filtering)
6. **Compliance & audit** (Mission Replay with timeline scrubbing)

---

## Roadmap

### Phase 0 (MVP - Complete)
- ✅ Command Center UI with asset tree + telemetry panel
- ✅ Mission Planner UI (DAG flow editor stub)
- ✅ FlowIQ Analytics (trend charts + AI insights)
- ✅ Alert Console (real-time stack with filtering)
- ✅ Asset detail view (health, mission history, live feed)
- ✅ Mission Replay (playback controls + event timeline)
- ✅ SSE event streaming

### Phase 1 (6 months - Polish & Connect)
- 3D terrain map (Three.js + Cesium for satellite overlay)
- Live camera integration (RTMP/RTSP ingestion)
- Persistent database (PostgreSQL/SQLite)
- Real telemetry (MQTT/OPC-UA/ROS2 bridges)
- Authentication & RBAC
- DAG flow editor interactive nodes
- Mission simulation preview

### Phase 2 (12 months - Analytics & Autonomy)
- FlowIQ anomaly models (LSTM time-series forecasting)
- Predictive maintenance scoring
- Multi-agent coordination (fleet management)
- Self-healing & auto-dispatch
- Advanced compliance reporting (PDF generation)

### Phase 3 (18+ months - Scale & Integration)
- Edge agent firmware (ROS2 on robots)
- Gazebo/Webots simulation environment
- Protocol adapters (Modbus, OPC-UA, MQTT, SCADA)
- Partner module SDK
- Licensing & API monetization

---

## Next Steps

1. **Map integration**: Wire Three.js canvas to Command Center, render asset icons at GPS coords
2. **Live video**: Add RTMP player component to Asset detail view
3. **Database**: Swap file-based store for Postgres queries
4. **Authentication**: Add Fastify JWT plugin + React context
5. **Real telemetry**: Connect MQTT broker for live sensor feeds
6. **DAG editor**: Integrate React Flow or similar for interactive mission building
7. **Testing**: Add E2E tests (Playwright/Cypress) for critical workflows

---

## Tech Stack Summary

| Layer | Tech | Purpose |
|-------|------|---------|
| **Frontend** | React 18, Vite, Tailwind, Framer Motion | UI + state management + animations |
| **3D/Viz** | Three.js, Recharts | Terrain maps + data visualization |
| **Backend** | Fastify, Node.js | HTTP API + SSE streaming |
| **State** | Zustand (frontend), File JSON (backend) | App & domain state |
| **Typing** | TypeScript 5.6 | Full type safety |
| **Testing** | Vitest | Unit tests (2 API tests, dashboard ready) |

---

## File Structure

```
plainview/
├── apps/
│   └── dashboard/          # React + Vite frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/     # Design system (Button, Card, Badge, etc.)
│       │   │   └── layout/ # Navbar, layouts
│       │   ├── views/      # Pages (CommandCenter, Missions, Analytics, etc.)
│       │   ├── store.ts    # Zustand app state
│       │   ├── App.tsx     # Main router
│       │   └── index.css   # Tailwind + global styles
│       └── package.json
├── services/
│   └── api/                # Fastify backend
│       ├── src/
│       │   ├── modules/    # Domain handlers (ValveOps, FlowIQ, etc.)
│       │   ├── sse.ts      # Event streaming
│       │   ├── store.ts    # File-based persistence
│       │   ├── server.ts   # Main app
│       │   └── shared.ts   # Constants
│       ├── test/           # Vitest suite
│       └── package.json
├── packages/
│   └── shared/             # Shared TypeScript types
│       ├── src/
│       │   └── index.ts    # Exported interfaces
│       └── package.json
└── package.json            # Root monorepo
```

---

**Built with ❤️ by BigMT | Plainview v0.0.1**
