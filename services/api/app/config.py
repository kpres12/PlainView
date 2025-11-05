import os
from pydantic_settings import BaseSettings


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
    
    # CORS
    cors_origins: list = ["*"]  # Configure in production
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
