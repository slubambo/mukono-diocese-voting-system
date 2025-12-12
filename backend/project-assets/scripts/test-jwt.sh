#!/bin/bash

# JWT Authentication Testing Script
# This script tests the JWT authentication implementation

BASE_URL="http://localhost:8080"

echo "==========================================="
echo "JWT Authentication Testing Script"
echo "==========================================="
echo ""

# Test 1: Access protected endpoint without token (should return 401)
echo "Test 1: Access protected endpoint WITHOUT authentication"
echo "Command: curl -X GET $BASE_URL/api/v1/test/secure"
echo ""
echo "Expected: 401 Unauthorized JSON response"
echo "---"
curl -s -X GET "$BASE_URL/api/v1/test/secure" -w "\nHTTP Status: %{http_code}\n"
echo ""
echo ""

# Test 2: Access public auth endpoint (should return 200)
echo "Test 2: Access public endpoint at /api/v1/auth/..."
echo "Command: curl -X GET $BASE_URL/api/v1/auth/test"
echo ""
echo "Expected: 200 OK (if endpoint exists)"
echo "---"
curl -s -X GET "$BASE_URL/api/v1/auth/test" -w "\nHTTP Status: %{http_code}\n" 2>/dev/null || echo "Endpoint not yet implemented"
echo ""
echo ""

# Test 3: Access Swagger UI (public endpoint)
echo "Test 3: Access Swagger UI (public endpoint)"
echo "Command: curl -X GET $BASE_URL/swagger-ui.html"
echo ""
echo "Expected: 200 OK (HTML response)"
echo "---"
curl -s -I "$BASE_URL/swagger-ui.html" | head -5
echo ""
echo ""

# Test 4: Generate a token (once login endpoint is implemented)
echo "Test 4: Generate JWT Token (once /api/v1/auth/login is implemented)"
echo "Command: curl -X POST $BASE_URL/api/v1/auth/login \\"
echo "         -H 'Content-Type: application/json' \\"
echo "         -d '{\"username\":\"testuser\",\"password\":\"testpass\"}'"
echo ""
echo "Expected: 200 OK with JWT token in response"
echo "---"
echo "(Not yet implemented - implement login endpoint first)"
echo ""
echo ""

# Test 5: Access protected endpoint WITH token
echo "Test 5: Access protected endpoint WITH valid JWT token"
echo "Command: curl -X GET $BASE_URL/api/v1/test/secure \\"
echo "         -H 'Authorization: Bearer <token>'"
echo ""
echo "Expected: 200 OK with response 'secure ok'"
echo "---"
echo "(First, obtain a token from login endpoint)"
echo ""
echo ""

echo "==========================================="
echo "Testing Complete"
echo "==========================================="
echo ""
echo "Notes:"
echo "- Application must be running on port 8080"
echo "- Database must be configured and accessible"
echo "- Users must exist in the database to authenticate"
echo ""
