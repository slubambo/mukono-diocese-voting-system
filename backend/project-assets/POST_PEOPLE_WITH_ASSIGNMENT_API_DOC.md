# POST /people/with-assignment API Documentation

## Overview
Creates a person and assigns them to a leadership position in a single transactional operation.

## Endpoint
```
POST /api/v1/people/with-assignment
```

## Authorization
Requires one of the following roles:
- `ROLE_ADMIN`
- `ROLE_DS`

## Request Body

### Fields

#### Person Fields (required: fullName)
- **fullName** (string, required): The full name of the person
- **email** (string, optional): Email address (must be unique if provided)
- **phoneNumber** (string, optional): Phone number (must be unique if provided)
- **gender** (string, optional): One of: `MALE`, `FEMALE`, `OTHER`
- **dateOfBirth** (date, optional): Date in ISO 8601 format (YYYY-MM-DD)

#### Assignment Fields (required: fellowshipPositionId, termStartDate)
- **fellowshipPositionId** (long, required): The ID of the fellowship position
- **termStartDate** (date, required): Start date of the term (ISO 8601 format)
- **termEndDate** (date, optional): End date of the term (must be after termStartDate)
- **dioceseId** (long, optional): Diocese ID (required if position scope is DIOCESE)
- **archdeaconryId** (long, optional): Archdeaconry ID (required if position scope is ARCHDEACONRY)
- **churchId** (long, optional): Church ID (required if position scope is CHURCH)
- **notes** (string, optional, max 1000 chars): Additional notes

### Scope Rules
Based on the `fellowshipPositionId`'s scope, only one of the organizational IDs should be provided:
- **DIOCESE scope**: Provide `dioceseId` only
- **ARCHDEACONRY scope**: Provide `archdeaconryId` only
- **CHURCH scope**: Provide `churchId` only

### Example Request
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+256700123456",
  "gender": "MALE",
  "dateOfBirth": "1980-05-15",
  "fellowshipPositionId": 1,
  "termStartDate": "2024-01-01",
  "termEndDate": "2028-01-01",
  "dioceseId": 1,
  "notes": "Appointed as diocesan treasurer"
}
```

## Response

### Success Response (201 Created)
Returns an object containing both the created person and the created assignment.

```json
{
  "person": {
    "id": 123,
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+256700123456",
    "gender": "MALE",
    "dateOfBirth": "1980-05-15",
    "age": 45,
    "status": "ACTIVE"
  },
  "assignment": {
    "id": 456,
    "status": "ACTIVE",
    "termStartDate": "2024-01-01",
    "termEndDate": "2028-01-01",
    "notes": "Appointed as diocesan treasurer",
    "person": {
      "id": 123,
      "fullName": "John Doe",
      "email": "john.doe@example.com"
    },
    "fellowshipPosition": {
      "id": 1,
      "title": "Treasurer",
      "scope": "DIOCESE",
      "maxSeats": 1
    },
    "diocese": {
      "id": 1,
      "name": "Mukono Diocese",
      "code": "MKN"
    },
    "archdeaconry": null,
    "church": null,
    "createdAt": "2026-01-04T10:17:48.123Z",
    "updatedAt": "2026-01-04T10:17:48.123Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "timestamp": "2026-01-04T10:17:48.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "fullName",
      "message": "Full name is required"
    }
  ]
}
```

#### 400 Bad Request - Business Rule Violations
```json
{
  "timestamp": "2026-01-04T10:17:48.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Email already in use"
}
```

```json
{
  "timestamp": "2026-01-04T10:17:48.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Term end date must be after term start date"
}
```

```json
{
  "timestamp": "2026-01-04T10:17:48.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Diocese ID is required for position with DIOCESE scope"
}
```

```json
{
  "timestamp": "2026-01-04T10:17:48.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Position has reached maximum seat capacity"
}
```

#### 404 Not Found
```json
{
  "timestamp": "2026-01-04T10:17:48.123Z",
  "status": 404,
  "error": "Not Found",
  "message": "Fellowship position with ID 999 not found"
}
```

#### 403 Forbidden
```json
{
  "timestamp": "2026-01-04T10:17:48.123Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied"
}
```

## Behavior

### Transaction Handling
The operation is fully transactional:
1. Person is created first
2. Leadership assignment is created for that person
3. If either step fails, the entire operation is rolled back

### Validations Applied

#### Person Validations
- Full name is required and cannot be blank
- Email must be unique across all people (if provided)
- Phone number must be unique across all people (if provided)
- Gender must be one of: MALE, FEMALE, OTHER (if provided)

#### Assignment Validations
- Fellowship position must exist
- Term start date is required
- Term end date must be after term start date (if provided)
- Organizational scope must match the position's scope:
  - DIOCESE scope: requires dioceseId
  - ARCHDEACONRY scope: requires archdeaconryId
  - CHURCH scope: requires churchId
- Only one organizational ID should be provided per scope
- No duplicate active assignments (same person + position + target organization)
- Position must have available seats (not exceed maxSeats)

## Use Cases

### 1. Creating a Diocesan Leader
```json
{
  "fullName": "Bishop James Smith",
  "email": "bishop@mukono.diocese.ug",
  "gender": "MALE",
  "fellowshipPositionId": 1,
  "termStartDate": "2024-01-01",
  "termEndDate": "2028-12-31",
  "dioceseId": 1,
  "notes": "Elected at General Assembly 2024"
}
```

### 2. Creating an Archdeaconry Leader
```json
{
  "fullName": "Archdeacon Mary Johnson",
  "email": "archdeacon@example.com",
  "phoneNumber": "+256701234567",
  "gender": "FEMALE",
  "dateOfBirth": "1975-03-20",
  "fellowshipPositionId": 5,
  "termStartDate": "2024-06-01",
  "archdeaconryId": 3
}
```

### 3. Creating a Church Leader
```json
{
  "fullName": "Rev. Peter Mugisha",
  "email": "peter.mugisha@example.com",
  "phoneNumber": "+256702345678",
  "fellowshipPositionId": 10,
  "termStartDate": "2025-01-01",
  "termEndDate": "2029-01-01",
  "churchId": 15,
  "notes": "Appointed by diocesan council"
}
```

## Benefits Over Separate Calls

1. **Atomicity**: Both person creation and assignment happen in one transaction
2. **Efficiency**: Single API call instead of two sequential calls
3. **Error Handling**: If assignment fails, person is not created (avoids orphaned records)
4. **Convenience**: Simplified client code - no need to extract person ID and make a second call
5. **UI Flexibility**: Response includes both person and assignment data for immediate use

## Related Endpoints

- `POST /api/v1/people` - Create person only (without assignment)
- `POST /api/v1/ds/leadership/assignments` - Create assignment for existing person
- `GET /api/v1/people/{id}` - Get person details
- `GET /api/v1/ds/leadership/assignments/{id}` - Get assignment details
