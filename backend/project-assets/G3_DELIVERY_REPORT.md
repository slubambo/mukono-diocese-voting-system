# G3 Results Certification + Winners Application - Delivery Report

**Date:** December 17, 2025  
**Status:** ✅ **COMPLETE**  
**Build:** ✅ **SUCCESS** (mvn clean install)  
**Tests:** ✅ **32/32 PASSED** (8 new G3 tests)

---

## Summary

G3 implements the complete election finalization workflow: computing winners using deterministic tie-breaking, persisting certified results as an immutable snapshot, and applying winners to ElectionWinnerAssignment in a safe, auditable, and idempotent manner.

---

## Files Added/Changed

### New Entities (5)
1. `src/main/java/com/mukono/voting/model/election/TallyStatus.java` - Enum (PENDING, COMPLETED, FAILED, ROLLED_BACK)
2. `src/main/java/com/mukono/voting/model/election/ElectionTallyRun.java` - Tracks tally attempts, enforces idempotency
3. `src/main/java/com/mukono/voting/model/election/CertifiedPositionResult.java` - Persisted final results per position
4. `src/main/java/com/mukono/voting/model/election/CertifiedCandidateResult.java` - Persisted vote counts per candidate
5. `src/main/java/com/mukono/voting/model/election/ElectionWinnerAssignment.java` - Authoritative election outcome

### New Repositories (4)
6. `src/main/java/com/mukono/voting/repository/election/ElectionTallyRunRepository.java`
7. `src/main/java/com/mukono/voting/repository/election/CertifiedPositionResultRepository.java`
8. `src/main/java/com/mukono/voting/repository/election/CertifiedCandidateResultRepository.java`
9. `src/main/java/com/mukono/voting/repository/election/ElectionWinnerAssignmentRepository.java`

### New DTOs (4)
10. `src/main/java/com/mukono/voting/api/admin/dto/RunTallyRequest.java`
11. `src/main/java/com/mukono/voting/api/admin/dto/RunTallyResponse.java`
12. `src/main/java/com/mukono/voting/api/admin/dto/TallyStatusResponse.java`
13. `src/main/java/com/mukono/voting/api/admin/dto/RollbackTallyResponse.java`

### New Service (1)
14. `src/main/java/com/mukono/voting/api/admin/service/ElectionTallyService.java` - Core business logic

### New Controller (1)
15. `src/main/java/com/mukono/voting/api/admin/controller/ElectionTallyAdminController.java`

### New Tests (1)
16. `src/test/java/com/mukono/voting/api/admin/controller/ElectionTallyAdminControllerTest.java` - 8 comprehensive tests

### Modified Files (2)
17. `src/main/java/com/mukono/voting/api/admin/dto/CandidateResultsResponse.java` - Cleaned up duplicate constructors
18. `src/main/java/com/mukono/voting/api/admin/dto/ElectionResultsSummaryResponse.java` - Cleaned up duplicate constructors

### Documentation (1)
19. `project-assets/G3_SAMPLE_RESPONSES.md`

**Total: 19 files added/modified**

---

## Endpoint List

**Base Path:** `/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally`

### 1. POST /run
Run tally: compute winners, certify results, apply to winner assignments.

**Request:**
```json
{
  "remarks": "Final tally for 2025 election",
  "force": false
}
```

**Response:**
```json
{
  "tallyRunId": 1,
  "status": "COMPLETED",
  "electionId": 1,
  "votingPeriodId": 1,
  "totalPositionsTallied": 3,
  "totalWinnersApplied": 3,
  "tiesDetectedCount": 1,
  "serverTime": "2025-12-17T12:27:00.000Z",
  "message": "Tally completed successfully"
}
```

**Idempotency:** If already completed, returns existing results without recomputation.

### 2. GET /status
Get tally status for an election and voting period.

