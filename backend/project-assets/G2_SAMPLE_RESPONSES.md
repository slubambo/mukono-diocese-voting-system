# G2 Results & Reporting APIs - Sample JSON Responses

## Base Path
```
/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/results
```

## 1. GET /summary
**Sample Response:**
```json
{
  "electionId": 1,
  "votingPeriodId": 1,
  "votingPeriodName": "Period 1",
  "periodStatus": "OPEN",
  "periodStartTime": "2025-12-17T08:00:00Z",
  "periodEndTime": "2025-12-17T18:00:00Z",
  "totalPositions": 2,
  "totalBallotsCast": 150,
  "totalSelectionsCast": 150,
  "totalDistinctVoters": 150,
  "serverTime": "2025-12-17T12:01:57.969878Z"
}
```

**Description:**
- `totalBallotsCast`: Count of VoteRecord entries (ballots cast per position)
- `totalSelectionsCast`: Count of VoteSelection entries (candidate selections)
- `totalDistinctVoters`: Unique personId count across all positions

---

## 2. GET /positions
**Sample Response:**
```json
[
  {
    "positionId": 1,
    "positionName": "Chairperson",
    "scope": "CHURCH",
    "seats": 1,
    "maxVotesPerVoter": 1,
    "turnoutForPosition": 150,
    "totalBallotsForPosition": 150,
    "candidates": [
      {
        "candidateId": 1,
        "personId": 10,
        "fullName": "Alice Smith",
        "voteCount": 85,
        "voteSharePercent": 56.67
      },
      {
        "candidateId": 2,
        "personId": 11,
        "fullName": "Bob Johnson",
        "voteCount": 65,
        "voteSharePercent": 43.33
      }
    ]
  },
  {
    "positionId": 2,
    "positionName": "Secretary",
    "scope": "CHURCH",
    "seats": 1,
    "maxVotesPerVoter": 1,
    "turnoutForPosition": 148,
    "totalBallotsForPosition": 148,
    "candidates": [
      {
        "candidateId": 3,
        "personId": 12,
        "fullName": "Carol Williams",
        "voteCount": 90,
        "voteSharePercent": 60.81
      },
      {
        "candidateId": 4,
        "personId": 13,
        "fullName": "David Brown",
        "voteCount": 58,
        "voteSharePercent": 39.19
      }
    ]
  }
]
```

**Sorting Rules:**
- Positions: sorted by `positionId` ASC
- Candidates: sorted by `voteCount` DESC, then `fullName` ASC (deterministic)

**Notes:**
- `voteSharePercent` is `null` if totalVotes for position is 0 (no votes cast)
- Empty votes case returns candidates with `voteCount: 0`

---

## 3. GET /positions/{positionId}
**Sample Response:**
```json
{
  "positionId": 1,
  "positionName": "Chairperson",
  "scope": "CHURCH",
  "seats": 1,
  "maxVotesPerVoter": 1,
  "turnoutForPosition": 150,
  "totalBallotsForPosition": 150,
  "candidates": [
    {
      "candidateId": 1,
      "personId": 10,
      "fullName": "Alice Smith",
      "voteCount": 85,
      "voteSharePercent": 56.67
    },
    {
      "candidateId": 2,
      "personId": 11,
      "fullName": "Bob Johnson",
      "voteCount": 65,
      "voteSharePercent": 43.33
    }
  ]
}
```

**Validation:**
- Returns 400 if position does not belong to election
- Same structure as one element from `/positions` endpoint

---

## 4. GET /export
**Sample Response:**
```json
[
  {
    "electionId": 1,
    "votingPeriodId": 1,
    "positionId": 1,
    "positionName": "Chairperson",
    "candidateId": 1,
    "personId": 10,
    "fullName": "Alice Smith",
    "voteCount": 85,
    "turnoutForPosition": 150,
    "totalBallotsForPosition": 150
  },
  {
    "electionId": 1,
    "votingPeriodId": 1,
    "positionId": 1,
    "positionName": "Chairperson",
    "candidateId": 2,
    "personId": 11,
    "fullName": "Bob Johnson",
    "voteCount": 65,
    "turnoutForPosition": 150,
    "totalBallotsForPosition": 150
  },
  {
    "electionId": 1,
    "votingPeriodId": 1,
    "positionId": 2,
    "positionName": "Secretary",
    "candidateId": 3,
    "personId": 12,
    "fullName": "Carol Williams",
    "voteCount": 90,
    "turnoutForPosition": 148,
    "totalBallotsForPosition": 148
  },
  {
    "electionId": 1,
    "votingPeriodId": 1,
    "positionId": 2,
    "positionName": "Secretary",
    "candidateId": 4,
    "personId": 13,
    "fullName": "David Brown",
    "voteCount": 58,
    "turnoutForPosition": 148,
    "totalBallotsForPosition": 148
  }
]
```

**Description:**
- Flat format suitable for CSV conversion in UI
- Each row represents one candidate in one position
- UI can easily convert to CSV with headers

---

## Security

All endpoints require `ADMIN` role:
```
@PreAuthorize("hasRole('ADMIN')")
```

Unauthorized access returns **403 Forbidden**.

---

## Error Handling

- **400 Bad Request**: Invalid electionId, votingPeriodId, or position does not belong to election
- **403 Forbidden**: User lacks ADMIN role
- **200 OK with empty data**: No votes cast (returns zeros/empty arrays, never 404)

---

## Test Coverage

All endpoints tested in `ElectionResultsAdminControllerTest`:
- ✅ Summary returns correct totals
- ✅ Positions endpoint returns deterministic ordering
- ✅ Single position returns same as positions subset
- ✅ Empty votes returns zeros (not 404)
- ✅ Unauthorized access returns 403
- ✅ Export returns correct flat format
