# Section C2: Leadership Assignment Entity + Repository - Implementation Summary

**Date:** December 15, 2025
**Status:** ✅ COMPLETE - BUILD SUCCESS

## Overview
Implemented term-aware leadership assignment system that links People to FellowshipPositions for specific organizational targets (Diocese/Archdeaconry/Church) with 4-year term support. This implementation supports multi-seat positions with seat enforcement deferred to the service layer (C3).

---

## 1. Design Decisions

### ✅ No LeadershipTargetType Enum
**Decision:** Skipped creating a separate `LeadershipTargetType` enum.
**Rationale:** We use `PositionScope` directly from the FellowshipPosition, avoiding redundancy and maintaining single source of truth for scope values.

### ✅ No Unique Constraint on Position Slots
**Decision:** Did NOT add unique constraint on `(fellowship_position_id, diocese_id, archdeaconry_id, church_id, status)`.
**Rationale:** 
- Allows support for multi-seat positions (seats > 1)
- A database-level unique constraint would block multiple people from holding the same position
- Seat limits are enforced in the service layer (C3) with proper business logic
- More flexible and correct for the use case

### ✅ Comprehensive Indexing Strategy
**Decision:** Added 6 indexes for optimal query performance.
**Benefits:**
- Fast lookups by person, position, status, and organizational targets
- Supports efficient counting and filtering operations
- Optimizes eligibility queries for voting workflows

---

## 2. Entity: LeadershipAssignment

**Location:** `com.mukono.voting.model.leadership.LeadershipAssignment`

**Table:** `leadership_assignments`

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Long | PK, auto-generated | Primary key |
| `person` | ManyToOne → Person | Required, LAZY | The person assigned to the position |
| `fellowshipPosition` | ManyToOne → FellowshipPosition | Required, LAZY | The fellowship position being filled |
| `diocese` | ManyToOne → Diocese | Nullable, LAZY | Target diocese (for DIOCESE scope) |
| `archdeaconry` | ManyToOne → Archdeaconry | Nullable, LAZY | Target archdeaconry (for ARCHDEACONRY scope) |
| `church` | ManyToOne → Church | Nullable, LAZY | Target church (for CHURCH scope) |
| `termStartDate` | LocalDate | Required | Start date of the 4-year term |
| `termEndDate` | LocalDate | Nullable | End date of the term (null = ongoing) |
| `status` | RecordStatus | Required, default ACTIVE | ACTIVE or INACTIVE |
| `notes` | String | Nullable, max 1000 chars | Optional notes about the assignment |
| `createdAt` | Instant | Auto (from DateAudit) | Creation timestamp |
| `updatedAt` | Instant | Auto (from DateAudit) | Last update timestamp |

### Database Indexes

```sql
-- Performance indexes for common queries
idx_leadership_person              ON person_id
idx_leadership_fellowship_position ON fellowship_position_id  
idx_leadership_status              ON status
idx_leadership_diocese             ON diocese_id
idx_leadership_archdeaconry        ON archdeaconry_id
idx_leadership_church              ON church_id
```

### Validation Rules (Enforced in Service Layer)

The entity has nullable target fields at the DB level, but the service layer will enforce:

1. **Scope Matching:**
   - If `fellowshipPosition.scope = DIOCESE` → `diocese` must be set, others null
   - If `fellowshipPosition.scope = ARCHDEACONRY` → `archdeaconry` must be set, others null
   - If `fellowshipPosition.scope = CHURCH` → `church` must be set, others null

2. **Seat Limits:**
   - Count active assignments for the same position + target
   - Ensure count < `fellowshipPosition.seats`

3. **Term Dates:**
   - `termStartDate` is required
   - `termEndDate` must be after `termStartDate` (if provided)
   - Typical term: 4 years

---

## 3. Repository: LeadershipAssignmentRepository

**Location:** `com.mukono.voting.repository.leadership.LeadershipAssignmentRepository`

### Slot Counting Methods (for Seats Enforcement)

These methods enable the service layer to check if positions have reached their seat limits:

