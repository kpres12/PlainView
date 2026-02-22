import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables."""
    
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
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
    
    # CORS - restrict in production
    @property
    def cors_origins(self) -> list[str]:
        origins_str = os.getenv("CORS_ORIGINS", "")
        if origins_str:
            return [origin.strip() for origin in origins_str.split(",")]
        # Default: allow localhost in dev, require explicit config in prod
        if self.environment == "production":
            return []  # Must be explicitly set
        return ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
    # API Key Authentication
    api_key_enabled: bool = os.getenv("API_KEY_ENABLED", "false").lower() == "true"
    
    @property
    def api_keys(self) -> list[str]:
        """Parse comma-separated API keys from environment."""
        keys_str = os.getenv("API_KEYS", "")
        if not keys_str:
            return []
        return [key.strip() for key in keys_str.split(",") if key.strip()]
    
    # Authentication mode: "none" | "api_key" | "jwt"
    auth_mode: str = os.getenv("AUTH_MODE", "none")

    # JWT settings
    jwt_secret: str = os.getenv("JWT_SECRET", "plainview-dev-secret-change-me")
    jwt_expiry_minutes: int = int(os.getenv("JWT_EXPIRY_MINUTES", "30"))

    # Simulation
    simulation_mode: bool = os.getenv("SIMULATION_MODE", "true").lower() == "true"

    # Metrics
    metrics_enabled: bool = os.getenv("METRICS_ENABLED", "true").lower() == "true"

    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    json_logging: bool = os.getenv("JSON_LOGGING", "false").lower() == "true"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
