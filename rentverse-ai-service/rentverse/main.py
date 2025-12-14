"""
Main FastAPI application for RentVerse AI Service.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.routes import health, prediction, classification
from .api.middleware import RequestLoggingMiddleware, ErrorHandlingMiddleware
from .models.ml_models import get_model
from .core.exceptions import ModelNotFoundError
from .config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Changed from INFO to DEBUG
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    # Startup
    logger.info("Starting RentVerse AI Service...")

    try:
        # Initialize the model on startup
        model = get_model()
        logger.info(f"Model loaded successfully: {model.model_version}")

    except ModelNotFoundError as e:
        logger.error(f"Failed to load model on startup: {e}")
        # Continue anyway - model loading will be retried on first request

    except Exception as e:
        logger.error(f"Unexpected error during startup: {e}")

    logger.info("RentVerse AI Service started successfully")

    yield
    
    # Shutdown
    logger.info("Shutting down RentVerse AI Service...")


# Create FastAPI application
app = FastAPI(
    title="RentVerse AI Service",
    description="AI-powered rent price prediction service for real estate properties",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add custom middleware
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(ErrorHandlingMiddleware)

# Include routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(prediction.router, prefix="/api/v1")
app.include_router(classification.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "service": "RentVerse AI Service",
        "version": "1.0.0",
        "description": "AI-powered rent price prediction service",
        "docs": "/docs",
        "health": "/api/v1/health",
        "predict": "/api/v1/predict",
        "classify": "/api/v1/classify",
        "endpoints": {
            "price_prediction": "/api/v1/classify/price",
            "listing_approval": "/api/v1/classify/approval",
            "single_prediction": "/api/v1/predict/single",
            "batch_prediction": "/api/v1/predict/batch"
        }
    }


@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle OPTIONS requests for CORS preflight."""
    return {"message": "OK"}


@app.exception_handler(ModelNotFoundError)
async def model_not_found_handler(request, exc):
    """Handle model not found errors."""
    logger.error(f"Model not found: {exc.message}")
    return JSONResponse(
        status_code=503,
        content={
            "error": "Model not available",
            "detail": exc.message,
            "code": 503,
            "status": "error"
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": "An unexpected error occurred",
            "code": 500,
            "status": "error"
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "rentverse.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
