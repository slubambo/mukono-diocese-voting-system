# POST /people/with-assignment Implementation Summary

## Implementation Date
January 4, 2026

## Overview
Successfully implemented the `POST /api/v1/people/with-assignment` endpoint that creates a person and assigns them to a leadership position in a single transactional operation.

## Files Created

### 1. CreatePersonWithAssignmentRequest.java
**Location**: `/src/main/java/com/mukono/voting/payload/request/CreatePersonWithAssignmentRequest.java`

**Purpose**: Request DTO combining person fields and assignment fields

**Fields**:
- Person: fullName (required), email, phoneNumber, gender, dateOfBirth
- Assignment: fellowshipPositionId (required), termStartDate (required), termEndDate, dioceseId, archdeaconryId, churchId, notes

**Validations**:
- `@NotBlank` on fullName
- `@NotNull` on fellowshipPositionId and termStartDate
- `@Size(max=1000)` on notes

### 2. PersonWithAssignmentResponse.java
**Location**: `/src/main/java/com/mukono/voting/payload/response/PersonWithAssignmentResponse.java`

**Purpose**: Response DTO containing both created person and assignment

**Structure**:
```json
{
  "person": PersonResponse,
  "assignment": LeadershipAssignmentResponse
}
```

**Benefit**: UI can use either or both pieces of data immediately

## Files Modified

### 3. PersonService.java
**Location**: `/src/main/java/com/mukono/voting/service/people/PersonService.java`

**Changes**:
- Added dependency injection for `LeadershipAssignmentService`
- Added method `createPersonWithAssignment()` that:
  1. Creates the person using existing `createPerson()` method
  2. Creates the leadership assignment using `LeadershipAssignmentService.create()`
  3. Returns both entities in an Object array
  4. Operates within a single `@Transactional` boundary

**Key Features**:
- Full transaction rollback if either operation fails
- Reuses existing validation logic from both services
- No code duplication

### 4. PersonController.java
**Location**: `/src/main/java/com/mukono/voting/controller/people/PersonController.java`

**Changes**:
- Added imports for new request/response DTOs
- Added `@PostMapping("/with-assignment")` endpoint
- Requires `ROLE_ADMIN` or `ROLE_DS` authorization
- Returns HTTP 201 (Created) on success
- Maps request to entities and entities to responses

## Technical Implementation Details

### Transaction Management
- The entire operation is wrapped in `@Transactional` annotation on PersonService
- If person creation succeeds but assignment fails, the person creation is rolled back
- Ensures no orphaned person records without assignments

### Validation Flow
1. **Request Validation**: Spring's `@Valid` annotation triggers JSR-303 validation
2. **Person Validation**: PersonService validates email/phone uniqueness
3. **Assignment Validation**: LeadershipAssignmentService validates:
   - Fellowship position exists
   - Term dates are valid
   - Scope matches (diocese/archdeaconry/church)
   - No duplicate assignments
   - Seat availability

### Error Handling
Inherits error handling from existing services:
- **IllegalArgumentException**: Converted to HTTP 400 by exception handler
- **Validation errors**: Converted to HTTP 400 with field details
- **Not found errors**: Appropriate 404 responses
- **Unique constraint violations**: Clear error messages

## API Specification

### Endpoint
```
POST /api/v1/people/with-assignment
```

### Authorization
- `ROLE_ADMIN` or `ROLE_DS`

### Request Example
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

### Response Example (201 Created)
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
    "createdAt": "2026-01-04T10:17:48Z",
    "updatedAt": "2026-01-04T10:17:48Z"
  }
}
```

## Scope Rules Enforcement

The endpoint enforces scope rules based on the fellowship position:

| Position Scope | Required Field | Optional Fields | Validation |
|---------------|----------------|-----------------|------------|
| DIOCESE | dioceseId | none | Must provide dioceseId only |
| ARCHDEACONRY | archdeaconryId | none | Must provide archdeaconryId only |
| CHURCH | churchId | none | Must provide churchId only |

The validation is performed by `LeadershipAssignmentService.create()` method.

## Build Status
✅ **Build Successful** - All files compiled without errors
- Compilation completed at 13:17:48 on January 4, 2026
- 236 source files compiled
- No compilation errors or warnings

## Testing Recommendations

### Manual Testing Steps
1. **Create a diocesan leader**:
   ```bash
   POST /api/v1/people/with-assignment
   # With dioceseId and DIOCESE-scoped position
   ```

2. **Create an archdeaconry leader**:
   ```bash
   POST /api/v1/people/with-assignment
   # With archdeaconryId and ARCHDEACONRY-scoped position
   ```

3. **Create a church leader**:
   ```bash
   POST /api/v1/people/with-assignment
   # With churchId and CHURCH-scoped position
   ```

4. **Test validation errors**:
   - Missing fullName (should return 400)
   - Missing fellowshipPositionId (should return 400)
   - Missing termStartDate (should return 400)
   - termEndDate before termStartDate (should return 400)
   - Invalid fellowshipPositionId (should return 404)
   - Duplicate email (should return 400)
   - Wrong scope (e.g., churchId for DIOCESE position) (should return 400)

5. **Test transaction rollback**:
   - Try to create with invalid assignment after person would be created
   - Verify person is NOT created in database

### Integration Test Scenarios
- Verify both person and assignment are created in database
- Verify transaction rollback on assignment failure
- Verify unique constraints on email/phone
- Verify scope validation
- Verify seat limit enforcement
- Verify term date validation

## Benefits

### For Backend
- **Single transaction**: Ensures data consistency
- **Code reuse**: Leverages existing service methods
- **Maintainability**: No duplication of validation logic

### For Frontend/API Consumers
- **Simplicity**: One API call instead of two
- **Atomicity**: No partial states (person without assignment)
- **Efficiency**: Reduced network overhead
- **Complete data**: Both person and assignment in response

### For Users
- **Streamlined workflow**: Create person and assign role in one step
- **Data integrity**: Assignment always has a person
- **Better UX**: Faster operation with immediate feedback

## Related Documentation
- Full API documentation: `POST_PEOPLE_WITH_ASSIGNMENT_API_DOC.md`
- LeadershipAssignment creation logic: `LeadershipAssignmentService.java`
- Person creation logic: `PersonService.java`

## Compliance with Requirements

✅ **Request payload uses same property names as existing**
- Person fields match `CreatePersonRequest`
- Assignment fields match `CreateLeadershipAssignmentRequest`

✅ **Behavior: Create person, then assignment**
- Implemented in `PersonService.createPersonWithAssignment()`
- Person created first, assignment created second

✅ **Enforce scope rules**
- Delegated to `LeadershipAssignmentService.create()`
- Validates only one of dioceseId/archdeaconryId/churchId per scope

✅ **Validate term dates**
- Delegated to `LeadershipAssignmentService.create()`
- termEndDate must be after termStartDate

✅ **Response returns { person, assignment }**
- Implemented in `PersonWithAssignmentResponse`
- UI can use either or both

## Status
✅ **COMPLETE** - Implementation ready for use
