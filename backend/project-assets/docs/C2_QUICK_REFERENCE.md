# Section C2: Quick Reference Card

## Entity Overview

### LeadershipAssignment
**Purpose:** Assign a Person to a FellowshipPosition for a specific organizational target with term tracking

**Key Relationships:**
- Person (required) → Who holds the position
- FellowshipPosition (required) → What position they hold
- Diocese/Archdeaconry/Church (one required based on scope) → Where they serve
- Term dates → When they serve (4-year terms)

**Example Assignment:**
```
Jane Doe → MU Chairperson (Diocese) → Mukono Diocese → 2024-2028
```

## Important Design Notes

### ✅ Multi-Seat Support
- NO unique constraint at database level
- Allows positions with `seats > 1` to have multiple active assignments
- Service layer (C3) will enforce seat limits using count queries

### ✅ Scope Validation (Service Layer, not DB)
```
If position.scope = DIOCESE → diocese field must be set
If position.scope = ARCHDEACONRY → archdeaconry field must be set  
If position.scope = CHURCH → church field must be set
```

## Repository Capabilities

### 1. Seat Counting (for C3 service)
```java
// Check if position has available seats
long count = countByFellowshipPositionIdAndDioceseIdAndStatus(
    positionId, dioceseId, RecordStatus.ACTIVE);
    
boolean hasSpace = count < fellowshipPosition.getSeats();
```

### 2. Eligibility Queries (for voting)
```java
// Get all active archdeaconry-level leaders
List<LeadershipAssignment> voters = 
    findByFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndStatus(
        fellowshipId, PositionScope.ARCHDEACONRY, RecordStatus.ACTIVE);
```

### 3. Person History
```java
// Get all positions held by a person
Page<LeadershipAssignment> positions = findByPersonId(personId, pageable);
```

## Database Schema Highlights

```sql
-- 6 Performance Indexes
idx_leadership_person
idx_leadership_fellowship_position  
idx_leadership_status
idx_leadership_diocese
idx_leadership_archdeaconry
idx_leadership_church

-- NO unique constraint (supports multi-seat)
```

## Files Created

1. `LeadershipAssignment.java` - Entity (172 lines)
2. `LeadershipAssignmentRepository.java` - Repository with 10 query methods

## Build Verification

✅ **BUILD SUCCESS** - 79 source files compiled
✅ All classes in target/classes
✅ Ready for C3 service layer

---

**Status:** Implementation Complete - Model & Repository Ready
**Next:** Section C3 - Service Layer + Validation Logic
