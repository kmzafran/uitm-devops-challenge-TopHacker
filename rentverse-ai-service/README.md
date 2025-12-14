# RentVerse AI Service

A production-ready FastAPI service for property rental price prediction and listing approval classification using machine learning. This service provides comprehensive REST API endpoints for predicting property rental prices in Malaysia and automatically classifying whether property listings should be approved based on market analysis and property features.

## 🏗️ Project Structure

```
rentverse-ai-service/
├── rentverse/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry point
│   ├── cli.py                     # CLI commands for dev/prod
│   ├── config.py                  # Configuration management
│   ├── models/                    # ML models and schemas
│   │   ├── __init__.py
│   │   ├── ml_models.py          # Model loading/inference logic
│   │   ├── schemas.py            # Pydantic request/response models
│   │   ├── enhanced_deployment_pipeline.pkl    # Enhanced ML model
│   │   ├── standard_deployment_pipeline.pkl    # Standard ML model
│   │   ├── enhanced_price_prediction_pipeline.pkl
│   │   └── improved_price_prediction_pipeline.pkl
│   ├── api/                       # API endpoints and middleware
│   │   ├── __init__.py
│   │   ├── middleware.py         # Custom middleware
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py         # Health check endpoints
│   │       ├── prediction.py     # Original prediction endpoints
│   │       └── classification.py # New classification endpoints
│   ├── core/                      # Core business logic
│   │   ├── __init__.py
│   │   ├── exceptions.py         # Custom exceptions
│   │   └── logging.py            # Logging configuration
│   └── utils/                     # Utility functions
│       ├── __init__.py
│       ├── helpers.py            # General utilities
│       └── preprocessor.py       # Data preprocessing utilities
├── notebooks/                     # Jupyter notebooks for model development
│   ├── Rentverse_rentprice_prediction.ipynb
│   ├── compiled.csv              # Training data
│   └── *.csv                     # Model evaluation results
├── tests/                         # Test files
├── debug_prediction.py           # Debug script for testing
├── test_batch_prediction.py      # API testing script
├── test_new_routes.py            # Test script for new routes
├── test_cors.py                  # CORS functionality test
├── pyproject.toml                # Poetry dependencies
├── Dockerfile                    # Docker configuration
├── docker-compose.yml           # Docker Compose setup
├── CORS_CONFIGURATION.md        # CORS setup documentation
├── NEW_ROUTES_DOCUMENTATION.md  # New routes documentation
├── .env.example                  # Environment variables template
└── README.md
```

## 🚀 Features

- **FastAPI Framework**: High-performance, async web framework with automatic API documentation
- **Advanced ML Pipeline**: Enhanced Extra Trees model with log transformation (R² = 0.84+)
- **Price Prediction**: Accurate rental price prediction for Malaysian properties
- **Listing Approval Classification**: Automated approval/rejection classification based on market analysis
- **Data Preprocessing**: Robust preprocessing with outlier removal and feature engineering
- **Batch Processing**: Support for single and batch predictions (up to 100 properties)
- **Malaysian Property Focus**: Optimized for Malaysian rental market with location parsing
- **Health Checks**: Comprehensive health and readiness endpoints with model validation
- **Input Validation**: Strict Pydantic schemas with property type and range validation
- **Error Handling**: Structured error handling with detailed debugging information
- **Logging**: Comprehensive logging for monitoring and debugging
- **Docker Support**: Complete containerization with Docker and Docker Compose
- **CORS Support**: Full CORS configuration for deployment and web application integration
- **Utility Module**: Reusable preprocessor utilities for data validation and cleaning

## 📋 API Endpoints

