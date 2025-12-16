# D3 Election Services - Quick Reference

## Package Location
```
com.mukono.voting.service.election
```

## Files Created (2)

### 1. ElectionService.java
**5 public methods**

#### Create Election
```java
public Election create(
    String name,                  // Required, max 255
    String description,           // Optional, max 1000
    Long fellowshipId,            // Required, must exist
    PositionScope scope,          // Required: DIOCESE/ARCHDEACONRY/CHURCH
    Long dioceseId,              // Required if scope = DIOCESE
    Long archdeaconryId,         // Required if scope = ARCHDEACONRY
    Long churchId,               // Required if scope = CHURCH
    LocalDate termStartDate,     // Required
    LocalDate termEndDate,       // Required, > start
    Instant nominationStartAt,   // Optional (but both or none)
    Instant nominationEndAt,     // Optional (but both or none)
    Instant votingStartAt,       // Required
    Instant votingEndAt          // Required, > start
)
```

**Key Validations:**
- Exactly ONE target based on scope
- Prevents duplicates (fellowship+scope+target+term)
- Nomination window must end before voting ends
- Starts in DRAFT status

#### Update Election
```java
public Election update(
    Long electionId,             // Required
    String name,                 // Optional
    String description,          // Optional
    ElectionStatus status,       // Optional, validated for transitions
    LocalDate termStartDate,     // Optional
    LocalDate termEndDate,       // Optional
    Instant nominationStartAt,   // Optional
    Instant nominationEndAt,     // Optional
    Instant votingStartAt,       // Optional
    Instant votingEndAt          // Optional
)
```

**Key Rules:**
- Partial updates only
- Cannot change fellowship/scope/targets
- Status transitions validated

#### Get Election
```java
@Transactional(readOnly = true)
public Election getById(Long electionId)
```

#### List Elections
```java
@Transactional(readOnly = true)
public Page<Election> list(
    Long fellowshipId,           // Optional filter
    PositionScope scope,         // Optional filter
    ElectionStatus status,       // Optional filter
    Long dioceseId,             // Optional filter
    Long archdeaconryId,        // Optional filter
    Long churchId,              // Optional filter
    Pageable pageable           // Required for pagination
)
```

#### Cancel Election
```java
public Election cancel(Long electionId, String reason)
```

**Rules:**
- Cannot cancel if PUBLISHED
- Appends reason to description

---

### 2. ElectionPositionService.java
**4 public methods**

#### Add Position
```java
public ElectionPosition addPosition(
    Long electionId,             // Required
    Long fellowshipPositionId,   // Required
    Integer seats                // Optional, defaults to position.seats
)
```

**Validations:**
- Election must be in DRAFT status
- Scope must match (position.scope == election.scope)
- Fellowship must match
- Prevents duplicates
- Seats >= 1

#### Remove Position
```java
public void removePosition(Long electionId, Long fellowshipPositionId)
```

**Rules:**
- Election must be in DRAFT status
- Position must exist in election

#### List Positions
```java
@Transactional(readOnly = true)
public Page<ElectionPosition> listPositions(Long electionId, Pageable pageable)
```

#### Get Position
```java
@Transactional(readOnly = true)
public ElectionPosition getByElectionAndFellowshipPosition(
    Long electionId, 
    Long fellowshipPositionId
)
```

---

## Status Transition Rules

### Valid Transitions

```java
DRAFT              → NOMINATION_OPEN, CANCELLED
NOMINATION_OPEN    → NOMINATION_CLOSED, CANCELLED
NOMINATION_CLOSED  → VOTING_OPEN, CANCELLED
VOTING_OPEN        → VOTING_CLOSED, CANCELLED
VOTING_CLOSED      → TALLIED, CANCELLED
TALLIED            → PUBLISHED, CANCELLED
PUBLISHED          → (none)
CANCELLED          → (none)
```

### Transition Validation
```java
// Throws IllegalArgumentException if invalid
private void validateStatusTransition(ElectionStatus current, ElectionStatus next)
```

---

## Scope-to-Target Matching Rules

| Scope | Required Target | Other Targets |
|-------|----------------|---------------|
| DIOCESE | dioceseId | archdeaconryId, churchId must be NULL |
| ARCHDEACONRY | archdeaconryId | dioceseId, churchId must be NULL |
| CHURCH | churchId | dioceseId, archdeaconryId must be NULL |

**Validation:**
```java
switch (scope) {
    case DIOCESE:
        if (dioceseId == null) throw...
        if (archdeaconryId != null || churchId != null) throw...
        break;
    // ... etc
}
```

