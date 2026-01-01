# Church API - Quick Reference

## Enhanced List Endpoint

### Endpoint
```
GET /api/v1/ds/org/churches
```

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `archdeaconryId` | Long | ✅ Yes | - | Filter churches by archdeaconry |
| `q` | String | ❌ No | - | Search query (searches in name) |
| `page` | Integer | ❌ No | 0 | Page number (0-based) |
| `size` | Integer | ❌ No | 20 | Page size |
| `sort` | String | ❌ No | id,desc | Sort field and direction |

### Response Fields (Enhanced)
| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Church ID |
| `name` | String | Church name |
| `code` | String | Church code (optional) |
| `status` | Enum | Status (ACTIVE/INACTIVE) |
| `archdeaconry` | Object | Parent archdeaconry summary (id, name, code) |
| `diocese` | Object | ✨ **NEW**: Grandparent diocese summary (id, name, code) |
| `currentLeadersCount` | Long | ✨ **NEW**: Number of active leadership assignments |
| `createdAt` | Timestamp | Creation timestamp |
| `updatedAt` | Timestamp | Last update timestamp |

### Example Requests

#### Get all churches for archdeaconry 14
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/churches?archdeaconryId=14&page=0&size=20&sort=id,desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Search churches by name
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/churches?archdeaconryId=14&q=john" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get second page sorted by name
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/churches?archdeaconryId=14&page=1&size=10&sort=name,asc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example Response
```json
{
  "content": [
    {
      "id": 1,
      "name": "St. John's Church",
      "code": "SJC",
      "status": "ACTIVE",
      "archdeaconry": {
        "id": 14,
        "name": "Mukono Archdeaconry",
        "code": "MKN"
      },
      "diocese": {
        "id": 2,
        "name": "Mukono Diocese",
        "code": "MKN-D"
      },
      "currentLeadersCount": 5,
      "createdAt": "2026-01-01T10:00:00Z",
      "updatedAt": "2026-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "name": "St. Paul's Church",
      "code": "SPC",
      "status": "ACTIVE",
      "archdeaconry": {
        "id": 14,
        "name": "Mukono Archdeaconry",
        "code": "MKN"
      },
      "diocese": {
        "id": 2,
        "name": "Mukono Diocese",
        "code": "MKN-D"
      },
      "currentLeadersCount": 3,
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

#### Missing archdeaconryId
```json
{
  "timestamp": "2026-01-01T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Required request parameter 'archdeaconryId' is not present",
  "path": "/api/v1/ds/org/churches"
}
```

#### Invalid archdeaconryId
```json
{
  "timestamp": "2026-01-01T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Archdeaconry id is required",
  "path": "/api/v1/ds/org/churches"
}
```

#### Unauthorized
```json
{
  "timestamp": "2026-01-01T10:00:00Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required",
  "path": "/api/v1/ds/org/churches"
}
```

## Other Church Endpoints

### Create Church
```
POST /api/v1/ds/org/churches
```
**Body:**
```json
{
  "archdeaconryId": 14,
  "name": "New Church",
  "code": "NEW"
}
```

### Update Church
```
PUT /api/v1/ds/org/churches/{id}
```
**Body:**
```json
{
  "name": "Updated Church Name",
  "code": "UPD",
  "status": "ACTIVE"
}
```

### Get Church by ID
```
GET /api/v1/ds/org/churches/{id}
```

### Delete/Deactivate Church
```
DELETE /api/v1/ds/org/churches/{id}
```

## Authorization
All endpoints require authentication with role: **DS** or **ADMIN**

## Count Calculation Details

### Current Leaders Count
```
currentLeadersCount = COUNT(leadership_assignments WHERE church_id = ? AND status = 'ACTIVE')
```

This includes all active leadership assignments directly associated with this church.

### Diocese Information
```
diocese = church.archdeaconry.diocese
```

Retrieved through the existing relationship chain (no additional query needed).

## Hierarchical Structure
```
Diocese
  └── Archdeaconry
      └── Church
          └── Leadership Assignments

Example Response Shows:
  - diocese: "Mukono Diocese" (grandparent)
  - archdeaconry: "Mukono Archdeaconry" (parent)
  - currentLeadersCount: 5 (children)
```

## UI Display Recommendations

### Table View
Display churches with their full context:
```
+----------------------+------+------------------+--------------------+----------+--------+
| Church Name          | Code | Diocese          | Archdeaconry       | Leaders  | Status |
+----------------------+------+------------------+--------------------+----------+--------+
| St. John's Church    | SJC  | Mukono Diocese   | Mukono Archdeaconry| 5        | Active |
| St. Paul's Church    | SPC  | Mukono Diocese   | Mukono Archdeaconry| 3        | Active |
| Holy Trinity Church  | HTC  | Mukono Diocese   | Buikwe Archdeaconry| 0        | Active |
+----------------------+------+------------------+--------------------+----------+--------+
```

### Detail View
Show full hierarchy:
```
Diocese: Mukono Diocese (MKN-D)
  └─ Archdeaconry: Mukono Archdeaconry (MKN)
      └─ Church: St. John's Church (SJC)
          └─ Active Leaders: 5
```

### Dashboard Cards
```
┌─────────────────────────────────┐
│ St. John's Church               │
│ Code: SJC                       │
│                                 │
│ 📍 Mukono Diocese               │
│ 🏛️  Mukono Archdeaconry         │
│ 👥 5 Active Leaders             │
│                                 │
│ Status: ✅ Active               │
└─────────────────────────────────┘
```

## Common Use Cases

### Find Churches Needing Leaders
Filter or sort by `currentLeadersCount = 0`:
```bash
# Get all churches, then filter client-side for count = 0
curl -X GET "http://localhost:8080/api/v1/ds/org/churches?archdeaconryId=14&size=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Generate Church Report
Export churches with full context for reporting:
```bash
# Get all churches with hierarchy and leader counts
curl -X GET "http://localhost:8080/api/v1/ds/org/churches?archdeaconryId=14&size=1000" \
  -H "Authorization: Bearer YOUR_TOKEN" > churches_report.json
```

### Compare Leadership Across Churches
Use the leader counts to identify:
- Churches with no leaders (need attention)
- Churches with many leaders (well-staffed)
- Average leaders per church in archdeaconry

## Performance Notes
- ✅ Optimized with COUNT queries using indexed foreign keys
- ✅ `currentLeadersCount` counts only **ACTIVE** leadership assignments
- ✅ Diocese info uses existing relationships (no extra query)
- ✅ All endpoints support pagination and sorting
- ✅ Typical response time: < 500ms for page of 20 items

## Related Endpoints

### Get Archdeaconry (parent)
```
GET /api/v1/ds/org/archdeaconries/{id}
```

### Get Leadership Assignments for Church
```
GET /api/v1/ds/leadership/assignments?churchId={id}
```
(Note: Check actual endpoint path in your API)

### Get Diocese (grandparent)
```
GET /api/v1/ds/org/dioceses/{id}
```

## Tips
1. Always provide `archdeaconryId` parameter - it's required
2. Use pagination for large datasets (default size=20 is reasonable)
3. Search by name is case-insensitive
4. Leader counts are calculated in real-time (not cached)
5. Diocese info helps users understand the full organizational context
6. Churches with 0 leaders may need administrative attention
