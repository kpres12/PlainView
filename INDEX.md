# Plainview Documentation Index

## Quick Navigation

### 🚀 Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** — 3-step setup & what to expect
- **[BUILD_SUMMARY.txt](BUILD_SUMMARY.txt)** — Complete build overview

### 📖 Comprehensive Guides
- **[README_BUILD.md](README_BUILD.md)** — Full architecture, tech stack, roadmap
- **[STYLING.md](STYLING.md)** — CSS/Tailwind implementation guide
- **[WARP.md](WARP.md)** — Development guidelines for WARP

### 💻 Running the Project
```bash
npm install                         # Install all dependencies
npm run dev                         # Start dashboard + API
npm run build                       # Production build
npm run test                        # Run tests
npm run typecheck                   # Strict TypeScript check
```

### 🎯 Key Files & Locations

**Frontend Dashboard**
- Main app: `apps/dashboard/src/App.tsx`
- Views: `apps/dashboard/src/views/` (6 complete views)
- UI Components: `apps/dashboard/src/components/ui/` (6 components)
- Styles: `apps/dashboard/tailwind.config.js`, `apps/dashboard/src/index.css`
- State: `apps/dashboard/src/store.ts` (Zustand)

**Backend API**
- Server: `services/api/src/server.ts`
- Modules: `services/api/src/modules/` (ValveOps, etc.)
- SSE Events: `services/api/src/sse.ts`
- Storage: `services/api/src/store.ts`

**Shared**
- Types: `packages/shared/src/index.ts`

### 📍 What's Built

✅ **Frontend**
- Command Center (3D map + asset tree + telemetry)
- Mission Planner (DAG editor + mission list)
- FlowIQ Analytics (trend charts + AI insights)
- Alert Console (real-time stack + filtering)
- Asset Detail (drill-down view)
- Mission Replay (playback + compliance)

✅ **Backend**
- Fastify HTTP API
- SSE event streaming (8 event types)
- Domain modules (ValveOps, RigSight, etc.)
- File-based persistence

✅ **Design System**
- 6 reusable UI components
- Tailwind + Framer Motion
- Industrial dark theme

### 🔧 Common Commands

```bash
# Development
npm run dev -w @plainview/api          # API only
npm run dev -w @plainview/dashboard    # Dashboard only

# Testing
npm run test -w @plainview/api -- -t "MODULES"

# Build individual workspaces
npm run build -w @plainview/api

# Type checking
npm run typecheck
```

### 📊 Project Status

**Phase 0 (✅ COMPLETE)**
- All 6 dashboard views
- Full API with SSE
- Design system
- TypeScript strict mode
- 2 tests passing

**Phase 1 (Ready to Start)**
- 3D terrain map
- Live video streaming
- Database integration
- Authentication
- DAG flow editor

### 📚 Documentation Quick Links

| Document | Purpose |
|----------|---------|
| QUICKSTART.md | Get running in 3 steps |
| README_BUILD.md | Comprehensive architecture |
| BUILD_SUMMARY.txt | Complete feature list |
| STYLING.md | CSS & Tailwind implementation |
| WARP.md | Development guidelines |
| INDEX.md | This file |

### 🌐 Endpoints

**Dashboard**: http://localhost:5173
**API**: http://localhost:4000

**Key API Routes**
- `GET /health` — System status
- `GET /modules` — Domain modules
- `GET /valves` — Valve list
- `GET /events` — SSE stream
- `POST /valves/:id/actuate` — Actuate valve

### 🎨 Design Tokens

- Background: `#0C0C0E` (matte black)
- Accent: `#F5A623` (amber)
- Secondary: `#2E9AFF` (steel blue)
- Success: `#5FFF96`
- Warning: `#F5A623`
- Danger: `#FF4040`

### ⚡ Next Steps

1. Read QUICKSTART.md
2. Run `npm install && npm run dev`
3. Open http://localhost:5173
4. Explore the dashboard
5. Check README_BUILD.md for architecture details

---

**Plainview v0.0.1** — Oilfield Autonomy & Control Platform
