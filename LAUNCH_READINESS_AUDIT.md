# Launch Readiness Audit – Plainview

**Date**: 2025-11-13  
**Status**: CRITICAL ISSUES FIXED

This document outlines glaring issues that would become apparent at launch and the fixes applied.

---

## Critical Issues Fixed

### 1. ⚠️  Data Directory Path Incorrect (FIXED)
**Impact**: Runtime crashes, file not found errors, incident and valve state loss  
**Root cause**: `store.py` constructed path as `services/api/app/../../services/api/data`, which resolved to a duplicate nested `services/services/api/data` directory. Tests expected `services/api/data`.

**Fix**:
- Changed `store.py` line 6 from:
  ```python
  DATA_DIR = Path(__file__).resolve().parents[2] / "services" / "api" / "data"
  ```
  to:
  ```python
  DATA_DIR = Path(__file__).resolve().parents[1] / "data"
  ```
- Updated `test_incidents.py` to import `FILES` from `app.store` instead of hard-coding the path.

**Files changed**:
- `services/api/app/store.py`
- `services/api/tests/test_incidents.py`

---

### 2. ⚠️  Undefined Variable in ValveOps Health Endpoint (FIXED)
**Impact**: 500 Internal Server Error on `GET /valves/:id/health`  
**Root cause**: Code referenced `valve_state` dict and `init_valve_state()` function, which were never defined. Old vestigial code from a refactor.

**Fix**:
- Removed references to undefined `valve_state` and `init_valve_state()`.
- Replaced with call to `store.get_valves()` to retrieve persisted valve data.

**Files changed**:
- `services/api/app/modules/valveops.py` (lines 214–264)

---

### 3. ⚠️  Missing Event Types in SSE Stream (FIXED)
**Impact**: UI SSE subscribers never receive `mission.updated`, `detection.made`, `incident.created`, `intelligence.insight.received` events. Certain parts of the UI (AI assistant, mission replay, incident timeline) would show stale data.

**Root cause**: `events.py` EVENT_TYPES whitelist excluded event types emitted by modules.

**Fix**:
- Added missing event types to `EVENT_TYPES` set in `services/api/app/events.py`:
  - `mission.updated`
  - `detection.made`
  - `incident.created`
  - `incident.updated`
  - `intelligence.insight.received`

**Files changed**:
- `services/api/app/events.py`

---

### 4. ⚠️  Hardcoded API Base URL in React Dashboard (FIXED)
**Impact**: Dashboard breaks in production/staging environments; localhost-only SSE connection.

**Root cause**: `AIAssistant.tsx` hardcoded `http://localhost:4000/events` for EventSource connection.

**Fix**:
- Changed EventSource URL from hardcoded `http://localhost:4000/events` to:
  ```typescript
  const base = (import.meta as any).env?.VITE_API_BASE || "http://localhost:4000";
  const es = new EventSource(`${base}/events`);
  ```
- Now respects `VITE_API_BASE` environment variable for production builds.

**Files changed**:
- `apps/dashboard/src/components/AIAssistant.tsx`

---

### 5. ⚠️  SSE Event Handling in Dashboard (FIXED)
**Impact**: Dashboard only received `message` event; server sends named events (`anomaly.detected`, `valve.actuation.completed`, etc.). AI Assistant insights never appeared.

**Root cause**: `AIAssistant.tsx` only listened to generic `message` events, but FastAPI SSE emits `event: <type>` with distinct event types.

**Fix**:
- Replaced generic `message` listener with explicit named-event listeners for:
  - `telemetry.tick`
  - `anomaly.detected`
  - `mission.completed`
  - `mission.started`
  - `valve.actuation.completed`
  - `alert.created`
  - `incident.created`
  - `detection.made`
  - `intelligence.insight.received`
- Normalized payloads to handle both `snake_case` (Python) and `camelCase` (TS) keys.

**Files changed**:
- `apps/dashboard/src/components/AIAssistant.tsx`

---

### 6. ⚠️  CORS Allows All Origins (KNOWN RISK, NOT FIXED)
**Impact**: Production security risk; any origin can call the API.

**Current state**: `config.py` line 26:
```python
cors_origins: list = ["*"]  # Configure in production
```

**Recommendation for production**:
```python
cors_origins: list = os.getenv("CORS_ORIGINS", "https://app.plainview.com").split(",")
```

