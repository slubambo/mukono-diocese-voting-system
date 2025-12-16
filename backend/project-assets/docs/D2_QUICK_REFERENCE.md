# D2 Election Repositories - Quick Reference

## Package Location
```
com.mukono.voting.repository.election
```

## Files Created (2)

### 1. ElectionRepository.java
**12 methods total**

#### Core Queries (4)
```java
// List by fellowship
Page<Election> findByFellowshipId(Long fellowshipId, Pageable pageable);

// Filter by fellowship + scope
Page<Election> findByFellowshipIdAndScope(Long fellowshipId, PositionScope scope, Pageable pageable);

// Filter by fellowship + status
Page<Election> findByFellowshipIdAndStatus(Long fellowshipId, ElectionStatus status, Pageable pageable);

// Filter by fellowship + scope + status
Page<Election> findByFellowshipIdAndScopeAndStatus(
    Long fellowshipId, PositionScope scope, ElectionStatus status, Pageable pageable);
```

#### Target Queries (3)
```java
// Diocese elections
Page<Election> findByScopeAndDioceseId(PositionScope scope, Long dioceseId, Pageable pageable);

// Archdeaconry elections
Page<Election> findByScopeAndArchdeaconryId(PositionScope scope, Long archdeaconryId, Pageable pageable);

// Church elections
Page<Election> findByScopeAndChurchId(PositionScope scope, Long churchId, Pageable pageable);
```

#### Existence Checks (3)
```java
// Check diocese election exists
boolean existsByFellowshipIdAndScopeAndDioceseIdAndTermStartDateAndTermEndDate(
    Long fellowshipId, PositionScope scope, Long dioceseId, 
    LocalDate termStartDate, LocalDate termEndDate);

// Check archdeaconry election exists
boolean existsByFellowshipIdAndScopeAndArchdeaconryIdAndTermStartDateAndTermEndDate(
    Long fellowshipId, PositionScope scope, Long archdeaconryId,
    LocalDate termStartDate, LocalDate termEndDate);

// Check church election exists
boolean existsByFellowshipIdAndScopeAndChurchIdAndTermStartDateAndTermEndDate(
    Long fellowshipId, PositionScope scope, Long churchId,
    LocalDate termStartDate, LocalDate termEndDate);
```

#### Time-Window Queries (2 JPQL)
```java
// Elections currently accepting votes
List<Election> findVotingOpenAt(Instant now);

// Elections currently accepting nominations (null-safe)
List<Election> findNominationOpenAt(Instant now);
```

---

### 2. ElectionPositionRepository.java
**5 methods total**

```java
// List positions (paginated)
Page<ElectionPosition> findByElectionId(Long electionId, Pageable pageable);

// List positions (non-paginated)
List<ElectionPosition> findByElectionId(Long electionId);

// Get specific position
Optional<ElectionPosition> findByElectionIdAndFellowshipPositionId(
    Long electionId, Long fellowshipPositionId);

// Check if position already in election
boolean existsByElectionIdAndFellowshipPositionId(Long electionId, Long fellowshipPositionId);

// Remove all positions from election
void deleteByElectionId(Long electionId);
```

---

## Common Usage Patterns

### Pattern 1: List Fellowship Elections
```java
@Autowired
private ElectionRepository electionRepository;

public Page<Election> getElections(Long fellowshipId, int page, int size) {
    return electionRepository.findByFellowshipId(
        fellowshipId,
        PageRequest.of(page, size, Sort.by("createdAt").descending())
    );
}
```

### Pattern 2: Filter Active Elections
```java
public Page<Election> getActiveElections(Long fellowshipId, PositionScope scope) {
    return electionRepository.findByFellowshipIdAndScopeAndStatus(
        fellowshipId,
        scope,
        ElectionStatus.VOTING_OPEN,
        PageRequest.of(0, 20)
    );
}
```

### Pattern 3: Prevent Duplicate Elections
```java
public void validateElection(Election election) {
    boolean exists = false;
    
    switch (election.getScope()) {
        case DIOCESE:
            exists = electionRepository.existsByFellowshipIdAndScopeAndDioceseIdAndTermStartDateAndTermEndDate(
                election.getFellowship().getId(),
                election.getScope(),
                election.getDiocese().getId(),
                election.getTermStartDate(),
                election.getTermEndDate()
            );
            break;
        // ... handle other scopes
    }
    
    if (exists) {
        throw new DuplicateElectionException("Election already exists");
    }
}
```

### Pattern 4: Add Position to Election
```java
@Autowired
private ElectionPositionRepository positionRepository;

public void addPosition(Election election, FellowshipPosition position, int seats) {
    // Check duplicate
    if (positionRepository.existsByElectionIdAndFellowshipPositionId(
            election.getId(), position.getId())) {
        throw new DuplicateException("Position already in election");
    }
    
    // Create and save
    ElectionPosition ep = new ElectionPosition(election, position, seats);
    positionRepository.save(ep);
}
```

