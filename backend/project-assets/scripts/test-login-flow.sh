#!/bin/bash

# Login Flow Test Script
# Tests the authentication endpoint and protected resources

BASE_URL="http://localhost:8080"

echo "=========================================="
echo "Authentication Flow Test"
echo "=========================================="
echo ""

# Test 1: Successful Login
echo "Test 1: Login with valid credentials (admin/admin123)"
echo "---"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Status: $HTTP_STATUS"
echo "Response:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

if [ "$HTTP_STATUS" -eq 200 ]; then
    TOKEN=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
    echo ""
    echo "✅ Login successful!"
    echo "Token (first 50 chars): ${TOKEN:0:50}..."
else
    echo ""
    echo "❌ Login failed!"
fi

echo ""
echo ""

# Test 2: Access Protected Endpoint
if [ ! -z "$TOKEN" ]; then
    echo "Test 2: Access protected endpoint with token"
    echo "---"
    PROTECTED_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/v1/test/secure" \
      -H "Authorization: Bearer $TOKEN")
    
    PROTECTED_STATUS=$(echo "$PROTECTED_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    PROTECTED_BODY=$(echo "$PROTECTED_RESPONSE" | sed '$d')
    
    echo "Status: $PROTECTED_STATUS"
    echo "Response: $PROTECTED_BODY"
    
    if [ "$PROTECTED_STATUS" -eq 200 ]; then
        echo "✅ Protected endpoint accessed successfully!"
    else
        echo "❌ Failed to access protected endpoint!"
    fi
    echo ""
    echo ""
fi

# Test 3: Access Protected Endpoint Without Token
echo "Test 3: Access protected endpoint WITHOUT token"
echo "---"
NO_TOKEN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/v1/test/secure")

NO_TOKEN_STATUS=$(echo "$NO_TOKEN_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
NO_TOKEN_BODY=$(echo "$NO_TOKEN_RESPONSE" | sed '$d')

echo "Status: $NO_TOKEN_STATUS"
echo "Response:"
echo "$NO_TOKEN_BODY" | python3 -m json.tool 2>/dev/null || echo "$NO_TOKEN_BODY"

if [ "$NO_TOKEN_STATUS" -eq 401 ]; then
    echo "✅ Correctly returned 401 Unauthorized!"
else
    echo "❌ Expected 401 but got $NO_TOKEN_STATUS!"
fi

echo ""
echo ""

# Test 4: Invalid Credentials
echo "Test 4: Login with invalid credentials"
echo "---"
INVALID_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "wrongpassword"
  }')

INVALID_STATUS=$(echo "$INVALID_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
INVALID_BODY=$(echo "$INVALID_RESPONSE" | sed '$d')

echo "Status: $INVALID_STATUS"
echo "Response:"
echo "$INVALID_BODY" | python3 -m json.tool 2>/dev/null || echo "$INVALID_BODY"

if [ "$INVALID_STATUS" -eq 401 ]; then
    echo "✅ Correctly returned 401 Unauthorized for bad credentials!"
else
    echo "❌ Expected 401 but got $INVALID_STATUS!"
fi

echo ""
echo ""

# Test 5: Validation Error
echo "Test 5: Login with missing fields"
echo "---"
VALIDATION_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "",
    "password": ""
  }')

VALIDATION_STATUS=$(echo "$VALIDATION_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
VALIDATION_BODY=$(echo "$VALIDATION_RESPONSE" | sed '$d')

echo "Status: $VALIDATION_STATUS"
echo "Response:"
echo "$VALIDATION_BODY" | python3 -m json.tool 2>/dev/null || echo "$VALIDATION_BODY"

if [ "$VALIDATION_STATUS" -eq 400 ]; then
    echo "✅ Correctly returned 400 Bad Request for validation error!"
else
    echo "❌ Expected 400 but got $VALIDATION_STATUS!"
fi

echo ""
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Expected Results:"
echo "  Test 1 (Valid login): 200 ✓"
echo "  Test 2 (With token): 200 ✓"
echo "  Test 3 (No token): 401 ✓"
echo "  Test 4 (Bad credentials): 401 ✓"
echo "  Test 5 (Validation): 400 ✓"
echo ""
echo "Make sure to:"
echo "  1. Run the application: mvn spring-boot:run"
echo "  2. Create test users: mysql -u root -p < test-users-setup.sql"
echo "  3. Verify database connection in application-dev.properties"
echo ""
echo "=========================================="
