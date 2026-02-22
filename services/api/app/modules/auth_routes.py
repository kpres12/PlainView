"""
Authentication endpoints: login, refresh, me.
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth_jwt import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    _load_users,
)
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/login")
async def login(body: LoginRequest):
    """
    Authenticate with username/password, receive access + refresh tokens.
    """
    user = authenticate_user(body.username, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    access = create_access_token(user["username"], user["role"])
    refresh = create_refresh_token(user["username"], user["role"])
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": settings.jwt_expiry_minutes * 60,
        "user": {
            "username": user["username"],
            "role": user["role"],
            "display_name": user.get("display_name", user["username"]),
        },
    }


@router.post("/refresh")
async def refresh(body: RefreshRequest):
    """
    Exchange a refresh token for a new access token.
    """
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type — expected refresh token",
        )

    access = create_access_token(payload["sub"], payload["role"])
    return {
        "access_token": access,
        "token_type": "bearer",
        "expires_in": settings.jwt_expiry_minutes * 60,
    }


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    """
    Return the current authenticated user's info.
    """
    users = _load_users()
    stored = users.get(user["sub"], {})
    return {
        "username": user["sub"],
        "role": user["role"],
        "display_name": stored.get("display_name", user["sub"]),
    }


def register_auth_routes(app):
    """Register auth routes with the app."""
    app.include_router(router)
