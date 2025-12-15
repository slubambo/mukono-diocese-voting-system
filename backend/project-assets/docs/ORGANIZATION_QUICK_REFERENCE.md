# Organization Entities - Quick Reference Guide

## Entity Hierarchy & Structure

```
Diocese (Top Level)
├── Archdeaconry (Many per Diocese)
│   └── Church (Many per Archdeaconry)
└── Multiple Archdeaconries...

Fellowship (Independent)
```

## Entity Summary Table

| Entity | Package | Table | Parent | Fields | Key Constraint |
|--------|---------|-------|--------|--------|-----------------|
| Diocese | model.org | dioceses | None | id, name*, code*, status | unique(name, code) |
| Archdeaconry | model.org | archdeaconries | Diocese | id, name, code, diocese_id*, status | unique(diocese_id, name) |
| Church | model.org | churches | Archdeaconry | id, name, code, archdeaconry_id*, status | unique(archdeaconry_id, name) |
| Fellowship | model.org | fellowships | None | id, name*, code*, status | unique(name, code) |

*required fields

## Repository Methods Reference

### DioceseRepository
```java
// Find & check existence
Optional<Diocese> findByNameIgnoreCase(String name);
boolean existsByNameIgnoreCase(String name);
```

### ArchdeaconryRepository
```java
// Find all in diocese
List<Archdeaconry> findByDioceseId(Long dioceseId);

// Search within diocese (paginated)
Page<Archdeaconry> findByDioceseIdAndNameContainingIgnoreCase(
    Long dioceseId, String name, Pageable pageable
);

// Exact match in diocese
Optional<Archdeaconry> findByDioceseIdAndNameIgnoreCase(
    Long dioceseId, String name
);
```

### ChurchRepository
```java
// Find all in archdeaconry
List<Church> findByArchdeaconryId(Long archdeaconryId);

// Search within archdeaconry (paginated)
Page<Church> findByArchdeaconryIdAndNameContainingIgnoreCase(
    Long archdeaconryId, String name, Pageable pageable
);

// Exact match in archdeaconry
Optional<Church> findByArchdeaconryIdAndNameIgnoreCase(
    Long archdeaconryId, String name
);
```

### FellowshipRepository
```java
// Find & check existence
Optional<Fellowship> findByNameIgnoreCase(String name);
boolean existsByNameIgnoreCase(String name);
```

## Common RecordStatus Enum

```java
public enum RecordStatus {
    ACTIVE,    // Record is active and usable
    INACTIVE   // Record is archived or disabled
}
```

## Usage Examples (Future Services)

### Creating a Diocese
```java
Diocese diocese = new Diocese("Mukono Diocese", "MUK");
diocese.setStatus(RecordStatus.ACTIVE);
dioceseRepository.save(diocese);
```

### Creating an Archdeaconry
```java
Archdeaconry archdeaconry = new Archdeaconry(
    "Mukono West Archdeaconry",
    "MWA",
    diocese  // ManyToOne reference
);
archdeaconryRepository.save(archdeaconry);
```

### Searching for Churches
```java
// All churches in an archdeaconry
List<Church> churches = churchRepository
    .findByArchdeaconryId(archdeaconryId);

// Search with pagination
Page<Church> results = churchRepository
    .findByArchdeaconryIdAndNameContainingIgnoreCase(
        archdeaconryId,
        "St",  // Search term
        PageRequest.of(0, 20)
    );

// Exact match
Optional<Church> church = churchRepository
    .findByArchdeaconryIdAndNameIgnoreCase(
        archdeaconryId,
        "St. John's Church"
    );
```

## Audit Tracking (Automatic)

All entities automatically track:
- `createdAt` - Timestamp when record was created
- `updatedAt` - Timestamp when record was last modified
- `createdBy` - (Future: User who created the record)
- `updatedBy` - (Future: User who modified the record)

## Database Constraints

### Unique Constraints
- **Diocese**: `name` and `code` must be globally unique
- **Archdeaconry**: `(diocese_id, name)` must be unique within diocese
- **Church**: `(archdeaconry_id, name)` must be unique within archdeaconry
- **Fellowship**: `name` and `code` must be globally unique

### Foreign Key Constraints
- **Archdeaconry**: `diocese_id` REFERENCES `dioceses(id)` (NOT NULL)
- **Church**: `archdeaconry_id` REFERENCES `archdeaconries(id)` (NOT NULL)

### Enumeration Constraints
- **RecordStatus**: Stored as VARCHAR(20) with values 'ACTIVE', 'INACTIVE'
- Default: 'ACTIVE'

## Lazy Loading Behavior

All ManyToOne relationships use `FetchType.LAZY` to prevent:
- N+1 query problems
- Unnecessary data loading
- Performance degradation in large queries

**Note**: To access parent entity, you may need to ensure session is open or explicitly fetch.

## Next Steps

1. **Create Services** (service.org package):
   - Implement business logic validation
   - Handle duplicate checks using repository methods
   - Manage transaction boundaries

2. **Create Controllers** (controller.org package):
   - REST endpoints for CRUD operations
   - Pagination support
   - Proper authorization checks (DS namespace)

3. **Create DTOs** (payload package):
   - Request DTOs for creation/updates
   - Response DTOs for API responses
   - Separate from JPA entities to prevent over-exposure

4. **Add Tests**:
   - Repository tests for query methods
   - Service tests for business logic
   - Controller tests for endpoint validation

---

**Last Updated**: December 14, 2025
**Status**: Complete - Ready for Service/Controller Implementation
