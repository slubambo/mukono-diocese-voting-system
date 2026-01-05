# Eligible Voters - Complete Implementation with Voting Codes

## Final Implementation Summary
**Date:** January 5, 2026

## Overview

The eligible voters endpoint now correctly implements the following logic:

### Eligibility Criteria (Who Appears in the List)

A person appears in the eligible voters list if they have **AT LEAST ONE** of:

1. ✅ **A qualifying position** - Active leadership assignment that matches election scope rules
2. ✅ **A manual override** - Entry in `election_voter_roll` with `eligible = true`

**Note:** Voting codes are NOT required for appearing in the list. Codes are issued TO eligible voters after determining eligibility.

### Voting Code Information (Attached to Results)

For each eligible voter, the response includes:

#### 1. Active Code (Top-level Fields)
Shows the **ACTIVE code** if available, otherwise the **most recently issued code**:
- `code` - The voting code string
- `lastCodeStatus` - Status (ACTIVE, USED, EXPIRED, REVOKED)
- `lastCodeIssuedAt` - When the code was issued
- `lastCodeUsedAt` - When the code was used (if applicable)

**Prioritization Logic:**
```sql
ORDER BY 
    CASE WHEN vc.status = 'ACTIVE' THEN 0 ELSE 1 END,  -- Active codes first
    vc.issued_at DESC                                   -- Then by most recent
```

#### 2. Code History (Array)
Shows **ALL codes** ever issued to this person for the election/voting period:
- `codeHistory[]` - Array of all voting codes with full details
  - `code` - Code string
  - `status` - Status
  - `issuedAt` - Issue timestamp
  - `usedAt` - Use timestamp (if used)
  - `revokedAt` - Revocation timestamp (if revoked)
  - `expiredAt` - Expiration timestamp (if expired)

## Response Structure

### Example 1: Voter with Active Code
```json
{
  "personId": 36,
  "fullName": "Betty Muhaye",
  "phoneNumber": "0777600257",
  "position": "Chairperson",
  "location": "Namirembe Archdeaconry",
  "fellowship": "Men's Fellowship",
  "voted": false,
  "isOverride": false,
  
  // Active code (current)
  "code": "ABC123",
  "lastCodeStatus": "ACTIVE",
  "lastCodeIssuedAt": "2026-01-05T10:30:00",
  "lastCodeUsedAt": null,
  
  // All codes issued
  "codeHistory": [
    {
      "code": "ABC123",
      "status": "ACTIVE",
      "issuedAt": "2026-01-05T10:30:00",
      "usedAt": null,
      "revokedAt": null,
      "expiredAt": null
    },
    {
      "code": "XYZ789",
      "status": "EXPIRED",
      "issuedAt": "2026-01-04T14:20:00",
      "usedAt": null,
      "revokedAt": null,
      "expiredAt": "2026-01-05T10:00:00"
    }
  ]
}
```

### Example 2: Voter with Used Code
```json
{
  "personId": 32,
  "fullName": "Cyrus Wambuzi",
  "phoneNumber": "0784999878",
  "position": "Secretary",
  "location": "Buikwe Archdeaconry",
  "fellowship": "Women's Fellowship",
  "voted": true,
  "voteCastAt": "2026-01-05T11:15:00Z",
  "isOverride": false,
  
  // Latest code (used)
  "code": "DEF456",
  "lastCodeStatus": "USED",
  "lastCodeIssuedAt": "2026-01-05T10:45:00",
  "lastCodeUsedAt": "2026-01-05T11:15:00",
  
  // All codes issued
  "codeHistory": [
    {
      "code": "DEF456",
      "status": "USED",
      "issuedAt": "2026-01-05T10:45:00",
      "usedAt": "2026-01-05T11:15:00",
      "revokedAt": null,
      "expiredAt": null
    }
  ]
}
```

### Example 3: Eligible Voter with No Codes Yet
```json
{
  "personId": 37,
  "fullName": "Dicson Kagodo",
  "phoneNumber": "0753705456",
  "position": "Treasurer",
  "location": "Misindye Church",
  "fellowship": "Youth Fellowship",
  "voted": false,
  "isOverride": false,
  
  // No codes issued yet
  "code": null,
  "lastCodeStatus": null,
  "lastCodeIssuedAt": null,
  "lastCodeUsedAt": null,
  "codeHistory": null
}
```

