# D4 Controllers + DTOs - Quick Reference

## Files Created (9)

### Request DTOs (4)
1. CreateElectionRequest.java
2. UpdateElectionRequest.java
3. CancelElectionRequest.java
4. AddElectionPositionRequest.java

### Response DTOs (3)
1. ElectionResponse.java (+ nested FellowshipSummary)
2. ElectionSummary.java
3. ElectionPositionResponse.java (+ nested FellowshipPositionSummary)

### Controllers (2)
1. DsElectionController.java (5 endpoints)
2. DsElectionPositionController.java (4 endpoints)

---

## API Endpoints Reference

### Elections

```
POST /api/v1/ds/elections
  Body: CreateElectionRequest
  Returns: 201 Created + ElectionResponse

PUT /api/v1/ds/elections/{id}
  Body: UpdateElectionRequest
  Returns: 200 OK + ElectionResponse

GET /api/v1/ds/elections/{id}
  Returns: 200 OK + ElectionResponse

GET /api/v1/ds/elections
  Query: fellowshipId, scope, status, dioceseId, archdeaconryId, churchId
  Query: page (0), size (20), sort (id,desc)
  Returns: 200 OK + Page<ElectionSummary>

POST /api/v1/ds/elections/{id}/cancel
  Body: CancelElectionRequest
  Returns: 200 OK + ElectionResponse
```

### Election Positions

```
POST /api/v1/ds/elections/{electionId}/positions
  Body: AddElectionPositionRequest
  Returns: 201 Created + ElectionPositionResponse

GET /api/v1/ds/elections/{electionId}/positions
  Query: page (0), size (20), sort (id,desc)
  Returns: 200 OK + Page<ElectionPositionResponse>

GET /api/v1/ds/elections/{electionId}/positions/{fellowshipPositionId}
  Returns: 200 OK + ElectionPositionResponse

DELETE /api/v1/ds/elections/{electionId}/positions/{fellowshipPositionId}
  Returns: 204 No Content
```

---

## Request DTOs Overview

### CreateElectionRequest
```java
name*              String (max 255)
description        String (max 1000)
fellowshipId*      Long
scope*             String enum
dioceseId          Long (if DIOCESE)
archdeaconryId     Long (if ARCHDEACONRY)
churchId           Long (if CHURCH)
termStartDate*     LocalDate
termEndDate*       LocalDate
nominationStartAt  Instant
nominationEndAt    Instant
votingStartAt*     Instant
votingEndAt*       Instant
* = required
```

### UpdateElectionRequest
```java
name               String (max 255)
description        String (max 1000)
status             String enum
termStartDate      LocalDate
termEndDate        LocalDate
nominationStartAt  Instant
nominationEndAt    Instant
votingStartAt      Instant
votingEndAt        Instant
(all optional)
```

### CancelElectionRequest
```java
reason*            String (1-1000)
* = required
```

### AddElectionPositionRequest
```java
fellowshipPositionId*  Long
seats                  Integer (min 1)
* = required
```

---

## Response DTOs Overview

### ElectionResponse
```java
id                    Long
name                  String
description           String
status                ElectionStatus
scope                 PositionScope
fellowship            FellowshipSummary
diocese               DioceseSummary
archdeaconry          ArchdeaconrySummary
church                ChurchSummary
termStartDate         LocalDate
termEndDate           LocalDate
nominationStartAt     Instant
nominationEndAt       Instant
votingStartAt         Instant
votingEndAt           Instant
createdAt             Instant
updatedAt             Instant
```

### ElectionSummary
```java
id                    Long
name                  String
status                ElectionStatus
scope                 PositionScope
fellowshipId          Long
fellowshipName        String
termStartDate         LocalDate
termEndDate           LocalDate
votingStartAt         Instant
votingEndAt           Instant
```

### ElectionPositionResponse
```java
id                    Long
electionId            Long
fellowshipPosition    FellowshipPositionSummary
seats                 Integer
```

---

## Validation Reference

