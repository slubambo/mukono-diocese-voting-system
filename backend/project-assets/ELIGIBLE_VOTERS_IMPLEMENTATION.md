# Eligible Voters Implementation Summary

**Date**: December 30, 2025  
**Status**: ✅ Complete

## Overview

Implemented comprehensive eligible voters tracking and management endpoints scoped to elections and voting periods, enabling accurate vote status monitoring with dynamic filtering capabilities.

---

## Endpoints Delivered

### 1. List Eligible Voters (Paginated)

**Endpoint**: `GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/eligible-voters`

**Query Parameters**:
- `page` (default: 0) - Page number (0-indexed)
- `size` (default: 20) - Items per page
- `sort` (default: "fullName,asc") - Sort specification
- `status` (default: "ALL") - Filter: `ALL` | `VOTED` | `NOT_VOTED`
- `q` (optional) - Search by name, phone, or email (case-insensitive)
- `fellowshipId` (optional) - Filter by fellowship
- `electionPositionId` (optional) - Filter by specific position

**Response Example**:
```json
{
  "content": [
    {
      "personId": 123,
      "fullName": "Jane Doe",
      "phoneNumber": "256700123456",
      "email": "jane@example.com",
      "fellowshipName": "Youth Fellowship",
      "scope": "DIOCESE",
      "scopeName": "Mukono Diocese",
      "voted": true,
      "voteCastAt": "2025-12-30T10:15:00Z",
      "lastCodeStatus": "USED",
      "lastCodeIssuedAt": "2025-12-30T09:45:00",
      "lastCodeUsedAt": "2025-12-30T10:15:00"
    }
  ],
  "totalElements": 145,
  "totalPages": 8,
  "page": 0,
  "size": 20,
  "last": false
}
```

### 2. Count Eligible Voters

**Endpoint**: `GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/eligible-voters/count`

**Query Parameters**:
- `status` (default: "ALL") - Filter: `ALL` | `VOTED` | `NOT_VOTED`
- `fellowshipId` (optional) - Filter by fellowship
- `electionPositionId` (optional) - Filter by specific position

**Response Example**:
```json
{
  "count": 145
}
```

### 3. Update Voting Period (NEW)

**Endpoint**: `PUT /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}`

**Request Body** (all fields optional for partial update):
```json
{
  "name": "Day One of Voting",
  "description": "First voting day",
  "startTime": "2025-12-30T05:46:00.000Z",
  "endTime": "2025-12-30T19:46:00.000Z"
}
```

**Response**: Returns updated `VotingPeriodResponse`

**Business Rules**:
- Cannot update CLOSED or CANCELLED periods
- Start time must be before end time
- Validates against existing voting window constraints

---

## Technical Implementation

### Components Created

#### 1. **EligibleVoterResponse** (DTO)
Path: `com.mukono.voting.payload.response.election.EligibleVoterResponse`

Fields:
- `personId`: Voter's person ID
- `fullName`: Full name of voter
- `phoneNumber`: Contact number (optional)
- `email`: Email address (optional)
- `fellowshipName`: Fellowship they belong to
- `scope`: Election scope (DIOCESE/ARCHDEACONRY/CHURCH)
- `scopeName`: Name of the scope target
- `voted`: Boolean indicating if they've cast a vote
- `voteCastAt`: Timestamp of vote submission (optional)
- `lastCodeStatus`: Status of most recent voting code (ACTIVE/USED/REVOKED/EXPIRED)
- `lastCodeIssuedAt`: When the latest code was issued
- `lastCodeUsedAt`: When the code was used to vote

#### 2. **EligibleVoterProjection** (Interface)
Path: `com.mukono.voting.repository.election.projection.EligibleVoterProjection`

Spring Data projection interface for native query results. Handles MariaDB-specific type conversions (Integer to Boolean for voted status).

#### 3. **EligibleVoterService**
Path: `com.mukono.voting.service.election.EligibleVoterService`

Service layer handling:
- Query coordination with repository
- Status filtering normalization
- Search query sanitization
- Projection to DTO mapping
- Type conversion (MariaDB Integer to Boolean)

#### 4. **VotingCodeRepository Enhancement**
Path: `com.mukono.voting.repository.election.VotingCodeRepository`

Added native SQL query method: `searchEligibleVoters()`

**Query Strategy**:
- Joins `people`, `leadership_assignments`, `fellowship_positions`, `fellowships`, `election_positions`, `elections`
- Left joins organization hierarchy (dioceses, archdeaconries, churches)
- Correlates with `vote_records` subquery (earliest vote per person)
- Correlates with `voting_codes` subquery (latest code via ROW_NUMBER window function)
- Filters by election, optional voting period, fellowship, position, vote status, and search text
- Groups to ensure distinct persons
- Includes optimized count query for pagination metadata

**MariaDB Compatibility**:
- Uses `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)` instead of PostgreSQL's `DISTINCT ON`
- Case-insensitive search via `LOWER()` function instead of `ILIKE`
- Handles `CASE WHEN` returning Integer (1/0) for boolean logic

#### 5. **VotingPeriodAdminController Enhancement**
Path: `com.mukono.voting.controller.admin.VotingPeriodAdminController`

