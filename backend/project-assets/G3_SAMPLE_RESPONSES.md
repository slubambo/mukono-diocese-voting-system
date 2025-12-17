# G3 Results Certification + Winners Application - Sample JSON Responses

## Base Path
```
/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally
```

---

## 1. POST /run
**Request Body:**
```json
{
  "remarks": "Final tally for 2025 election",
  "force": false
}
```

**Response (Successful Tally):**
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

**Response (Idempotent - Already Completed):**
```json
{
  "tallyRunId": 1,
  "status": "COMPLETED",
  "electionId": 1,
  "votingPeriodId": 1,
  "totalPositionsTallied": 3,
  "totalWinnersApplied": 3,
  "tiesDetectedCount": 1,
  "serverTime": "2025-12-17T12:28:00.000Z",
  "message": "Tally already completed (idempotent)"
}
```

**Error Response (Period Not Closed):**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "timestamp": "2025-12-17T12:27:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Voting period must be CLOSED to tally results"
}
```

---

## 2. GET /status
**Response (Tally Exists and Completed):**
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

**Response (No Tally Exists):**
```json
{
  "tallyExists": false,
  "tallyRunId": null,
  "status": null,
  "electionId": null,
  "votingPeriodId": null,
  "startedAt": null,
  "completedAt": null,
  "startedByPersonId": null,
  "completedByPersonId": null,
  "remarks": null,
  "totalPositionsCertified": null,
  "totalWinnersApplied": null
}
```

**Response (Tally in Progress):**
```json
{
  "tallyExists": true,
  "tallyRunId": 2,
  "status": "PENDING",
  "electionId": 2,
  "votingPeriodId": 2,
  "startedAt": "2025-12-17T12:30:00.000Z",
  "completedAt": null,
  "startedByPersonId": 1,
  "completedByPersonId": null,
  "remarks": "Large election tally",
  "totalPositionsCertified": null,
  "totalWinnersApplied": null
}
```

---

## 3. POST /rollback
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

**Error Response (Cannot Rollback Non-Completed):**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "timestamp": "2025-12-17T12:35:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Can only rollback COMPLETED tallies"
}
```

---

## Winner Computation Logic

### Deterministic Tie-Breaking
When multiple candidates have the same vote count:
- Sort by `voteCount` DESC
- If tie: sort by `candidateId` ASC (deterministic, no randomness)
- Pick top N candidates by `seats`

### Example (1 Seat, Tie):
```
Candidates:
  - Candidate A (ID=1): 50 votes
  - Candidate B (ID=2): 50 votes
  - Candidate C (ID=3): 30 votes

Winner: Candidate A (ID=1)
Reason: Tie between A & B resolved by candidateId ASC
```

### Tie Detection:
If the candidate at position `seats` has the same vote count as the candidate at position `seats+1`, a tie is detected and noted in `CertifiedPositionResult.notes`:

```
"Tie detected at cutoff; resolved by candidateId ASC"
```

---

## Data Persistence

### ElectionTallyRun
- Tracks tally execution status
- Unique constraint: (election_id, voting_period_id)
- Prevents concurrent tallies via pessimistic lock

### CertifiedPositionResult
- Persisted final results per position
- Includes turnout and total ballots
- Notes field captures tie information

### CertifiedCandidateResult
- One row per candidate per position
- Includes: voteCount, voteSharePercent, rank, isWinner
- Ranked 1..N by voteCount DESC

### ElectionWinnerAssignment
- Authoritative election outcome
- Links winners to positions
- Used for audit and leadership assignment
- Can be rolled back

---

## Security

All endpoints require `ADMIN` role:
```
@PreAuthorize("hasRole('ADMIN')")
```

Unauthorized access returns **403 Forbidden**.

---

## Idempotency

### POST /run
- First call: Computes winners, persists results
- Subsequent calls: Returns existing results (no recomputation)
- Unique constraint on ElectionTallyRun prevents duplicates

### POST /rollback
- Deletes ElectionWinnerAssignment rows
- Marks tally as ROLLED_BACK
- After rollback, can re-run tally

---

## Error Scenarios

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

## Test Coverage

All scenarios tested in `ElectionTallyAdminControllerTest`:
- ✅ Cannot run tally when period OPEN (force=false)
- ✅ Can run tally when period CLOSED
- ✅ Idempotent: second run returns existing without duplicating
- ✅ Winner selection deterministic (tie handled by candidateId ASC)
- ✅ Certified results persisted (position + candidate rows)
- ✅ Winner assignments match seats
- ✅ Rollback removes winners and marks ROLLED_BACK
- ✅ Get status returns correct info
