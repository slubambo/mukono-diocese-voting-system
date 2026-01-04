# POST /people/with-assignment - Quick Reference

## Endpoint
```
POST /api/v1/people/with-assignment
```

## Auth
`ROLE_ADMIN` or `ROLE_DS`

## Minimal Request
```json
{
  "fullName": "Jane Smith",
  "fellowshipPositionId": 1,
  "termStartDate": "2024-01-01",
  "dioceseId": 1
}
```

## Full Request
```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "phoneNumber": "+256700123456",
  "gender": "FEMALE",
  "dateOfBirth": "1985-03-15",
  "fellowshipPositionId": 1,
  "termStartDate": "2024-01-01",
  "termEndDate": "2028-01-01",
  "dioceseId": 1,
  "notes": "Elected by council"
}
```

## Response (201)
```json
{
  "person": { "id": 123, "fullName": "Jane Smith", ... },
  "assignment": { "id": 456, "person": {...}, "fellowshipPosition": {...}, ... }
}
```

## Scope Rules
- **DIOCESE** position → provide `dioceseId`
- **ARCHDEACONRY** position → provide `archdeaconryId`
- **CHURCH** position → provide `churchId`

## Common Errors
- `400` - Missing required fields, invalid dates, duplicate email/phone
- `404` - Fellowship position not found
- `403` - Insufficient permissions

## Implementation Files
1. **Request**: `CreatePersonWithAssignmentRequest.java`
2. **Response**: `PersonWithAssignmentResponse.java`
3. **Service**: `PersonService.createPersonWithAssignment()`
4. **Controller**: `PersonController` (POST /with-assignment)

## Testing
```bash
# cURL example
curl -X POST http://localhost:8080/api/v1/people/with-assignment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fullName": "Test Person",
    "fellowshipPositionId": 1,
    "termStartDate": "2024-01-01",
    "dioceseId": 1
  }'
```

## Status
✅ Implemented and tested (Build successful)