### Example 4: Manual Override with Multiple Revoked Codes
```json
{
  "personId": 123,
  "fullName": "John Doe",
  "phoneNumber": "0700000000",
  "position": null,
  "location": null,
  "fellowship": null,
  "voted": false,
  "isOverride": true,
  "overrideReason": "Special guest",
  
  // Latest code (no active, so shows most recent)
  "code": "GHI789",
  "lastCodeStatus": "REVOKED",
  "lastCodeIssuedAt": "2026-01-05T12:00:00",
  "lastCodeUsedAt": null,
  
  // All codes (multiple revoked)
  "codeHistory": [
    {
      "code": "GHI789",
      "status": "REVOKED",
      "issuedAt": "2026-01-05T12:00:00",
      "usedAt": null,
      "revokedAt": "2026-01-05T12:30:00",
      "expiredAt": null
    },
    {
      "code": "JKL012",
      "status": "REVOKED",
      "issuedAt": "2026-01-05T11:00:00",
      "usedAt": null,
      "revokedAt": "2026-01-05T11:45:00",
      "expiredAt": null
    }
  ]
}
```

## SQL Query Logic

### Main Query Structure

```sql
SELECT 
    p.id AS personId,
    p.full_name AS fullName,
    -- ... other person fields
    
    -- Active/latest code (from vc join)
    vc.code AS code,
    vc.status AS lastCodeStatus,
    vc.issued_at AS lastCodeIssuedAt,
    vc.used_at AS lastCodeUsedAt,
    
    -- All codes (from subquery)
    (SELECT JSON_ARRAYAGG(...) FROM voting_codes WHERE ...) AS codeHistoryJson,
    
    -- Position info
    MAX(positionOnly.position_name) AS position,
    MAX(positionOnly.scope_name) AS location,
    MAX(positionOnly.fellowship_name) AS fellowship
    
FROM people p

-- Position eligibility (with hierarchy checks)
LEFT JOIN (...positionOnly subquery...) ON positionOnly.person_id = p.id

-- Manual overrides
LEFT JOIN (...election_voter_roll...) evr ON evr.person_id = p.id

-- Active/latest voting code
LEFT JOIN (
    SELECT person_id, code, status, issued_at, used_at
    FROM (
        SELECT vc.person_id, vc.code, vc.status, vc.issued_at, vc.used_at,
               ROW_NUMBER() OVER (
                   PARTITION BY vc.person_id 
                   ORDER BY 
                       CASE WHEN vc.status = 'ACTIVE' THEN 0 ELSE 1 END,
                       vc.issued_at DESC
               ) AS rn
        FROM voting_codes vc
        WHERE vc.election_id = :electionId
          AND (:votingPeriodId IS NULL OR vc.voting_period_id = :votingPeriodId)
    ) t
    WHERE t.rn = 1
) vc ON vc.person_id = p.id

-- Vote records (for voted status)
LEFT JOIN (...vote_records...) vr_vote ON vr_vote.person_id = p.id

WHERE (positionOnly.person_id IS NOT NULL OR evr.person_id IS NOT NULL)
  -- Note: NO voting code requirement here!
```

### Code Prioritization Logic

The `vc` join uses a sophisticated ORDER BY to select the "best" code:

```sql
ORDER BY 
    CASE WHEN vc.status = 'ACTIVE' THEN 0 ELSE 1 END,  -- Step 1: Active codes first
    vc.issued_at DESC                                   -- Step 2: Most recent
```

**Priority Order:**
1. **ACTIVE codes** (if any exist)
2. **Most recently issued code** (if no active codes)

**Examples:**
- Person has codes: ACTIVE(10am), EXPIRED(9am) → Returns ACTIVE
- Person has codes: USED(11am), EXPIRED(10am), REVOKED(9am) → Returns USED (most recent)
- Person has codes: EXPIRED(10am), EXPIRED(9am) → Returns EXPIRED(10am) (most recent)

## Use Cases

### 1. Bulk Code Generation
**Scenario:** Admin generates voting codes for all eligible voters

**Flow:**
1. Call `GET /eligible-voters` → Returns all eligible voters (even without codes)
2. Filter where `code == null` → Get voters needing codes
3. Call `POST /voting-codes/bulk` → Generate codes for those voters
4. Call `GET /eligible-voters` again → Now shows codes in results

### 2. Code Regeneration
**Scenario:** Voter requests new code (lost phone, code expired, etc.)

**Flow:**
1. Call `GET /eligible-voters?q=phone` → Find voter
2. Check `codeHistory` → See previous codes (expired/revoked)
3. Call `POST /voting-codes/regenerate` → Issue new code
4. New code appears as `code` (ACTIVE status)
5. Old codes remain in `codeHistory`

### 3. Voter Status Check
**Scenario:** Check if someone can vote

