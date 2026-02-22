"""
JWT Authentication for Plainview.

Provides token creation/validation, user lookup, and role-based FastAPI dependencies.
"""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger("plainview.auth")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token scheme (auto_error=False so we can fall through to API-key)
bearer_scheme = HTTPBearer(auto_error=False)


# ---- Models ----

class TokenPayload(BaseModel):
    sub: str  # username
    role: str  # operator | admin | viewer
    exp: Optional[float] = None
    type: str = "access"  # access | refresh


class UserRecord(BaseModel):
    username: str
    hashed_password: str
    role: str = "viewer"
    display_name: str = ""


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


# ---- User store (JSON-file backed for MVP) ----

USERS_FILE = Path(__file__).resolve().parents[1] / "data" / "users.json"


def _load_users() -> dict[str, dict]:
    """Load users from JSON file."""
    if not USERS_FILE.exists():
        return {}
    try:
        data = json.loads(USERS_FILE.read_text("utf-8"))
        return {u["username"]: u for u in data if isinstance(u, dict)}
    except Exception:
        return {}


def _save_users(users: dict[str, dict]):
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    USERS_FILE.write_text(
        json.dumps(list(users.values()), indent=2), encoding="utf-8"
    )


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def authenticate_user(username: str, password: str) -> Optional[dict]:
    users = _load_users()
    user = users.get(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


# ---- Token creation ----

def create_access_token(sub: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.jwt_expiry_minutes))
    payload = {
        "sub": sub,
        "role": role,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def create_refresh_token(sub: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(days=7)
    payload = {
        "sub": sub,
        "role": role,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


# ---- FastAPI dependencies ----

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    Extract and validate the current user from a Bearer token.
    Returns the decoded token payload.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type — expected access token",
        )
    return payload


def require_role(*roles: str):
    """
    Dependency factory that requires the current user to have one of the given roles.

    Usage:
        @router.post("/valves/{id}/actuate", dependencies=[Depends(require_role("operator", "admin"))])
    """
    async def _check(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {', '.join(roles)}",
            )
        return user
    return _check
