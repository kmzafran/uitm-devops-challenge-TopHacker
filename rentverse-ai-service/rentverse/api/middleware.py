"""
Middleware for RentVerse AI Service.
"""

import time
import logging
from typing import Callable
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.exceptions import RentVerseException

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging API requests and responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log details."""
        start_time = time.time()
        
        # Log request details
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"from {request.client.host if request.client else 'unknown'}"
        )
        
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log response details
        logger.info(
            f"Response: {response.status_code} "
            f"in {process_time:.3f}s"
        )
        
        # Add processing time to response headers (but don't override CORS headers)
        if "X-Process-Time" not in response.headers:
            response.headers["X-Process-Time"] = str(process_time)
        
        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for handling exceptions and returning proper error responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Handle exceptions and return structured error responses."""
        try:
            response = await call_next(request)
            return response
            
        except RentVerseException as e:
            logger.error(f"RentVerse error: {e.message}")
            return JSONResponse(
                status_code=e.code,
                content={
                    "error": e.message,
                    "code": e.code,
                    "status": "error",
                    "timestamp": time.time()
                }
            )
            
        except HTTPException as e:
            logger.error(f"HTTP error: {e.detail}")
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": str(e.detail),
                    "code": e.status_code,
                    "status": "error",
                    "timestamp": time.time()
                }
            )
            
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "detail": "An unexpected error occurred",
                    "code": 500,
                    "status": "error",
                    "timestamp": time.time()
                }
            )