### Health & Monitoring
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/ready` - Readiness check with model validation
- `GET /api/v1/health/live` - Liveness check

### Original Prediction Endpoints
- `POST /api/v1/predict/single` - Single property price prediction (detailed response)
- `POST /api/v1/predict/batch` - Batch property price predictions
- `GET /api/v1/predict/model-info` - Model information and metadata

### New Classification Endpoints
- `POST /api/v1/classify/price` - Simplified price prediction with basic response
- `POST /api/v1/classify/approval` - Listing approval classification with market analysis

### Documentation
- `GET /docs` - Swagger UI documentation
- `GET /redoc` - ReDoc documentation
- `GET /` - API information and available endpoints

### CORS Support
- All endpoints support CORS with `Access-Control-Allow-Origin: *`
- Preflight OPTIONS requests are handled automatically
- Full cross-origin support for web applications

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.12+
- Poetry (for dependency management)
- Docker (optional, for containerization)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rentverse-ai-service
   ```

2. **Install dependencies using Poetry**
   ```bash
   poetry install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Run development server**
   ```bash
   # Using Poetry (recommended)
   poetry run uvicorn rentverse.main:app --reload --host 0.0.0.0 --port 8000
   
   # Alternative using Python module
   poetry run python -m rentverse.main
   ```

The API will be available at `http://localhost:8000`

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📝 API Usage Examples

### Simple Price Prediction (New Route)

```bash
curl -X POST "http://localhost:8000/api/v1/classify/price" \
  -H "Content-Type: application/json" \
  -d '{
    "property_type": "Condominium",
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 1200,
    "furnished": "Yes",
    "location": "KLCC, Kuala Lumpur"
  }'
```

**Response:**
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

### Listing Approval Classification (New Route)

```bash
curl -X POST "http://localhost:8000/api/v1/classify/approval" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Response:**
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

### Detailed Single Property Prediction (Original Route)

```bash
curl -X POST "http://localhost:8000/api/v1/predict/single" \
  -H "Content-Type: application/json" \
  -d '{
    "property_type": "Condominium",
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 1200,
    "furnished": "Yes",
    "location": "KLCC, Kuala Lumpur"
  }'
```

**Response:**
```json
{
  "predicted_price": 2500.0,
  "confidence_score": 0.89,
  "price_range": {
    "min": 2200.0,
    "max": 2800.0
  },
  "currency": "RM",
  "status": "success",
  "model_version": "Extra Trees",
  "features_used": ["property_type", "bedrooms", "bathrooms", "area", "furnished", "region"],
  "timestamp": "2025-09-20T10:30:00"
}
```

### Batch Property Prediction

```bash
curl -X POST "http://localhost:8000/api/v1/predict/batch" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Response:**
```json
{
  "predictions": [
    {
      "batch_index": 0,
      "predicted_price": 2500.0,
      "confidence_score": 0.89,
      "price_range": {"min": 2200.0, "max": 2800.0},
      "currency": "RM",
      "status": "success",
      "model_version": "Extra Trees",
      "timestamp": "2025-09-20T10:30:00"
    },
    {
      "batch_index": 1,
      "predicted_price": 1800.0,
      "confidence_score": 0.85,
      "price_range": {"min": 1620.0, "max": 1980.0},
      "currency": "RM",
      "status": "success",
      "model_version": "Extra Trees",
      "timestamp": "2025-09-20T10:30:00"
    }
  ],
  "total_count": 2,
  "success_count": 2,
  "error_count": 0,
  "timestamp": "2025-09-20T10:30:00"
}
```

### Model Information

```bash
curl -X GET "http://localhost:8000/api/v1/predict/model-info"
```

**Response:**
```json
{
  "model_version": "Extra Trees",
  "created_at": "2025-09-20T10:30:00",
  "feature_columns": ["property_type", "bedrooms", "bathrooms", "area", "furnished", "region"],
  "supported_property_types": ["Apartment", "Condominium", "Service Residence", "Townhouse"],
  "supported_furnished_types": ["Yes", "No", "Partial", "Fully Furnished", "Partially Furnished", "Unfurnished"],
  "is_loaded": true,
  "max_batch_size": 100,
  "use_log_transform": true,
  "performance_metrics": {
    "test_r2": 0.8408,
    "test_rmse": 425.67,
    "test_mae": 301.23
  }
}
```

