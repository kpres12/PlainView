"""
API Key Authentication

Simple API key authentication for production endpoints.
For MVP: single API key from environment variable.
For production: consider JWT tokens or OAuth2.
"""

import os
from typing import Optional
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.config import settings


# API key header scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: Optional[str] = Security(api_key_header)) -> str:
    """
    Verify API key for protected endpoints.
    
    Usage:
        @router.post("/valves/{valve_id}/actuate", dependencies=[Depends(verify_api_key)])
        async def actuate_valve(valve_id: str):
            ...
    
    Raises:
        HTTPException: 401 if key is missing or invalid
    """
    if not settings.api_key_enabled:
        # Auth disabled (for local dev)
        return "dev-mode"
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Include X-API-Key header.",
        )
    
    valid_keys = settings.api_keys
    if api_key not in valid_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    
    return api_key


def get_optional_api_key(api_key: Optional[str] = Security(api_key_header)) -> Optional[str]:
    """
    Get API key without requiring it (for logging/metrics).
    Returns None if not provided or invalid.
    """
    if not api_key or not settings.api_key_enabled:
        return None
    
    if api_key in settings.api_keys:
        return api_key
    
    return None