**Response:**
```json
{
  "tallyExists": true,
  "tallyRunId": 1,
  "status": "COMPLETED",
  "electionId": 1,
  "votingPeriodId": 1,
  "startedAt": "2025-12-17T12:27:00.000Z",
  "completedAt": "2025-12-17T12:27:02.500Z",
  "startedByPersonId": 1,
  "completedByPersonId": 1,
  "remarks": "Final tally for 2025 election",
  "totalPositionsCertified": 3,
  "totalWinnersApplied": 3
}
```

### 3. POST /rollback
Rollback tally (admin emergency).

**Query Parameter:** `?reason=Election%20disputed`

**Response:**
```json
{
  "tallyRunId": 1,
  "status": "ROLLED_BACK",
  "winnersRemoved": 3,
  "rolledBackAt": "2025-12-17T12:35:00.000Z",
  "message": "Tally rolled back successfully"
}
```

---

## Build Confirmation

```bash
$ mvn clean install
[INFO] BUILD SUCCESS
[INFO] Total time:  11.180 s
[INFO] Finished at: 2025-12-17T15:27:26+03:00
```

---

## Test Confirmation

```bash
$ mvn test
[INFO] Tests run: 32, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### G3 Test Coverage (8 tests)
- ✅ Cannot run tally when period OPEN (force=false) → 400
- ✅ Can run tally when period CLOSED → COMPLETED
- ✅ Idempotent: second run returns existing without duplicating winners
- ✅ Winner selection deterministic (tie handled by candidateId ASC)
- ✅ Certified results persisted (position + candidate rows)
- ✅ Winner assignments match seats count
- ✅ Rollback removes winners and marks tally ROLLED_BACK
- ✅ Get status returns correct info

---

## Key Features Implemented

### 1. Winner Computation with Deterministic Tie-Breaking

**Algorithm:**
1. Sort candidates by `voteCount` DESC
2. If tie: sort by `candidateId` ASC (deterministic, no randomness)
3. Select top N candidates by `seats`
4. Mark ties in `CertifiedPositionResult.notes`

**Example (1 seat, tie):**
```
Candidates:
  - Candidate A (ID=1): 50 votes
  - Candidate B (ID=2): 50 votes
  - Candidate C (ID=3): 30 votes

Winner: Candidate A (ID=1)
Reason: Tie resolved by candidateId ASC
Notes: "Tie detected at cutoff; resolved by candidateId ASC"
```

### 2. Idempotency & Concurrency Safety

**Unique Constraint:**
```sql
UNIQUE (election_id, voting_period_id) on election_tally_runs
```

**Pessimistic Locking:**
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
findByElectionIdAndVotingPeriodIdWithLock(...)
```

**Behavior:**
- First run: Creates tally, computes winners, persists results
- Second run: Returns existing results (idempotent)
- Concurrent runs: Blocked by database lock

### 3. Certified Results Persistence

**Three-tier snapshot:**

1. **ElectionTallyRun** - Tracks execution
   - Status: PENDING → COMPLETED/FAILED/ROLLED_BACK
   - Timestamps, admin IDs, remarks

2. **CertifiedPositionResult** - Position-level results
   - Turnout, total ballots
   - Notes (tie detection)

3. **CertifiedCandidateResult** - Candidate-level results
   - Vote count, vote share %, rank, isWinner flag

### 4. Winner Application to ElectionWinnerAssignment

**Authoritative outcome table:**
```java
ElectionWinnerAssignment {
  election, votingPeriod, position, candidate
  personId, voteCount, rank
  tallyRun (for audit/rollback)
  createdByPersonId
}
```

**Unique constraint:**
```sql
UNIQUE (election_id, voting_period_id, position_id, person_id)
```

### 5. Eligibility Constraints

**Tallying allowed only if:**
- ✅ Voting period belongs to election
- ✅ Voting period status is CLOSED (strict)
- ✅ OR `force=true` flag (admin override)

**Rejection:**
```
"Voting period must be CLOSED to tally results" → 400
```

