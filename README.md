# Plainview

**Industrial operations control platform** powered by Summit.OS autonomy kernel.

Monitor and control industrial assets (valves, pipelines, sensors) with autonomous actuation, predictive maintenance, and incident response.

## Architecture

- **API**: `services/api` (FastAPI, Python) – REST API + SSE event streaming
- **Dashboard**: `apps/dashboard` (Vite + React + TS) – Real-time UI with 3D visualization
- **Shared Types**: `packages/shared` – Cross-platform type definitions
- **Integrations**: `integrations/` – Summit.OS MQTT bridge, ROS2 telemetry (planned)

## Quick Start

### Development (Local)

```bash
# 1. Install dependencies
npm install
cd services/api && pip install -r requirements.txt

# 2. Start API
npm run dev -w @plainview/api

# 3. Start Dashboard (in another terminal)
npm run dev -w @plainview/dashboard
```

### Production (Docker)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your settings (see DEPLOYMENT.md)

# 2. Start all services
docker-compose up -d

# 3. Verify health
curl http://localhost:4000/health
```

Access dashboard at: **http://localhost:5173**

## Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** – Production deployment guide, Docker, Kubernetes, troubleshooting
- **[TECH_DEBT_FIXED.md](TECH_DEBT_FIXED.md)** – Summary of production hardening (auth, CORS, health checks)
- **[LAUNCH_READINESS_AUDIT.md](LAUNCH_READINESS_AUDIT.md)** – Security audit and remaining risks
- **[WARP.md](WARP.md)** – Development commands and architecture notes
- **[.env.example](.env.example)** – All configuration options documented

## Features

### Domain Modules

- **ValveOps** – Autonomous valve actuation with torque telemetry and maintenance scheduling
- **PipelineGuard** – Leak detection, robot dispatch, and integrity monitoring
- **FlowIQ** – Predictive analytics and anomaly detection (flow, pressure, temperature)
- **RigSight** – Camera/thermal monitoring with AI object detection
- **Incidents** – Automated incident correlation and timeline reconstruction

### Platform Capabilities

- ✅ Real-time SSE event streaming (telemetry, alerts, actuations)
- ✅ API key authentication for write operations
- ✅ CORS restrictions configurable by environment
- ✅ Health checks with subsystem status (DB, MQTT, event bus)
- ✅ Docker Compose deployment
- ✅ Incident timeline with alert correlation
- ✅ Summit.OS MQTT integration (optional)

## API Endpoints

### Core
- `GET /health` – Health check with subsystem status
- `GET /modules` – List available domain modules
- `GET /events` – SSE stream of all telemetry and events

### ValveOps
- `GET /valves` – List all valves with current status
- `GET /valves/:id` – Get valve details and actuation history
- `POST /valves/:id/actuate` – Actuate valve (protected)
- `GET /valves/:id/health` – Detailed health report with thresholds

### PipelineGuard
- `GET /pipeline/alerts` – Active and recent leak detections
- `GET /pipeline/health` – Integrity score and pressure profile
- `POST /pipeline/alerts/:id/resolve` – Mark leak as resolved (protected)

### FlowIQ
- `GET /flow/health` – Current metrics and anomaly count
- `GET /flow/metrics` – Historical metrics and statistics
- `GET /flow/anomalies` – Anomaly history with filtering

### Incidents
- `GET /incidents` – Active and recent incidents
- `GET /incidents/:id` – Incident details with timeline
- `POST /incidents/:id/update` – Update incident status (protected)

## Security

### Authentication

API key authentication protects write operations:

```bash
# Enable in .env
API_KEY_ENABLED=true
API_KEYS=your_key_here

# Call protected endpoint
curl -X POST http://localhost:4000/valves/v-101/actuate \
  -H "X-API-Key: your_key_here"
```

### CORS

Restrict origins in production:

```bash
ENVIRONMENT=production
CORS_ORIGINS=https://app.yourdomain.com,https://dashboard.yourdomain.com
```

## Monitoring

```bash
# Health check
curl http://localhost:4000/health

# Expected response:
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "mqtt": "ok",
    "event_bus": "ok"
  },
  "uptime_sec": 1234,
  "version": "0.0.1"
}

# View logs
docker-compose logs -f api
```

## Roadmap

- **0–6 months**: ValveOps, PipelineGuard, incident correlation (MVP)
- **6–12 months**: FlowIQ predictive analytics, health scoring, anomaly models
- **12–18 months**: Full autonomy, multi-agent coordination, self-maintenance
- **18–24 months**: Integration suite, partner APIs, SDK, licensing

## Production Readiness

✅ **Ready for customer pilots**

| Category | Status |
|----------|--------|
| Security | 🟢 Auth + CORS enabled |
| Deployment | 🟢 Docker Compose ready |
| Reliability | 🟡 Health checks + basic logging |
| Observability | 🟡 Logs sufficient for pilots |
| Documentation | 🟢 Complete |

See [TECH_DEBT_FIXED.md](TECH_DEBT_FIXED.md) for details.

## Support

For issues or questions:
- GitHub Issues: [your-repo]/issues
- Documentation: [docs site]
- Email: support@plainview.com

## License

Proprietary – All rights reserved
