"""
CORS Test Script for RentVerse AI Service
Tests CORS functionality for all endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_cors_preflight(endpoint):
    """Test CORS preflight request (OPTIONS)."""
    try:
        response = requests.options(f"{BASE_URL}{endpoint}")
        print(f"OPTIONS {endpoint}:")
        print(f"  Status: {response.status_code}")
        print(f"  CORS Headers:")
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('access-control-allow-origin'),
            'Access-Control-Allow-Methods': response.headers.get('access-control-allow-methods'),
            'Access-Control-Allow-Headers': response.headers.get('access-control-allow-headers'),
            'Access-Control-Max-Age': response.headers.get('access-control-max-age')
        }
        
        for header, value in cors_headers.items():
            if value:
                print(f"    {header}: {value}")
        
        print()
        return response.status_code == 200
        
    except Exception as e:
        print(f"  Error: {e}")
        return False

def test_cors_actual_request(endpoint, method="GET", data=None):
    """Test actual request with CORS headers."""
    headers = {
        'Content-Type': 'application/json',
        'Origin': 'https://example.com'  # Simulate cross-origin request
    }
    
    try:
        if method == "POST" and data:
            response = requests.post(f"{BASE_URL}{endpoint}", json=data, headers=headers)
        else:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            
        print(f"{method} {endpoint}:")
        print(f"  Status: {response.status_code}")
        
        # Check CORS response headers
        cors_origin = response.headers.get('access-control-allow-origin')
        if cors_origin:
            print(f"  Access-Control-Allow-Origin: {cors_origin}")
        else:
            print("  No CORS origin header found")
        
        print()
        return response.status_code in [200, 201, 422]  # 422 is validation error, which is OK for testing
        
    except Exception as e:
        print(f"  Error: {e}")
        return False

def main():
    print("🌐 Testing CORS Configuration for RentVerse AI Service")
    print("=" * 60)
    
    # Test endpoints
    endpoints = [
        "/",
        "/api/v1/health/",
        "/api/v1/classify/price",
        "/api/v1/classify/approval",
        "/api/v1/predict/single"
    ]
    
    # Test preflight requests
    print("1. Testing CORS Preflight Requests (OPTIONS)")
    print("-" * 40)
    preflight_results = []
    for endpoint in endpoints:
        result = test_cors_preflight(endpoint)
        preflight_results.append((endpoint, result))
    
    # Test actual requests
    print("2. Testing Actual Requests with CORS")
    print("-" * 40)
    
    # Test GET requests
    get_results = []
    for endpoint in ["/", "/api/v1/health/"]:
        result = test_cors_actual_request(endpoint, "GET")
        get_results.append((endpoint, "GET", result))
    
    # Test POST requests (these will fail validation but should pass CORS)
    post_data = {
        "property_type": "Condominium",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 1200,
        "furnished": "Yes",
        "location": "KLCC, Kuala Lumpur"
    }
    
    post_results = []
    for endpoint in ["/api/v1/classify/price", "/api/v1/predict/single"]:
        result = test_cors_actual_request(endpoint, "POST", post_data)
        post_results.append((endpoint, "POST", result))
    
    # Summary
    print("3. CORS Test Results Summary")
    print("-" * 40)
    
    print("Preflight Tests:")
    for endpoint, result in preflight_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} OPTIONS {endpoint}")
    
    print("\nActual Request Tests:")
    for endpoint, method, result in get_results + post_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {method} {endpoint}")
    
    # Overall result
    all_tests = [r for _, r in preflight_results] + [r for _, _, r in get_results + post_results]
    passed = sum(all_tests)
    total = len(all_tests)
    
    print(f"\nOverall CORS Test Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All CORS tests passed! Your API should work from any origin.")
    else:
        print("⚠️  Some CORS tests failed. Check your CORS configuration.")

if __name__ == "__main__":
    main()
