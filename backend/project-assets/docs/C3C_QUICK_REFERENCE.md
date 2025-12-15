# Section C3C: Quick Reference - DS Controllers

## Base Paths

| Controller | Base Path |
|-----------|-----------|
| DsPositionTitleController | `/api/v1/ds/leadership/titles` |
| DsFellowshipPositionController | `/api/v1/ds/leadership/positions` |
| DsLeadershipAssignmentController | `/api/v1/ds/leadership/assignments` |

---

## All Endpoints

### PositionTitle Controller (5 endpoints)
```
POST   /api/v1/ds/leadership/titles
       CreatePositionTitleRequest → 201 PositionTitleResponse

PUT    /api/v1/ds/leadership/titles/{id}
       UpdatePositionTitleRequest → 200 PositionTitleResponse

GET    /api/v1/ds/leadership/titles/{id}
       → 200 PositionTitleResponse

GET    /api/v1/ds/leadership/titles?q=...&page=0&size=20&sort=id,desc
       → 200 Page<PositionTitleResponse>

DELETE /api/v1/ds/leadership/titles/{id}
       → 204 No Content
```

### FellowshipPosition Controller (5 endpoints)
```
POST   /api/v1/ds/leadership/positions
       CreateFellowshipPositionRequest → 201 FellowshipPositionResponse

PUT    /api/v1/ds/leadership/positions/{id}
       UpdateFellowshipPositionRequest → 200 FellowshipPositionResponse

GET    /api/v1/ds/leadership/positions/{id}
       → 200 FellowshipPositionResponse

GET    /api/v1/ds/leadership/positions?fellowshipId=...&scope=...&page=0&size=20
       → 200 Page<FellowshipPositionResponse>

DELETE /api/v1/ds/leadership/positions/{id}
       → 204 No Content
```

### LeadershipAssignment Controller (7 endpoints)
```
POST   /api/v1/ds/leadership/assignments
       CreateLeadershipAssignmentRequest → 201 LeadershipAssignmentResponse

PUT    /api/v1/ds/leadership/assignments/{id}
       UpdateLeadershipAssignmentRequest → 200 LeadershipAssignmentResponse

GET    /api/v1/ds/leadership/assignments/{id}
       → 200 LeadershipAssignmentResponse

GET    /api/v1/ds/leadership/assignments?status=...&fellowshipId=...&personId=...&archdeaconryId=...
       → 200 Page<LeadershipAssignmentResponse>

DELETE /api/v1/ds/leadership/assignments/{id}?termEndDate=...
       → 204 No Content

GET    /api/v1/ds/leadership/assignments/eligible-voters?fellowshipId=...&scope=...
       → 200 Page<LeadershipAssignmentResponse>
```

---

## Query Parameters

### Common Pagination
- `page`: default 0
- `size`: default 20
- `sort`: default id,desc (format: field,direction)

### Filters by Controller

**PositionTitle:**
- `q`: optional search by name

**FellowshipPosition:**
- `fellowshipId`: required
- `scope`: optional (DIOCESE, ARCHDEACONRY, CHURCH)

**LeadershipAssignment:**
- `status`: optional (ACTIVE, INACTIVE)
- `fellowshipId`: optional
- `personId`: optional
- `archdeaconryId`: optional

**Eligible Voters:**
- `fellowshipId`: required
- `scope`: required (DIOCESE, ARCHDEACONRY, CHURCH)

---

## Security

**All controllers require:**
```
@PreAuthorize("hasAnyRole('DS','ADMIN')")
```

**Header required:**
```
Authorization: Bearer {jwt_token}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation error) |
| 403 | Forbidden (insufficient permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Server Error |

---

## Request/Response Examples

### Create Position Title
**Request:**
```json
{
  "name": "Chairperson"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Chairperson",
  "status": "ACTIVE",
  "createdAt": "2025-12-15T23:56:22.000Z",
  "updatedAt": "2025-12-15T23:56:22.000Z"
}
```

### List with Pagination
**Request:**
```
GET /api/v1/ds/leadership/titles?q=chair&page=0&size=10&sort=name,asc
```

**Response (200):**
```json
{
  "content": [...],
  "pageable": {...},
  "totalElements": 5,
  "totalPages": 1,
  "number": 0,
  "size": 10,
  "empty": false
}
```

---

## Error Response Format

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "message": "Field 'name': Position title name is required"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Position title with ID 999 not found"
}
```

**409 Conflict:**
```json
{
  "error": "Conflict",
  "message": "Position title with name 'Chairperson' already exists"
}
```

---

## Curl Examples

### Create
```bash
curl -X POST http://localhost:8080/api/v1/ds/leadership/titles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name": "Chairperson"}'
```

### Read
```bash
curl -X GET http://localhost:8080/api/v1/ds/leadership/titles/1 \
  -H "Authorization: Bearer TOKEN"
```

### Update
```bash
curl -X PUT http://localhost:8080/api/v1/ds/leadership/titles/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name": "Vice Chair", "status": "ACTIVE"}'
```

### List
```bash
curl -X GET "http://localhost:8080/api/v1/ds/leadership/titles?page=0&size=20" \
  -H "Authorization: Bearer TOKEN"
```

### Delete
```bash
curl -X DELETE http://localhost:8080/api/v1/ds/leadership/titles/1 \
  -H "Authorization: Bearer TOKEN"
```

---

## Build Status

✅ **BUILD SUCCESS**

- Source files compiled: 99
- Build time: 1.712 seconds
- Controllers ready: 3
- Endpoints ready: 17

---

## Testing Checklist

- [ ] Test POST endpoints (create with valid data)
- [ ] Test POST endpoints (create with invalid data → 400)
- [ ] Test POST endpoints (create duplicate → 409)
- [ ] Test PUT endpoints (update with valid data)
- [ ] Test PUT endpoints (update with invalid data → 400)
- [ ] Test GET /{id} endpoints (valid ID)
- [ ] Test GET /{id} endpoints (invalid ID → 404)
- [ ] Test GET endpoints (pagination)
- [ ] Test GET endpoints (filters)
- [ ] Test GET endpoints (sorting)
- [ ] Test DELETE endpoints
- [ ] Test security (missing token → 401)
- [ ] Test security (invalid role → 403)
- [ ] Test /eligible-voters endpoint

---

## Integration with Frontend

Controllers are ready for integration:

1. **Authorization**: Include JWT token in Authorization header
2. **Error Handling**: Check HTTP status codes and error messages
3. **Pagination**: Use page/size/sort parameters
4. **Filtering**: Use appropriate query parameters per endpoint
5. **DTO Mapping**: Work with DTOs, not entities

---

**Section C3C: DS Controllers Complete** ✅
