# Section C3A: Leadership Services - Implementation Summary

**Date:** December 15, 2025
**Status:** ✅ COMPLETE - BUILD SUCCESS

## Overview
Implemented comprehensive service layer for the leadership module with full validation, business logic, and transactional support. All services follow the existing project patterns using `@Service`, constructor injection, `@Transactional`, and `IllegalArgumentException` for validation errors.

---

## 1. PositionTitleService

**Location:** `com.mukono.voting.service.leadership.PositionTitleService`

**Dependencies:**
- `PositionTitleRepository`

### Methods Implemented

#### `PositionTitle create(String name)`
**Validations:**
- Name is required (not null/blank)
- Name must be unique (case-insensitive check)
- Auto-sets status to ACTIVE

**Example:**
```java
PositionTitle chairperson = service.create("Chairperson");
```

#### `PositionTitle update(Long id, String name, RecordStatus status)`
**Validations:**
- Position title must exist
- If name is changed, check uniqueness (case-insensitive)
- Only re-checks uniqueness if name actually changes

**Example:**
```java
PositionTitle updated = service.update(1L, "Vice Chairperson", RecordStatus.ACTIVE);
```

#### `PositionTitle getById(Long id)`
**Validations:**
- ID is required
- Position title must exist

#### `Page<PositionTitle> list(String q, Pageable pageable)`
**Behavior:**
- If `q` is null/blank → returns all position titles
- If `q` is provided → searches by name (case-insensitive contains)

**Example:**
```java
Page<PositionTitle> results = service.list("chair", PageRequest.of(0, 10));
```

#### `void deactivate(Long id)`
**Behavior:**
- Sets status to INACTIVE
- Position title must exist

---

## 2. FellowshipPositionService

**Location:** `com.mukono.voting.service.leadership.FellowshipPositionService`

**Dependencies:**
- `FellowshipPositionRepository`
- `FellowshipRepository`
- `PositionTitleRepository`

### Methods Implemented

#### `FellowshipPosition create(Long fellowshipId, Long titleId, PositionScope scope, Integer seats)`
**Validations:**
- Fellowship must exist
- Position title must exist
- Scope is required
- Seats defaults to 1 if null, must be >= 1
- Prevents duplicates: unique (fellowship + scope + title) combination
- Auto-sets status to ACTIVE

**Example:**
```java
FellowshipPosition position = service.create(
    1L,                      // Mothers' Union fellowship
    5L,                      // Chairperson title
    PositionScope.DIOCESE,   // Diocese level
    1                        // 1 seat
);
```

#### `FellowshipPosition update(Long id, Long titleId, PositionScope scope, Integer seats, RecordStatus status)`
**Validations:**
- Fellowship position must exist
- If title changes, must exist
- Seats must be >= 1 if provided
- Re-checks duplicate if (fellowship/title/scope) combination changes
- Only validates changes, not unchanged fields

**Smart duplicate checking:** Only re-validates uniqueness if the combination actually changed.

#### `FellowshipPosition getById(Long id)`
**Validations:**
- ID is required
- Fellowship position must exist

#### `Page<FellowshipPosition> list(Long fellowshipId, PositionScope scope, Pageable pageable)`
**Filtering logic:**
- Both fellowshipId AND scope → `findByFellowshipIdAndScope()`
- Only fellowshipId → `findByFellowshipId()`
- No filters → `findAll()`

**Example:**
```java
// All positions for Mothers' Union at Diocese level
Page<FellowshipPosition> positions = service.list(1L, PositionScope.DIOCESE, pageable);
```

#### `void deactivate(Long id)`
**Behavior:**
- Sets status to INACTIVE
- Fellowship position must exist

---

## 3. LeadershipAssignmentService

**Location:** `com.mukono.voting.service.leadership.LeadershipAssignmentService`

**Dependencies:**
- `LeadershipAssignmentRepository`
- `PersonRepository`
- `FellowshipPositionRepository`
- `DioceseRepository`
- `ArchdeaconryRepository`
- `ChurchRepository`

**This is the most complex service with comprehensive validation logic.**

### Methods Implemented

#### `LeadershipAssignment create(...)`
**Parameters:**
```java
create(
    Long personId,
    Long fellowshipPositionId,
    Long dioceseId,
    Long archdeaconryId,
    Long churchId,
    LocalDate termStartDate,
    LocalDate termEndDate,
    String notes
)
```

**Comprehensive Validations:**

