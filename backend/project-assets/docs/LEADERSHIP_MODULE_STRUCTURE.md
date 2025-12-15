# Leadership Module - Complete Structure

## Package: com.mukono.voting.model.leadership

### Enums
✅ **PositionScope.java**
- DIOCESE
- ARCHDEACONRY  
- CHURCH

### Entities
✅ **PositionTitle.java**
- Reusable position titles (e.g., "Chairperson", "Secretary")
- Unique constraint on name
- RecordStatus support

✅ **FellowshipPosition.java** 
- Links Fellowship + PositionTitle + Scope + Seats
- Unique constraint on (fellowship_id, scope, title_id)
- Supports multi-seat positions

✅ **LeadershipAssignment.java** (NEW - Section C2)
- Links Person to FellowshipPosition for specific target
- Term-aware (start/end dates)
- 6 database indexes for performance
- NO unique constraint (supports multi-seat)

---

## Package: com.mukono.voting.repository.leadership

### Repositories
✅ **PositionTitleRepository.java**
- `existsByNameIgnoreCase(String name)`
- `findByNameContainingIgnoreCase(String q, Pageable)`

✅ **FellowshipPositionRepository.java**
- `existsByFellowshipIdAndScopeAndTitleId(...)`
- `findByFellowshipId(Long, Pageable)`
- `findByFellowshipIdAndScope(Long, PositionScope, Pageable)`

✅ **LeadershipAssignmentRepository.java** (NEW - Section C2)
- **Seat Counting:** 4 methods for slot enforcement
- **Listing:** 4 methods for dashboard views
- **Eligibility:** 2 methods for voting queries

---

## Data Flow Example

### 1. Define Position Title
```java
PositionTitle chairperson = new PositionTitle("Chairperson");
// Reusable across all fellowships
```

### 2. Create Fellowship Position
```java
FellowshipPosition muChair = new FellowshipPosition(
    mothersUnion,           // Fellowship
    chairperson,            // Title
    PositionScope.DIOCESE,  // Scope
    1                       // Seats
);
// "Mothers' Union Chairperson at Diocese level, 1 seat"
```

### 3. Assign Person to Position
```java
LeadershipAssignment assignment = new LeadershipAssignment(
    janeDoe,                      // Person
    muChair,                      // Fellowship Position  
    LocalDate.of(2024, 1, 1)     // Term start
);
assignment.setDiocese(mukonoDiocese);
assignment.setTermEndDate(LocalDate.of(2028, 1, 1));
// "Jane Doe is MU Chairperson for Mukono Diocese, 2024-2028"
```

---

## Build Status

```
✅ Section C1A: Position Catalog (3 files)
   - PositionScope enum
   - PositionTitle entity + repository
   - FellowshipPosition entity + repository

✅ Section C2: Leadership Assignment (2 files)
   - LeadershipAssignment entity
   - LeadershipAssignmentRepository

BUILD SUCCESS - 79 source files compiled
Total leadership module: 5 entities/enums + 3 repositories = 8 files
```

---

## Next Steps: Section C3

**Service Layer Requirements:**
1. PositionTitleService - CRUD for position titles
2. FellowshipPositionService - CRUD + seat validation
3. LeadershipAssignmentService - CRUD + complex validations:
   - Scope matching (diocese/archdeaconry/church based on position.scope)
   - Seat limit enforcement using count queries
   - Term date validation
   - Prevent duplicate active assignments for same person+position
   - Status lifecycle management

**Controllers (API Endpoints):**
- REST endpoints for all CRUD operations
- Filter/search capabilities  
- Eligibility lookup for voting

---

**Current Status:** Model & Repository layers complete and verified ✅
