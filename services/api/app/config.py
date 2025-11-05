import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables."""
    
    postgres_url: str = os.getenv(
        "POSTGRES_URL",
        "postgresql+asyncpg://plainview:plainview_password@localhost:5432/plainview"
    )
    port: int = int(os.getenv("PORT", 4000))
    host: str = "0.0.0.0"
    
    # Optional Redis for caching/streams
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # Summit.OS integration (optional)
    summit_enabled: bool = os.getenv("SUMMIT_ENABLED", "false").lower() == "true"
    summit_mqtt_url: str = os.getenv("SUMMIT_MQTT_URL", "ws://localhost:1883")
    summit_api_key: Optional[str] = os.getenv("SUMMIT_API_KEY")
    summit_org_id: Optional[str] = os.getenv("SUMMIT_ORG_ID")
    
    # CORS
    cors_origins: list = ["*"]  # Configure in production
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
