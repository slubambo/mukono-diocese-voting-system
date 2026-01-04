#!/bin/bash

# Test script for POST /people/with-assignment endpoint
# Make sure the server is running on localhost:8080

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing POST /people/with-assignment endpoint${NC}\n"

# Replace with your actual JWT token
TOKEN="YOUR_JWT_TOKEN_HERE"
BASE_URL="http://localhost:8080/api/v1/people/with-assignment"

# Test 1: Create person with diocesan assignment (minimal)
echo -e "${YELLOW}Test 1: Minimal request (Diocese scope)${NC}"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullName": "Test Person Minimal",
    "fellowshipPositionId": 1,
    "termStartDate": "2024-01-01",
    "dioceseId": 1
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 2: Create person with full details (Diocese scope)
echo -e "${YELLOW}Test 2: Full request (Diocese scope)${NC}"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullName": "Jane Smith",
    "email": "jane.smith.test@example.com",
    "phoneNumber": "+256700111222",
    "gender": "FEMALE",
    "dateOfBirth": "1985-03-15",
    "fellowshipPositionId": 1,
    "termStartDate": "2024-01-01",
    "termEndDate": "2028-01-01",
    "dioceseId": 1,
    "notes": "Elected by diocesan council"
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 3: Create person with archdeaconry assignment
echo -e "${YELLOW}Test 3: Archdeaconry scope${NC}"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullName": "John Archdeacon",
    "email": "john.arch@example.com",
    "fellowshipPositionId": 5,
    "termStartDate": "2024-06-01",
    "archdeaconryId": 1
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 4: Create person with church assignment
echo -e "${YELLOW}Test 4: Church scope${NC}"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullName": "Peter Church Leader",
    "email": "peter.church@example.com",
    "phoneNumber": "+256700333444",
    "fellowshipPositionId": 10,
    "termStartDate": "2025-01-01",
    "churchId": 1
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 5: Validation error - missing fullName
echo -e "${YELLOW}Test 5: Validation error (missing fullName)${NC}"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fellowshipPositionId": 1,
    "termStartDate": "2024-01-01",
    "dioceseId": 1
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 6: Validation error - missing termStartDate
echo -e "${YELLOW}Test 6: Validation error (missing termStartDate)${NC}"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullName": "Test Person",
    "fellowshipPositionId": 1,
    "dioceseId": 1
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 7: Business rule error - invalid date range
echo -e "${YELLOW}Test 7: Business rule error (termEndDate before termStartDate)${NC}"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullName": "Test Person Invalid Dates",
    "fellowshipPositionId": 1,
    "termStartDate": "2024-01-01",
    "termEndDate": "2023-01-01",
    "dioceseId": 1
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo -e "${GREEN}Testing complete!${NC}"
echo -e "${YELLOW}Note: Replace YOUR_JWT_TOKEN_HERE with an actual token${NC}"
echo -e "${YELLOW}Note: Adjust fellowshipPositionId, dioceseId, etc. to match your database${NC}"