## 🏠 Property Data Formats

### Simple Price Prediction Request
For the simplified price prediction endpoint (`/api/v1/classify/price`):

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `property_type` | string | Yes | Type of property | "Condominium", "Apartment", "Townhouse", "Service Residence" |
| `bedrooms` | integer | Yes | Number of bedrooms | 3 |
| `bathrooms` | integer | Yes | Number of bathrooms | 2 |
| `area` | number | Yes | Area in square feet | 1200.0 |
| `furnished` | string | Yes | Furnishing status | "Yes", "No", "Partial", "Fully Furnished", "Partially Furnished", "Unfurnished" |
| `location` | string | Yes | Property location | "KLCC, Kuala Lumpur", "Petaling Jaya, Selangor" |

### Listing Approval Classification Request
For the listing approval endpoint (`/api/v1/classify/approval`):

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `property_type` | string | Yes | Type of property | "Condominium" |
| `bedrooms` | integer | Yes | Number of bedrooms | 3 |
| `bathrooms` | integer | Yes | Number of bathrooms | 2 |
| `area` | number | Yes | Area in square feet | 1200.0 |
| `furnished` | string | Yes | Furnishing status | "Yes" |
| `location` | string | Yes | Property location | "KLCC, Kuala Lumpur" |
| `asking_price` | number | Yes | Asking price in RM | 4500.0 |
| `property_age` | integer | No | Property age in years | 5 |
| `parking_spaces` | integer | No | Number of parking spaces | 2 |
| `floor_level` | integer | No | Floor level | 15 |
| `facilities` | array | No | List of facilities/amenities | ["Swimming Pool", "Gym", "Security"] |

### Detailed Prediction Request
For the original detailed prediction endpoint (`/api/v1/predict/single`):

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `property_type` | string | Yes | Type of property | "Condominium", "Apartment", "Townhouse", "Service Residence" |
| `bedrooms` | integer | Yes | Number of bedrooms | 3 |
| `bathrooms` | integer | Yes | Number of bathrooms | 2 |
| `area` | number | Yes | Area in square feet | 1200.0 |
| `furnished` | string | Yes | Furnishing status | "Yes", "No", "Partial", "Fully Furnished", "Partially Furnished", "Unfurnished" |
| `location` | string | Yes | Property location | "KLCC, Kuala Lumpur", "Petaling Jaya, Selangor" |

### Validation Rules
- **bedrooms**: 0-10 bedrooms
- **bathrooms**: 1-10 bathrooms  
- **area**: 1-10,000 square feet
- **asking_price**: Must be positive (for approval classification)
- **property_age**: 0-100 years (optional)
- **parking_spaces**: 0-10 spaces (optional)
- **floor_level**: 1-100 floors (optional)
- **location**: Non-empty string (location parsing extracts region automatically)

## 🧠 Model Information

### Current Model
- **Algorithm**: Extra Trees Regressor with 200 estimators
- **Preprocessing**: Robust preprocessing with outlier removal and log transformation
- **Performance**: R² = 0.84+ (explains 84%+ of price variance)
- **Features**: 6 engineered features including location region parsing
- **Training Data**: Malaysian rental property data with aggressive outlier filtering

### Model Features
1. **property_type**: Encoded property type
2. **bedrooms**: Number of bedrooms
3. **bathrooms**: Number of bathrooms  
4. **area**: Property area in square feet
5. **furnished**: Encoded furnishing status
6. **region**: Extracted region from location string

### Approval Classification Logic
The listing approval classification considers multiple factors:

#### Price Analysis
- **Within ±15%** of predicted price: Acceptable
- **>15% above** predicted: Overpriced (may require review)
- **>30% above** predicted: Rejected
- **<15% below** predicted: Underpriced (competitive)

#### Property Quality Factors
- Minimum requirements: 1+ bedrooms, 1+ bathrooms, 300+ sq ft
- Adequate specifications boost approval chances
- Premium locations (KLCC, Mont Kiara, Bangsar, etc.) receive positive scoring
- Facilities and amenities (2+ recommended) improve approval likelihood

