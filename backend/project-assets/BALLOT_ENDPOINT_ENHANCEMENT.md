# Ballot Endpoint Enhancement - Implementation Summary

**Date:** December 23, 2025  
**Status:** ✅ Complete

## Overview

Enhanced the ballot endpoint to make `electionPositionId` optional and add voting period filtering support. When `electionPositionId` is omitted, the endpoint returns candidates grouped by position. Optional `votingPeriodId` parameter filters results to only positions assigned to that voting period.

## Endpoint Changes

### GET /api/v1/ds/elections/{electionId}/candidates/ballot

#### Parameters

```
GET /api/v1/ds/elections/{electionId}/candidates/ballot
  [?electionPositionId=123]     (optional)
  [?votingPeriodId=456]         (optional)
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| electionId | Long | ✅ Yes | Election ID (path parameter) |
| electionPositionId | Long | ❌ No | Position ID for flat list response |
| votingPeriodId | Long | ❌ No | Voting period ID to filter positions |

#### Response Format

**Case 1: With electionPositionId**
- Returns flat list of `ElectionCandidateResponse[]`
- Candidates for specific position sorted alphabetically

```json
[
  {
    "id": 101,
    "electionId": 45,
    "electionPositionId": 67,
    "positionTitle": "Parish Secretary",
    "fellowshipName": "Men's Fellowship",
    "person": { "id": 200, "name": "Jane Doe" },
    "applicantId": 300,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Case 2: Without electionPositionId (grouped by position)**
- Returns `BallotGroupedByPositionResponse`
- Candidates grouped by election position
- Optional `votingPeriodId` filters to only positions in that period

```json
{
  "positions": [
    {
      "electionPositionId": 67,
      "positionTitle": "Parish Secretary",
      "fellowshipName": "Men's Fellowship",
      "fellowshipId": 12,
      "seats": 2,
      "positionScope": "CHURCH",
      "candidates": [
        {
          "id": 101,
          "electionId": 45,
          "electionPositionId": 67,
          "positionTitle": "Parish Secretary",
          "fellowshipName": "Men's Fellowship",
          "person": { "id": 200, "name": "Jane Doe" },
          "applicantId": 300,
          "createdAt": "...",
          "updatedAt": "..."
        }
      ]
    },
    {
      "electionPositionId": 68,
      "positionTitle": "Treasurer",
      "fellowshipName": "Women's Fellowship",
      "fellowshipId": 13,
      "seats": 1,
      "positionScope": "CHURCH",
      "candidates": [...]
    }
  ]
}
```

#### Usage Examples

**1. Get candidates for a specific position (backward compatible)**
```
GET /api/v1/ds/elections/45/candidates/ballot?electionPositionId=67
```
Returns: `ElectionCandidateResponse[]`

**2. Get all candidates grouped by position**
```
GET /api/v1/ds/elections/45/candidates/ballot
```
Returns: `BallotGroupedByPositionResponse` with all positions

**3. Get candidates for a voting period, grouped by position**
```
GET /api/v1/ds/elections/45/candidates/ballot?votingPeriodId=456
```
Returns: `BallotGroupedByPositionResponse` with only positions in voting period 456

**4. Get candidates for a specific position in a voting period**
```
GET /api/v1/ds/elections/45/candidates/ballot?electionPositionId=67&votingPeriodId=456
```
Returns: `ElectionCandidateResponse[]` (votingPeriodId ignored if position ID provided)

## Implementation Details

### New Files Created

1. **BallotGroupedByPositionResponse.java**
   - Root response DTO for grouped ballot
   - Contains list of `PositionGroup` objects
   - Each group includes position metadata and candidate list

2. **BallotGroupedByPositionResponse.PositionGroup**
   - Group metadata:
     - electionPositionId: Position ID
     - positionTitle: Title name
     - fellowshipName: Fellowship name
     - fellowshipId: Fellowship ID
     - seats: Number of seats
     - positionScope: DIOCESE/ARCHDEACONRY/CHURCH
   - candidates: List of `ElectionCandidateResponse`

3. **BallotGroupedByPositionResponse.PositionScope**
   - Enum mapping from `com.mukono.voting.model.leadership.PositionScope`
   - Values: DIOCESE, ARCHDEACONRY, CHURCH

### Service Layer Changes

**ElectionCandidateService**

**Added dependencies:**
- `VotingPeriodPositionRepository` for filtering by voting period

**New methods:**

1. `listBallotGroupedByPosition(Long electionId, Long votingPeriodId)`
   - Returns `BallotGroupedByPositionResponse`
   - Fetches all candidates with details
   - Groups by position
   - Optional voting period filtering
   - Returns groups sorted by position ID

**Updated methods:**
- Constructor updated to inject `VotingPeriodPositionRepository`
- Existing `listCandidatesForBallot(Long, Long)` unchanged for backward compatibility

### Controller Layer Changes

**DsElectionCandidateController**

**Updated endpoint:**
```java
@GetMapping("/ballot")
public ResponseEntity<?> ballot(
    @PathVariable Long electionId,
    @RequestParam(required = false) Long electionPositionId,
    @RequestParam(required = false) Long votingPeriodId)
```

**Logic:**
1. If `electionPositionId` is provided → return flat list (legacy behavior)
2. If `electionPositionId` is null → return grouped response
3. Optional `votingPeriodId` parameter filters to positions in that period
4. Return type is `ResponseEntity<?>` to support both response formats

## Database Queries

No new database tables required. Queries use existing relationships:

1. **Fetch all candidates with details**
   - `ElectionCandidateRepository.findAllCandidatesForElectionWithDetails(electionId)`
   - Includes eager fetch of position, fellowship position, and title

2. **Fetch position IDs for voting period**
   - `VotingPeriodPositionRepository.findElectionPositionIdsByVotingPeriod(electionId, votingPeriodId)`
   - Returns list of position IDs

3. **Grouping done in-memory**
   - Stream API for efficient grouping by position ID
   - Filtering by voting period positions

## Backward Compatibility

✅ **Fully backward compatible**
- Existing calls with `electionPositionId` parameter work unchanged
- Returns `List<ElectionCandidateResponse>` as before
- New grouped response only returned when `electionPositionId` is omitted

## Performance Considerations

**Voting Period Filtering:**
- Single query to fetch position IDs for period
- In-memory filtering of candidates
- Efficient for typical election sizes (100s-1000s of candidates)

**No N+1 Problems:**
- Uses eager fetch for all relationships
- Single query fetches all candidates with details
- Grouping done in memory

**Query Optimization:**
```sql
-- Fetches all candidates with eager loading
SELECT c FROM ElectionCandidate c 
JOIN FETCH c.person
JOIN FETCH c.electionPosition ep
JOIN FETCH ep.fellowshipPosition fp
JOIN FETCH fp.title
WHERE c.election.id = :electionId
ORDER BY c.person.fullName ASC

-- Fetches position IDs for voting period
SELECT vpp.electionPosition.id FROM VotingPeriodPosition vpp 
WHERE vpp.electionId = :electionId AND vpp.votingPeriod.id = :votingPeriodId
```

## Build Status

✅ **Compilation:** SUCCESS
✅ **Type Checks:** PASSED
✅ **Maven Package:** SUCCESS
- New file count: 229 sources (was 228)
- Build time: 2.793s

## Testing Notes

**Recommended test scenarios:**

1. **Legacy behavior (with position ID)**
   ```
   GET /api/v1/ds/elections/45/candidates/ballot?electionPositionId=67
   ```
   Expected: Flat list of candidates

2. **Grouped response (no position ID)**
   ```
   GET /api/v1/ds/elections/45/candidates/ballot
   ```
   Expected: Grouped by position

3. **Voting period filter**
   ```
   GET /api/v1/ds/elections/45/candidates/ballot?votingPeriodId=456
   ```
   Expected: Only positions assigned to voting period 456

4. **Position + Voting period (position takes precedence)**
   ```
   GET /api/v1/ds/elections/45/candidates/ballot?electionPositionId=67&votingPeriodId=456
   ```
   Expected: Flat list (position ID takes precedence, voting period ignored)

## Future Enhancements

1. **Sorting options** for grouped positions (by title, seats, etc.)
2. **Pagination** for large candidate lists within groups
3. **Candidate counts** in position group metadata
4. **Qualification summary** (seats vs. candidates ratio)
5. **Filtered voting period** - return only active/OPEN periods

## Related Documentation

- [Election Candidate Service](./ELECTION_POSITION_SERVICE_FIXES.md)
- [Voting Period API](./VOTING_PERIOD_ADMIN_API_SUMMARY.md)
- [Ballot Generation Documentation](./F2_BALLOT_ENDPOINT_DELIVERY.md)

---

**Implementation Complete** ✅  
Ready for deployment and frontend integration.
