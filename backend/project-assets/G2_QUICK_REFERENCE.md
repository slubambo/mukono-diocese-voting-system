# G2 Quick Reference

## Endpoints (Admin Only)

**Base:** `/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/results`

| Method | Path | Returns |
|--------|------|---------|
| GET | `/summary` | Election summary (totals, turnout, period info) |
| GET | `/positions` | All positions with candidates and vote counts |
| GET | `/positions/{positionId}` | Single position results |
| GET | `/export` | Flat CSV-ready format |

## Key Classes

- **Controller:** `ElectionResultsAdminController`
- **Service:** `ElectionResultsAdminService`
- **DTOs:** `ElectionResultsSummaryResponse`, `PositionResultsResponse`, `CandidateResultsResponse`, `FlatResultRowResponse`
- **Tests:** `ElectionResultsAdminControllerTest`

## Data Definitions

- **totalBallotsCast:** Count of VoteRecord (ballots per position)
- **totalSelectionsCast:** Count of VoteSelection (candidate selections)
- **totalDistinctVoters:** Unique personId across election
- **turnoutForPosition:** Unique personId for one position
- **voteSharePercent:** `(voteCount / totalVotes) * 100` or `null` if no votes

## Test Results

```
Tests run: 24, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

## Sample cURL

```bash
# Get summary
curl -H "Authorization: Bearer {admin-token}" \
  http://localhost:8080/api/v1/admin/elections/1/voting-periods/1/results/summary

# Get all positions
curl -H "Authorization: Bearer {admin-token}" \
  http://localhost:8080/api/v1/admin/elections/1/voting-periods/1/results/positions

# Export CSV-ready data
curl -H "Authorization: Bearer {admin-token}" \
  http://localhost:8080/api/v1/admin/elections/1/voting-periods/1/results/export
```

## Security

All endpoints require `ADMIN` role. Unauthorized → 403.

## What G2 Does NOT Do

❌ Compute winners  
❌ Handle ties  
❌ Update leadership tables  
❌ Change election status  

**These are G3 scope.**
