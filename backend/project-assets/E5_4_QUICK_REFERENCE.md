# E5.4 REST API - Quick Reference Guide

**Date:** December 17, 2025  
**Status:** ✅ COMPLETE & READY

---

## 🚀 Quick Start

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication
(Assumed handled elsewhere in project)

---

## 📋 All Endpoints at a Glance

### 1️⃣ Check Eligibility (Public)
```
GET /elections/{electionId}/eligibility/me?voterPersonId={voterId}

Response: 200 OK
{
  "eligible": true,
  "rule": "VOTER_ROLL_ALLOW",
  "reason": "Whitelisted voter: Special voter"
}
```

### 2️⃣ Cast Vote (Public)
```
POST /elections/{electionId}/positions/{positionId}/votes

Request:
{
  "candidateId": 42,
  "voterId": 100,
  "source": "WEB"
}

Response: 201 Created
{
  "voteId": 501,
  "electionId": 1,
  "positionId": 5,
  "candidateId": 42,
  "voterId": 100,
  "status": "CAST",
  "castAt": "2025-12-17T09:35:32Z",
  "source": "WEB"
}
```

### 3️⃣ Recast Vote (Public)
```
PUT /elections/{electionId}/positions/{positionId}/votes

Request:
{
  "candidateId": 43,
  "voterId": 100,
  "source": "WEB"
}

Response: 200 OK
{ ...same as cast vote... }
```

### 4️⃣ Revoke Vote (Public)
```
DELETE /elections/{electionId}/positions/{positionId}/votes?voterId={voterId}

Response: 200 OK
{
  "voteId": 501,
  "status": "REVOKED",
  ...
}
```

### 5️⃣ Get My Vote (Public)
```
GET /elections/{electionId}/positions/{positionId}/votes/me?voterId={voterId}

Response: 200 OK or 404 Not Found
{ ...vote response... }
```

### 6️⃣ Get Position Tally (Public Results)
```
GET /elections/{electionId}/results/positions/{positionId}/tally

Response: 200 OK
{
  "electionId": 1,
  "positionId": 5,
  "items": [
    {"candidateId": 42, "votes": 150},
    {"candidateId": 43, "votes": 120},
    {"candidateId": 44, "votes": 85}
  ],
  "totalVotes": 355
}
```

### 7️⃣ Get Winner (Public Results)
```
GET /elections/{electionId}/results/positions/{positionId}/winner

Response (winner): 200 OK
{
  "tie": false,
  "winnerCandidateId": 42,
  "topCandidateIds": [42],
  "topVotes": 150
}

Response (tie): 200 OK
{
  "tie": true,
  "winnerCandidateId": null,
  "topCandidateIds": [42, 43],
  "topVotes": 120
}
```

### 8️⃣ Get Turnout (Public Results)
```
GET /elections/{electionId}/results/turnout

Response: 200 OK
{
  "electionId": 1,
  "items": [
    {"positionId": 5, "votes": 355},
    {"positionId": 6, "votes": 340},
    {"positionId": 7, "votes": 320}
  ]
}
```

### 9️⃣ Get Turnout Percentage (Public Results)
```
GET /elections/{electionId}/results/positions/{positionId}/turnout-percentage

Response: 200 OK
{
  "electionId": 1,
  "positionId": 5,
  "turnoutPercentage": 85.5
}
```

### 🔟 Get Unique Voters (Public Results)
```
GET /elections/{electionId}/results/unique-voters

Response: 200 OK
{
  "electionId": 1,
  "uniqueVoters": 415
}
```

### 1️⃣1️⃣ Add/Update Override (Admin)
```
PUT /admin/elections/{electionId}/voter-roll/{personId}

Request:
{
  "eligible": true,
  "addedBy": "admin@example.com",
  "reason": "Special voter - bishop"
}

Response: 201 Created
{
  "id": 201,
  "electionId": 1,
  "personId": 100,
  "eligible": true,
  "reason": "Special voter - bishop",
  "addedBy": "admin@example.com",
  "addedAt": "2025-12-17T09:35:32Z"
}
```

### 1️⃣2️⃣ Remove Override (Admin)
```
DELETE /admin/elections/{electionId}/voter-roll/{personId}

Response: 204 No Content
```

### 1️⃣3️⃣ List Overrides (Admin - Paginated)
```
GET /admin/elections/{electionId}/voter-roll/?eligible=true&page=0&size=20&sort=addedAt,desc

Response: 200 OK
{
  "content": [
    { ...voter roll entry... },
    { ...voter roll entry... }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 45,
  "totalPages": 3,
  "last": false
}
```

### 1️⃣4️⃣ Count Overrides (Admin)
```
GET /admin/elections/{electionId}/voter-roll/count?eligible=true

Response: 200 OK
{
  "count": 25
}
```

---

## ❌ Error Responses

All errors follow this format:

```json
{
  "timestamp": "2025-12-17T09:35:32Z",
  "status": 400,
  "error": "Error Type",
  "message": "Detailed message",
  "path": "/api/v1/elections/1/positions/5/votes"
}
```

