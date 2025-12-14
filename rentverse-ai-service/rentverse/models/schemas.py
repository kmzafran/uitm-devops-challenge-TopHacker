"""
Pydantic schemas for request/response validation.
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from enum import Enum


class PropertyType(str, Enum):
    """Supported property types."""
    APARTMENT = "Apartment"
    CONDOMINIUM = "Condominium"
    SERVICE_RESIDENCE = "Service Residence"
    TOWNHOUSE = "Townhouse"


class FurnishedType(str, Enum):
    """Furnished status options that match the model training data."""
    YES = "Yes"
    NO = "No"
    PARTIAL = "Partial"
    FULLY_FURNISHED = "Fully Furnished"
    PARTIALLY_FURNISHED = "Partially Furnished"
    UNFURNISHED = "Unfurnished"


class PropertyPredictionRequest(BaseModel):
    """Schema for single property prediction request - matches model expectations."""

    property_type: PropertyType = Field(..., description="Type of property")
    bedrooms: int = Field(..., ge=0, le=10, description="Number of bedrooms")
    bathrooms: int = Field(..., ge=1, le=10, description="Number of bathrooms")
    area: float = Field(..., gt=0, le=10000, description="Area in square feet")
    furnished: FurnishedType = Field(..., description="Furnished status")
    location: str = Field(..., min_length=1, max_length=200, description="Property location")

    @field_validator('area')
    @classmethod
    def validate_area(cls, v):
        if v <= 0:
            raise ValueError('Area must be positive')
        return v

    @field_validator('location')
    @classmethod
    def validate_location(cls, v):
        if not v.strip():
            raise ValueError('Location cannot be empty')
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "property_type": "Condominium",
                "bedrooms": 3,
                "bathrooms": 2,
                "area": 1200,
                "furnished": "Yes",
                "location": "KLCC, Kuala Lumpur"
            }
        }


class BatchPredictionRequest(BaseModel):
    """Schema for batch prediction request."""

    properties: List[PropertyPredictionRequest] = Field(..., min_length=1, max_length=100,
                                                        description="List of properties to predict")

    class Config:
        json_schema_extra = {
            "example": {
                "properties": [
                    {
                        "property_type": "Condominium",
                        "bedrooms": 3,
                        "bathrooms": 2,
                        "area": 1200,
                        "furnished": "Yes",
                        "location": "KLCC, Kuala Lumpur"
                    },
                    {
                        "property_type": "Apartment",
                        "bedrooms": 2,
                        "bathrooms": 1,
                        "area": 800,
                        "furnished": "No",
                        "location": "Petaling Jaya, Selangor"
                    }
                ]
            }
        }


class PredictionResponse(BaseModel):
    """Schema for prediction response."""

    predicted_price: float = Field(..., description="Predicted price in RM")
    confidence_score: float = Field(..., ge=0, le=1, description="Confidence score of prediction")
    price_range: dict = Field(..., description="Price range (min, max)")
    model_version: str = Field(..., description="Version of the model used")
    features_used: List[str] = Field(..., description="List of features used in prediction")
    currency: str = Field(default="RM", description="Currency")
    status: str = Field(default="success", description="Prediction status")

    class Config:
        json_schema_extra = {
            "example": {
                "predicted_price": 450000.0,
                "confidence_score": 0.85,
                "price_range": {"min": 400000.0, "max": 500000.0},
                "model_version": "1.0.0",
                "features_used": ["property_type", "bedrooms", "bathrooms", "square_feet"],
                "currency": "RM",
                "status": "success"
            }
        }


class BatchPredictionResponse(BaseModel):
    """Schema for batch prediction response."""

    predictions: List[Dict[str, Any]] = Field(..., description="List of prediction results")
    total_count: int = Field(..., description="Total number of predictions")
    success_count: int = Field(..., description="Number of successful predictions")
    error_count: int = Field(..., description="Number of failed predictions")
    timestamp: datetime = Field(..., description="Batch processing timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "predictions": [
                    {
                        "batch_index": 0,
                        "predicted_price": 450000.0,
                        "currency": "RM",
                        "status": "success",
                        "model_version": "1.0.0",
                        "timestamp": "2025-09-13T10:30:00"
                    }
                ],
                "total_count": 1,
                "success_count": 1,
                "error_count": 0,
                "timestamp": "2025-09-13T10:30:00"
            }
        }


class ModelInfoResponse(BaseModel):
    """Schema for model information response."""

    model_version: str = Field(..., description="Model version")
    created_at: str = Field(..., description="Model creation date")
    feature_columns: List[str] = Field(..., description="List of feature columns")
    supported_property_types: List[str] = Field(..., description="Supported property types")
    supported_furnished_types: List[str] = Field(..., description="Supported furnished types")
    is_loaded: bool = Field(..., description="Whether model is loaded")
    max_batch_size: int = Field(..., description="Maximum batch size allowed")

    class Config:
        json_schema_extra = {
            "example": {
                "model_version": "1.0.0",
                "created_at": "2025-09-13T10:00:00",
                "feature_columns": ["property_type", "bedrooms", "bathrooms"],
                "supported_property_types": ["Apartment", "Condominium"],
                "supported_furnished_types": ["Fully Furnished", "Unfurnished"],
                "is_loaded": True,
                "max_batch_size": 100
            }
        }


class HealthResponse(BaseModel):
    """Schema for health check response."""

    status: str = Field(..., description="Health status")
    message: str = Field(..., description="Health message")
    timestamp: datetime = Field(..., description="Health check timestamp")
    test_prediction: Optional[float] = Field(None, description="Test prediction result")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "message": "Model is working correctly",
                "timestamp": "2025-09-13T10:30:00",
                "test_prediction": 450000.0
            }
        }


class ListingApprovalRequest(BaseModel):
    """Schema for listing approval classification request."""

    property_type: PropertyType = Field(..., description="Type of property")
    bedrooms: int = Field(..., ge=0, le=10, description="Number of bedrooms")
    bathrooms: int = Field(..., ge=1, le=10, description="Number of bathrooms")
    area: float = Field(..., gt=0, le=10000, description="Area in square feet")
    furnished: FurnishedType = Field(..., description="Furnished status")
    location: str = Field(..., min_length=1, max_length=200, description="Property location")
    asking_price: float = Field(..., gt=0, description="Asking price in RM")
    property_age: Optional[int] = Field(None, ge=0, le=100, description="Property age in years")
    parking_spaces: Optional[int] = Field(None, ge=0, le=10, description="Number of parking spaces")
    floor_level: Optional[int] = Field(None, ge=1, le=100, description="Floor level")
    facilities: Optional[List[str]] = Field(None, description="List of facilities/amenities")

    @field_validator('area')
    @classmethod
    def validate_area(cls, v):
        if v <= 0:
            raise ValueError('Area must be positive')
        return v

    @field_validator('location')
    @classmethod
    def validate_location(cls, v):
        if not v.strip():
            raise ValueError('Location cannot be empty')
        return v.strip()

    @field_validator('asking_price')
    @classmethod
    def validate_asking_price(cls, v):
        if v <= 0:
            raise ValueError('Asking price must be positive')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "property_type": "Condominium",
                "bedrooms": 3,
                "bathrooms": 2,
                "area": 1200,
                "furnished": "Yes",
                "location": "KLCC, Kuala Lumpur",
                "asking_price": 4500.0,
                "property_age": 5,
                "parking_spaces": 2,
                "floor_level": 15,
                "facilities": ["Swimming Pool", "Gym", "Security"]
            }
        }


class ListingApprovalResponse(BaseModel):
    """Schema for listing approval classification response."""

    approval_status: str = Field(..., description="Approval status: approved, rejected, needs_review")
    confidence_score: float = Field(..., ge=0, le=1, description="Confidence score of classification")
    predicted_price: float = Field(..., description="Model predicted price in RM")
    asking_price: float = Field(..., description="Asking price in RM")
    price_deviation: float = Field(..., description="Percentage deviation from predicted price")
    approval_reasons: List[str] = Field(..., description="Reasons for approval/rejection")
    recommendations: Optional[List[str]] = Field(None, description="Recommendations for improvement")
    status: str = Field(default="success", description="Classification status")

    class Config:
        json_schema_extra = {
            "example": {
                "approval_status": "approved",
                "confidence_score": 0.87,
                "predicted_price": 4200.0,
                "asking_price": 4500.0,
                "price_deviation": 7.1,
                "approval_reasons": ["Price within acceptable range", "Good location", "Adequate facilities"],
                "recommendations": ["Consider slightly reducing price for faster rental"],
                "status": "success"
            }
        }


class PricePredictionRequest(BaseModel):
    """Schema for simplified price prediction request."""

    property_type: PropertyType = Field(..., description="Type of property")
    bedrooms: int = Field(..., ge=0, le=10, description="Number of bedrooms")
    bathrooms: int = Field(..., ge=1, le=10, description="Number of bathrooms")
    area: float = Field(..., gt=0, le=10000, description="Area in square feet")
    furnished: FurnishedType = Field(..., description="Furnished status")
    location: str = Field(..., min_length=1, max_length=200, description="Property location")

    @field_validator('area')
    @classmethod
    def validate_area(cls, v):
        if v <= 0:
            raise ValueError('Area must be positive')
        return v

    @field_validator('location')
    @classmethod
    def validate_location(cls, v):
        if not v.strip():
            raise ValueError('Location cannot be empty')
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "property_type": "Condominium",
                "bedrooms": 3,
                "bathrooms": 2,
                "area": 1200,
                "furnished": "Yes",
                "location": "KLCC, Kuala Lumpur"
            }
        }


class PricePredictionResponse(BaseModel):
    """Schema for simplified price prediction response."""

    predicted_price: float = Field(..., description="Predicted price in RM")
    price_range: dict = Field(..., description="Price range (min, max)")
    currency: str = Field(default="RM", description="Currency")
    status: str = Field(default="success", description="Prediction status")

    class Config:
        json_schema_extra = {
            "example": {
                "predicted_price": 4200.0,
                "price_range": {"min": 3800.0, "max": 4600.0},
                "currency": "RM",
                "status": "success"
            }
        }


class ErrorResponse(BaseModel):
    """Schema for error responses."""

    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    code: int = Field(..., description="Error code")
    status: str = Field(default="error", description="Status")
    timestamp: datetime = Field(..., description="Error timestamp")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "Invalid property type",
                "detail": "The property type 'InvalidType' is not supported",
                "code": 400,
                "status": "error",
                "timestamp": "2025-09-13T10:30:00",
                "details": {"field": "property_type", "value": "InvalidType"}
            }
        }
