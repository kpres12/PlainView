"""
HTTP metrics middleware — records request count and latency for Prometheus.
"""

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import Request, Response

from app.metrics import http_requests_total, http_request_duration_seconds


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware that instruments every request for Prometheus."""

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        method = request.method
        # Normalise path to avoid high-cardinality labels
        path = self._normalise_path(request.url.path)

        start = time.perf_counter()
        try:
            response: Response = await call_next(request)
            status = str(response.status_code)
        except Exception:
            status = "500"
            raise
        finally:
            duration = time.perf_counter() - start
            http_requests_total.labels(method=method, path=path, status=status).inc()
            http_request_duration_seconds.labels(method=method, path=path).observe(duration)

        return response

    @staticmethod
    def _normalise_path(path: str) -> str:
        """
        Collapse path parameters to placeholders to keep cardinality manageable.
        /valves/v-101/actuate  →  /valves/{id}/actuate
        /incidents/abc123      →  /incidents/{id}
        """
        parts = path.strip("/").split("/")
        normalised = []
        for i, part in enumerate(parts):
            # Heuristic: if part looks like an ID (contains digits or hyphens after prefix)
            if i > 0 and (any(c.isdigit() for c in part) or len(part) > 20):
                normalised.append("{id}")
            else:
                normalised.append(part)
        return "/" + "/".join(normalised) if normalised else "/"
