# New RentVerse AI Service Routes

This document describes the two new routes added to the RentVerse AI Service for price prediction and listing approval classification.

## New Routes Overview

### 1. Price Prediction Route
**Endpoint**: `POST /api/v1/classify/price`

A simplified price prediction endpoint that provides basic price estimates with confidence ranges.

**Request Body**:
```json
{
  "property_type": "Condominium",
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 1200,
  "furnished": "Yes",
  "location": "KLCC, Kuala Lumpur"
}
```

**Response**:
```json
{
  "predicted_price": 4200.0,
  "price_range": {
    "min": 3800.0,
    "max": 4600.0
  },
  "currency": "RM",
  "status": "success"
}
```

### 2. Listing Approval Classification Route
**Endpoint**: `POST /api/v1/classify/approval`

Classifies whether a property listing should be approved based on market analysis and property factors.

**Request Body**:
```json
{
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
```

**Response**:
```json
{
  "approval_status": "approved",
  "confidence_score": 0.87,
  "predicted_price": 4200.0,
  "asking_price": 4500.0,
  "price_deviation": 7.1,
  "approval_reasons": [
    "Price within acceptable range",
    "Good location",
    "Adequate facilities"
  ],
  "recommendations": [
    "Consider slightly reducing price for faster rental"
  ],
  "status": "success"
}
```

## Classification Logic

### Approval Status Values:
- `approved`: Listing meets market standards and is recommended for approval
- `rejected`: Listing has significant issues (usually overpriced) and should be rejected
- `needs_review`: Listing requires manual review for final decision

### Classification Factors:

1. **Price Analysis**:
   - Within ±15% of predicted price: Acceptable
   - >15% above predicted: Overpriced
   - >30% above predicted: Rejected
   - <15% below predicted: Underpriced (competitive)

2. **Property Quality**:
   - Minimum requirements: 1+ bedrooms, 1+ bathrooms, 300+ sq ft
   - Adequate specifications boost approval chances

3. **Location Assessment**:
   - Premium areas (KLCC, Mont Kiara, Bangsar, etc.) receive positive scoring
   - Location quality affects approval recommendations

4. **Facilities & Amenities**:
   - 2+ facilities listed: Positive factor
   - No facilities: Recommendation to highlight amenities

## Existing Functionality Preservation

The new routes **do not modify** any existing functionality:

- **Existing Routes Unchanged**:
  - `POST /api/v1/predict/single` - Original detailed prediction endpoint
  - `POST /api/v1/predict/batch` - Batch prediction endpoint
  - `GET /api/v1/health/` - Health check endpoint
  - `GET /api/v1/predict/model-info` - Model information endpoint

- **New Routes Added**:
  - `POST /api/v1/classify/price` - Simplified price prediction
  - `POST /api/v1/classify/approval` - Listing approval classification

## Testing

Use the provided `test_new_routes.py` script to test the new endpoints:

```bash
python test_new_routes.py
```

## API Documentation

Access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

The new endpoints are categorized under the "Classification" tag in the API documentation.
