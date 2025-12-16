# SECTION E5.1: VOTING DOMAIN MODEL - COMPLETE

**Implementation Date:** December 16, 2025  
**Status:** ✅ **COMPLETE AND VERIFIED**

---

## Files Created (3)

### 1. VoteStatus.java ✅
**Location:** `src/main/java/com/mukono/voting/model/election/VoteStatus.java`

**Enum Values:**
- CAST - Vote has been cast
- REVOKED - Vote has been revoked

**Storage:** STRING (@Enumerated(EnumType.STRING))

### 2. ElectionVote.java ✅
**Location:** `src/main/java/com/mukono/voting/model/election/ElectionVote.java`

**Table:** `election_votes`

**Fields:** 8 (id, election, position, candidate, voter, castAt, status, source)

**Unique Constraint:** (election_id, election_position_id, voter_id)

**Indexes:** 6
- idx_election_votes_election
- idx_election_votes_position
- idx_election_votes_candidate
- idx_election_votes_voter
- idx_election_votes_election_position
- idx_election_votes_election_voter

### 3. ElectionVoterRoll.java ✅
**Location:** `src/main/java/com/mukono/voting/model/election/ElectionVoterRoll.java`

**Table:** `election_voter_roll`

**Fields:** 6 (id, election, person, eligible, reason, addedBy, addedAt)

**Unique Constraint:** (election_id, person_id)

**Indexes:** 4
- idx_voter_roll_election
- idx_voter_roll_person
- idx_voter_roll_eligible
- idx_voter_roll_election_eligible

---

## Table Schemas

### election_votes
| Column | Type | Constraint |
|--------|------|-----------|
| id | BIGINT PK | Auto-increment |
| election_id | BIGINT | NOT NULL, FK |
| election_position_id | BIGINT | NOT NULL, FK |
| candidate_id | BIGINT | NOT NULL, FK |
| voter_id | BIGINT | NOT NULL, FK |
| cast_at | TIMESTAMP | NOT NULL |
| status | VARCHAR(20) | NOT NULL, default CAST |
| source | VARCHAR(50) | Nullable |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**Unique:** (election_id, election_position_id, voter_id)

### election_voter_roll
| Column | Type | Constraint |
|--------|------|-----------|
| id | BIGINT PK | Auto-increment |
| election_id | BIGINT | NOT NULL, FK |
| person_id | BIGINT | NOT NULL, FK |
| eligible | BOOLEAN | NOT NULL, default true |
| reason | VARCHAR(1000) | Nullable |
| added_by | VARCHAR(255) | Nullable |
| added_at | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**Unique:** (election_id, person_id)

---

## Relationships

**ElectionVote:**
- election → Election (M:1, LAZY)
- electionPosition → ElectionPosition (M:1, LAZY)
- candidate → ElectionCandidate (M:1, LAZY)
- voter → Person (M:1, LAZY)

**ElectionVoterRoll:**
- election → Election (M:1, LAZY)
- person → Person (M:1, LAZY)

---

## Constraints & Indexes

| Entity | Unique Constraints | Indexes |
|--------|-------------------|---------|
| ElectionVote | 1 (election, position, voter) | 6 |
| ElectionVoterRoll | 1 (election, person) | 4 |
| **Total** | **2** | **10** |

---

## Build Status

```
✅ BUILD SUCCESS
✅ 136 source files compiled (+3 new)
✅ Zero errors
✅ Zero warnings
✅ 2.115 seconds
```

---

## Key Design Features

### Vote Audit Trail
- castAt: Automatic timestamp
- status: CAST or REVOKED
- source: Optional (WEB/MOBILE/USSD)
- createdAt/updatedAt: DateAudit

### Voter Eligibility Override
- eligible: Boolean flag (true = allow, false = block)
- reason: Override explanation
- addedBy: Admin username for audit
- addedAt: When override was added

### One Vote Per Position
- Unique constraint prevents double voting in same position
- Allows same voter to vote in different positions

---

## Eligibility Enforcement (E5.3 Strategy)

**3-Tier Eligibility Check:**

1. **Voter Roll Override (Highest Priority)**
   - eligible = false → BLOCK
   - eligible = true → ALLOW

2. **Scope-Based Eligibility**
   - Voter must match election's fellowship
   - Voter must match election's scope (DIOCESE/ARCHDEACONRY/CHURCH)

3. **Default Eligibility**
   - Member of fellowship + scope match = ALLOW

---

## Compliance

| Requirement | Status |
|------------|--------|
| VoteStatus enum | ✅ |
| ElectionVote entity | ✅ |
| ElectionVoterRoll entity | ✅ |
| DateAudit inheritance | ✅ |
| Unique constraints (2) | ✅ |
| Indexes (10 total) | ✅ |
| Validation | ✅ |
| Build success | ✅ |

**100% Complete** ✅

---

## Ready For

- **E5.2:** Repositories (ElectionVoteRepository, ElectionVoterRollRepository)
- **E5.3:** Services (Voting, Eligibility, Vote Counting)
- **E5.4:** Controllers & DTOs (REST APIs)

---

**Report Generated:** December 16, 2025  
**Status:** ✅ READY FOR E5.2
