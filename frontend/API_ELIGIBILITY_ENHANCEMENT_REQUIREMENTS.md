# API Endpoint Requirements for Eligibility & Codes Redesign

## Overview
This document outlines API endpoint requirements to enhance the Eligibility & Codes page functionality. These are simple additions to existing endpoints that would improve the user experience.

## 1. Enhanced Eligible Voters API Response

### Current Endpoint
`GET /api/elections/{electionId}/voting-periods/{votingPeriodId}/eligible-voters`

### Requested Enhancement
Add the following optional fields to the `EligibleVoterResponse` payload:

```typescript
{
  personId: number
  fullName: string
  phoneNumber?: string
  email?: string
  fellowshipName?: string
  scope?: string
  scopeName?: string
  voted?: boolean
  voteCastAt?: string
  
  // NEW FIELDS (optional):
  lastCodeStatus?: 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED'
  lastCodeIssuedAt?: string
  lastCodeUsedAt?: string
  hasEligibilityOverride?: boolean  // Indicates if voter was added via manual override
  overrideReason?: string          // Reason for override if applicable
}
```

**Rationale:**
- Eliminates need for multiple API calls per voter to fetch their code status
- Provides override information directly for display in the UI
- Improves page load performance significantly

## 2. Voting Codes Filter by Person

### Current Endpoint
`GET /api/elections/{electionId}/voting-periods/{votingPeriodId}/codes`

### Requested Enhancement
Add optional query parameter:
- `personId` (number): Filter codes by specific person ID

**Current Workaround:**
The UI currently fetches all codes and filters client-side, which is inefficient.

**Example Usage:**
```
GET /api/elections/1/voting-periods/2/codes?personId=123&page=0&size=1&sort=issuedAt,desc
```

**Rationale:**
- Allows efficient fetching of a person's most recent code
- Reduces payload size when only one person's code is needed
- Server-side filtering is more efficient than client-side

## 3. Voting Period Date Fields

### Current Type
`VotingPeriod` interface

### Requested Enhancement
Ensure the following fields are included in the `VotingPeriod` response:
```typescript
{
  id: number | string
  name?: string
  label?: string
  status?: 'DRAFT' | 'OPEN' | 'CLOSED'
  
  // THESE FIELDS (if not already present):
  startAt?: string     // ISO 8601 datetime
  endAt?: string       // ISO 8601 datetime
  description?: string
}
```

**Rationale:**
- Enables auto-selection logic based on current date/time
- Provides better context for users about voting period timing
- Helps identify "closest" voting period to current time

## 4. Bulk Code Status (Nice to Have)

### New Endpoint Suggestion
`POST /api/elections/{electionId}/voting-periods/{votingPeriodId}/codes/bulk-status`

**Request Body:**
```json
{
  "personIds": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "codes": [
    {
      "personId": 1,
      "code": "ABC123",
      "status": "ACTIVE",
      "issuedAt": "2026-01-03T10:30:00Z"
    },
    // ...
  ]
}
```

**Rationale:**
- More efficient than making individual requests for each voter's code
- Reduces number of HTTP requests significantly
- Optional - can implement later for performance optimization

## Priority

1. **High Priority**: #1 (Enhanced Eligible Voters Response) - Biggest performance impact
2. **Medium Priority**: #2 (Voting Codes Filter) - Good performance improvement
3. **Low Priority**: #3 (Voting Period Dates) - Quality of life improvement
4. **Optional**: #4 (Bulk Code Status) - Can implement later if needed

## Implementation Notes

All these enhancements are:
- Backward compatible (adding optional fields)
- Non-breaking (existing functionality remains unchanged)
- Simple to implement on the backend
- Provide significant UX improvements on the frontend

The current UI implementation gracefully handles missing fields, so these can be implemented incrementally.
