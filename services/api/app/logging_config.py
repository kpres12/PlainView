"""
Structured Logging Configuration

Provides JSON logging for production with request tracing.
"""

import logging
import sys
import json
import time
import uuid
from typing import Any, Dict
from datetime import datetime

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


class StructuredFormatter(logging.Formatter):
    """
    JSON formatter for structured logging.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add request ID if available
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        # Add extra fields
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP requests with timing and request IDs.
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = logging.getLogger("plainview.requests")
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Log request
        start_time = time.time()
        
        # Add request ID to logging context
        extra = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None,
        }
        
        self.logger.info(
            f"{request.method} {request.url.path}",
            extra=extra
        )
        
        # Process request
        try:
            response: Response = await call_next(request)
            
            # Log response
            duration_ms = (time.time() - start_time) * 1000
            extra.update({
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
            })
            
            self.logger.info(
                f"{request.method} {request.url.path} - {response.status_code} ({duration_ms:.2f}ms)",
                extra=extra
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000
            extra.update({
                "status_code": 500,
                "duration_ms": round(duration_ms, 2),
                "error": str(exc),
            })
            
            self.logger.error(
                f"{request.method} {request.url.path} - ERROR: {exc}",
                extra=extra,
                exc_info=True
            )
            raise


def setup_logging(json_logging: bool = False, log_level: str = "INFO"):
    """
    Configure logging for the application.
    
    Args:
        json_logging: If True, use JSON format. Otherwise use standard format.
        log_level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    # Remove existing handlers
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    
    if json_logging:
        handler.setFormatter(StructuredFormatter())
    else:
        # Standard format for development
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Set level for specific loggers
    logging.getLogger("plainview").setLevel(getattr(logging, log_level.upper()))
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