1. **Person Validation:**
   - Person ID required
   - Person must exist

2. **Fellowship Position Validation:**
   - Fellowship position ID required
   - Fellowship position must exist

3. **Term Date Validation:**
   - Term start date is required
   - If term end date provided, must be after start date

4. **Scope Matching (Critical):**
   - If `position.scope = DIOCESE`:
     - `dioceseId` REQUIRED
     - `archdeaconryId` and `churchId` must be NULL
     - Diocese must exist
   - If `position.scope = ARCHDEACONRY`:
     - `archdeaconryId` REQUIRED
     - `dioceseId` and `churchId` must be NULL
     - Archdeaconry must exist
   - If `position.scope = CHURCH`:
     - `churchId` REQUIRED
     - `dioceseId` and `archdeaconryId` must be NULL
     - Church must exist

5. **Duplicate Prevention:**
   - Checks if person already has an ACTIVE assignment for same position + target
   - Uses scope-specific repository methods:
     - `existsByPersonIdAndFellowshipPositionIdAndDioceseIdAndStatus()`
     - `existsByPersonIdAndFellowshipPositionIdAndArchdeaconryIdAndStatus()`
     - `existsByPersonIdAndFellowshipPositionIdAndChurchIdAndStatus()`

6. **Seat Enforcement:**
   - Counts active assignments for the position at the specific target
   - Uses scope-specific count methods:
     - `countByFellowshipPositionIdAndDioceseIdAndStatus()`
     - `countByFellowshipPositionIdAndArchdeaconryIdAndStatus()`
     - `countByFellowshipPositionIdAndChurchIdAndStatus()`
   - Ensures `currentActiveCount < position.seats`
   - Throws error if all seats are filled

**Example:**
```java
LeadershipAssignment assignment = service.create(
    personId: 10L,
    fellowshipPositionId: 5L,
    dioceseId: 1L,           // For DIOCESE scope
    archdeaconryId: null,
    churchId: null,
    termStartDate: LocalDate.of(2024, 1, 1),
    termEndDate: LocalDate.of(2028, 1, 1),  // 4-year term
    notes: "Elected in 2024"
);
```

#### `LeadershipAssignment update(...)`
**Parameters:**
```java
update(
    Long id,
    Long personId,
    Long fellowshipPositionId,
    Long dioceseId,
    Long archdeaconryId,
    Long churchId,
    LocalDate termStartDate,
    LocalDate termEndDate,
    RecordStatus status,
    String notes
)
```

**Smart Update Logic:**
- All parameters except `id` are optional
- Only validates and updates changed fields
- Tracks changes to: person, position, target, status
- Re-validates scope matching if position changes
- Re-checks duplicates if person/position/target changes AND status is ACTIVE
- Re-checks seat availability if position/target changes AND status is ACTIVE
- For seat checking on update, subtracts 1 from count (excludes current assignment)

**Example:**
```java
// Change status to INACTIVE and set end date
LeadershipAssignment updated = service.update(
    id: 1L,
    personId: null,          // Not changing
    fellowshipPositionId: null,  // Not changing
    dioceseId: null,
    archdeaconryId: null,
    churchId: null,
    termStartDate: null,
    termEndDate: LocalDate.now(),  // Set end date
    status: RecordStatus.INACTIVE,
    notes: "Term completed"
);
```

#### `LeadershipAssignment getById(Long id)`
**Validations:**
- ID is required
- Assignment must exist

#### `Page<LeadershipAssignment> list(...)`
**Parameters:**
```java
list(
    RecordStatus status,
    Long fellowshipId,
    Long personId,
    Long archdeaconryId,
    Pageable pageable
)
```

**Filter Priority (applies first matching filter):**
1. `personId` → `findByPersonId()`
2. `fellowshipId` → `findByFellowshipPositionFellowshipId()`
3. `archdeaconryId` → `findByArchdeaconryId()`
4. `status` → `findByStatus()`
5. No filters → `findAll()`

**Example:**
```java
// Get all positions held by a specific person
Page<LeadershipAssignment> myPositions = service.list(null, null, personId, null, pageable);
```

#### `void deactivate(Long id, LocalDate termEndDateOptional)`
**Behavior:**
- Sets status to INACTIVE
- If `termEndDateOptional` provided → sets it as term end date
- Else if current term end date is null → sets to `LocalDate.now()`
- Else → keeps existing term end date