### Pattern 5: Automation - Find Open Elections
```java
@Scheduled(cron = "0 0 * * * *") // Every hour
public void processOpenElections() {
    Instant now = Instant.now();
    
    // Process elections accepting votes
    List<Election> votingOpen = electionRepository.findVotingOpenAt(now);
    votingOpen.forEach(this::processVoting);
    
    // Process elections accepting nominations
    List<Election> nominationOpen = electionRepository.findNominationOpenAt(now);
    nominationOpen.forEach(this::processNominations);
}
```

---

## Query Return Types

| Return Type | When to Use |
|-------------|-------------|
| `Page<T>` | Admin dashboards, user lists (needs pagination) |
| `List<T>` | Service layer processing, complete lists |
| `Optional<T>` | Single record lookup (may not exist) |
| `boolean` | Validation, existence checks |
| `void` | Delete operations |

---

## Pagination Examples

### Basic Pagination
```java
PageRequest pageable = PageRequest.of(0, 20); // Page 0, size 20
Page<Election> elections = electionRepository.findByFellowshipId(fellowshipId, pageable);
```

### With Sorting
```java
PageRequest pageable = PageRequest.of(
    0, 20, 
    Sort.by("termStartDate").descending()
);
Page<Election> elections = electionRepository.findByFellowshipId(fellowshipId, pageable);
```

### Multiple Sort Fields
```java
Sort sort = Sort.by("status").ascending()
                .and(Sort.by("termStartDate").descending());
PageRequest pageable = PageRequest.of(0, 20, sort);
```

### Accessing Page Data
```java
Page<Election> page = electionRepository.findByFellowshipId(fellowshipId, pageable);

List<Election> content = page.getContent();      // Current page items
long totalElements = page.getTotalElements();    // Total count
int totalPages = page.getTotalPages();           // Total pages
boolean hasNext = page.hasNext();                // More pages?
```

---

## Method Naming Convention

Spring Data JPA auto-generates queries from method names:

```
findBy[Property][Operator][Property]...
```

**Examples:**
- `findByFellowshipId` → `WHERE fellowship_id = ?`
- `findByFellowshipIdAndScope` → `WHERE fellowship_id = ? AND scope = ?`
- `existsByElectionIdAndFellowshipPositionId` → `SELECT COUNT(*) > 0`

**Properties must match entity field names exactly!**

---

## JPQL Query Syntax

### Time Window Query Pattern
```java
@Query("""
    SELECT e FROM Election e
    WHERE e.votingStartAt <= :now AND e.votingEndAt >= :now
""")
List<Election> findVotingOpenAt(@Param("now") Instant now);
```

**Key Points:**
- Use entity name (`Election`), not table name
- Use field names (`votingStartAt`), not column names
- `:paramName` for parameter binding
- `@Param("paramName")` in method signature
- Triple quotes `"""` for multi-line strings (Java 15+)

---

## Performance Tips

### Use Indexes
All these queries benefit from D1 indexes:
- ✅ Fellowship queries → `idx_elections_fellowship`
- ✅ Scope queries → `idx_elections_scope`
- ✅ Status queries → `idx_elections_status`
- ✅ Diocese queries → `idx_elections_diocese`

### Pagination for Large Sets
Always use `Pageable` for potentially large result sets:
```java
// ✅ Good - paginated
Page<Election> elections = repo.findByFellowshipId(id, pageable);

// ❌ Avoid - could return thousands
List<Election> elections = repo.findAll();
```

### Existence Checks
Use `exists` instead of `find` when you only need to check:
```java
// ✅ Good - lightweight check
boolean exists = repo.existsByElectionIdAndFellowshipPositionId(eId, pId);

// ❌ Wasteful - loads entire object
Optional<ElectionPosition> ep = repo.findByElectionIdAndFellowshipPositionId(eId, pId);
boolean exists = ep.isPresent();
```

---

## Transactional Considerations

### Read Operations
Most queries are read-only (no `@Transactional` needed):
```java
// Read operations - no transaction needed
Page<Election> elections = electionRepository.findByFellowshipId(id, pageable);
```

### Write Operations
Delete operations need `@Transactional`:
```java
@Transactional
public void removeElectionPositions(Long electionId) {
    electionPositionRepository.deleteByElectionId(electionId);
}
```

---

## Build Status

✅ **BUILD SUCCESS**  
✅ 104 source files compiled  
✅ Zero errors  
✅ Java 17 compliance  

## Ready For D3

- ✅ ElectionService
- ✅ Business logic
- ✅ Validation
- ✅ Transaction management