```java
// Overall position slot checking
long countByFellowshipPositionIdAndStatus(Long fellowshipPositionId, RecordStatus status)

// Diocese-level slot checking  
long countByFellowshipPositionIdAndDioceseIdAndStatus(
    Long fellowshipPositionId, Long dioceseId, RecordStatus status)

// Archdeaconry-level slot checking
long countByFellowshipPositionIdAndArchdeaconryIdAndStatus(
    Long fellowshipPositionId, Long archdeaconryId, RecordStatus status)

// Church-level slot checking
long countByFellowshipPositionIdAndChurchIdAndStatus(
    Long fellowshipPositionId, Long churchId, RecordStatus status)
```

**Usage Example (in future service):**
```java
// Check if diocese-level position has available seats
long currentAssignments = repository.countByFellowshipPositionIdAndDioceseIdAndStatus(
    positionId, dioceseId, RecordStatus.ACTIVE);
    
if (currentAssignments >= fellowshipPosition.getSeats()) {
    throw new Exception("Position is full - all seats occupied");
}
```

### Listing/Filtering Methods (for Dashboard Views)

```java
// Find by status (all active/inactive assignments)
Page<LeadershipAssignment> findByStatus(RecordStatus status, Pageable pageable)

// Find all positions held by a person
Page<LeadershipAssignment> findByPersonId(Long personId, Pageable pageable)

// Find all assignments for a specific fellowship
Page<LeadershipAssignment> findByFellowshipPositionFellowshipId(Long fellowshipId, Pageable pageable)

// Find all assignments in an archdeaconry
Page<LeadershipAssignment> findByArchdeaconryId(Long archdeaconryId, Pageable pageable)
```

### Eligibility Queries (Core for Voting Workflows)

Critical for determining who can vote in elections:

```java
// PAGINATED: Fetch active leaders at a specific scope (e.g., all archdeaconry-level leaders)
Page<LeadershipAssignment> findByFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndStatus(
    Long fellowshipId, PositionScope scope, RecordStatus status, Pageable pageable)

// NON-PAGINATED: Same query but returns full list (for exports/validation)
List<LeadershipAssignment> findByFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndStatus(
    Long fellowshipId, PositionScope scope, RecordStatus status)
```

**Usage Example (in future voting service):**
```java
// Get all active archdeaconry-level leaders for "Mothers' Union" fellowship
List<LeadershipAssignment> eligibleVoters = repository
    .findByFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndStatus(
        mothersUnionId, PositionScope.ARCHDEACONRY, RecordStatus.ACTIVE);
```

---

## 4. Verification

### Build Status: ✅ BUILD SUCCESS

**Command:** `mvn clean install -DskipTests`

**Result:**
```
[INFO] Compiling 79 source files with javac [debug parameters release 17] to target/classes
[INFO] BUILD SUCCESS
[INFO] Total time:  1.590 s
[INFO] Finished at: 2025-12-15T23:18:30+03:00
```

### Files Created

1. **Entity:** `/src/main/java/com/mukono/voting/model/leadership/LeadershipAssignment.java`
2. **Repository:** `/src/main/java/com/mukono/voting/repository/leadership/LeadershipAssignmentRepository.java`

### Compiled Classes (Verified)

```
target/classes/com/mukono/voting/model/leadership/
├── FellowshipPosition.class
├── LeadershipAssignment.class (NEW - 5,546 bytes)
├── PositionScope.class
└── PositionTitle.class

target/classes/com/mukono/voting/repository/leadership/
├── FellowshipPositionRepository.class
├── LeadershipAssignmentRepository.class (NEW - 2,805 bytes)
└── PositionTitleRepository.class
```

---

## 5. Database Schema (Generated by Hibernate)

### Table: leadership_assignments

