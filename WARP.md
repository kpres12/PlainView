# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Common commands
- Root (run across workspaces):
  - Dev: `npm run dev`
  - Build: `npm run build`
  - Test: `npm run test`
- Per workspace:
  - API (Python/FastAPI): `npm run dev -w @plainview/api` | start `npm run start -w @plainview/api`
  - Dashboard: `npm run dev -w @plainview/dashboard` | build `npm run build -w @plainview/dashboard`
  - Shared types: `npm run build -w @plainview/shared`

How to run a single test
- API uses Python now. Tests TBD (pytest recommended). Dashboard still uses Vitest.

Architecture (current snapshot)
- Monorepo (npm workspaces): `apps/` (dashboard), `services/` (API), `packages/` (shared types), `integrations/` (reserved for connectors).
- API Service (`services/api`, FastAPI + Python): exposes `/health`, `/modules`, `/events`, and composes domain modules (ValveOps, PipelineGuard, FlowIQ, RigSight, Incidents, stubs for Missions/ROS2).
- Dashboard (`apps/dashboard`, Vite + React + TS): vintage industrial theme; lists modules; ValveOps panel; SSE timeline from `/events`.
- Shared Types (`packages/shared`): cross-package contracts for modules, health, descriptors (expand as needed).

Product/system design anchors
Plainview = Summit.OS + Industry Modules + Edge Agents
- Summit.OS Core: Autonomy kernel with Fabric (comms), Fusion (sensor), Intelligence (AI orchestration).
- Edge Agents: Software on robots, drones, stationary sensors, and gateways for local missions with safe fallback.
- Cloud/App: Dashboard, analytics, incident timeline, mission planner.

Domain modules (initial stubs wired into API)
- PipelineGuard — `/pipeline/alerts`
- RigSight — `/rig/cameras`
- ValveOps — `/valves`, `/valves/:id/actuate` (simulated actuation + SSE events)
- FlowIQ — `/flow/health`
- Events — `/events` (SSE, emits telemetry ticks and actuation events)

Roadmap (concise)
- 0–6 mo (MVP): ValveOps, Leak/Spill Detection, Command Dashboard.
- 6–12 mo: FlowIQ analytics (anomaly models, health scoring).
- 12–18 mo: Full autonomy and self-maintenance (multi-agent coordination, autonomous dispatch).
- 18–24 mo: Integration suite and licensing (APIs, SDK, partner modules).

Implementation notes
- To develop:
  - API dev: `npm run dev -w @plainview/api` (FastAPI + Uvicorn; CORS enabled; port 4000). First-time: `pip install -r services/api/requirements.txt`.
  - Dashboard dev: `npm run dev -w @plainview/dashboard` (port 5173)
- Road to production: add auth, persistence (e.g., Postgres/SQLite), real telemetry (MQTT/OPC-UA/ROS2), and map/timeline data sources.
- As components land, add: edge agents/firmware (ROS2), simulation (Gazebo/Webots), protocol integrations (Modbus/OPC-UA/MQTT/SCADA), and corresponding commands (dev/build/test).