Added three endpoints:
- `GET /{votingPeriodId}/eligible-voters` - Paginated list
- `GET /{votingPeriodId}/eligible-voters/count` - Count with filters
- `PUT /{votingPeriodId}` - Update voting period

---

## Database Query Performance

### Indexes Utilized
- `leadership_assignments(person_id, status)`
- `fellowship_positions(id, fellowship_id)`
- `election_positions(fellowship_position_id, election_id)`
- `vote_records(election_id, voting_period_id, person_id)`
- `voting_codes(election_id, voting_period_id, person_id, issued_at)`

### Query Optimization
- Subqueries for vote and code aggregation minimize full table scans
- Window functions efficiently select latest voting code per person
- Proper indexing on foreign keys ensures fast joins
- COUNT query mirrors main query structure for accuracy

---

## UI Integration Guidelines

### Filtering Workflow

1. **Default View**: Show all eligible voters (`status=ALL`)
2. **Voted Filter**: Show only those who cast votes (`status=VOTED`)
3. **Not Voted Filter**: Show those who haven't voted (`status=NOT_VOTED`)
4. **Fellowship Drill-Down**: Add `fellowshipId` to scope results to a specific fellowship
5. **Position Drill-Down**: Add `electionPositionId` to further filter by position
6. **Search**: Use `q` parameter for real-time name/phone/email search

### Display Recommendations

**Table Columns**:
- Full Name (sortable)
- Fellowship
- Scope/Location
- Voted Status (icon: ✓ or ✗)
- Vote Cast Time (if voted)
- Last Code Status (badge with color)
- Actions (view details, issue code if not voted)

**Badges/Icons**:
- Voted: Green checkmark with timestamp
- Not Voted: Yellow warning icon
- Code Status:
  - ACTIVE: Blue badge
  - USED: Green badge
  - REVOKED: Red badge
  - EXPIRED: Gray badge

**Filters Panel**:
- Status dropdown (All/Voted/Not Voted)
- Fellowship dropdown (dynamically loaded from election positions)
- Position dropdown (cascades from fellowship selection)
- Search box (debounced, min 2 characters)

### Sample API Calls

```javascript
// Initial load: all eligible voters, paginated
GET /api/v1/admin/elections/378/voting-periods/432/eligible-voters?page=0&size=20&sort=fullName,asc

// Filter: show only voted
GET /api/v1/admin/elections/378/voting-periods/432/eligible-voters?status=VOTED&page=0&size=20

// Drill-down: Youth Fellowship members who haven't voted
GET /api/v1/admin/elections/378/voting-periods/432/eligible-voters?status=NOT_VOTED&fellowshipId=5&page=0&size=20

// Search: find voters by name
GET /api/v1/admin/elections/378/voting-periods/432/eligible-voters?q=jane&page=0&size=20

// Get counts for dashboard
GET /api/v1/admin/elections/378/voting-periods/432/eligible-voters/count
GET /api/v1/admin/elections/378/voting-periods/432/eligible-voters/count?status=VOTED
GET /api/v1/admin/elections/378/voting-periods/432/eligible-voters/count?status=NOT_VOTED
```

---

## Testing Checklist

- [x] SQL syntax compatibility with MariaDB
- [x] Type conversion (Integer to Boolean for voted field)
- [x] Pagination works correctly
- [x] Sorting on all supported fields
- [x] Status filtering (ALL, VOTED, NOT_VOTED)
- [x] Search by name/phone/email (case-insensitive)
- [x] Fellowship filter
- [x] Position filter
- [x] Count endpoint accuracy
- [x] Update voting period endpoint
- [x] Validation on update requests
- [x] Business rules enforced (no update on CLOSED/CANCELLED)

---

## Known Limitations

1. **Performance**: For elections with 10,000+ eligible voters, consider adding a materialized view or caching layer
2. **Real-time Updates**: Vote status updates require page refresh; consider WebSocket for live updates
3. **Export**: No CSV/Excel export implemented yet (future enhancement)
4. **Audit Trail**: Updates to voting periods are tracked via DateAudit but no explicit changelog

---

## Future Enhancements

1. **Export Functionality**: Add CSV/Excel export for eligible voters list
2. **Bulk Operations**: Issue voting codes to multiple voters at once
3. **Email/SMS Integration**: Send voting codes directly from this view
4. **Real-time Dashboard**: WebSocket updates for vote counts
5. **Historical Comparison**: Compare turnout across voting periods
6. **Voter Engagement Metrics**: Track time-to-vote, code issuance to vote latency

---

## Documentation Updated

- `E5_4_USER_MANAGEMENT_API.md` - Added eligible voters endpoints documentation
- Controller JavaDocs - Comprehensive endpoint documentation
- Service layer comments - Query strategy and business rules
- Repository query comments - SQL optimization notes

---

## Security Considerations

- All endpoints require `ROLE_ADMIN` via `@PreAuthorize`
- Path variables validated with `@NotNull`
- Request bodies validated with `@Valid`
- SQL injection prevented via parameterized queries
- No sensitive data (passwords, internal IDs) exposed in responses

---

## Deployment Notes

- No schema migrations required (reuses existing tables)
- No configuration changes needed
- Compatible with existing authentication/authorization
- Backward compatible with existing voting period endpoints

---

**Implementation Complete**: All requested functionality delivered and tested. Ready for frontend integration and UAT.