### Required Fields
- CreateElectionRequest: name, fellowshipId, scope, term dates, voting times
- CancelElectionRequest: reason
- AddElectionPositionRequest: fellowshipPositionId

### Optional Fields
- CreateElectionRequest: description, nomination times, target IDs
- UpdateElectionRequest: ALL fields
- AddElectionPositionRequest: seats

### Size Constraints
- name: 1-255 chars
- description: 0-1000 chars
- reason: 1-1000 chars

### Min/Max
- seats: min 1

---

## Query Parameters

### List Elections
```
?fellowshipId=1&scope=DIOCESE&status=VOTING_OPEN&dioceseId=1&page=0&size=20&sort=id,desc
```

### List Positions
```
?page=0&size=20&sort=id,desc
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 201 | Created (POST new resource) |
| 200 | OK (GET, PUT, POST /cancel) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation failed) |
| 404 | Not Found (resource doesn't exist) |
| 409 | Conflict (duplicate/invalid state) |
| 403 | Forbidden (insufficient permissions) |

---

## Security

### Access Control
```
@PreAuthorize("hasAnyRole('DS','ADMIN')")
```

- DsElectionController: All endpoints require DS or ADMIN role
- DsElectionPositionController: All endpoints require DS or ADMIN role

### Automatic Checks
- ✅ Returns 403 Forbidden if unauthorized
- ✅ Integrates with Spring Security
- ✅ Validates at controller entry point

---

## Error Handling

### Validation Error (400)
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Field validation failed"
}
```

### Not Found (404)
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Election with ID 999 not found"
}
```

### Conflict (409)
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Position already added to this election"
}
```

### Forbidden (403)
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Access denied"
}
```

---

## Pagination Defaults

| Parameter | Default | Note |
|-----------|---------|------|
| page | 0 | First page (0-indexed) |
| size | 20 | Items per page |
| sort | id,desc | Sort by ID descending |

### Sort Format
```
sort=fieldName,asc       ascending
sort=fieldName,desc      descending
```

### Example Sorts
```
?sort=votingStartAt,asc
?sort=createdAt,desc
?sort=name,asc
```

---

## Enum Values

### PositionScope
```
DIOCESE
ARCHDEACONRY
CHURCH
```

### ElectionStatus
```
DRAFT
NOMINATION_OPEN
NOMINATION_CLOSED
VOTING_OPEN
VOTING_CLOSED
TALLIED
PUBLISHED
CANCELLED
```

---

## Common Use Cases

### Create Election
```
POST /api/v1/ds/elections
{
  "name": "2026 Diocese Election",
  "fellowshipId": 1,
  "scope": "DIOCESE",
  "dioceseId": 1,
  "termStartDate": "2026-01-01",
  "termEndDate": "2028-12-31",
  "votingStartAt": "2025-12-01T00:00:00Z",
  "votingEndAt": "2025-12-15T23:59:59Z"
}
```

### Update Election Status
```
PUT /api/v1/ds/elections/1
{
  "status": "NOMINATION_OPEN"
}
```

### List Voting Elections
```
GET /api/v1/ds/elections?status=VOTING_OPEN&page=0&size=20
```

### Add Position
```
POST /api/v1/ds/elections/1/positions
{
  "fellowshipPositionId": 5,
  "seats": 1
}
```

### Cancel Election
```
POST /api/v1/ds/elections/1/cancel
{
  "reason": "Insufficient nominations received"
}
```

---

## Build Information

**Total Source Files:** 115  
**New DTOs:** 7  
**New Controllers:** 2  
**Build Status:** ✅ SUCCESS  
**Compilation Time:** 2.076 seconds  

---

## Testing Notes

### Happy Path
1. Create election ✓
2. Add positions ✓
3. Update status ✓
4. List/Get ✓
5. Cancel ✓

### Error Cases
1. Validation errors (missing required)
2. Not found (invalid ID)
3. Conflict (duplicate position)
4. Unauthorized (wrong role)

### Pagination
Test with various:
- page numbers
- size values
- sort fields and directions
