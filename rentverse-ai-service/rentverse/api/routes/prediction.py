"""
Prediction endpoints for RentVerse AI Service.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, BackgroundTasks

from ...core.exceptions import ModelNotFoundError, PredictionError, ValidationError
from ...models.ml_models import get_model
from ...models.schemas import (
    PropertyPredictionRequest,
    BatchPredictionRequest,
    PredictionResponse,
    BatchPredictionResponse
)

router = APIRouter(prefix="/predict", tags=["Prediction"])
logger = logging.getLogger(__name__)


@router.post("/single", response_model=PredictionResponse, summary="Single property prediction")
async def predict_single_property(request: PropertyPredictionRequest):
    """
    Predict rent price for a single property.

    Args:
        request: Property details for prediction

    Returns:
        PredictionResponse: Predicted rent price with confidence metrics

    Raises:
        HTTPException: If prediction fails or model is not available
    """
    logger.info(f"Received single prediction request for {request.property_type} property")

    try:
        model = get_model()

        # Convert Pydantic model to dictionary for the ML model
        property_data = request.model_dump()
        result = model.predict_single(property_data)

        logger.info(f"Prediction successful: RM {result['predicted_price']:,.0f}")
        return result

    except ModelNotFoundError as e:
        logger.error(f"Model not found: {e}")
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Model not available",
                "detail": str(e),
                "code": 503,
                "timestamp": datetime.now().isoformat()
            }
        )

    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid input data",
                "detail": str(e),
                "code": 400,
                "timestamp": datetime.now().isoformat()
            }
        )

    except PredictionError as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Prediction failed",
                "detail": str(e),
                "code": 500,
                "timestamp": datetime.now().isoformat()
            }
        )

    except Exception as e:
        logger.error(f"Unexpected error in prediction: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "detail": "An unexpected error occurred during prediction",
                "code": 500,
                "timestamp": datetime.now().isoformat()
            }
        )


@router.post("/batch", response_model=BatchPredictionResponse, summary="Batch property prediction")
async def predict_batch_properties(
    request: BatchPredictionRequest,
    background_tasks: BackgroundTasks
):
    """
    Predict rent prices for multiple properties in a single request.

    Args:
        request: List of properties for batch prediction
        background_tasks: FastAPI background tasks for logging

    Returns:
        BatchPredictionResponse: Batch prediction results with summary statistics

    Raises:
        HTTPException: If batch prediction fails or model is not available
    """
    logger.info(f"Received batch prediction request for {len(request.properties)} properties")

    try:
        model = get_model()

        # Validate batch size
        if len(request.properties) > 100:
            raise ValidationError("Batch size cannot exceed 100 properties")

        # Convert Pydantic models to dictionaries for the ML model
        properties_data = [property_obj.model_dump() for property_obj in request.properties]

        # Process batch predictions
        results = model.predict_batch(properties_data)

        # Calculate summary statistics
        successful_predictions = [r for r in results if r.get("status") == "success"]
        failed_predictions = [r for r in results if r.get("status") == "error"]

        success_count = len(successful_predictions)
        error_count = len(failed_predictions)

        # Add timestamp to each result
        for result in results:
            result["timestamp"] = datetime.now().isoformat()

        response = BatchPredictionResponse(
            predictions=results,
            total_count=len(request.properties),
            success_count=success_count,
            error_count=error_count,
            timestamp=datetime.now()
        )

        # Log batch processing summary
        background_tasks.add_task(
            log_batch_summary,
            total=len(request.properties),
            successful=success_count,
            failed=error_count
        )

        logger.info(f"Batch prediction completed: {success_count} successful, {error_count} failed")
        return response

    except ModelNotFoundError as e:
        logger.error(f"Model not found for batch prediction: {e}")
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Model not available",
                "detail": str(e),
                "code": 503,
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except ValidationError as e:
        logger.error(f"Batch validation error: {e}")
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid batch request",
                "detail": str(e),
                "code": 400,
                "timestamp": datetime.now().isoformat()
            }
        )

    except Exception as e:
        logger.error(f"Unexpected error in batch prediction: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Batch prediction failed",
                "detail": "An unexpected error occurred during batch prediction",
                "code": 500,
                "timestamp": datetime.now().isoformat()
            }
        )


@router.get("/model-info", summary="Get model information")
async def get_model_info():
    """
    Get information about the current prediction model.

    Returns:
        dict: Model metadata including version, features, and capabilities
    """
    try:
        model = get_model()
        info = model.get_model_info()

        logger.info("Model info requested")
        return info

    except ModelNotFoundError as e:
        logger.error(f"Model not found for info request: {e}")
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Model not available",
                "detail": str(e),
                "code": 503,
                "timestamp": datetime.now().isoformat()
            }
        )

    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to get model information",
                "detail": str(e),
                "code": 500,
                "timestamp": datetime.now().isoformat()
            }
        )


def log_batch_summary(total: int, successful: int, failed: int):
    """Background task to log batch processing summary."""
    logger.info(
        f"Batch processing summary - Total: {total}, "
        f"Successful: {successful}, Failed: {failed}, "
        f"Success rate: {(successful/total)*100:.1f}%"
    )
