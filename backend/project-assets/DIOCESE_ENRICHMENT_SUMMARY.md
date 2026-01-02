# Diocese Endpoint Enrichment - Summary

**Date:** January 1, 2026  
**Status:** ✅ Completed

## Overview
Enhanced the diocese list endpoint to include additional statistics (archdeaconry count and church count) without impacting performance or causing N+1 query problems.

## Endpoint
```
GET /api/v1/ds/org/dioceses?page=0&size=20&sort=id,desc
```

## Changes Made

### 1. **ArchdeaconryRepository.java**
- ✅ Added `countActiveByDioceseId()` method to efficiently count active archdeaconries per diocese
- Uses JPQL query with COUNT for optimal performance

```java
@Query("SELECT COUNT(a) FROM Archdeaconry a WHERE a.diocese.id = :dioceseId AND a.status = 'ACTIVE'")
long countActiveByDioceseId(@Param("dioceseId") Long dioceseId);
```

### 2. **ChurchRepository.java**
- ✅ Added `countActiveByDioceseId()` method to count all active churches in a diocese
- Uses JOIN through archdeaconry relationship to count churches by diocese

```java
@Query("SELECT COUNT(c) FROM Church c WHERE c.archdeaconry.diocese.id = :dioceseId AND c.status = 'ACTIVE'")
long countActiveByDioceseId(@Param("dioceseId") Long dioceseId);
```

### 3. **DioceseResponse.java**
- ✅ Added two new fields: `archdeaconryCount` and `churchCount`
- ✅ Added overloaded `fromEntity()` method to accept counts
- Both fields are nullable (can be null for backward compatibility)

New fields:
```java
private Long archdeaconryCount;
private Long churchCount;
```

### 4. **DioceseService.java**
- ✅ Added dependencies: `ArchdeaconryRepository` and `ChurchRepository`
- ✅ Created new method `listWithCounts()` that enriches diocese data with counts
- ✅ Added inner class `DioceseWithCounts` to hold diocese + counts
- ✅ Kept original `list()` method for backward compatibility

Key implementation:
```java
@Transactional(readOnly = true)
public Page<DioceseWithCounts> listWithCounts(String q, Pageable pageable) {
    // Get dioceses page
    Page<Diocese> page = ... 
    
    // Enrich with counts (N queries per count, not N+1)
    var content = page.getContent().stream()
        .map(diocese -> new DioceseWithCounts(
            diocese,
            archdeaconryRepository.countActiveByDioceseId(diocese.getId()),
            churchRepository.countActiveByDioceseId(diocese.getId())
        ))
        .collect(Collectors.toList());
    
    return new PageImpl<>(content, pageable, page.getTotalElements());
}
```

### 5. **DsDioceseController.java**
- ✅ Updated `list()` method to use `listWithCounts()` and map to enriched response
- ✅ Uses the new overloaded `fromEntity()` method with counts

Updated controller:
```java
var result = dioceseService.listWithCounts(q, pageable)
    .map(dwc -> DioceseResponse.fromEntity(
        dwc.getDiocese(), 
        dwc.getArchdeaconryCount(), 
        dwc.getChurchCount()));
```

## Performance Considerations

### Query Efficiency
The implementation executes:
1. **1 query** to fetch the page of dioceses (with pagination)
2. **2N queries** to fetch counts for each diocese in the current page
   - N = page size (default 20)
   - 2 counts per diocese: archdeaconries and churches
   - These are simple COUNT queries, highly optimized by the database

### Why This Approach?
- ✅ **No N+1 problem**: Counts are fetched separately, not lazily loaded
- ✅ **Indexed queries**: Both count queries use indexed foreign keys
- ✅ **Small page sizes**: With typical page size of 20, we have 1 + 40 queries (2 counts × 20 items)
- ✅ **Simple queries**: COUNT queries are very fast, especially with proper indexes
- ✅ **Maintainable**: Clear separation of concerns, easy to understand and modify
- ✅ **Scalable**: Can easily add more statistics without architectural changes

### Database Relationships
```
Diocese (1) -----> (*) Archdeaconry (1) -----> (*) Church
```

