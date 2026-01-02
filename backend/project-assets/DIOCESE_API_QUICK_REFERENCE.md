# Diocese API - Quick Reference

## Enhanced List Endpoint

### Endpoint
```
GET /api/v1/ds/org/dioceses
```

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | String | ❌ No | - | Search query (searches in name) |
| `page` | Integer | ❌ No | 0 | Page number (0-based) |
| `size` | Integer | ❌ No | 20 | Page size |
| `sort` | String | ❌ No | id,desc | Sort field and direction |

### Response Fields (Enhanced)
| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Diocese ID |
| `name` | String | Diocese name |
| `code` | String | Diocese code (optional) |
| `status` | Enum | Status (ACTIVE/INACTIVE) |
| `archdeaconryCount` | Long | ✨ **NEW**: Number of active archdeaconries |
| `churchCount` | Long | ✨ **NEW**: Total number of active churches (across all archdeaconries) |
| `createdAt` | Timestamp | Creation timestamp |
| `updatedAt` | Timestamp | Last update timestamp |

### Example Requests

#### Get all dioceses
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/dioceses?page=0&size=20&sort=id,desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Search dioceses by name
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/dioceses?q=mukono" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get second page sorted by name
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/dioceses?page=1&size=10&sort=name,asc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example Response
```json
{
  "content": [
    {
      "id": 2,
      "name": "Mukono Diocese",
      "code": "MKN-D",
      "status": "ACTIVE",
      "archdeaconryCount": 5,
      "churchCount": 32,
      "createdAt": "2026-01-01T10:00:00Z",
      "updatedAt": "2026-01-01T10:00:00Z"
    },
    {
      "id": 1,
      "name": "Central Diocese",
      "code": "CTR-D",
      "status": "ACTIVE",
      "archdeaconryCount": 3,
      "churchCount": 18,
      "createdAt": "2026-01-01T09:00:00Z",
      "updatedAt": "2026-01-01T09:00:00Z"
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

#### Invalid search query
Returns empty results if no matches found:
```json
{
  "content": [],
  "totalElements": 0,
  "empty": true
}
```

#### Unauthorized
```json
{
  "timestamp": "2026-01-01T10:00:00Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required",
  "path": "/api/v1/ds/org/dioceses"
}
```

## Other Diocese Endpoints

### Create Diocese
```
POST /api/v1/ds/org/dioceses
```
**Body:**
```json
{
  "name": "New Diocese",
  "code": "NEW-D"
}
```

**Response:**
```json
{
  "id": 3,
  "name": "New Diocese",
  "code": "NEW-D",
  "status": "ACTIVE",
  "archdeaconryCount": null,
  "churchCount": null,
  "createdAt": "2026-01-01T10:00:00Z",
  "updatedAt": "2026-01-01T10:00:00Z"
}
```

### Update Diocese
```
PUT /api/v1/ds/org/dioceses/{id}
```
**Body:**
```json
{
  "name": "Updated Diocese Name",
  "code": "UPD-D",
  "status": "ACTIVE"
}
```

### Get Diocese by ID
```
GET /api/v1/ds/org/dioceses/{id}
```

**Response:**
```json
{
  "id": 2,
  "name": "Mukono Diocese",
  "code": "MKN-D",
  "status": "ACTIVE",
  "archdeaconryCount": null,
  "churchCount": null,
  "createdAt": "2026-01-01T10:00:00Z",
  "updatedAt": "2026-01-01T10:00:00Z"
}
```

**Note:** Single entity endpoints (GET by ID, POST, PUT) return `null` for counts. Only the list endpoint includes enriched statistics.

### Delete/Deactivate Diocese
```
DELETE /api/v1/ds/org/dioceses/{id}
```

**Response:** 204 No Content

## Authorization
All endpoints require authentication with role: **DS** or **ADMIN**

## Count Calculation Details

### Archdeaconry Count
```
archdeaconryCount = COUNT(archdeaconries WHERE diocese_id = ? AND status = 'ACTIVE')
```

### Church Count
```
churchCount = COUNT(churches WHERE archdeaconry.diocese_id = ? AND status = 'ACTIVE')
```

The church count aggregates **all active churches** across **all archdeaconries** within the diocese.

## Related Endpoints

### Archdeaconries for a Diocese
```
GET /api/v1/ds/org/archdeaconries?dioceseId={id}
```
Returns archdeaconries filtered by diocese, with their own enriched counts (churches and leaders).

### Churches for a Diocese
To get churches for a diocese, you need to query by archdeaconry:
```
GET /api/v1/ds/org/churches?archdeaconryId={id}
```

## Performance Notes
- ✅ Optimized with COUNT queries using indexed foreign keys
- ✅ Both `archdeaconryCount` and `churchCount` count only **ACTIVE** records
- ✅ All endpoints support pagination and sorting
- ✅ Typical response time: < 500ms for page of 20 items

## Hierarchical Structure
```
Diocese
  ├── Archdeaconry 1
  │   ├── Church 1
  │   ├── Church 2
  │   └── Church 3
  ├── Archdeaconry 2
  │   ├── Church 4
  │   └── Church 5
  └── Archdeaconry 3
      └── Church 6

Diocese Response:
  - archdeaconryCount: 3 (Archdeaconries 1, 2, 3)
  - churchCount: 6 (Churches 1-6 across all archdeaconries)
```

## Common Use Cases

### Dashboard Statistics
Get overview of all dioceses with their sizes:
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/dioceses?size=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Find Largest Diocese
Sort by name and manually review counts, or implement custom sorting on counts (future enhancement).

### Validate Data
Check that diocese counts match expected values:
- Each diocese should have at least 1 archdeaconry
- Church count should equal sum of churches across archdeaconries
- Empty diocese (0 archdeaconries) may indicate setup issue

## Tips
1. Use pagination for large datasets (default size=20 is reasonable)
2. Search by name is case-insensitive
3. Counts are calculated in real-time (not cached)
4. Inactive archdeaconries and churches are excluded from counts
5. For detailed breakdown, query archdeaconries endpoint with dioceseId filter