### 6. Rollback Capability

**Safe rollback:**
1. Delete `ElectionWinnerAssignment` rows by `tallyRunId`
2. Mark `ElectionTallyRun.status` → ROLLED_BACK
3. Keep certified results (for audit)
4. Allow re-run after rollback

**Protection:**
- Can only rollback COMPLETED tallies
- Cannot rollback PENDING or FAILED

### 7. Transaction Safety

**Single transaction scope:**
```java
@Transactional
public RunTallyResponse runTally(...) {
  // 1. Validate
  // 2. Lock tally run
  // 3. Compute winners
  // 4. Persist certified results
  // 5. Apply winner assignments
  // 6. Mark COMPLETED
  // All or nothing
}
```

**Failure handling:**
- Exception → Mark tally as FAILED
- Rollback transaction
- Safe to retry

---

## Winner Computation Logic (Detailed)

### Algorithm Implementation
```java
// 1. Load candidates with vote counts
List<CandidateWithVotes> candidatesWithVotes = ...;

// 2. Sort: voteCount DESC, then candidateId ASC
candidatesWithVotes.sort(
  Comparator.comparing(CandidateWithVotes::getVoteCount).reversed()
    .thenComparing(c -> c.getCandidate().getId())
);

// 3. Determine winners (top N by seats)
Set<Long> winnerIds = new HashSet<>();
for (int i = 0; i < Math.min(seats, candidatesWithVotes.size()); i++) {
  winnerIds.add(candidatesWithVotes.get(i).getCandidate().getId());
}

// 4. Detect ties
if (candidatesWithVotes.size() > seats) {
  long winnerCutoffVotes = candidatesWithVotes.get(seats - 1).getVoteCount();
  long nextCandidateVotes = candidatesWithVotes.get(seats).getVoteCount();
  if (winnerCutoffVotes == nextCandidateVotes && winnerCutoffVotes > 0) {
    tieDetected = true;
    certifiedPositionResult.setNotes("Tie detected at cutoff; resolved by candidateId ASC");
  }
}
```

### Ranking
```java
int rank = 1;
for (CandidateWithVotes cwv : candidatesWithVotes) {
  CertifiedCandidateResult ccr = new CertifiedCandidateResult();
  ccr.setRank(rank++);
  ccr.setIsWinner(winnerIds.contains(cwv.getCandidate().getId()));
  // ...
}
```

---

## Database Schema

### ElectionTallyRun
```sql
CREATE TABLE election_tally_runs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  election_id BIGINT NOT NULL,
  voting_period_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL, -- PENDING, COMPLETED, FAILED, ROLLED_BACK
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  started_by_person_id BIGINT,
  completed_by_person_id BIGINT,
  remarks VARCHAR(1000),
  result_hash VARCHAR(64),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE (election_id, voting_period_id),
  INDEX idx_tally_run_election (election_id),
  INDEX idx_tally_run_period (voting_period_id),
  INDEX idx_tally_run_status (status)
);
```

### CertifiedPositionResult
```sql
CREATE TABLE certified_position_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  election_id BIGINT NOT NULL,
  voting_period_id BIGINT NOT NULL,
  position_id BIGINT NOT NULL,
  total_ballots_for_position BIGINT NOT NULL,
  turnout_for_position BIGINT NOT NULL,
  computed_at TIMESTAMP NOT NULL,
  computed_by_person_id BIGINT,
  status VARCHAR(20) NOT NULL, -- CERTIFIED
  notes VARCHAR(1000),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE (election_id, voting_period_id, position_id),
  INDEX idx_certified_pos_election (election_id),
  INDEX idx_certified_pos_period (voting_period_id),
  INDEX idx_certified_pos_position (position_id)
);
```

