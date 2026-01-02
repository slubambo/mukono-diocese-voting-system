# Archdeaconry API - Quick Reference

## Enhanced List Endpoint

### Endpoint
```
GET /api/v1/ds/org/archdeaconries
```

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `dioceseId` | Long | ✅ Yes | - | Filter archdeaconries by diocese |
| `q` | String | ❌ No | - | Search query (searches in name) |
| `page` | Integer | ❌ No | 0 | Page number (0-based) |
| `size` | Integer | ❌ No | 20 | Page size |
| `sort` | String | ❌ No | id,desc | Sort field and direction |

### Response Fields (Enhanced)
| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Archdeaconry ID |
| `name` | String | Archdeaconry name |
| `code` | String | Archdeaconry code (optional) |
| `status` | Enum | Status (ACTIVE/INACTIVE) |
| `diocese` | Object | Parent diocese summary (id, name, code) |
| `churchCount` | Long | ✨ **NEW**: Number of active churches |
| `currentLeadersCount` | Long | ✨ **NEW**: Number of active leaders |
| `createdAt` | Timestamp | Creation timestamp |
| `updatedAt` | Timestamp | Last update timestamp |

### Example Requests

#### Get all archdeaconries for diocese 2
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/archdeaconries?dioceseId=2&page=0&size=20&sort=id,desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Search archdeaconries by name
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/archdeaconries?dioceseId=2&q=mukono" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get second page sorted by name
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/archdeaconries?dioceseId=2&page=1&size=10&sort=name,asc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example Response
```json
{
  "content": [
    {
      "id": 1,
      "name": "Mukono Archdeaconry",
      "code": "MKN",
      "status": "ACTIVE",
      "diocese": {
        "id": 2,
        "name": "Mukono Diocese",
        "code": "MKN-D"
      },
      "churchCount": 12,
      "currentLeadersCount": 8,
      "createdAt": "2026-01-01T10:00:00Z",
      "updatedAt": "2026-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Buikwe Archdeaconry",
      "code": "BKW",
      "status": "ACTIVE",
      "diocese": {
        "id": 2,
        "name": "Mukono Diocese",
        "code": "MKN-D"
      },
      "churchCount": 8,
      "currentLeadersCount": 5,
      "createdAt": "2026-01-01T10:05:00Z",
      "updatedAt": "2026-01-01T10:05:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "last": true,
  "totalPages": 1,
  "totalElements": 2,
  "first": true,
  "size": 20,
  "number": 0,
  "sort": {
    "sorted": true,
    "unsorted": false,
    "empty": false
  },
  "numberOfElements": 2,
  "empty": false
}
```

### Error Responses

#### Missing dioceseId
```json
{
  "timestamp": "2026-01-01T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Diocese id is required",
  "path": "/api/v1/ds/org/archdeaconries"
}
```

#### Invalid dioceseId
```json
{
  "timestamp": "2026-01-01T10:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Diocese with id 999 not found",
  "path": "/api/v1/ds/org/archdeaconries"
}
```

#### Unauthorized
```json
{
  "timestamp": "2026-01-01T10:00:00Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required",
  "path": "/api/v1/ds/org/archdeaconries"
}
```

## Other Archdeaconry Endpoints

### Create Archdeaconry
```
POST /api/v1/ds/org/archdeaconries
```
**Body:**
```json
{
  "dioceseId": 2,
  "name": "New Archdeaconry",
  "code": "NEW"
}
```

### Update Archdeaconry
```
PUT /api/v1/ds/org/archdeaconries/{id}
```
**Body:**
```json
{
  "name": "Updated Name",
  "code": "UPD",
  "status": "ACTIVE"
}
```

### Get Archdeaconry by ID
```
GET /api/v1/ds/org/archdeaconries/{id}
```

### Delete/Deactivate Archdeaconry
```
DELETE /api/v1/ds/org/archdeaconries/{id}
```

## Authorization
All endpoints require authentication with role: **DS** or **ADMIN**

## Notes
- ✅ Diocese filtering is now properly implemented and working
- ✅ Both `churchCount` and `currentLeadersCount` count only **ACTIVE** records
- ✅ Performance optimized with efficient COUNT queries
- ✅ All endpoints support pagination and sorting