---

## Common Usage Patterns

### Pattern 1: Create Complete Election
```java
@Autowired
private ElectionService electionService;

public Election createDioceseElection() {
    return electionService.create(
        "2026 Diocese Leadership Election",
        "Annual election for all diocese positions",
        1L,                                      // fellowshipId
        PositionScope.DIOCESE,
        1L,                                      // dioceseId
        null,                                    // archdeaconryId (must be null)
        null,                                    // churchId (must be null)
        LocalDate.of(2026, 1, 1),               // Term start
        LocalDate.of(2028, 12, 31),             // Term end
        Instant.parse("2025-11-01T00:00:00Z"),  // Nomination start
        Instant.parse("2025-11-30T23:59:59Z"),  // Nomination end
        Instant.parse("2025-12-01T00:00:00Z"),  // Voting start
        Instant.parse("2025-12-15T23:59:59Z")   // Voting end
    );
}
```

### Pattern 2: Status Workflow
```java
public void runElectionWorkflow(Long electionId) {
    // 1. Start in DRAFT (automatic on create)
    
    // 2. Open nominations
    electionService.update(electionId, null, null, 
        ElectionStatus.NOMINATION_OPEN, null, null, null, null, null, null);
    
    // 3. Close nominations
    electionService.update(electionId, null, null, 
        ElectionStatus.NOMINATION_CLOSED, null, null, null, null, null, null);
    
    // 4. Open voting
    electionService.update(electionId, null, null, 
        ElectionStatus.VOTING_OPEN, null, null, null, null, null, null);
    
    // 5. Close voting
    electionService.update(electionId, null, null, 
        ElectionStatus.VOTING_CLOSED, null, null, null, null, null, null);
    
    // 6. Tally results
    electionService.update(electionId, null, null, 
        ElectionStatus.TALLIED, null, null, null, null, null, null);
    
    // 7. Publish results
    electionService.update(electionId, null, null, 
        ElectionStatus.PUBLISHED, null, null, null, null, null, null);
}
```

### Pattern 3: Add Multiple Positions
```java
@Autowired
private ElectionPositionService positionService;

public void setupElection(Long electionId, List<Long> positionIds) {
    // Add all positions (must be in DRAFT status)
    for (Long positionId : positionIds) {
        positionService.addPosition(electionId, positionId, null); // Uses default seats
    }
}
```

### Pattern 4: Filter Elections
```java
public Page<Election> getActiveElections(Long fellowshipId) {
    return electionService.list(
        fellowshipId,
        null,                        // Any scope
        ElectionStatus.VOTING_OPEN,  // Only voting open
        null, null, null,            // No target filters
        PageRequest.of(0, 20)
    );
}
```

### Pattern 5: Complete Election Setup
```java
public Election setupCompleteElection(
    String name, 
    Long fellowshipId, 
    Long dioceseId,
    List<Long> positionIds) {
    
    // 1. Create election
    Election election = electionService.create(
        name, null, fellowshipId, PositionScope.DIOCESE,
        dioceseId, null, null,
        LocalDate.now().plusMonths(1),
        LocalDate.now().plusYears(2),
        null, null,  // No nomination window
        Instant.now().plusDays(30),
        Instant.now().plusDays(45)
    );
    
    // 2. Add positions
    for (Long positionId : positionIds) {
        positionService.addPosition(election.getId(), positionId, null);
    }
    
    return election;
}
```

---

## Error Handling Examples

### Scope Mismatch Error
```java
try {
    // Church scope but diocese ID provided
    electionService.create(name, desc, fellowshipId, 
        PositionScope.CHURCH, dioceseId, null, null, ...);
} catch (IllegalArgumentException e) {
    // "For CHURCH scope, only churchId should be provided; 
    //  dioceseId and archdeaconryId must be null"
}
```

### Invalid Transition Error
```java
try {
    // Try to go from PUBLISHED back to DRAFT
    election.setStatus(ElectionStatus.PUBLISHED);
    electionService.update(electionId, null, null, 
        ElectionStatus.DRAFT, null, null, null, null, null, null);
} catch (IllegalArgumentException e) {
    // "Invalid status transition from PUBLISHED to DRAFT. 
    //  This transition is not allowed in the election lifecycle."
}
```

### Duplicate Election Error
```java
try {
    // Create duplicate for same term
    electionService.create(name, desc, fellowshipId, scope,
        dioceseId, null, null, sameStartDate, sameEndDate, ...);
} catch (IllegalArgumentException e) {
    // "An election already exists for this fellowship, scope, 
    //  target, and term period"
}
```