**Flow:**
1. Call `GET /eligible-voters?q=name` → Find voter
2. Check eligibility:
   - Not in results? → **Not eligible** (no position/override)
   - In results with `code != null` and `lastCodeStatus == 'ACTIVE'`? → **Can vote**
   - In results with `code == null`? → **Eligible but needs code**
   - In results with `voted == true`? → **Already voted**

### 4. Audit Trail
**Scenario:** Investigate voting irregularities

**Flow:**
1. Call `GET /eligible-voters` → Get all voters
2. Check `codeHistory` for each voter:
   - Multiple REVOKED codes? → May indicate issues
   - USED code but `voted == false`? → Data inconsistency
   - No codes but voted? → Impossible, investigate

## Election Scope Rules (Reminder)

### Diocese Election
- **Eligible:** People with ARCHDEACONRY positions in that diocese
- **Check:** `ad.diocese_id = e.diocese_id`

### Archdeaconry Election
- **Eligible:** People with CHURCH positions in that archdeaconry
- **Check:** `ch.archdeaconry_id = e.archdeaconry_id`

### Church Election
- **Eligible:** People with positions at that church
- **Check:** `la.church_id = e.church_id`

## Key Points

### ✅ Voting Codes Are Optional
- Eligible voters appear even without codes
- Codes are issued TO eligible voters
- Not having a code doesn't make someone ineligible

### ✅ Active Code Prioritization
- Response shows ACTIVE code if it exists
- Falls back to most recent code if no active code
- All codes available in `codeHistory` array

### ✅ Complete Code History
- Every code ever issued is tracked
- Status changes (ACTIVE → USED, EXPIRED, REVOKED) preserved
- Useful for audit and troubleshooting

### ✅ Voting Period Scoping
- Codes filtered by `voting_period_id` when specified
- Allows same election to have multiple voting periods
- Each period's codes tracked separately

## API Response Fields

| Field | Type | Description | Source |
|-------|------|-------------|--------|
| `personId` | Long | Person's ID | people table |
| `fullName` | String | Full name | people table |
| `phoneNumber` | String | Phone number | people table |
| `position` | String | Position title | First qualifying position |
| `location` | String | Scope location name | Diocese/Archdeaconry/Church |
| `fellowship` | String | Fellowship name | First qualifying position |
| `voted` | Boolean | Has voted? | vote_records table |
| `isOverride` | Boolean | Manual override? | election_voter_roll table |
| `code` | String | Active/latest code | voting_codes (prioritized) |
| `lastCodeStatus` | String | Code status | voting_codes (ACTIVE, USED, etc.) |
| `lastCodeIssuedAt` | DateTime | When code issued | voting_codes |
| `lastCodeUsedAt` | DateTime | When code used | voting_codes |
| `codeHistory` | Array | All codes | voting_codes (all rows) |

## Testing Scenarios

### Scenario 1: New Election, No Codes
- [ ] Endpoint returns eligible voters based on positions
- [ ] All code fields are NULL
- [ ] Count is correct

### Scenario 2: After Bulk Code Generation
- [ ] Same voters now have `code` populated
- [ ] `lastCodeStatus` = 'ACTIVE'
- [ ] `codeHistory` has one entry

### Scenario 3: After Some Vote
- [ ] Voted voters show `voted = true`
- [ ] Their `lastCodeStatus` = 'USED'
- [ ] `voteCastAt` is populated

### Scenario 4: After Code Regeneration
- [ ] Voter has multiple codes in `codeHistory`
- [ ] Latest ACTIVE code shows in `code` field
- [ ] Old codes show as EXPIRED/REVOKED in history

### Scenario 5: Manual Override
- [ ] Override voters appear in list
- [ ] Position fields are NULL
- [ ] Can have codes like regular voters

## Files Modified

**File:** `src/main/java/com/mukono/voting/repository/election/VotingCodeRepository.java`

**Changes:**
1. Updated `vc` join to prioritize ACTIVE codes using CASE in ORDER BY
2. Kept code history subquery (returns all codes)
3. WHERE clause requires position OR override (not codes)
4. Added organizational hierarchy checks (diocese_id, archdeaconry_id, church_id)

## Summary

✅ **Eligibility determined by:** Position OR Override (NOT codes)

✅ **Active code shown** when available, otherwise most recent code

✅ **All codes tracked** in codeHistory array

✅ **Organizational hierarchy** properly enforced

✅ **Build successful** - Ready to deploy

The implementation now correctly separates:
- **Eligibility** (determined by position/override)
- **Code availability** (optional, shown in results)
- **Vote status** (tracked separately)

This allows the system to:
1. Identify who can vote (eligible voters)
2. Track who has been issued codes
3. Monitor who has actually voted
4. Maintain complete audit trail

Perfect for the voting workflow! 🎉
