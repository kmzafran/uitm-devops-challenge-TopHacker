"""
Test script for the new RentVerse AI Service routes.
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_price_prediction():
    """Test the simplified price prediction endpoint."""
    url = f"{BASE_URL}/api/v1/classify/price"
    
    payload = {
        "property_type": "Condominium",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 1200,
        "furnished": "Yes",
        "location": "KLCC, Kuala Lumpur"
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Price Prediction Test:")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("-" * 50)
        
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing price prediction: {e}")
        return False

def test_listing_approval():
    """Test the listing approval classification endpoint."""
    url = f"{BASE_URL}/api/v1/classify/approval"
    
    payload = {
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
    
    try:
        response = requests.post(url, json=payload)
        print(f"Listing Approval Test:")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("-" * 50)
        
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing listing approval: {e}")
        return False

def test_health_check():
    """Test the health check endpoint."""
    url = f"{BASE_URL}/api/v1/health/"
    
    try:
        response = requests.get(url)
        print(f"Health Check Test:")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("-" * 50)
        
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing health check: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint to see all available routes."""
    url = f"{BASE_URL}/"
    
    try:
        response = requests.get(url)
        print(f"Root Endpoint Test:")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("-" * 50)
        
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing root endpoint: {e}")
        return False

if __name__ == "__main__":
    print("Testing RentVerse AI Service New Routes")
    print("=" * 50)
    
    # Test all endpoints
    tests = [
        ("Root Endpoint", test_root_endpoint),
        ("Health Check", test_health_check),
        ("Price Prediction", test_price_prediction),
        ("Listing Approval", test_listing_approval)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        success = test_func()
        results.append((test_name, success))
    
    # Summary
    print("\n" + "=" * 50)
    print("Test Results Summary:")
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    print(f"\nOverall: {passed}/{total} tests passed")