### Position Scope Mismatch Error
```java
try {
    // Add church position to diocese election
    positionService.addPosition(dioceseElectionId, churchPositionId, 3);
} catch (IllegalArgumentException e) {
    // "Fellowship position scope (CHURCH) does not match 
    //  election scope (DIOCESE)"
}
```

### Edit Locked Election Error
```java
try {
    // Try to add position to voting election
    positionService.addPosition(votingElectionId, positionId, 3);
} catch (IllegalArgumentException e) {
    // "Cannot modify positions for election in VOTING_OPEN status. 
    //  Positions can only be modified when election is in DRAFT status."
}
```

---

## Transaction Boundaries

### Write Operations
All write operations are transactional:
```java
@Transactional  // Class-level
public class ElectionService {
    
    public Election create(...) { }      // Transactional
    public Election update(...) { }      // Transactional
    public Election cancel(...) { }      // Transactional
}
```

### Read Operations
Read operations use read-only transactions:
```java
@Transactional(readOnly = true)
public Election getById(Long id) { }

@Transactional(readOnly = true)
public Page<Election> list(...) { }
```

**Benefits:**
- Automatic rollback on exceptions
- Connection pool optimization
- No partial updates on validation failures

---

## Validation Checklist

### Creating Elections
- [ ] Name provided and <= 255 chars
- [ ] Description <= 1000 chars (if provided)
- [ ] Fellowship exists
- [ ] Scope specified
- [ ] Correct target for scope (and ONLY that target)
- [ ] Target entity exists
- [ ] Term end > term start
- [ ] Voting end > voting start
- [ ] If nomination window: both dates provided, end > start, end <= voting end
- [ ] No duplicate for same fellowship+scope+target+term

### Adding Positions
- [ ] Election exists
- [ ] Election in DRAFT status
- [ ] Fellowship position exists
- [ ] Scopes match (position.scope == election.scope)
- [ ] Fellowships match
- [ ] Seats >= 1
- [ ] Position not already in election

### Status Transitions
- [ ] Current status allows transition to desired status
- [ ] Follow state machine rules
- [ ] Cannot transition from PUBLISHED or CANCELLED

---

## Dependencies Required

### ElectionService Dependencies
```java
✅ ElectionRepository
✅ FellowshipRepository
✅ DioceseRepository
✅ ArchdeaconryRepository
✅ ChurchRepository
```

### ElectionPositionService Dependencies
```java
✅ ElectionRepository
✅ ElectionPositionRepository
✅ FellowshipPositionRepository
```

---

## Best Practices

### 1. Always Validate First
```java
// ✅ Good
if (name == null || name.isBlank()) {
    throw new IllegalArgumentException("Name required");
}
Fellowship fellowship = repo.findById(id)
    .orElseThrow(() -> new IllegalArgumentException("Not found"));
// ... then business logic

// ❌ Bad
Fellowship fellowship = repo.findById(id).get();  // May throw NoSuchElementException
```

### 2. Use Partial Updates
```java
// ✅ Good - only update what's provided
electionService.update(electionId, newName, null, null, null, null, null, null, null, null);

// ❌ Bad - fetching and resetting everything
Election e = service.getById(id);
e.setName(newName);
// Other fields reset to null/default
```

### 3. Check Status Before Operations
```java
// ✅ Good - let service validate
try {
    positionService.addPosition(electionId, positionId, seats);
} catch (IllegalArgumentException e) {
    // Handle appropriately
}

// ❌ Bad - manual status check (bypasses validation)
Election e = service.getById(id);
if (e.getStatus() == ElectionStatus.DRAFT) {
    positionService.addPosition(electionId, positionId, seats);
}
```

### 4. Use Specific Filters
```java
// ✅ Good - specific filters
service.list(fellowshipId, PositionScope.DIOCESE, ElectionStatus.VOTING_OPEN, null, null, null, pageable);

// ⚠️ Less efficient - fetching all then filtering
Page<Election> all = service.list(null, null, null, null, null, null, pageable);
// ... manual filtering
```

---

## Build Status

✅ **BUILD SUCCESS**  
✅ 106 source files compiled  
✅ Zero errors  
✅ Java 17 compliance  

## Ready For D4

- ✅ ElectionController
- ✅ ElectionPositionController
- ✅ DTOs (Request/Response)
- ✅ REST endpoints
- ✅ OpenAPI documentation
