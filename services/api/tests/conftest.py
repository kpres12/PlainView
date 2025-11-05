import asyncio
import os
import sys
from pathlib import Path
import pytest
import httpx
from asgi_lifespan import LifespanManager

# Ensure 'app' package is importable when running from repo root
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

# Use SQLite DB for tests to avoid external dependency
os.environ.setdefault("POSTGRES_URL", "sqlite+aiosqlite:///./test_plainview.db")

from app.main import app


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session")
async def lifespan():
    async with LifespanManager(app):
        yield


@pytest.fixture()
async def client(lifespan):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test", timeout=10.0) as ac:
        yield ac