**Example:**
```java
// Deactivate and set end date to today
service.deactivate(1L, LocalDate.now());

// Deactivate with specific end date
service.deactivate(1L, LocalDate.of(2025, 12, 31));
```

### Private Helper Methods

The service includes well-organized private helper methods:

1. **`checkDuplicateAssignment(...)`** - Validates no duplicate active assignment exists
2. **`checkDuplicateAssignmentForUpdate(...)`** - Duplicate check that excludes current assignment
3. **`checkSeatAvailability(...)`** - Ensures seats are available
4. **`checkSeatAvailabilityForUpdate(...)`** - Seat check that excludes current assignment

---

## 4. Repository Methods Added

### LeadershipAssignmentRepository (Enhanced)

Added 3 new methods for duplicate prevention:

```java
// Check if person already holds position at specific diocese
boolean existsByPersonIdAndFellowshipPositionIdAndDioceseIdAndStatus(
    Long personId, Long fellowshipPositionId, Long dioceseId, RecordStatus status)

// Check if person already holds position at specific archdeaconry
boolean existsByPersonIdAndFellowshipPositionIdAndArchdeaconryIdAndStatus(
    Long personId, Long fellowshipPositionId, Long archdeaconryId, RecordStatus status)

// Check if person already holds position at specific church
boolean existsByPersonIdAndFellowshipPositionIdAndChurchIdAndStatus(
    Long personId, Long fellowshipPositionId, Long churchId, RecordStatus status)
```

**Purpose:** Prevent the same person from being assigned to the same position+target combination more than once (for ACTIVE status).

---

## 5. Validation Summary

### PositionTitleService Validations
✅ Name required  
✅ Name unique (case-insensitive)  
✅ Entity existence checks

### FellowshipPositionService Validations
✅ Fellowship exists  
✅ Title exists  
✅ Scope required  
✅ Seats >= 1  
✅ Unique (fellowship + scope + title)  
✅ Smart duplicate checking on update

### LeadershipAssignmentService Validations
✅ Person exists  
✅ Fellowship position exists  
✅ **Scope matching enforcement** (correct target for scope)  
✅ Target entity existence (diocese/archdeaconry/church)  
✅ Term start date required  
✅ Term end date > start date  
✅ **Duplicate prevention** (same person + position + target)  
✅ **Seat limit enforcement** (respects position.seats)  
✅ Smart re-validation on updates  
✅ Status-aware validation (only for ACTIVE)

---

## 6. Build Verification

### Build Status: ✅ BUILD SUCCESS

**Command:** `mvn clean install -DskipTests`

**Result:**
```
[INFO] Compiling 82 source files with javac [debug parameters release 17] to target/classes
[INFO] BUILD SUCCESS
[INFO] Total time:  1.616 s
[INFO] Finished at: 2025-12-15T23:35:26+03:00
```

### Files Created

**Services (3 files):**
1. `/src/main/java/com/mukono/voting/service/leadership/PositionTitleService.java` (127 lines)
2. `/src/main/java/com/mukono/voting/service/leadership/FellowshipPositionService.java` (206 lines)
3. `/src/main/java/com/mukono/voting/service/leadership/LeadershipAssignmentService.java` (519 lines)

**Repository Enhanced (1 file):**
4. `/src/main/java/com/mukono/voting/repository/leadership/LeadershipAssignmentRepository.java` (added 3 methods)

### Compiled Classes (Verified)

```
target/classes/com/mukono/voting/service/leadership/
├── PositionTitleService.class (4,747 bytes)
├── FellowshipPositionService.class (7,857 bytes)
├── LeadershipAssignmentService.class (16,400 bytes)
└── LeadershipAssignmentService$1.class (938 bytes) [switch enum helper]
```

---

## 7. Example Usage Scenarios

### Scenario 1: Create Complete Leadership Position

```java
// Step 1: Create position title
PositionTitle chairperson = positionTitleService.create("Chairperson");

// Step 2: Create fellowship position
FellowshipPosition muChairDiocese = fellowshipPositionService.create(
    mothersUnionId,           // Fellowship: Mothers' Union
    chairperson.getId(),      // Title: Chairperson
    PositionScope.DIOCESE,    // Diocese level
    1                         // 1 seat only
);

// Step 3: Assign person to position
LeadershipAssignment assignment = assignmentService.create(
    janeDoeId,                     // Person
    muChairDiocese.getId(),        // Position
    mukonoDioceseId,               // Target: Mukono Diocese
    null, null,                    // Other targets null
    LocalDate.of(2024, 1, 1),      // Start: Jan 1, 2024
    LocalDate.of(2028, 1, 1),      // End: Jan 1, 2028
    "Elected unanimously"          // Notes
);
```