#### Approval Status Values
- **approved**: Listing meets market standards and is recommended for approval
- **rejected**: Listing has significant issues (usually overpriced by >30%)
- **needs_review**: Listing requires manual review for final decision

### Price Range
- **Minimum**: RM 500/month
- **Maximum**: RM 50,000/month
- **Typical Range**: RM 800 - RM 8,000/month
- **Currency**: Malaysian Ringgit (RM)

## ⚙️ Configuration

Configuration is managed through environment variables. Key settings:

```bash
# Application
APP_NAME="RentVerse AI Service"
DEBUG=false
LOG_LEVEL=INFO

# Server
HOST=0.0.0.0
PORT=8000

# Model
MODEL_DIR=rentverse/models
MAX_BATCH_SIZE=100

# API
API_PREFIX=/api/v1

# CORS Configuration (for deployment)
CORS_ORIGINS=["*"]  # Allow all origins
CORS_CREDENTIALS=false  # Must be false when origins=["*"]
CORS_METHODS=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"]
CORS_HEADERS=["*"]
```

Copy `.env.example` to `.env` and customize as needed.

### CORS Configuration Notes
The service is pre-configured with full CORS support for deployment:
- **Allow Origins**: `*` (all domains)
- **Allow Methods**: All HTTP methods
- **Allow Headers**: All headers
- **Preflight Handling**: Automatic OPTIONS request handling
- **Production Ready**: No CORS-related deployment issues

For more details, see `CORS_CONFIGURATION.md`.

## 🐳 Docker Support

### Quick Start
```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Manual Docker
```bash
# Build image
docker build -t rentverse-ai .

# Run container
docker run -p 8000:8000 rentverse-ai

# Run with environment file
docker run -p 8000:8000 --env-file .env rentverse-ai
```

## 🧪 Testing

### Test Scripts
```bash
# Test original prediction endpoints
python test_batch_prediction.py

# Test new classification routes
python test_new_routes.py

# Test CORS functionality
python test_cors.py

# Debug prediction pipeline locally
python debug_prediction.py
```

### Health Checks
```bash
# Basic health check
curl http://localhost:8000/api/v1/health

# Model readiness check  
curl http://localhost:8000/api/v1/health/ready

# Detailed model information
curl http://localhost:8000/api/v1/predict/model-info
```

### Running Tests with Poetry
```bash
# Install dependencies and run tests
poetry install
poetry run python test_new_routes.py
poetry run python test_cors.py
```

## 🔧 Development

### Adding New Features
1. **Model Updates**: Update notebooks and retrain models
2. **API Changes**: Modify schemas in `rentverse/models/schemas.py`
3. **New Routes**: Add endpoints in `rentverse/api/routes/`
4. **Preprocessing**: Update utilities in `rentverse/utils/preprocessor.py`

### Route Structure
- **Health Routes**: `rentverse/api/routes/health.py`
- **Original Prediction Routes**: `rentverse/api/routes/prediction.py` 
- **New Classification Routes**: `rentverse/api/routes/classification.py`

### Preprocessing Utilities
The service includes a comprehensive preprocessor utility:

```python
from rentverse.utils import ImprovedDataPreprocessor, validate_property_data

# Create preprocessor
preprocessor = ImprovedDataPreprocessor(
    remove_outliers=True,
    price_percentile=90,
    area_percentile=95,
    verbose=False
)

