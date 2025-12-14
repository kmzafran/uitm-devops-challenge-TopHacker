#!/usr/bin/env python3
"""
Test script to verify the API works correctly
"""

import requests
import json

def test_batch_prediction():
    """Test the batch prediction endpoint"""

    print("🧪 Testing Batch Prediction API")
    print("=" * 40)

    # API endpoint
    url = "http://localhost:8000/api/v1/predict/batch"

    # Test data
    test_data = {
        "properties": [
            {
                "property_type": "Condominium",
                "bedrooms": 3,
                "bathrooms": 2,
                "area": 1200,
                "furnished": "Yes",
                "location": "penang"
            }
        ]
    }

    try:
        print(f"Making request to: {url}")
        print(f"Request data: {json.dumps(test_data, indent=2)}")

        response = requests.post(url, json=test_data)

        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Data:")
        print(json.dumps(response.json(), indent=2))

        if response.status_code == 200:
            result = response.json()
            if result["success_count"] > 0:
                predicted_price = result["predictions"][0]["predicted_price"]
                print(f"\n✅ Success! Predicted price: RM {predicted_price:,.0f}")
            else:
                print(f"\n❌ Prediction failed: {result['predictions'][0].get('error', 'Unknown error')}")
        else:
            print(f"\n❌ API request failed with status {response.status_code}")

    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to API. Make sure the server is running on localhost:8000")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    test_batch_prediction()
