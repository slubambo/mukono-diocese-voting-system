# Current Implementation - Eligible Voters Conditions Summary

**Generated:** January 5, 2026

## The Current Conditions in Your System

When you call the eligible voters endpoint, the system applies THESE exact conditions:

---

## CONDITION 1: Person Must Exist in Database
```
FROM people p
```
✅ **Status:** Basic - always true

---

## CONDITION 2: Person Must Have a Qualifying Position (OR Manual Override)

### Part A: Finding Positions That Qualify

The query joins these tables in order:
```
leadership_assignments la
  ↓
fellowship_positions fp (via la.fellowship_position_id)
  ↓
position_titles pt (via fp.title_id)
  ↓
fellowships f (via fp.fellowship_id)
  ↓
election_positions ep (via ep.fellowship_position_id AND ep.election_id = 380)
  ↓
elections e (via e.id = ep.election_id)
```

**Translation:**
1. Person must have a leadership assignment
2. That assignment must reference a fellowship position
3. That fellowship position must be registered in THIS election (election_positions)
4. We get the election details from elections table

### Part B: Verifying Position Status

```sql
WHERE la.status = 'ACTIVE'
```

**Translation:** Position must be ACTIVE (not ENDED, not DRAFT, etc.)

### Part C: Verifying Position Level and Location

```sql
AND (
    (e.scope = 'DIOCESE' 
     AND la.archdeaconry_id IS NOT NULL 
     AND ad.diocese_id = e.diocese_id)
 OR (e.scope = 'ARCHDEACONRY' 
     AND la.church_id IS NOT NULL 
     AND ch.archdeaconry_id = e.archdeaconry_id)
 OR (e.scope = 'CHURCH' 
     AND la.church_id = e.church_id)
)
```

**Translation:**

| If Election Is | Then Person Must Have | And That Must Be In |
|---|---|---|
| **DIOCESE** (e.g., Mukono Diocese) | ARCHDEACONRY position | That specific DIOCESE |
| **ARCHDEACONRY** (e.g., Namirembe) | CHURCH position | That specific ARCHDEACONRY |
| **CHURCH** (e.g., Misindye Church) | Position at | That specific CHURCH |

**Examples:**
- Mukono Diocese election → Person needs archdeaconry position in Mukono (not Kampala)
- Namirembe Archdeaconry election → Person needs church position in Namirembe (not Buikwe)
- Misindye Church election → Person needs position at Misindye (not Mutundwe)

### Part D: Select Only First Position (When Multiple)

```sql
ROW_NUMBER() OVER (PARTITION BY la.person_id ORDER BY la.id ASC) AS rn
...
WHERE rn = 1
```

**Translation:** If person has multiple qualifying positions, only use the first one (oldest by ID)

### Result of Conditions 1 & 2A-2D:
You get a table called `positionOnly` containing people who:
- Have an ACTIVE leadership assignment
- At a position registered for this election
- At the right organizational level
- In the right organizational location
- Only the first position if they have multiple

---

## CONDITION 3: Manual Overrides (Alternative to Condition 2)

```sql
LEFT JOIN (
    SELECT evr.person_id, evr.id AS evr_id, evr.reason
    FROM election_voter_roll evr
    WHERE evr.election_id = :electionId 
      AND evr.voting_period_id = :votingPeriodId
      AND evr.eligible = true
) evr ON evr.person_id = p.id
```

**Translation:** 
- Person is in `election_voter_roll` table
- For THIS election (election_id = 380)
- For THIS voting period (voting_period_id = 438)
- With `eligible = true` flag

---

## CONDITION 4: MUST Have Either Condition 2 OR Condition 3

```sql
WHERE (positionOnly.person_id IS NOT NULL OR evr.person_id IS NOT NULL)
```

**Translation:**
- Person has qualifying position (from Condition 2), **OR**
- Person is manual override (from Condition 3)
- **At least one must be true, otherwise person is not listed**

---

## CONDITION 5: Other Optional Filters (If Specified)

If you passed parameters:

### Filter by Fellowship
```sql
AND (:fellowshipId IS NULL OR positionOnly.f_id = :fellowshipId)
```
- If you specified `?fellowshipId=5`, only show people in fellowship 5
- If not specified or NULL, show all

### Filter by Election Position
```sql
AND (:electionPositionId IS NULL OR positionOnly.ep_id = :electionPositionId)
```
- If you specified `?electionPositionId=10`, only show people in that position type
- If not specified, show all

### Filter by Vote Status
```sql
AND (:status = 'ALL'
     OR (:status = 'VOTED' AND vr_vote.person_id IS NOT NULL)
     OR (:status = 'NOT_VOTED' AND vr_vote.person_id IS NULL))
```
- `?status=VOTED` → Only show people who have already voted
- `?status=NOT_VOTED` → Only show people who haven't voted
- `?status=ALL` (default) → Show everyone

### Filter by Search Query
```sql
AND (:q IS NULL OR LOWER(p.full_name) LIKE CONCAT('%', LOWER(:q), '%')
     OR LOWER(p.phone_number) LIKE CONCAT('%', LOWER(:q), '%')
     OR LOWER(p.email) LIKE CONCAT('%', LOWER(:q), '%'))
```
- `?q=betty` → Only show people with "betty" in name/phone/email
- If not specified, show all

---

## The Complete Logic in One Sentence

```
Return all people who:
  - Have an ACTIVE position at the right organizational level and location
    for this election
  OR
  - Are in the manual override list for this election+period
AND
  - Pass any additional filters (if specified)
```

---

## What Does NOT Require Voting Codes?

```
❌ Does NOT require: vc.code IS NOT NULL
```

