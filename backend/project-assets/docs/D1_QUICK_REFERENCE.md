# D1 Election Core Model - Quick Reference

## Package Location
```
com.mukono.voting.model.election
```

## Files Created (3)

### 1. ElectionStatus.java
**Enum with 8 states:**
- DRAFT → NOMINATION_OPEN → NOMINATION_CLOSED → VOTING_OPEN → VOTING_CLOSED → TALLIED → PUBLISHED
- CANCELLED (can happen at any point)

### 2. Election.java
**Main election entity**

**Key Fields:**
- `name` - Election name (required, max 255)
- `description` - Optional description (max 1000)
- `status` - ElectionStatus (default: DRAFT)
- `fellowship` - Which fellowship owns this election
- `scope` - DIOCESE / ARCHDEACONRY / CHURCH
- `diocese`, `archdeaconry`, `church` - Target org (nullable)
- `termStartDate`, `termEndDate` - Leadership term dates
- `nominationStartAt`, `nominationEndAt` - Nomination window (optional)
- `votingStartAt`, `votingEndAt` - Voting window (required)
- `electionPositions` - List of positions being contested

**6 Database Indexes:**
- fellowship, scope, status, diocese, archdeaconry, church

### 3. ElectionPosition.java
**Junction entity: Election ↔ FellowshipPosition**

**Fields:**
- `election` - The election
- `fellowshipPosition` - The position being contested
- `seats` - Number of seats (min 1)

**Unique Constraint:**
- One position can only be added once per election

## Database Tables

### elections
- Primary key: `id`
- Foreign keys: `fellowship_id`, `diocese_id`, `archdeaconry_id`, `church_id`
- 6 indexes for efficient querying

### election_positions
- Primary key: `id`
- Foreign keys: `election_id`, `fellowship_position_id`
- Unique constraint on (election_id, fellowship_position_id)
- 2 indexes

## Usage Examples

### Creating an Election (Service Layer - D3)
```java
Election election = new Election();
election.setName("2026 Diocese Leadership Election");
election.setFellowship(fellowship);
election.setScope(PositionScope.DIOCESE);
election.setDiocese(diocese);
election.setTermStartDate(LocalDate.of(2026, 1, 1));
election.setTermEndDate(LocalDate.of(2028, 12, 31));
election.setVotingStartAt(Instant.parse("2025-12-01T00:00:00Z"));
election.setVotingEndAt(Instant.parse("2025-12-15T23:59:59Z"));
```

### Adding a Position to an Election
```java
ElectionPosition ep = new ElectionPosition();
ep.setElection(election);
ep.setFellowshipPosition(position);
ep.setSeats(position.getSeats()); // Inherit from position

election.addElectionPosition(ep); // Bidirectional helper
```

## Validation Rules

### Election
- ✅ name: required, max 255 chars
- ✅ description: optional, max 1000 chars
- ✅ status: required
- ✅ fellowship: required
- ✅ scope: required
- ✅ termStartDate: required
- ✅ termEndDate: required
- ✅ votingStartAt: required
- ✅ votingEndAt: required

### ElectionPosition
- ✅ election: required
- ✅ fellowshipPosition: required
- ✅ seats: required, min 1
- ✅ Unique per (election, position) combination

## Ready For D2
- ✅ ElectionRepository
- ✅ ElectionPositionRepository
- ✅ Custom query methods
- ✅ Service layer implementation

## Build Status
✅ Compiles cleanly with Java 17  
✅ Maven build: SUCCESS  
✅ Hibernate schema generation: Ready  
✅ No circular dependencies  
✅ 102 total source files compiled  