### Scenario 2: Multi-Seat Position with Seat Enforcement

```java
// Create committee position with 5 seats
FellowshipPosition committee = fellowshipPositionService.create(
    mothersUnionId,
    committeeTitleId,
    PositionScope.ARCHDEACONRY,
    5  // 5 seats available
);

// Assign 5 people successfully
for (int i = 0; i < 5; i++) {
    assignmentService.create(personIds[i], committee.getId(), 
        null, archdeaconryId, null, startDate, endDate, null);
}

// 6th assignment FAILS with: "All seats (5) for this position are already filled"
assignmentService.create(person6Id, committee.getId(), 
    null, archdeaconryId, null, startDate, endDate, null);
// → IllegalArgumentException thrown ✅
```

### Scenario 3: Duplicate Prevention

```java
// First assignment succeeds
LeadershipAssignment first = assignmentService.create(
    janeDoeId, positionId, dioceseId, null, null, 
    startDate, endDate, null);

// Second assignment for SAME person + position + diocese FAILS
assignmentService.create(
    janeDoeId, positionId, dioceseId, null, null, 
    startDate2, endDate2, null);
// → IllegalArgumentException: "This person already has an active assignment..." ✅
```

### Scenario 4: Scope Validation

```java
// Position is ARCHDEACONRY scope
FellowshipPosition archPosition = fellowshipPositionService.create(
    fellowshipId, titleId, PositionScope.ARCHDEACONRY, 1);

// INVALID: Providing dioceseId for ARCHDEACONRY scope
assignmentService.create(
    personId, archPosition.getId(),
    dioceseId,    // ❌ Wrong! Should be null
    null,         // ❌ Should be archdeaconryId
    null,
    startDate, endDate, null);
// → IllegalArgumentException: "Archdeaconry ID is required for ARCHDEACONRY scope positions" ✅

// VALID: Correct scope matching
assignmentService.create(
    personId, archPosition.getId(),
    null,              // ✅ Null for diocese
    archdeaconryId,    // ✅ Required for ARCHDEACONRY
    null,              // ✅ Null for church
    startDate, endDate, null);
// → Success! ✅
```

### Scenario 5: Deactivate with Term End

```java
// Deactivate and set end date to today
assignmentService.deactivate(assignmentId, LocalDate.now());

// Result:
// - status = INACTIVE
// - termEndDate = 2025-12-15
```

---

## 8. Key Design Highlights

✅ **Consistent Error Handling:** All validation errors use `IllegalArgumentException`  
✅ **Transactional Safety:** All methods run in transactions via `@Transactional`  
✅ **Constructor Injection:** All dependencies injected via constructor  
✅ **Smart Validation:** Only re-checks constraints when relevant fields change  
✅ **Scope Enforcement:** Strict validation of diocese/archdeaconry/church based on position scope  
✅ **Multi-Seat Support:** Full support for positions with multiple seats  
✅ **Duplicate Prevention:** Comprehensive checks to prevent invalid duplicate assignments  
✅ **Update Safety:** Update validations account for the current entity being updated  
✅ **Flexible Filtering:** List methods support multiple optional filters  
✅ **Clean Separation:** Business logic in services, data access in repositories

---

## 9. Next Steps: Section C3B (Controllers)

The service layer is now complete and ready for:

1. **REST Controllers:**
   - `PositionTitleController` - CRUD endpoints for position titles
   - `FellowshipPositionController` - CRUD endpoints for fellowship positions
   - `LeadershipAssignmentController` - CRUD + eligibility endpoints

2. **API Features:**
   - Create/Update/Get/List/Deactivate endpoints
   - Search and filtering
   - Pagination support
   - Error handling and response formatting
   - Eligibility lookup for voting

3. **Security Integration:**
   - Role-based access control
   - JWT authentication
   - Permission validation

---

**Section C3A Implementation Complete** ✅

All three leadership services are fully implemented with comprehensive validation logic, smart update handling, and proper integration with existing repository layer. The system now enforces all business rules including scope matching, seat limits, duplicate prevention, and term management.

**Build Status:** SUCCESS - 82 source files compiled  
**Services Created:** 3 (852 lines of code total)  
**Repository Methods Added:** 3 duplicate prevention methods
