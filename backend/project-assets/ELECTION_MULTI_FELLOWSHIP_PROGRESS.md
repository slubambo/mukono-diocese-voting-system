# Election Multi-Fellowship Architecture - Implementation Progress

## Date: 2025-12-22

## Overview
Implementing multi-fellowship support for elections where one election can span multiple fellowships via voting periods/days.

## Completed Changes

### 1. Data Model Updates ✅

#### Election Entity
- **File**: `Election.java`
- Made `fellowship` field nullable and deprecated
- Added comment: "DEPRECATED - fellowships now inferred via positions"
- Elections no longer require a single fellowship at creation

#### ElectionPosition Entity
- **File**: `ElectionPosition.java`
- Added explicit `fellowship` field (required)
- Added `maxVotesPerVoter` field (default 1)
- Updated unique constraint to: `(election_id, fellowship_id, fellowship_position_id)`
- Added fellowship index

#### VotingPeriodPosition Entity (NEW)
- **File**: `VotingPeriodPosition.java`
- Join entity linking voting periods to election positions
- Fields: `id`, `electionId`, `votingPeriod`, `electionPosition`
- Unique constraint: `(voting_period_id, election_position_id)`
- Extends `DateAudit` for auditing

### 2. Repository Layer ✅

#### VotingPeriodPositionRepository (NEW)
- **File**: `VotingPeriodPositionRepository.java`
- `findElectionPositionIdsByVotingPeriod(electionId, votingPeriodId)`
- `findByElectionIdAndVotingPeriodId(electionId, votingPeriodId)`
- `existsByVotingPeriodIdAndElectionPositionId(...)`
- `deleteByVotingPeriodId(votingPeriodId)`
- `countByVotingPeriodId(votingPeriodId)`

### 3. Service Layer ✅

#### ElectionService Updates
- **File**: `ElectionService.java`
- Made `fellowshipId` parameter optional in `create()` method
- Removed fellowship requirement from duplicate election check
- Elections now scoped only by `scope + target + term dates`

#### VotingPeriodPositionService (NEW)
- **File**: `VotingPeriodPositionService.java`
- `assignPositions(electionId, votingPeriodId, electionPositionIds)` - replaces existing assignments
- Validates period is SCHEDULED before allowing modifications
- Validates all positions belong to the election
- `getAssignedPositionIds(electionId, votingPeriodId)`
- `getAssignedPositions(electionId, votingPeriodId)`
- `countAssignedPositions(votingPeriodId)`

### 4. DTOs ✅

#### Request Payloads
- **File**: `AssignVotingPeriodPositionsRequest.java`
  - `List<Long> electionPositionIds` (required, not empty)

#### Response Payloads
- **File**: `VotingPeriodPositionsResponse.java`
  - `votingPeriodId`, `electionId`
  - `List<Long> electionPositionIds`
  - `List<FellowshipPositionsGroup> byFellowship` - grouped for UI convenience
  - Nested classes: `FellowshipPositionsGroup`, `PositionSummary`

### 5. Controller Updates ✅ (Partial)

#### VotingPeriodAdminController
- **File**: `VotingPeriodAdminController.java`
- Added endpoints (stubbed, need service wiring):
  - `POST /{votingPeriodId}/positions` - assign positions to period
  - `GET /{votingPeriodId}/positions` - get assigned positions

## Remaining Work

### 6. Service Wiring (HIGH PRIORITY)

#### VotingPeriodService Updates Needed
- Inject `VotingPeriodPositionService`
- Implement `assignVotingPeriodPositions(electionId, votingPeriodId, request)`
- Implement `getVotingPeriodPositions(electionId, votingPeriodId)` with fellowship grouping

#### ElectionPositionRepository Updates
- Add method: `findByElectionIdOrderByFellowshipIdAscIdAsc(Long electionId)`
- Add method: `findAllByIdIn(List<Long> ids)` (if not exists)

### 7. Voting Flow Updates (CRITICAL)

#### F2 Ballot Endpoint
- **File**: `VoteController.java` (or similar)
- **Method**: `GET /api/v1/vote/ballot`
- Must filter positions by `votingPeriodId` from JWT
- Load assigned `electionPositionIds` for that period
- Return only candidates for those positions
- Group by fellowship, deterministic ordering

#### F3 Vote Submit Endpoint
- **File**: `VoteController.java`
- **Method**: `POST /api/v1/vote/submit`
- Validate submitted selections reference only assigned positions for the period
- Reject votes for positions not active in period (400)

### 8. Eligibility Updates (CRITICAL)

#### ElectionVoterEligibilityService
- **File**: `ElectionVoterEligibilityService.java`
- Update `checkEligibility(electionId, personId, votingPeriodId)`
- Derive active fellowships from assigned positions in the period
- Voter eligible if member of ANY active fellowship for that period
- If period has zero positions → reject with 400

### 9. Code Issuance Updates

#### VotingCodeService (or similar)
- Validate period has assigned positions before issuing codes
- Use updated eligibility service

### 10. Results & Tallying

#### Results Endpoints
- Update to use `electionPositionId` instead of generic `positionId`
- Include `fellowshipId`, `fellowshipName` in responses
- G3 winner application must derive fellowship from `electionPosition`

### 11. Database Migration