People appear in eligible voters even if:
- They haven't been issued a voting code yet
- Their voting code has expired
- Their voting code has been revoked
- They have no codes at all

**Why?** Because eligible voters are determined by POSITIONS, not codes.
Codes are issued TO eligible voters.

---

## What About Voting Codes Then?

If a person IS in the eligible voters list, the response ALSO includes:

### Code Fields (Current Active/Latest Code)
```json
{
  "code": "ABC123",              // The voting code string
  "lastCodeStatus": "ACTIVE",    // Status: ACTIVE, USED, EXPIRED, REVOKED
  "lastCodeIssuedAt": "...",     // When issued
  "lastCodeUsedAt": null         // When used (if applicable)
}
```

These are:
- The ACTIVE code (if one exists), OR
- The most recently issued code (if no active code)
- NULL if no codes issued yet

### Code History (All Codes)
```json
{
  "codeHistory": [
    { "code": "ABC123", "status": "ACTIVE", ... },
    { "code": "XYZ789", "status": "EXPIRED", ... }
  ]
}
```

All codes ever issued to this person for this election/period.

---

## Your Current Configuration

Based on your code:

✅ **Eligibility is determined by:** Position OR Manual Override
✅ **Position must be:** ACTIVE
✅ **Position must be:** At the right organizational level for the election scope
✅ **Position must be:** In the right organizational location (diocese/archdeaconry/church)
✅ **Position must be:** Registered for this specific election
✅ **Voting codes:** Optional (not required for eligibility)
✅ **Code priority:** ACTIVE code first, then latest code
✅ **Code history:** All codes tracked and returned

---

## Common Reasons for Zero Results

### Reason 1: No Qualifying Positions Exist
```
leadership_assignments table has no ACTIVE records
OR
Those records don't match the organizational hierarchy
OR
Those positions aren't registered in election_positions for this election
```
**Fix:** Add leadership assignments or configure election_positions

### Reason 2: Positions at Wrong Level
```
Election is DIOCESE level but people only have CHURCH-level positions
OR
Election is ARCHDEACONRY level but people only have DIOCESE-level positions
```
**Fix:** Assign people positions at the correct level

### Reason 3: Positions in Wrong Location
```
Person has ARCHDEACONRY position but in different diocese than election
OR
Person has CHURCH position but in different archdeaconry than election
```
**Fix:** Update person's leadership assignment location

### Reason 4: Organizational Hierarchy Broken
```
Archdeaconry record has NULL diocese_id
OR
Church record has NULL archdeaconry_id
```
**Fix:** Update organizational records with proper parent IDs

### Reason 5: No Election Positions Defined
```
election_positions table is empty for this election
```
**Fix:** Add positions to the election

### Reason 6: No Manual Overrides AND Positions Don't Qualify
```
election_voter_roll is empty for this election/period
AND
No one's positions match the hierarchy rules
```
**Fix:** Add manual overrides OR fix position assignments

---

## How to Verify It's Working

### Quick Test 1: Check Election Exists
```sql
SELECT id, scope, diocese_id, archdeaconry_id, church_id 
FROM elections 
WHERE id = 380;
```
- Should return 1 row
- One of the *_id columns should be NOT NULL

### Quick Test 2: Check Positions Defined
```sql
SELECT COUNT(*) 
FROM election_positions 
WHERE election_id = 380;
```
- Should be > 0
- If 0, no positions defined for this election

### Quick Test 3: Check People Have Right Positions

**For DIOCESE election:**
```sql
SELECT COUNT(DISTINCT la.person_id)
FROM leadership_assignments la
JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
WHERE la.status = 'ACTIVE'
  AND la.archdeaconry_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM election_positions ep
    WHERE ep.fellowship_position_id = fp.id AND ep.election_id = 380
  );
```

**For ARCHDEACONRY election:**
```sql
SELECT COUNT(DISTINCT la.person_id)
FROM leadership_assignments la
JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
WHERE la.status = 'ACTIVE'
  AND la.church_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM election_positions ep
    WHERE ep.fellowship_position_id = fp.id AND ep.election_id = 380
  );
```

**For CHURCH election:**
```sql
SELECT COUNT(DISTINCT la.person_id)
FROM leadership_assignments la
WHERE la.status = 'ACTIVE'
  AND la.church_id = 20;  -- Replace with your church_id
```

If any of these return 0, that's why you're getting no eligible voters!

### Quick Test 4: Check Organizational Hierarchy
```sql
SELECT COUNT(*) FROM archdeaconries WHERE diocese_id IS NULL;
SELECT COUNT(*) FROM churches WHERE archdeaconry_id IS NULL;
```
- Both should be 0
- If > 0, there's a data integrity issue

### Quick Test 5: Check Manual Overrides
```sql
SELECT COUNT(*) 
FROM election_voter_roll 
WHERE election_id = 380 
  AND voting_period_id = 438 
  AND eligible = true;
```
- If > 0 and other tests fail, these should still appear

---

## Summary

Your eligible voters endpoint will return a person if:

```
┌─ Condition 1: Has ACTIVE position
│                ├─ At right level for election scope
│                ├─ At right location (correct diocese/archdeaconry/church)
│                └─ Registered for THIS election
│
├─ OR Condition 2: Manual override
│                  ├─ In election_voter_roll
│                  ├─ For THIS election
│                  ├─ For THIS voting period
│                  └─ Marked eligible = true
│
└─ AND pass optional filters (if specified)
```

If you're getting zero results, one or both of the main conditions (Condition 1 AND Condition 2) are not being met.

Use the diagnostic queries above to determine which!