**Files to change**:
- `services/api/app/config.py`

---

### 7. ⚠️  No Authentication/Authorization (KNOWN RISK, NOT FIXED)
**Impact**: Any client can actuate valves, resolve incidents, receive all events.

**Current state**: All endpoints are public.

**Recommendation for production**:
- Add FastAPI dependency for API key or JWT auth.
- Protect write endpoints (`POST /valves/:id/actuate`, `POST /incidents/:id/update`, etc.).
- Add role-based access controls for sensitive telemetry streams.

**Files to change**:
- `services/api/app/main.py` (add auth middleware)
- All module routers (add `Depends(get_current_user)` to protected routes)

---

### 8. ⚠️  Database URL Hardcoded with Default Password (KNOWN RISK, NOT FIXED)
**Impact**: Production data exposed if default credentials not changed.

**Current state**: `config.py` line 10:
```python
postgres_url: str = os.getenv(
    "POSTGRES_URL",
    "postgresql+asyncpg://plainview:plainview_password@localhost:5432/plainview"
)
```

**Recommendation for production**:
- Require `POSTGRES_URL` environment variable.
- Raise exception if not set in production mode.
- Use secrets manager (AWS Secrets Manager, Vault, etc.).

**Files to change**:
- `services/api/app/config.py`

---

### 9. ⚠️  No Dependency Version Pinning (KNOWN RISK, NOT FIXED)
**Impact**: Builds break randomly as upstream packages release breaking changes.

**Current state**: `requirements.txt` uses `>=` ranges:
```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.0
```

**Recommendation for production**:
- Pin exact versions or use `~=` (compatible release):
  ```
  fastapi==0.109.2
  uvicorn[standard]==0.27.1
  pydantic==2.5.3
  ```
- Use `pip-tools` or Poetry for lock files.

**Files to change**:
- `services/api/requirements.txt`
- `services/api/pyproject.toml`

---

### 10. ⚠️  No Rate Limiting (KNOWN RISK, NOT FIXED)
**Impact**: DoS attacks, accidental abuse (e.g., runaway script actuating valves).

**Recommendation for production**:
- Add `slowapi` or nginx rate limiting:
  ```python
  from slowapi import Limiter, _rate_limit_exceeded_handler
  from slowapi.util import get_remote_address
  
  limiter = Limiter(key_func=get_remote_address)
  app.state.limiter = limiter
  app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
  
  @app.post("/valves/{valve_id}/actuate")
  @limiter.limit("10/minute")
  async def actuate_valve(request: Request, valve_id: str):
      ...
  ```

**Files to change**:
- `services/api/app/main.py`
- Add `slowapi` to `requirements.txt`

---

### 11. ⚠️  No Logging / Observability (KNOWN RISK, NOT FIXED)
**Impact**: Blind to errors, performance issues, and security incidents in production.

**Current state**: Basic `logging.basicConfig(level=logging.INFO)` in `main.py`.

**Recommendation for production**:
- Structured logging (JSON) with OpenTelemetry or structlog.
- Export logs to centralized service (Datadog, CloudWatch, Grafana Loki).
- Add request ID tracing.
- Add metrics (Prometheus) for valve actuations, anomaly counts, SSE connections, etc.
- Add distributed tracing for async operations.

**Files to change**:
- `services/api/app/main.py` (add middleware for request logging and tracing)
- All modules (replace `print` with `logger.info/error`)

---

### 12. ⚠️  No Error Handling / Retries in Summit MQTT Client (KNOWN RISK, NOT FIXED)
**Impact**: If MQTT broker is down or network is unreliable, integration silently fails. No reconnection logic.

**Current state**: `summit.py` connects once; if connection drops, no retry.

**Recommendation for production**:
- Add exponential backoff reconnection logic.
- Add connection health checks.
- Log connection failures.
- Add circuit breaker to avoid cascading failures.

**Files to change**:
- `services/api/app/integrations/summit.py`

---

### 13. ⚠️  SQLite DB File in Repo Root (KNOWN RISK, NOT FIXED)
**Impact**: Test DB (`test_plainview.db`) persists and grows in size; could accidentally commit to git.

**Current state**: `.gitignore` does not exclude `*.db` files.

