# System User Management & People Registry - Postman Test Guide

## Overview
This guide provides step-by-step instructions to test the new System User Management and People Registry features using Postman.

## Prerequisites
- Application running on `http://localhost:8080`
- Fresh database (or cleared users table)
- Postman collection imported or requests created manually

## Test Flow

### 1. Bootstrap: Create First Admin User (Bootstrap Mode)

**Request: POST /api/v1/users**
```json
{
  "username": "admin_001",
  "password": "AdminPass123",
  "email": "admin@diocese.local",
  "roles": ["ROLE_ADMIN"],
  "person": {
    "fullName": "Bishop Admin",
    "email": "bishop.admin@diocese.local",
    "phoneNumber": "+256701234567",
    "gender": "MALE",
    "dateOfBirth": "1980-05-15"
  }
}
```

**Expected Response: 201 Created**
- User created with embedded Person
- Roles assigned: ROLE_ADMIN
- Person linked to User

### 2. Login as Admin

**Request: POST /api/v1/auth/login**
```json
{
  "username": "admin_001",
  "password": "AdminPass123"
}
```

**Expected Response: 200 OK**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "username": "admin_001",
  "roles": ["ROLE_ADMIN"]
}
```

**Save the accessToken for subsequent requests**

### 3. Get Current Admin User (/me endpoint)

**Request: GET /api/v1/users/me**
- Headers: `Authorization: Bearer {accessToken}`

**Expected Response: 200 OK**
```json
{
  "id": 1,
  "username": "admin_001",
  "email": "admin@diocese.local",
  "status": "ACTIVE",
  "roles": ["ROLE_ADMIN"],
  "person": {
    "id": 1,
    "fullName": "Bishop Admin",
    "email": "bishop.admin@diocese.local",
    "phoneNumber": "+256701234567",
    "gender": "MALE",
    "dateOfBirth": "1980-05-15",
    "age": 45,
    "status": "ACTIVE"
  }
}
```

### 4. Create People Records (as Admin)

**Request: POST /api/v1/people**
```json
{
  "fullName": "Dr. Grace Mukono",
  "email": "grace.mukono@diocese.local",
  "phoneNumber": "+256702345678",
  "gender": "FEMALE",
  "dateOfBirth": "1975-08-22"
}
```

**Expected Response: 201 Created**
```json
{
  "id": 2,
  "fullName": "Dr. Grace Mukono",
  "email": "grace.mukono@diocese.local",
  "phoneNumber": "+256702345678",
  "gender": "FEMALE",
  "dateOfBirth": "1975-08-22",
  "age": 50,
  "status": "ACTIVE"
}
```

**Save the person ID (2) for linking to users**

### 5. Create Another Person

**Request: POST /api/v1/people**
```json
{
  "fullName": "Canon John Ssemakula",
  "email": "john.ssemakula@diocese.local",
  "phoneNumber": "+256703456789",
  "gender": "MALE",
  "dateOfBirth": "1978-03-10"
}
```

**Expected Response: 201 Created** with ID 3

### 6. Search People by Name

**Request: GET /api/v1/people?q=Grace&page=0&size=10&sort=fullName,asc**

**Expected Response: 200 OK**
```json
{
  "content": [
    {
      "id": 2,
      "fullName": "Dr. Grace Mukono",
      "email": "grace.mukono@diocese.local",
      "phoneNumber": "+256702345678",
      "gender": "FEMALE",
      "dateOfBirth": "1975-08-22",
      "age": 50,
      "status": "ACTIVE"
    }
  ],
  "pageable": {...},
  "totalElements": 1,
  "totalPages": 1
}
```

### 7. Get Specific Person

**Request: GET /api/v1/people/2**

**Expected Response: 200 OK**
- Returns the person record with ID 2

### 8. Create DS User with Existing Person (personId)

**Request: POST /api/v1/users**
```json
{
  "username": "ds_001",
  "password": "DsPass123",
  "email": "ds@diocese.local",
  "roles": ["ROLE_DS"],
  "personId": 2
}
```

**Expected Response: 201 Created**
- User created and linked to Person ID 2 (Dr. Grace Mukono)
- Roles: ROLE_DS

### 9. Create Polling Officer User with Embedded Person

**Request: POST /api/v1/users**
```json
{
  "username": "po_001",
  "password": "PoPass123",
  "email": "po@diocese.local",
  "roles": ["ROLE_POLLING_OFFICER"],
  "person": {
    "fullName": "Sister Mary Kaggwa",
    "email": "mary.kaggwa@diocese.local",
    "phoneNumber": "+256704567890",
    "gender": "FEMALE",
    "dateOfBirth": "1982-11-07"
  }
}
```

**Expected Response: 201 Created**
- User created with auto-created Person
- New Person with derived age included in response

### 10. Login as DS User

**Request: POST /api/v1/auth/login**
```json
{
  "username": "ds_001",
  "password": "DsPass123"
}
```

**Expected Response: 200 OK**
- Returns token for ds_001
- Save this token

### 11. Get DS User Profile (/me)

**Request: GET /api/v1/users/me**
- Headers: `Authorization: Bearer {ds_token}`

**Expected Response: 200 OK**
```json
{
  "id": 4,
  "username": "ds_001",
  "email": "ds@diocese.local",
  "status": "ACTIVE",
  "roles": ["ROLE_DS"],
  "person": {
    "id": 2,
    "fullName": "Dr. Grace Mukono",
    "email": "grace.mukono@diocese.local",
    ...
  }
}
```

### 12. DS Cannot Create Users (Require Admin)

**Request: POST /api/v1/users**
- Headers: `Authorization: Bearer {ds_token}`
```json
{
  "username": "voter_001",
  "password": "VoterPass123",
  "roles": ["ROLE_VOTER"]
}
```

**Expected Response: 403 Forbidden**
- Only ROLE_ADMIN can create users after bootstrap

### 13. Admin Creates Multiple Users for Different Roles

**Create Bishop User:**
```json
{
  "username": "bishop_001",
  "password": "BishopPass123",
  "email": "bishop@diocese.local",
  "roles": ["ROLE_BISHOP"],
  "personId": 3
}
```

**Create Senior Staff User:**
```json
{
  "username": "senior_001",
  "password": "SeniorPass123",
  "roles": ["ROLE_SENIOR_STAFF"],
  "person": {
    "fullName": "Rev. Samuel Kabuye"
  }
}
```

### 14. Update User (Admin Only)

**Request: PUT /api/v1/users/4**
- Headers: `Authorization: Bearer {admin_token}`
```json
{
  "email": "ds_updated@diocese.local",
  "status": "ACTIVE",
  "roles": ["ROLE_DS", "ROLE_SENIOR_STAFF"]
}
```

**Expected Response: 200 OK**
- User updated with new email and additional role

### 15. Update Person (Admin/DS)

**Request: PUT /api/v1/people/2**
- Headers: `Authorization: Bearer {admin_token}`
```json
{
  "fullName": "Dr. Grace Mukono (Updated)",
  "status": "ACTIVE"
}
```

**Expected Response: 200 OK**
- Person record updated

### 16. Error Cases

#### Case A: Duplicate Email in Person
**Request: POST /api/v1/people**
```json
{
  "fullName": "Another User",
  "email": "grace.mukono@diocese.local"
}
```
**Expected Response: 400 Bad Request**
- Message: "Email already in use"

#### Case B: Duplicate Phone in Person
**Request: POST /api/v1/people**
```json
{
  "fullName": "Another User",
  "phoneNumber": "+256702345678"
}
```
**Expected Response: 400 Bad Request**
- Message: "Phone number already in use"

#### Case C: Both personId and embedded person
**Request: POST /api/v1/users**
```json
{
  "username": "user_test",
  "password": "TestPass123",
  "roles": ["ROLE_DS"],
  "personId": 2,
  "person": {
    "fullName": "Test User"
  }
}
```
**Expected Response: 400 Bad Request**
- Message: "Cannot provide both personId and embedded person"

#### Case D: DS Cannot Access User Endpoints
**Request: GET /api/v1/users/4**
- Headers: `Authorization: Bearer {ds_token}`
**Expected Response: 403 Forbidden**

#### Case E: DS Can Create People
**Request: POST /api/v1/people**
- Headers: `Authorization: Bearer {ds_token}`
```json
{
  "fullName": "Test Person by DS",
  "email": "test.ds@diocese.local"
}
```
**Expected Response: 201 Created**

## Summary of Features Tested

✅ **Bootstrap User Creation** (first user without authentication)
✅ **JWT Authentication** (login and token management)
✅ **User Profile Endpoint** (GET /api/v1/users/me)
✅ **Person Creation** (with embedded data)
✅ **Person Linking** (via personId or embedded person)
✅ **Role-Based Access Control** (ADMIN vs DS permissions)
✅ **Pagination & Search** (People search by name)
✅ **Validation** (email/phone uniqueness, required fields)
✅ **Age Computation** (automatic from dateOfBirth)
✅ **Status Management** (ACTIVE/INACTIVE/DISABLED)
✅ **Audit Tracking** (createdAt/updatedAt on entities)

## Running the Application

```bash
cd /Users/Simon/Dev/ThisIsMe/mukono-diocese-voting-system/backend
mvn spring-boot:run
```

Application will be available at `http://localhost:8080`
API Docs: `http://localhost:8080/swagger-ui.html`
