# Section C3A: Quick Reference Card

## Service Methods Overview

### PositionTitleService
```java
create(String name) → PositionTitle
update(Long id, String name, RecordStatus status) → PositionTitle
getById(Long id) → PositionTitle
list(String q, Pageable pageable) → Page<PositionTitle>
deactivate(Long id) → void
```

### FellowshipPositionService
```java
create(Long fellowshipId, Long titleId, PositionScope scope, Integer seats) → FellowshipPosition
update(Long id, Long titleId, PositionScope scope, Integer seats, RecordStatus status) → FellowshipPosition
getById(Long id) → FellowshipPosition
list(Long fellowshipId, PositionScope scope, Pageable pageable) → Page<FellowshipPosition>
deactivate(Long id) → void
```

### LeadershipAssignmentService
```java
create(Long personId, Long fellowshipPositionId, Long dioceseId, Long archdeaconryId, 
       Long churchId, LocalDate termStartDate, LocalDate termEndDate, String notes) → LeadershipAssignment

update(Long id, Long personId, Long fellowshipPositionId, Long dioceseId, Long archdeaconryId,
       Long churchId, LocalDate termStartDate, LocalDate termEndDate, RecordStatus status, 
       String notes) → LeadershipAssignment

getById(Long id) → LeadershipAssignment

list(RecordStatus status, Long fellowshipId, Long personId, Long archdeaconryId, 
     Pageable pageable) → Page<LeadershipAssignment>

deactivate(Long id, LocalDate termEndDateOptional) → void
```

---

## Key Validations

### Scope Matching Rules (LeadershipAssignmentService)
```
DIOCESE scope     → dioceseId REQUIRED, others NULL
ARCHDEACONRY scope → archdeaconryId REQUIRED, others NULL
CHURCH scope      → churchId REQUIRED, others NULL
```

### Seat Enforcement
```java
// Before creating assignment, service checks:
long activeCount = countByFellowshipPositionIdAnd[Target]IdAndStatus(...);
if (activeCount >= position.getSeats()) {
    throw new IllegalArgumentException("All seats filled");
}
```

### Duplicate Prevention
```java
// Prevents same person from holding same position+target twice (ACTIVE status)
boolean exists = existsByPersonIdAndFellowshipPositionIdAnd[Target]IdAndStatus(...);
if (exists) {
    throw new IllegalArgumentException("Person already assigned");
}
```

---

## Common Usage Patterns

### Create Leadership Position Flow
```java
// 1. Create title
PositionTitle title = positionTitleService.create("Chairperson");

// 2. Create fellowship position
FellowshipPosition position = fellowshipPositionService.create(
    fellowshipId, title.getId(), PositionScope.DIOCESE, 1);

// 3. Assign person
LeadershipAssignment assignment = assignmentService.create(
    personId, position.getId(), dioceseId, null, null,
    LocalDate.of(2024,1,1), LocalDate.of(2028,1,1), "Notes");
```

### Update Assignment Status
```java
// Keep person/position same, just change status and end date
LeadershipAssignment updated = assignmentService.update(
    id, null, null, null, null, null, null,
    LocalDate.now(),           // Set end date
    RecordStatus.INACTIVE,     // Deactivate
    "Term completed"
);
```

### Search and Filter
```java
// Get all active assignments
Page<LeadershipAssignment> active = assignmentService.list(
    RecordStatus.ACTIVE, null, null, null, pageable);

// Get all positions for a person
Page<LeadershipAssignment> myPositions = assignmentService.list(
    null, null, personId, null, pageable);

// Get all positions in a fellowship
Page<LeadershipAssignment> fellowshipLeaders = assignmentService.list(
    null, fellowshipId, null, null, pageable);
```

---

## Error Messages to Expect

### PositionTitleService
- "Position title name is required"
- "Position title with name 'X' already exists"
- "Position title with ID X not found"

### FellowshipPositionService
- "Fellowship ID is required"
- "Fellowship with ID X not found"
- "Position title ID is required"
- "Position title with ID X not found"
- "Position scope is required"
- "Number of seats must be at least 1"
- "Fellowship position already exists for this combination..."

### LeadershipAssignmentService
- "Person ID is required"
- "Person with ID X not found"
- "Fellowship position ID is required"
- "Fellowship position with ID X not found"
- "Term start date is required"
- "Term end date must be after term start date"
- "Diocese ID is required for DIOCESE scope positions"
- "Only diocese should be specified for DIOCESE scope positions"
- "Diocese with ID X not found"
- "This person already has an active assignment for this position and target"
- "All seats (X) for this position are already filled"

---

## Repository Methods Added

### LeadershipAssignmentRepository
```java
// Duplicate prevention (NEW)
existsByPersonIdAndFellowshipPositionIdAndDioceseIdAndStatus(...)
existsByPersonIdAndFellowshipPositionIdAndArchdeaconryIdAndStatus(...)
existsByPersonIdAndFellowshipPositionIdAndChurchIdAndStatus(...)
```

---

## Build Info

**Status:** ✅ BUILD SUCCESS  
**Source Files:** 82 compiled  
**Services Created:** 3 (852 lines total)  
**Build Time:** 1.616 seconds

---

## Files Created

1. `PositionTitleService.java` - 127 lines
2. `FellowshipPositionService.java` - 206 lines  
3. `LeadershipAssignmentService.java` - 519 lines
4. `LeadershipAssignmentRepository.java` - Enhanced with 3 methods

**Total:** 3 services + 1 repository enhancement = 4 files modified/created

---

**Next:** Section C3B - REST Controllers for all three services