```sql
CREATE TABLE leadership_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Core relationships
    person_id BIGINT NOT NULL,
    fellowship_position_id BIGINT NOT NULL,
    
    -- Target scope (nullable at DB level)
    diocese_id BIGINT NULL,
    archdeaconry_id BIGINT NULL,
    church_id BIGINT NULL,
    
    -- Term management
    term_start_date DATE NOT NULL,
    term_end_date DATE NULL,
    
    -- Status and notes
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes VARCHAR(1000) NULL,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    
    -- Foreign keys
    FOREIGN KEY (person_id) REFERENCES people(id),
    FOREIGN KEY (fellowship_position_id) REFERENCES fellowship_positions(id),
    FOREIGN KEY (diocese_id) REFERENCES dioceses(id),
    FOREIGN KEY (archdeaconry_id) REFERENCES archdeaconries(id),
    FOREIGN KEY (church_id) REFERENCES churches(id),
    
    -- Indexes for performance
    INDEX idx_leadership_person (person_id),
    INDEX idx_leadership_fellowship_position (fellowship_position_id),
    INDEX idx_leadership_status (status),
    INDEX idx_leadership_diocese (diocese_id),
    INDEX idx_leadership_archdeaconry (archdeaconry_id),
    INDEX idx_leadership_church (church_id)
);
```

**Important:** NO unique constraint on position slots to support multi-seat positions!

---

## 6. Use Cases Supported

### 6.1 Single-Seat Position Example
**Position:** Mothers' Union Chairperson (Diocese Level, 1 seat)
**Assignment:**
```java
LeadershipAssignment assignment = new LeadershipAssignment();
assignment.setPerson(janeDoe);
assignment.setFellowshipPosition(muChairpersonPosition);
assignment.setDiocese(mukonoDiocese);
assignment.setTermStartDate(LocalDate.of(2024, 1, 1));
assignment.setTermEndDate(LocalDate.of(2028, 1, 1));  // 4-year term
assignment.setStatus(RecordStatus.ACTIVE);
```

**Result:** Only 1 active assignment allowed (enforced by service layer checking seats=1)

### 6.2 Multi-Seat Position Example
**Position:** Mothers' Union Committee Member (Archdeaconry Level, 5 seats)
**Assignments:**
```java
// Person 1
assignment1.setPerson(person1);
assignment1.setFellowshipPosition(muCommitteePosition);
assignment1.setArchdeaconry(centralArchdeaconry);

// Person 2
assignment2.setPerson(person2);
assignment2.setFellowshipPosition(muCommitteePosition);
assignment2.setArchdeaconry(centralArchdeaconry);

// ... up to 5 people for the same position/archdeaconry
```

**Result:** Up to 5 active assignments allowed for the same position + archdeaconry combination

### 6.3 Voting Eligibility Query
**Scenario:** Find all active Archdeaconry-level leaders in Mothers' Union (eligible voters)

```java
List<LeadershipAssignment> eligibleVoters = repository
    .findByFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndStatus(
        mothersUnionFellowshipId,
        PositionScope.ARCHDEACONRY,
        RecordStatus.ACTIVE
    );
```

---

## 7. Next Steps (Section C3)

The model and repository are now ready for:

1. **Service Layer Implementation:**
   - Validate scope matching (diocese/archdeaconry/church based on position scope)
   - Enforce seat limits using the count methods
   - Validate term dates (start < end, reasonable 4-year duration)
   - Business logic for assignment lifecycle

2. **REST API Controllers:**
   - Create assignment endpoint
   - Update assignment endpoint  
   - List assignments (with filters)
   - Get eligible voters endpoint

3. **Integration with Voting System:**
   - Use eligibility queries to determine who can vote
   - Link to nomination and election workflows

---

## 8. Key Design Highlights

✅ **Multi-Seat Support:** No DB constraints blocking multiple assignments - handled in service
✅ **Flexible Target Scoping:** Nullable fields with service-level validation based on position scope
✅ **Term Awareness:** Start/end dates for 4-year leadership terms
✅ **Audit Trail:** Automatic timestamps via DateAudit inheritance
✅ **Performance Optimized:** 6 strategic indexes for fast queries
✅ **Voting Ready:** Specialized queries for eligibility determination
✅ **Status Management:** ACTIVE/INACTIVE support for lifecycle management

---

**Section C2 Implementation Complete** ✅

The foundation is now in place for term-aware leadership assignments with full support for multi-seat positions and voting eligibility tracking.