# Validate input data
validated_data = validate_property_data(property_dict)
```

### Adding New Classification Logic
To extend the approval classification system:

1. **Update ML Models**: Modify `classify_listing_approval()` in `ml_models.py`
2. **Update Schemas**: Add new fields to `ListingApprovalRequest` in `schemas.py`
3. **Update Routes**: Enhance endpoints in `classification.py`
4. **Update Tests**: Add test cases in `test_new_routes.py`

## 📊 Model Performance

- **Algorithm**: Extra Trees Regressor (Enhanced Pipeline)
- **R² Score**: 0.8408 (84.08% variance explained)
- **RMSE**: ~426 RM
- **MAE**: ~301 RM
- **Features**: 6 engineered features
- **Data**: Cleaned Malaysian rental property dataset
- **Preprocessing**: Aggressive outlier removal, log transformation

## 🚨 Error Handling

The API provides detailed error responses for all endpoints:

```json
{
  "error": "Validation failed",
  "detail": "Invalid bedrooms count: 15", 
  "code": 400,
  "status": "error",
  "timestamp": "2025-09-20T10:30:00"
}
```

### Common Error Codes
- **400**: Invalid input data or validation failure
- **422**: Pydantic validation error (missing required fields)
- **500**: Internal server error or prediction failure
- **503**: Model not available or loading failure

### CORS Error Resolution
If you encounter CORS errors:
1. **Check Browser Console**: Look for specific CORS error messages
2. **Verify Origin**: Ensure your frontend domain is allowed
3. **Test with curl**: Verify the API works outside the browser
4. **Check Preflight**: OPTIONS requests should return 200 status
5. **Review Headers**: Ensure proper `Access-Control-*` headers are present

For detailed CORS troubleshooting, see `CORS_CONFIGURATION.md`.

## 📈 Monitoring

### Logs
The service provides structured logging for monitoring:
- Request/response logging with CORS headers
- Model prediction logging with approval classification
- Error tracking with stack traces
- Performance metrics and processing times

### Metrics
Available through model info endpoint and health checks:
- Prediction success/failure rates
- Model performance metrics (R², RMSE, MAE)
- Feature importance scores
- Processing times per endpoint
- Approval classification accuracy

### New Route Monitoring
The classification endpoints provide additional metrics:
- **Price Prediction Route**: Simple prediction success rates
- **Approval Classification**: Approval/rejection/review ratios
- **CORS Requests**: Cross-origin request success rates

## 📚 Additional Documentation

- **`NEW_ROUTES_DOCUMENTATION.md`**: Detailed documentation for the new classification endpoints
- **`CORS_CONFIGURATION.md`**: Complete CORS setup and troubleshooting guide
- **`/docs`**: Interactive Swagger UI documentation
- **`/redoc`**: Alternative ReDoc documentation

## 🚀 Quick Start Guide

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd rentverse-ai-service
   poetry install
   ```

2. **Start the Server**:
   ```bash
   poetry run uvicorn rentverse.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Test the API**:
   ```bash
   # Test basic health
   curl http://localhost:8000/api/v1/health
   
   # Test price prediction
   curl -X POST http://localhost:8000/api/v1/classify/price \
     -H "Content-Type: application/json" \
     -d '{"property_type":"Condominium","bedrooms":3,"bathrooms":2,"area":1200,"furnished":"Yes","location":"KLCC, Kuala Lumpur"}'
   ```

4. **View Documentation**:
   - Open `http://localhost:8000/docs` for interactive API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Make changes and add tests
4. Update documentation (including this README if needed)
5. Test your changes with `poetry run python test_new_routes.py`
6. Submit a pull request

### Development Workflow
- Use Poetry for dependency management
- Follow FastAPI best practices
- Add tests for new endpoints
- Update API documentation
- Ensure CORS compatibility

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For issues, questions, or feature requests:
- **Create an issue** in the repository with detailed information
- **Check the API documentation** at `/docs` for endpoint details
- **Review the test scripts** (`test_new_routes.py`, `test_cors.py`) for examples
- **Consult additional documentation** in `NEW_ROUTES_DOCUMENTATION.md` and `CORS_CONFIGURATION.md`

### Common Questions
- **CORS Issues**: See `CORS_CONFIGURATION.md` for complete troubleshooting
- **New Routes**: Check `NEW_ROUTES_DOCUMENTATION.md` for detailed examples
- **Model Information**: Use `/api/v1/predict/model-info` for current model details
- **Health Status**: Use `/api/v1/health/ready` to verify model readiness