### Common Status Codes

| Status | Error | Message Example |
|--------|-------|-----------------|
| **400** | Validation Error | `candidateId: Candidate ID is required` |
| **400** | Invalid Request | `You have already voted for this position` |
| **400** | Invalid Request | `You are not eligible to vote in this election` |
| **404** | Not Found | `Election not found: 999` |
| **500** | Internal Server Error | `An unexpected error occurred` |

---

## ✅ Validation Rules

### Cast Vote Request
- ✅ `candidateId` is required (not null)
- ✅ `voterId` is required (not null)
- ✅ `source` max 50 characters (optional)

### Voter Roll Override Request
- ✅ `eligible` is required (not null) - true to whitelist, false to blacklist
- ✅ `addedBy` max 255 characters (optional)
- ✅ `reason` max 1000 characters (optional)

### Path Variables (All Endpoints)
- ✅ `electionId` is required (not null)
- ✅ `positionId` is required (not null)
- ✅ `voterId` is required (not null)
- ✅ `personId` is required (not null)

---

## 📊 Response DTOs Summary

| DTO | Usage | Contains |
|-----|-------|----------|
| **EligibilityDecisionResponse** | Eligibility check | eligible, rule, reason |
| **VoteResponse** | Vote operations | voteId, electionId, positionId, candidateId, voterId, status, castAt, source |
| **PositionTallyResponse** | Position tally | electionId, positionId, items (candidate votes), totalVotes |
| **WinnerResponse** | Winner determination | tie, winnerCandidateId, topCandidateIds, topVotes |
| **ElectionTurnoutResponse** | Turnout by position | electionId, items (position votes) |
| **TurnoutPercentageResponse** | Turnout % | electionId, positionId, turnoutPercentage |
| **UniqueVotersResponse** | Voter count | electionId, uniqueVoters |
| **VoterRollEntryResponse** | Override entries | id, electionId, personId, eligible, reason, addedBy, addedAt |
| **PagedResponse** | List endpoints | content, page, size, totalElements, totalPages, last |
| **CountResponse** | Count endpoints | count |
| **ApiErrorResponse** | All errors | timestamp, status, error, message, path, traceId |

---

## 🔍 Common Use Cases

### Use Case 1: Voter Checks Eligibility Then Votes
```bash
# Step 1: Check if eligible
curl -X GET "http://localhost:8080/api/v1/elections/1/eligibility/me?voterPersonId=100"

# Step 2: If eligible, cast vote
curl -X POST "http://localhost:8080/api/v1/elections/1/positions/5/votes" \
  -H "Content-Type: application/json" \
  -d '{"candidateId": 42, "voterId": 100, "source": "WEB"}'
```

### Use Case 2: Voter Changes Mind and Recasts
```bash
# Option A: Revoke then cast
curl -X DELETE "http://localhost:8080/api/v1/elections/1/positions/5/votes?voterId=100"
curl -X POST "http://localhost:8080/api/v1/elections/1/positions/5/votes" \
  -H "Content-Type: application/json" \
  -d '{"candidateId": 43, "voterId": 100, "source": "WEB"}'

# Option B: Direct recast (atomic)
curl -X PUT "http://localhost:8080/api/v1/elections/1/positions/5/votes" \
  -H "Content-Type: application/json" \
  -d '{"candidateId": 43, "voterId": 100, "source": "WEB"}'
```

### Use Case 3: Admin Checks Results and Manages Voter Roll
```bash
# Get tally
curl -X GET "http://localhost:8080/api/v1/elections/1/results/positions/5/tally"

# Get winner
curl -X GET "http://localhost:8080/api/v1/elections/1/results/positions/5/winner"

# List voter overrides
curl -X GET "http://localhost:8080/api/v1/admin/elections/1/voter-roll/?page=0&size=20"

# Whitelist a special voter
curl -X PUT "http://localhost:8080/api/v1/admin/elections/1/voter-roll/150" \
  -H "Content-Type: application/json" \
  -d '{"eligible": true, "addedBy": "admin@example.com", "reason": "Bishop"}'
```

---

## 🔐 Security Notes

### Current Implementation
- No authentication enforced in E5.4 (assumed handled elsewhere)
- Admin endpoints `/api/v1/admin/**` separated for future role protection
- No @PreAuthorize annotations (can be added later)

### Future Considerations
- Add Spring Security @PreAuthorize("hasRole('ADMIN')") to admin endpoints
- Add audit logging to voter operations
- Add rate limiting to voting endpoints
- Add request signing/verification for critical operations

---

## 📚 Related Sections

- **E5.1** - Voting Domain Model (ElectionVote, ElectionVoterRoll)
- **E5.2** - Voting Repositories (Tally queries, result queries)
- **E5.3** - Voting Services (ElectionVotingService, ElectionVoterEligibilityService, ElectionResultsService)
- **E5.4** - Voting Controllers (YOU ARE HERE) ✅

---

**Quick Reference Ready:** December 17, 2025  
**Status:** ✅ 14 Endpoints, 16 DTOs, All Validated
