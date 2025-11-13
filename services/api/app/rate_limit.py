"""
Rate Limiting for Plainview API

Uses slowapi to prevent abuse and DoS attacks.
Configurable per-endpoint via environment variables.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings

# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],  # Global default
    enabled=True,
)


def setup_rate_limiting(app):
    """
    Add rate limiting to FastAPI app.
    
    Usage:
        from app.rate_limit import setup_rate_limiting
        setup_rate_limiting(app)
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    return app


# Rate limit decorators for common operations
VALVE_ACTUATION_LIMIT = "10/minute"  # Configurable via env later
INCIDENT_MUTATION_LIMIT = "20/minute"