### CertifiedCandidateResult
```sql
CREATE TABLE certified_candidate_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  certified_position_result_id BIGINT NOT NULL,
  candidate_id BIGINT NOT NULL,
  vote_count BIGINT NOT NULL,
  vote_share_percent DOUBLE,
  rank INT NOT NULL,
  is_winner BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE (certified_position_result_id, candidate_id),
  INDEX idx_certified_cand_position (certified_position_result_id),
  INDEX idx_certified_cand_candidate (candidate_id),
  INDEX idx_certified_cand_winner (is_winner)
);
```

### ElectionWinnerAssignment
```sql
CREATE TABLE election_winner_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  election_id BIGINT NOT NULL,
  voting_period_id BIGINT NOT NULL,
  position_id BIGINT NOT NULL,
  candidate_id BIGINT NOT NULL,
  person_id BIGINT NOT NULL,
  vote_count BIGINT NOT NULL,
  rank INT NOT NULL,
  tally_run_id BIGINT NOT NULL,
  created_by_person_id BIGINT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE (election_id, voting_period_id, position_id, person_id),
  INDEX idx_winner_election (election_id),
  INDEX idx_winner_period (voting_period_id),
  INDEX idx_winner_position (position_id),
  INDEX idx_winner_person (person_id),
  INDEX idx_winner_tally (tally_run_id)
);
```

---

## Security

All endpoints require `ADMIN` role:
```java
@PreAuthorize("hasRole('ADMIN')")
```

Unauthorized access returns **403 Forbidden**.

---

## Error Handling

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| Period not CLOSED (force=false) | 400 | "Voting period must be CLOSED to tally results" |
| Tally already in progress | 400 | "Tally is already in progress" |
| Invalid election/period | 400 | "Invalid electionId" / "Invalid votingPeriodId" |
| Period doesn't belong to election | 400 | "VotingPeriod does not belong to election" |
| Rollback non-completed tally | 400 | "Can only rollback COMPLETED tallies" |
| No tally to rollback | 400 | "No tally found for this election and voting period" |
| Unauthorized (non-admin) | 403 | Forbidden |

---

## Integration with G1 and G2

**G1 (Vote Storage):**
- Uses `VoteTallyService.countVotesByCandidate()` for winner computation
- Uses `VoteTallyService.countTurnoutForPosition()` for turnout stats
- Uses `VoteTallyService.countElectionTurnout()` for election-wide turnout

**G2 (Results API):**
- G3 persists certified snapshots that won't change
- G2 reads live data (can change if more votes added)
- Both use the same underlying vote storage (G1)

**Future (Leadership Integration):**
- `ElectionWinnerAssignment` provides authoritative winner list
- Can be used to update `LeadershipAssignment` (not implemented in G3)
- Rollback capability ensures safe recovery

---

## Non-Goals (Strict Compliance)

✅ **Implemented in G3:**
- Winner computation with deterministic tie-breaking
- Certified results persistence
- ElectionWinnerAssignment creation
- Idempotency and concurrency safety
- Rollback capability

❌ **NOT implemented (as specified):**
- Automatic update of `LeadershipAssignment` table (safe to defer)
- Background jobs or scheduled tallies
- Manual tie-break UI (deterministic resolution used instead)
- Email notifications
- Audit log exports

---

## Completion Checklist

- [x] Entities created with proper constraints
- [x] Repositories with pessimistic locking
- [x] Winner computation with deterministic tie-breaking
- [x] Certified results persistence (3-tier)
- [x] Winner assignments applied
- [x] Idempotency enforced
- [x] Rollback capability implemented
- [x] Period status validation (CLOSED required)
- [x] Concurrent tally prevention
- [x] Transaction safety
- [x] Controller endpoints (3)
- [x] DTOs (4)
- [x] Tests (8 scenarios)
- [x] Build succeeds: `mvn clean install → SUCCESS`
- [x] Tests pass: `32/32 tests passed`
- [x] Sample JSON responses documented
- [x] No leadership table updates (deferred as safe)

---

## Status: ✅ G3 COMPLETE AND VERIFIED

**All requirements met. System is production-ready for election finalization.**
