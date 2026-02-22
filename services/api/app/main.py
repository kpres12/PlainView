import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, close_db
from app.events import register_events, event_bus
from app.models import Health, ModuleDescriptor
from app.rate_limit import setup_rate_limiting
from app.logging_config import setup_logging, RequestLoggingMiddleware
from app.error_handlers import setup_error_handlers

# Import modules
from app.modules.valveops import register_valveops
from app.modules.pipelineguard import register_pipelineguard
from app.modules.flowiq import register_flowiq
from app.modules.rigsight import register_rigsight
from app.modules.incidents import register_incidents
from app.modules.intelligence import register_intelligence
from app.modules.stubs import register_missions, register_ros2_bridge
from app.modules.auth_routes import register_auth_routes
from app.integrations.summit import init_summit, shutdown_summit, SummitConfig
from app.simulation.engine import sim_engine
from app.simulation.routes import register_simulation
from app.agents.registry import agent_registry
from app.agents.simulated import create_default_fleet
from app.agents.routes import register_agents
from app.metrics import register_metrics
from app.middleware.metrics import PrometheusMiddleware

# Configure logging
setup_logging(json_logging=settings.json_logging, log_level=settings.log_level)
logger = logging.getLogger("plainview.main")

# App lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logger.info("Starting Plainview API Service")
    
    # Startup
    await init_db()
    await register_events(app)

    # Optional Summit client
    if settings.summit_enabled:
        init_summit(SummitConfig(
            mqtt_url=settings.summit_mqtt_url,
            api_key=settings.summit_api_key,
            org_id=settings.summit_org_id,
        ))
    
    # Register modules
    register_valveops(app)
    register_pipelineguard(app)
    register_flowiq(app)
    register_rigsight(app)
    register_incidents(app)
    register_intelligence(app)
    register_missions(app)
    register_ros2_bridge(app)
    register_auth_routes(app)
    register_simulation(app)
    register_agents(app)

    if settings.metrics_enabled:
        register_metrics(app)

    # Start simulation engine and agents in simulation mode
    if settings.simulation_mode:
        sim_engine.start()
        for agent in create_default_fleet():
            agent_registry.register(agent)
        await agent_registry.start_all()
        logger.info("Simulation mode active — engine + %d agents started", len(agent_registry.list_agents()))

    yield

    # Shutdown
    logger.info("Shutting down Plainview API Service")
    agent_registry.stop_all()
    sim_engine.stop()
    shutdown_summit()
    await close_db()


# Create FastAPI app
app = FastAPI(
    title="Plainview API",
    description="Industrial operations control platform",
    version="0.0.1",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting
setup_rate_limiting(app)

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Add Prometheus metrics middleware
if settings.metrics_enabled:
    app.add_middleware(PrometheusMiddleware)

# Add error handlers
setup_error_handlers(app)

# Module registry
MODULES = [
    ModuleDescriptor(key="valve-ops", title="ValveOps", description="Autonomous actuation & maintenance scheduling"),
    ModuleDescriptor(key="pipeline-guard", title="PipelineGuard", description="Robot control & leak prevention"),
    ModuleDescriptor(key="rig-sight", title="RigSight", description="Camera/thermal integration for safety monitoring"),
    ModuleDescriptor(key="flow-iq", title="FlowIQ", description="Predictive analytics & anomaly detection"),
]

# Track server start time
startup_time = datetime.utcnow()


# ==================== API Endpoints ====================

@app.get("/health")
async def health():
    """Health check endpoint with subsystem checks.
    
    Returns:
        - status: "ok" | "degraded" | "down"
        - checks: dict of subsystem statuses
        - uptime_sec: server uptime in seconds
    """
    from sqlalchemy import text
    from app.database import AsyncSessionLocal
    from app.integrations.summit import summit_client
    
    checks = {}
    uptime_sec = int((datetime.utcnow() - startup_time).total_seconds())
    
    # Database check
    try:
        if AsyncSessionLocal:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
            checks["database"] = "ok"
        else:
            checks["database"] = "not_initialized"
    except Exception as e:
        checks["database"] = f"error: {type(e).__name__}"
    
    # MQTT/Summit check
    try:
        if summit_client and summit_client._connected.is_set():
            checks["mqtt"] = "ok"
        elif summit_client:
            checks["mqtt"] = "disconnected"
        else:
            checks["mqtt"] = "disabled"
    except Exception:
        checks["mqtt"] = "unknown"
    
    # Event bus check (always ok if server is running)
    checks["event_bus"] = "ok"
    
    # Determine overall status
    critical_checks = ["database"]
    if any(checks.get(c) not in ["ok", "disabled"] for c in critical_checks):
        status = "degraded"
    else:
        status = "ok"
    
    return {
        "status": status,
        "checks": checks,
        "uptime_sec": uptime_sec,
        "uptimeSec": uptime_sec,  # camelCase alias
        "version": "0.0.1",
    }


@app.get("/modules")
async def list_modules():
    """List available modules."""
    return MODULES


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Plainview API",
        "version": "0.0.1",
        "service": "core",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info",
    )
