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

# Import modules
from app.modules.valveops import register_valveops
from app.modules.pipelineguard import register_pipelineguard
from app.modules.flowiq import register_flowiq
from app.modules.rigsight import register_rigsight
from app.modules.incidents import register_incidents
from app.modules.intelligence import register_intelligence
from app.modules.stubs import register_missions, register_ros2_bridge
from app.integrations.summit import init_summit, shutdown_summit, SummitConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    yield
    
    # Shutdown
    logger.info("Shutting down Plainview API Service")
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
    """Health check endpoint."""
    uptime_sec = int((datetime.utcnow() - startup_time).total_seconds())
    # Provide both snake_case and camelCase for compatibility
    return {"status": "ok", "uptime_sec": uptime_sec, "uptimeSec": uptime_sec}


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
