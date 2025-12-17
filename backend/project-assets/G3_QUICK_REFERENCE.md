# G3 Quick Reference

## Endpoints (Admin Only)

**Base:** `/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally`

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/run` | Compute winners, certify results, apply assignments |
| GET | `/status` | Check tally status and statistics |
| POST | `/rollback` | Emergency rollback (removes winners, marks ROLLED_BACK) |

## Key Classes

- **Service:** `ElectionTallyService`
- **Controller:** `ElectionTallyAdminController`
- **Entities:** `ElectionTallyRun`, `CertifiedPositionResult`, `CertifiedCandidateResult`, `ElectionWinnerAssignment`
- **Tests:** `ElectionTallyAdminControllerTest`

## Winner Computation

**Algorithm:**
1. Sort by `voteCount` DESC
2. Tie-break by `candidateId` ASC (deterministic)
3. Select top N by `seats`
4. Mark ties in notes if detected

**Example (1 seat, tie at 50 votes):**
- Candidate A (ID=1): 50 votes → **WINNER** (tie resolved by ID)
- Candidate B (ID=2): 50 votes → Runner-up
- Candidate C (ID=3): 30 votes

## Idempotency

- **First run:** Computes winners, persists results
- **Second run:** Returns existing results (no recomputation)
- **Unique constraint:** (election_id, voting_period_id) on ElectionTallyRun
- **Pessimistic lock:** Prevents concurrent runs

## Rollback

**Steps:**
1. Delete ElectionWinnerAssignment rows
2. Mark tally as ROLLED_BACK
3. Keep certified results (audit trail)
4. Allow re-run

**Restrictions:**
- Only COMPLETED tallies can be rolled back
- Cannot rollback PENDING or FAILED

## Test Results

```
Tests run: 32, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

**G3 Tests (8):**
- Cannot run when period OPEN
- Can run when period CLOSED
- Idempotent re-run
- Deterministic tie-breaking
- Certified results persisted
- Winners match seats
- Rollback works
- Status endpoint accurate

## Sample cURL

```bash
# Run tally
curl -X POST \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{"remarks":"Final tally","force":false}' \
  http://localhost:8080/api/v1/admin/elections/1/voting-periods/1/tally/run

# Get status
curl -H "Authorization: Bearer {admin-token}" \
  http://localhost:8080/api/v1/admin/elections/1/voting-periods/1/tally/status

# Rollback
curl -X POST \
  -H "Authorization: Bearer {admin-token}" \
  http://localhost:8080/api/v1/admin/elections/1/voting-periods/1/tally/rollback?reason=Disputed
```

## Data Flow

```
POST /run
  ↓
1. Validate (period CLOSED or force=true)
  ↓
2. Lock tally run (prevent concurrent)
  ↓
3. Compute winners (deterministic tie-breaking)
  ↓
4. Persist certified results
  ↓
5. Apply ElectionWinnerAssignment
  ↓
6. Mark COMPLETED
  ↓
Return response
```

## Security

All endpoints require `ADMIN` role. Unauthorized → 403.

## What G3 Does

✅ Computes winners (deterministic)  
✅ Certifies results (immutable snapshot)  
✅ Applies winners to ElectionWinnerAssignment  
✅ Prevents concurrent tallies  
✅ Supports rollback  

## What G3 Does NOT Do

❌ Update LeadershipAssignment table (safe to defer)  
❌ Send notifications  
❌ Change election status  
❌ Manual tie-break UI (uses deterministic resolution)  
