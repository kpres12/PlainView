"""
Unified Authentication Dispatcher

Supports three modes via AUTH_MODE env var:
- "none"    — no auth (local dev)
- "api_key" — legacy X-API-Key header
- "jwt"     — Bearer token with role-based access
"""

import os
from typing import Optional
from fastapi import Depends, HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings


# ---- Schemes ----
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


# ---- API-key verification (legacy) ----

async def verify_api_key(api_key: Optional[str] = Security(api_key_header)) -> str:
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Include X-API-Key header.",
        )
    if api_key not in settings.api_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    return api_key


def get_optional_api_key(api_key: Optional[str] = Security(api_key_header)) -> Optional[str]:
    if not api_key or not settings.api_key_enabled:
        return None
    if api_key in settings.api_keys:
        return api_key
    return None


# ---- Unified write-access dependency ----

async def require_write_access(
    request: Request,
    api_key: Optional[str] = Security(api_key_header),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    Unified gate for write/protected endpoints.

    Checks AUTH_MODE:
    - "none"    → pass through (dev mode)
    - "api_key" → verify X-API-Key header
    - "jwt"     → verify Bearer token, require operator or admin role
    """
    mode = settings.auth_mode

    if mode == "none":
        return {"sub": "dev-user", "role": "admin"}

    if mode == "api_key":
        if not api_key or api_key not in settings.api_keys:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid API key",
            )
        return {"sub": "api-key-user", "role": "operator"}

    # JWT mode
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )
    from app.auth_jwt import decode_token
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    if payload.get("role") not in ("operator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions — requires operator or admin role",
        )
    return payload