**Recommendation**:
- Add `*.db` to `.gitignore`.
- Use in-memory SQLite for tests: `sqlite+aiosqlite:///:memory:`.

**Files to change**:
- `.gitignore`
- `services/api/tests/conftest.py` (change POSTGRES_URL default)

---

### 14. ⚠️  No Health Check Depth (KNOWN RISK, NOT FIXED)
**Impact**: `/health` endpoint only checks uptime; doesn't validate DB connection, MQTT connection, or SSE event bus.

**Current state**: Returns `{"status": "ok"}` unconditionally.

**Recommendation for production**:
```python
@app.get("/health")
async def health():
    checks = {}
    
    # DB check
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        checks["db"] = "ok"
    except Exception as e:
        checks["db"] = f"error: {str(e)}"
    
    # MQTT check
    checks["mqtt"] = "ok" if summit_client and summit_client._connected.is_set() else "offline"
    
    # SSE check
    checks["event_bus"] = "ok"
    
    status = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    return {"status": status, "checks": checks, "uptime_sec": ...}
```

**Files to change**:
- `services/api/app/main.py`

---

## Severity Summary

| Severity | Count | Examples |
|----------|-------|----------|
| **Critical (launch-blocker)** | 5 | Data path bug, undefined variable, missing SSE events, hardcoded API URL, broken SSE listeners |
| **High (fix before GA)** | 4 | No auth, CORS wildcard, default DB password, no rate limiting |
| **Medium (fix in first month)** | 4 | No version pinning, minimal logging, MQTT no retry, shallow health checks |

---

## Test Coverage Status

**Current**: Pytest fixtures exist; basic smoke tests pass.  
**Gaps**:
- No integration tests for SSE streaming.
- No auth/authz tests (because no auth exists).
- No load/stress tests for valve actuation under concurrent requests.
- No end-to-end tests for dashboard ↔ API flow.

**Recommendation**:
- Add E2E tests using Playwright or Cypress for dashboard.
- Add load tests using Locust or k6 for `/valves/:id/actuate` and `/events`.

---

## Deployment Checklist (Production)

- [ ] Set `POSTGRES_URL` from secrets manager
- [ ] Set `REDIS_URL` if using caching/pub-sub
- [ ] Set `SUMMIT_ENABLED=true` and `SUMMIT_MQTT_URL`, `SUMMIT_API_KEY`, `SUMMIT_ORG_ID`
- [ ] Set `CORS_ORIGINS` to actual dashboard domain(s)
- [ ] Enable authentication and authorization
- [ ] Pin dependency versions (`requirements.txt` exact pins)
- [ ] Configure structured logging to external service
- [ ] Add Prometheus `/metrics` endpoint
- [ ] Add rate limiting (10 req/min per IP for actuation endpoints)
- [ ] Enable HTTPS with valid certificate
- [ ] Set up database connection pooling and read replicas if needed
- [ ] Configure DB migrations via Alembic
- [ ] Add monitoring and alerting (uptime, error rate, latency SLOs)
- [ ] Harden MQTT connection with TLS and retries
- [ ] Add runbooks for incident response
- [ ] Set up CI/CD with automated tests and security scans (Dependabot, Snyk, Trivy)
- [ ] Verify `.gitignore` excludes secrets, `.env`, `*.db`, `node_modules`, `__pycache__`

---

## What Was Fixed Today

✅ **Data directory path** – corrected to `services/api/data`  
✅ **Undefined variable in ValveOps health endpoint** – replaced with `store.get_valves()`  
✅ **Missing SSE event types** – added 5 missing event types to whitelist  
✅ **Hardcoded API base URL** – now uses `VITE_API_BASE` env var  
✅ **SSE event handling** – listen to named events, handle snake_case/camelCase payloads  

These fixes prevent immediate runtime crashes and enable core functionality (incidents, valve telemetry, AI assistant) to work correctly at launch.

---

## What Still Needs Fixing Before Production

⚠️ **Security**: auth, CORS restrictions, secrets management, rate limiting  
⚠️ **Reliability**: retries, health checks, observability, error handling  
⚠️ **Operational**: version pinning, structured logging, metrics, runbooks

**Bottom line**: The app can now run without crashing and demonstrate core features. However, it is NOT production-ready without addressing security, reliability, and operational gaps above.
