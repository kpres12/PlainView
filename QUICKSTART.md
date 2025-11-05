# Plainview — Quick Start

## 🚀 Get Running in 3 Steps

### 1. Install
```bash
cd Plainview
npm install
```

### 2. Start Dev Servers
```bash
npm run dev
```

This launches:
- **Dashboard**: http://localhost:5173 (React dev server with HMR)
- **API**: http://localhost:4000 (Fastify backend)

### 3. Open Your Browser
Navigate to **http://localhost:5173** and explore the Command Center.

---

## 📍 What You'll See

- **Navbar**: Logo + navigation tabs (COMMAND CENTER | MISSIONS | FLOWIQ | ALERTS)
- **Command Center**: 
  - Left: Asset tree with 4 sample devices
  - Center: 3D map placeholder
  - Right: Live telemetry metrics
  - Bottom: Event timeline scrubber
- **Click asset** in tree to see telemetry
- **Top nav tabs** to switch views
  - MISSIONS: DAG flow editor + mission list
  - FLOWIQ: Pressure/Torque trend charts + AI insights
  - ALERTS: Real-time alert stack with filtering

---

## 🔌 Try Live Interactions

### Trigger Valve Actuation
1. Go to **COMMAND CENTER**
2. Valve should appear in sidebar
3. Behind the scenes: SSE events stream to dashboard in real-time

### Scroll Alerts
1. Click **ALERTS** in navbar
2. Try "CRITICAL" filter
3. Acknowledge or delete alerts

### Playback Mission
1. Look for **MISSION REPLAY** view (can add to navbar)
2. Scrub timeline with slider
3. See camera stream + event markers sync

---

## 🛠 Common Commands

```bash
# Dev
npm run dev                         # All services
npm run dev -w @plainview/api       # API only (port 4000)
npm run dev -w @plainview/dashboard # Dashboard only (port 5173)

# Build
npm run build                       # Production builds
npm run build -w @plainview/api

# Test
npm run test                        # All tests
npm run test -w @plainview/api -- -t "MODULES"  # Single test

# Type Check
npm run typecheck                   # All workspaces

# Check Coverage
cd services/api && npm run test     # Shows coverage
```

---

## 📦 Architecture at a Glance

```
┌─────────────────────────────────────────┐
│         Browser (React + Vite)          │
│  Dashboard, Views, UI Components        │
│  State: Zustand + React Hooks           │
└──────────────┬──────────────────────────┘
               │ HTTP + SSE
┌──────────────▼──────────────────────────┐
│      Fastify API (Node.js)              │
│  /health, /modules, /valves, /events    │
│  SSE streaming at /events               │
└──────────────┬──────────────────────────┘
               │ File I/O
┌──────────────▼──────────────────────────┐
│    data/ (JSON files)                   │
│  incidents.json, valves.json            │
└─────────────────────────────────────────┘
```

---

## 🎨 Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| bg | `#0C0C0E` | Main background |
| accent | `#F5A623` | Buttons, highlights |
| secondary | `#2E9AFF` | Data streams, secondary |
| success | `#5FFF96` | Online, completed |
| warning | `#F5A623` | Alerts, anomalies |
| danger | `#FF4040` | Critical errors |

---

## 🔗 API Examples

### Get Modules
```bash
curl http://localhost:4000/modules
```

### Get Valves
```bash
curl http://localhost:4000/valves
```

### Listen to Events (SSE)
```bash
curl http://localhost:4000/events
```

### Actuate a Valve
```bash
curl -X POST http://localhost:4000/valves/v-101/actuate
```

---

## 📖 File Structure

```
apps/dashboard/src/
├── components/
│   ├── ui/              # Design system (Button, Card, Badge, etc.)
│   └── layout/
│       └── Navbar.tsx   # Top navigation
├── views/
│   ├── CommandCenter.tsx    # Main dashboard
│   ├── Missions.tsx         # Mission planner
│   ├── Analytics.tsx        # FlowIQ charts
│   ├── Alerts.tsx           # Alert console
│   ├── AssetDetail.tsx      # Drill-down view
│   └── MissionReplay.tsx    # Compliance/replay
├── App.tsx              # Main router
├── store.ts             # Zustand state
└── index.css            # Tailwind + global

services/api/src/
├── modules/             # Domain logic
│   ├── valveops.ts
│   ├── pipelineguard.ts
│   ├── rigsight.ts
│   └── flowiq.ts
├── sse.ts               # Event streaming
├── store.ts             # File-based persistence
├── server.ts            # Fastify setup
└── shared.ts            # Constants
```

---

## 🎯 Next Steps

1. **Open Dashboard**: http://localhost:5173
2. **Check Navbar**: Navigate through Command Center → Missions → FlowIQ → Alerts
3. **Click an asset** in the left sidebar to see telemetry
4. **Try the Alerts tab** and filter by Critical
5. **Explore code**: All TypeScript—types are enforced end-to-end

---

## 💡 Tips

- **Hot Reload**: Dashboard reloads on file changes (Vite)
- **API Logs**: Check terminal for request/response logging
- **Browser DevTools**: React DevTools + Network tab show SSE streams
- **Data Persistence**: `data/` directory stores incidents & valve state
- **CORS Enabled**: API accepts requests from localhost:5173

---

**Need help?** Check `README_BUILD.md` for detailed architecture & roadmap.
