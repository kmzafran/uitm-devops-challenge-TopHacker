"""
Classification and additional prediction endpoints for RentVerse AI Service.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Response

from ...core.exceptions import ModelNotFoundError, PredictionError, ValidationError
from ...models.ml_models import get_model
from ...models.schemas import (
    PricePredictionRequest,
    PricePredictionResponse,
    ListingApprovalRequest,
    ListingApprovalResponse
)

router = APIRouter(prefix="/classify", tags=["Classification"])
logger = logging.getLogger(__name__)


@router.post("/price", response_model=PricePredictionResponse, summary="Simple price prediction")
async def predict_price(request: PricePredictionRequest, response: Response):
    """
    Predict rent price for a property with simplified response.

    Args:
        request: Property details for prediction

    Returns:
        PricePredictionResponse: Predicted rent price with basic information

    Raises:
        HTTPException: If prediction fails or model is not available
    """
    # Set CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    logger.info(f"Received price prediction request for {request.property_type} property")

    try:
        model = get_model()

        # Convert Pydantic model to dictionary for the ML model
        property_data = request.model_dump()
        predicted_price = model.predict(property_data)

        # Calculate price range (±10%)
        price_range = {
            "min": round(predicted_price * 0.9, 2),
            "max": round(predicted_price * 1.1, 2)
        }

        result = PricePredictionResponse(
            predicted_price=round(predicted_price, 2),
            price_range=price_range,
            currency="RM",
            status="success"
        )

        logger.info(f"Price prediction successful: RM {predicted_price:,.0f}")
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
        logger.error(f"Unexpected error in price prediction: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "detail": "An unexpected error occurred during prediction",
                "code": 500,
                "timestamp": datetime.now().isoformat()
            }
        )


@router.post("/approval", response_model=ListingApprovalResponse, summary="Listing approval classification")
async def classify_listing_approval(request: ListingApprovalRequest, response: Response):
    """
    Classify if a listing should be approved based on price prediction and property factors.

    This endpoint analyzes the property details and asking price to determine if the listing
    should be approved, rejected, or needs manual review. It considers factors like:
    - Price deviation from predicted market value
    - Property specifications (bedrooms, bathrooms, area)
    - Location quality
    - Available facilities

    Args:
        request: Property details including asking price for classification

    Returns:
        ListingApprovalResponse: Approval classification with reasons and recommendations

    Raises:
        HTTPException: If classification fails or model is not available
    """
    # Set CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    logger.info(f"Received listing approval request for {request.property_type} property at RM {request.asking_price}")

    try:
        model = get_model()

        # Convert Pydantic model to dictionary for the ML model
        property_data = request.model_dump()
        result = model.classify_listing_approval(property_data)

        response = ListingApprovalResponse(**result)

        logger.info(f"Listing approval classification successful: {result['approval_status']} "
                   f"(confidence: {result['confidence_score']:.2f})")
        return response

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
        logger.error(f"Classification error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Classification failed",
                "detail": str(e),
                "code": 500,
                "timestamp": datetime.now().isoformat()
            }
        )

    except Exception as e:
        logger.error(f"Unexpected error in listing approval classification: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "detail": "An unexpected error occurred during classification",
                "code": 500,
                "timestamp": datetime.now().isoformat()
            }
        )


@router.options("/price")
async def price_options(response: Response):
    """Handle OPTIONS request for price prediction endpoint."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    return {"message": "OK"}


@router.options("/approval")
async def approval_options(response: Response):
    """Handle OPTIONS request for approval classification endpoint."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    return {"message": "OK"}
