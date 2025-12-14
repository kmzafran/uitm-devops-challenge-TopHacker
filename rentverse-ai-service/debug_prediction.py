#!/usr/bin/env python3
"""
Debug script to test the prediction flow locally
"""

import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logging

# Set up debug logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_prediction_flow():
    """Test the prediction flow step by step"""

    print("🧪 Testing Prediction Flow Step by Step")
    print("=" * 50)

    try:
        # Step 1: Test schema validation
        print("\n1. Testing Schema Validation...")
        from rentverse.models.schemas import PropertyPredictionRequest

        property_data = {
            "property_type": "Condominium",
            "bedrooms": 3,
            "bathrooms": 2,
            "area": 1200,
            "furnished": "Yes",
            "location": "penang"
        }

        # Create Pydantic model
        pydantic_model = PropertyPredictionRequest(**property_data)
        print(f"✅ Pydantic model created: {pydantic_model}")

        # Convert to dict
        model_dict = pydantic_model.model_dump()
        print(f"✅ Model dict: {model_dict}")
        print(f"✅ Dict keys: {list(model_dict.keys())}")

        # Step 2: Test validation function
        print("\n2. Testing Validation Function...")
        from rentverse.utils.preprocessor import validate_property_data

        validated_data = validate_property_data(model_dict)
        print(f"✅ Validation passed: {validated_data}")

        # Step 3: Test ML model loading
        print("\n3. Testing ML Model Loading...")
        from rentverse.models.ml_models import get_model

        model = get_model()
        print(f"✅ Model loaded: {model.model_name}")
        print(f"✅ Model features: {model.feature_names}")

        # Step 4: Test prediction
        print("\n4. Testing Prediction...")
        result = model.predict_single(model_dict)
        print(f"✅ Prediction result: {result}")

        print(f"\n🎉 All tests passed!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_prediction_flow()
