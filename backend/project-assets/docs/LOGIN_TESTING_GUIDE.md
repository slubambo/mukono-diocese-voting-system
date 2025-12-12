# Login Endpoint Testing Guide

## 🎯 Overview

This guide shows how to test the `/api/v1/auth/login` endpoint and verify JWT authentication works correctly.

---

## 📋 Prerequisites

1. **Application Running**: `mvn spring-boot:run`
2. **Database Setup**: Run `test-users-setup.sql` to create test users
3. **Test Tool**: Postman, curl, or any HTTP client

---

## 🔐 Test Users

After running `test-users-setup.sql`, you'll have:

| Username | Password | Roles |
|----------|----------|-------|
| admin | admin123 | ROLE_ADMIN, ROLE_USER |
| testuser | test123 | ROLE_USER |

---

## 🧪 Test Scenarios

### Test 1: Successful Login

**Request:**
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Expected Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGVzIjoiUk9MRV9BRE1JTixST0xFX1VTRVIiLCJpYXQiOjE3MDI0MjU2MDAsImV4cCI6MTcwMjUxMjAwMH0.xxxxx",
  "tokenType": "Bearer",
  "username": "admin",
  "roles": [
    "ROLE_ADMIN",
    "ROLE_USER"
  ]
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

---

### Test 2: Invalid Credentials

**Request:**
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "wrongpassword"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "timestamp": "2025-12-12T10:00:00.000Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid username or password",
  "path": "/api/v1/auth/login"
}
```

---

### Test 3: Missing Fields (Validation Error)

**Request:**
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "username": "",
  "password": ""
}
```

**Expected Response (400 Bad Request):**
```json
{
  "timestamp": "2025-12-12T10:00:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Username is required, Password is required",
  "path": "/api/v1/auth/login"
}
```

---

### Test 4: Missing Username

**Request:**
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "password": "admin123"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "timestamp": "2025-12-12T10:00:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Username is required",
  "path": "/api/v1/auth/login"
}
```

---

### Test 5: User Not Found

**Request:**
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "username": "nonexistent",
  "password": "password"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "timestamp": "2025-12-12T10:00:00.000Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid username or password",
  "path": "/api/v1/auth/login"
}
```

---

## 🔑 Test Protected Endpoint with JWT

After successful login, copy the `accessToken` from the response and use it to access protected endpoints.

### Step 1: Login and Get Token

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Save the token** from the response.

### Step 2: Access Protected Endpoint

**Request:**
```http
GET http://localhost:8080/api/v1/test/secure
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGVzIjoiUk9MRV9BRE1JTixST0xFX1VTRVIiLCJpYXQiOjE3MDI0MjU2MDAsImV4cCI6MTcwMjUxMjAwMH0.xxxxx
```

**Expected Response (200 OK):**
```
secure ok
```

**cURL Command:**
```bash
# Replace <YOUR_TOKEN> with actual token from login
curl -X GET http://localhost:8080/api/v1/test/secure \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 📱 Postman Testing

### Setup Postman Collection

1. **Create New Collection**: "Mukono Diocese Voting System"

2. **Add Environment Variables**:
   - `base_url`: `http://localhost:8080`
   - `token`: (will be set automatically)

3. **Create Requests**:

#### Request 1: Login
- **Method**: POST
- **URL**: `{{base_url}}/api/v1/auth/login`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "username": "admin",
  "password": "admin123"
}
```
- **Tests** (auto-save token):
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.accessToken);
}
```

#### Request 2: Test Secure Endpoint
- **Method**: GET
- **URL**: `{{base_url}}/api/v1/test/secure`
- **Headers**: 
  - `Authorization: Bearer {{token}}`

---

## 🧪 Complete Test Flow

### Using Bash Script

Save this as `test-login-flow.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8080"

echo "================================"
echo "Testing Login Flow"
echo "================================"
echo ""

# Test 1: Successful Login
echo "Test 1: Login with valid credentials"
echo "---"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

echo "$RESPONSE" | jq '.'
TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
echo ""
echo "Token saved: ${TOKEN:0:50}..."
echo ""

# Test 2: Access Protected Endpoint
echo "Test 2: Access protected endpoint with token"
echo "---"
curl -s -X GET "$BASE_URL/api/v1/test/secure" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# Test 3: Invalid Credentials
echo "Test 3: Login with invalid credentials"
echo "---"
curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "wrongpassword"
  }' | jq '.'
echo ""

# Test 4: Validation Error
echo "Test 4: Login with missing fields"
echo "---"
curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "",
    "password": ""
  }' | jq '.'
echo ""

echo "================================"
echo "All Tests Complete"
echo "================================"
```

Make it executable and run:
```bash
chmod +x test-login-flow.sh
./test-login-flow.sh
```

---

## 🔍 Troubleshooting

### Issue 1: 403 Forbidden Instead of 401

**Cause**: Spring Security default behavior  
**Solution**: Verify `JwtAuthenticationEntryPoint` is configured in `SecurityConfig`

### Issue 2: "No AuthenticationManager bean"

**Cause**: Missing AuthenticationManager bean  
**Solution**: Already added in SecurityConfig - verify it exists

### Issue 3: "Bad credentials" even with correct password

**Cause**: Password not BCrypt encrypted in database  
**Solution**: Use the SQL script provided or generate BCrypt hash properly

### Issue 4: Token validation fails

**Cause**: JWT secret mismatch  
**Solution**: Check `app.jwtSecret` in `application.properties`

### Issue 5: "User not found"

**Cause**: User doesn't exist in database  
**Solution**: Run `test-users-setup.sql` script

---

## 📊 Expected Results Summary

| Test | Status | Response |
|------|--------|----------|
| Valid login | 200 | JWT token + user info |
| Invalid password | 401 | Error JSON |
| Missing fields | 400 | Validation error |
| User not found | 401 | Error JSON |
| Access with valid token | 200 | "secure ok" |
| Access without token | 401 | Unauthorized JSON |

---

## 🎯 Success Criteria

✅ Login with valid credentials returns JWT token  
✅ Login with invalid credentials returns 401  
✅ Missing fields return 400 validation error  
✅ JWT token can access protected endpoints  
✅ Without token, protected endpoints return 401  
✅ Error responses follow consistent JSON format  

---

## 📝 Next Steps

After successful testing:

1. **Create more users** with different roles
2. **Test role-based security** with @PreAuthorize
3. **Implement refresh tokens** (optional)
4. **Add logout endpoint** (optional)
5. **Test with frontend** integration

---

## 🔗 Related Files

- **AuthController**: `/src/main/java/com/mukono/voting/security/AuthController.java`
- **GlobalExceptionHandler**: `/src/main/java/com/mukono/voting/exception/GlobalExceptionHandler.java`
- **Test Script**: `test-users-setup.sql`
- **Config**: `application.properties`

---

## 💡 Tips

1. **Use jq** for pretty JSON in terminal: `curl ... | jq '.'`
2. **Save tokens** in environment variables for easy testing
3. **Check logs** in application console for detailed errors
4. **Verify database** has users and roles properly set up
5. **Test all scenarios** including edge cases

---

Ready to test! Start with the successful login test and verify the token works.
