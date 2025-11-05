# Plainview API: TypeScript → Python Migration

This document outlines the migration of Plainview's API backend from TypeScript (Fastify) to Python (FastAPI).

## Changes

### Architecture
- **Before**: Fastify (Node.js) with EventEmitter for SSE
- **After**: FastAPI (Python) with asyncio queues for SSE
- **Benefits**: Consistent with Summit.OS/Sentinel; Python ecosystem for ML/analytics

### Endpoints (Preserved)
All HTTP endpoints remain unchanged:

#### Core
- `GET /` - Root info
- `GET /health` - Health check
- `GET /modules` - Module registry

#### ValveOps (`/valves`)
- `GET /valves` - List all valves
- `GET /valves/{id}` - Get single valve
- `POST /valves/{id}/actuate` - Actuate valve
- `GET /valves/{id}/health` - Detailed health report

#### PipelineGuard (`/pipeline`)
- `GET /pipeline/alerts` - Active and recent leaks
- `GET /pipeline/health` - Overall health report
- `GET /pipeline/sections/{section}` - Section-specific details
- `POST /pipeline/alerts/{id}/resolve` - Mark leak as resolved

#### FlowIQ (`/flow`)
- `GET /flow/health` - Current system health
- `GET /flow/metrics` - Metrics history and stats
- `GET /flow/anomalies` - Historical anomalies
- `GET /flow/source` - Current data source (mock vs ROS2)

#### Other Modules
- `GET /rig/cameras` - RigSight camera feeds
- `GET /incidents` - Incidents module
- `GET /missions` - Missions module
- `GET /ros2/nodes` - ROS2 Bridge nodes

#### Events (SSE)
- `GET /events` - Server-Sent Events stream (unchanged format)

### Data Models
- Pydantic models replace TypeScript interfaces
- JSON serialization preserved
- All field names match original TypeScript

### Database
- SQLAlchemy with asyncpg for async PostgreSQL
- Tables: flow_metrics, flow_anomalies, valve_actuations, leak_detections, missions, incidents
- Migration-ready with Alembic (stub provided)

### Event Bus
- Python asyncio.Queue replaces Node.js EventEmitter
- SSE generation via StreamingResponse
- 5-second heartbeat + event forwarding

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
npm run dev  # or: python -m uvicorn app.main:app --reload --port 4000

# Production
npm start  # or: python -m uvicorn app.main:app --port 4000
```

## Environment Variables
```
POSTGRES_URL=postgresql://plainview:plainview_password@localhost:5432/plainview
PORT=4000
REDIS_URL=redis://localhost:6379  # optional
```

## Testing Against TypeScript Version

The Python backend is a 1:1 port. To verify compatibility:

1. Start both servers (TypeScript on port 3000, Python on port 4000)
2. Compare `/health`, `/modules` responses
3. Subscribe to `/events` from both and compare event payloads
4. Test valve actuation: `POST /valves/v-101/actuate`
5. Verify SSE heartbeat (5-second interval)

## Notes

- In-memory simulation mode for ValveOps, PipelineGuard, FlowIQ (same as TypeScript)
- Database persistence optional (can use in-memory or add database layer)
- RigSight, Incidents, Missions, ROS2Bridge are stubs (expand as needed)
- Pydantic validation enabled for all request/response models

## Next Steps

1. **Add Alembic migrations** for schema versioning
2. **Wire up Redis** for distributed caching/streams (optional)
3. **Expand stub modules** (RigSight cameras, Missions planner, etc.)
4. **Add authentication** (OIDC bearer tokens, mTLS)
5. **Performance tuning** (connection pooling, query optimization)
6. **Integration tests** against live database and event stream