#### Migration Script Needed (Flyway/Liquibase)
```sql
-- 1. Make election.fellowship_id nullable
ALTER TABLE elections MODIFY COLUMN fellowship_id BIGINT NULL;

-- 2. Add fellowship_id to election_positions
ALTER TABLE election_positions 
  ADD COLUMN fellowship_id BIGINT NOT NULL AFTER election_id,
  ADD COLUMN max_votes_per_voter INT NOT NULL DEFAULT 1 AFTER seats,
  ADD INDEX idx_election_positions_fellowship (fellowship_id);

-- 3. Update unique constraint
ALTER TABLE election_positions 
  DROP INDEX uk_election_fellowship_position,
  ADD UNIQUE KEY uk_election_fellowship_position (election_id, fellowship_id, fellowship_position_id);

-- 4. Create voting_period_positions table
CREATE TABLE voting_period_positions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  election_id BIGINT NOT NULL,
  voting_period_id BIGINT NOT NULL,
  election_position_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_voting_period_position (voting_period_id, election_position_id),
  INDEX idx_vpp_voting_period (voting_period_id),
  INDEX idx_vpp_election_position (election_position_id),
  INDEX idx_vpp_election (election_id),
  FOREIGN KEY (voting_period_id) REFERENCES voting_periods(id),
  FOREIGN KEY (election_position_id) REFERENCES election_positions(id)
);

-- 5. Backfill fellowship_id for existing election_positions
UPDATE election_positions ep
JOIN elections e ON ep.election_id = e.id
SET ep.fellowship_id = e.fellowship_id
WHERE ep.fellowship_id IS NULL AND e.fellowship_id IS NOT NULL;
```

### 12. Response DTO Updates

#### ElectionResponse
- Remove or mark `fellowship` as deprecated
- Optionally add computed `fellowshipIds: List<Long>` derived from positions

#### ElectionPositionResponse
- Include `fellowshipId`, `fellowshipName`
- Include `maxVotesPerVoter`

### 13. Request DTO Updates

#### CreateElectionRequest / UpdateElectionRequest
- Make `fellowshipId` optional (not required)
- Update validation annotations

#### CreateElectionPositionRequest / UpdateElectionPositionRequest
- Ensure `fellowshipId` is required

### 14. Election Repository Updates

Remove methods that depend on fellowship:
- `existsByFellowshipIdAndScopeAndDioceseIdAndTermStartDateAndTermEndDate`
- `existsByFellowshipIdAndScopeAndArchdeaconryIdAndTermStartDateAndTermEndDate`
- `existsByFellowshipIdAndScopeAndChurchIdAndTermStartDateAndTermEndDate`

Add methods without fellowship:
- `existsByScopeAndDioceseIdAndTermStartDateAndTermEndDate`
- `existsByScopeAndArchdeaconryIdAndTermStartDateAndTermEndDate`
- `existsByScopeAndChurchIdAndTermStartDateAndTermEndDate`

### 15. Testing

- [ ] Create election without fellowship
- [ ] Add election positions with fellowships
- [ ] Assign positions to voting period
- [ ] Ballot returns only assigned positions
- [ ] Submit rejects non-assigned positions
- [ ] Eligibility checks active fellowships
- [ ] Results aggregate by electionPosition
- [ ] G3 applies winners with correct fellowship

## Files Created
1. `VotingPeriodPosition.java` - Join entity
2. `VotingPeriodPositionRepository.java` - Repository
3. `VotingPeriodPositionService.java` - Service layer
4. `AssignVotingPeriodPositionsRequest.java` - Request DTO
5. `VotingPeriodPositionsResponse.java` - Response DTO with nested classes

## Files Modified
1. `Election.java` - Made fellowship nullable/deprecated
2. `ElectionPosition.java` - Added fellowship field and maxVotesPerVoter
3. `ElectionService.java` - Made fellowship optional in create
4. `VotingPeriodAdminController.java` - Added position assignment endpoints

## Next Steps (Priority Order)

1. **Wire VotingPeriodService** - Connect to VotingPeriodPositionService
2. **Update Ballot endpoint** - Filter by assigned positions
3. **Update Submit endpoint** - Validate assigned positions
4. **Update Eligibility service** - Use active fellowships from period
5. **Create migration script** - Database schema changes
6. **Update response DTOs** - Include fellowship data
7. **Update ElectionRepository** - Remove fellowship-based queries
8. **Test end-to-end** - Full voting flow

## Notes

- All new code follows existing conventions (DateAudit, IllegalArgumentException→400)
- RBAC: Admin endpoints require `hasRole('ADMIN')`
- Deterministic ordering required for ballot/results
- Fellowship grouping in responses aids UI rendering
- Backward compatibility maintained where possible via nullable fields

## API Endpoints Added

```
PUT  /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/positions
  Body: { "electionPositionIds": [101, 102, 103] }
  Response: VotingPeriodResponse (200 OK)

GET  /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/positions
  Response: VotingPeriodPositionsResponse with fellowship grouping (200 OK)
```

## Sample Response Structure

```json
{
  "votingPeriodId": 7,
  "electionId": 364,
  "electionPositionIds": [101, 102, 103],
  "byFellowship": [
    {
      "fellowshipId": 2,
      "fellowshipName": "Fathers Union",
      "positions": [
        {
          "electionPositionId": 101,
          "fellowshipPositionId": 45,
          "positionTitle": "Chairman",
          "seats": 1,
          "maxVotesPerVoter": 1
        }
      ]
    },
    {
      "fellowshipId": 3,
      "fellowshipName": "Mothers Union",
      "positions": [...]
    }
  ]
}
```
