"""
Global Error Handlers

Provides consistent error responses and prevents internal details from leaking.
"""

import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("plainview.errors")


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors with consistent format.
    """
    request_id = getattr(request.state, "request_id", "unknown")
    
    logger.warning(
        f"Validation error on {request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "errors": exc.errors(),
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "detail": exc.errors(),
            "request_id": request_id,
        },
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handle HTTP exceptions with consistent format.
    """
    request_id = getattr(request.state, "request_id", "unknown")
    
    if exc.status_code >= 500:
        logger.error(
            f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}",
            extra={"request_id": request_id}
        )
    else:
        logger.info(
            f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}",
            extra={"request_id": request_id}
        )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "request_id": request_id,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception):
    """
    Handle all unhandled exceptions.
    Prevents internal details from leaking to clients.
    """
    request_id = getattr(request.state, "request_id", "unknown")
    
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}",
        extra={"request_id": request_id},
        exc_info=True
    )
    
    # Don't expose internal error details in production
    from app.config import settings
    if settings.environment == "production":
        error_detail = "An internal error occurred. Please contact support."
    else:
        error_detail = f"{type(exc).__name__}: {str(exc)}"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": error_detail,
            "request_id": request_id,
        },
    )


def setup_error_handlers(app):
    """
    Register all error handlers with the FastAPI app.
    """
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
    
    return app