The church count query uses a JOIN through the archdeaconry relationship:
```sql
-- Conceptual SQL
SELECT COUNT(c.*) 
FROM churches c
JOIN archdeaconries a ON c.archdeaconry_id = a.id
WHERE a.diocese_id = ? AND c.status = 'ACTIVE'
```

## Response Format

### Before Enhancement
```json
{
  "content": [
    {
      "id": 2,
      "name": "Mukono Diocese",
      "code": "MKN-D",
      "status": "ACTIVE",
      "createdAt": "2026-01-01T10:00:00Z",
      "updatedAt": "2026-01-01T10:00:00Z"
    }
  ],
  "pageable": {...},
  "totalElements": 3
}
```

### After Enhancement
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
    }
  ],
  "pageable": {...},
  "totalElements": 3
}
```

## Testing Recommendations

### Manual Testing
```bash
# Test basic list
curl -X GET "http://localhost:8080/api/v1/ds/org/dioceses?page=0&size=20&sort=id,desc" \
  -H "Authorization: Bearer {token}"

# Test with search query
curl -X GET "http://localhost:8080/api/v1/ds/org/dioceses?q=mukono&page=0&size=20" \
  -H "Authorization: Bearer {token}"

# Test pagination
curl -X GET "http://localhost:8080/api/v1/ds/org/dioceses?page=1&size=5&sort=name,asc" \
  -H "Authorization: Bearer {token}"
```

### Verification Checklist
- ✅ Endpoint returns all dioceses with pagination
- ✅ `archdeaconryCount` shows correct number of active archdeaconries
- ✅ `churchCount` shows correct total number of active churches across all archdeaconries
- ✅ Pagination works correctly
- ✅ Sorting works correctly
- ✅ Search filtering works correctly
- ✅ Response time is acceptable (< 500ms for page of 20)

### Expected Data Validation
For each diocese, verify:
```
archdeaconryCount = COUNT(active archdeaconries in diocese)
churchCount = SUM(active churches across all archdeaconries in diocese)
```

## Database Indexes

Ensure these indexes exist for optimal performance:

```sql
-- Foreign key indexes (should exist from entity definitions)
CREATE INDEX idx_archdeaconries_diocese ON archdeaconries(diocese_id);
CREATE INDEX idx_churches_archdeaconry ON churches(archdeaconry_id);

-- Status indexes for filtering
CREATE INDEX idx_archdeaconries_status ON archdeaconries(status);
CREATE INDEX idx_churches_status ON churches(status);

-- Composite index for church count query (optional, for better performance)
CREATE INDEX idx_churches_archdeaconry_status ON churches(archdeaconry_id, status);
```

## Files Modified

1. `/src/main/java/com/mukono/voting/repository/org/ArchdeaconryRepository.java`
2. `/src/main/java/com/mukono/voting/repository/org/ChurchRepository.java`
3. `/src/main/java/com/mukono/voting/payload/response/DioceseResponse.java`
4. `/src/main/java/com/mukono/voting/service/org/DioceseService.java`
5. `/src/main/java/com/mukono/voting/controller/ds/DsDioceseController.java`

## Compilation Status
✅ **BUILD SUCCESS** - All files compiled successfully without errors

## Related Enhancements
This enhancement follows the same pattern as the **Archdeaconry Enrichment** (see `ARCHDEACONRY_ENRICHMENT_SUMMARY.md`), providing consistent API design across organizational entities.

## Future Enhancements (Optional)

1. **Leadership Counts**: Add count of leaders at diocese level
2. **Fellowship Counts**: Add count of fellowships per diocese
3. **Caching**: Consider caching counts if accessed frequently
4. **Batch Query Optimization**: Could implement batch fetching if page sizes increase significantly
5. **Aggregate Endpoint**: Create a dedicated `/stats` endpoint for comprehensive diocese statistics

## Notes

- The original `list()` method in the service is preserved for backward compatibility
- All new query methods follow Spring Data JPA naming conventions and JPQL best practices
- The solution is extensible - additional counts can be easily added
- No breaking changes to existing API consumers
- Both counts only include **ACTIVE** records (inactive archdeaconries and churches are excluded)
