# How Eligible Voters Are Determined - Step by Step

## Overview
The eligible voters endpoint uses a multi-step process to determine who can vote in an election. Here are the EXACT steps and conditions:

---

## STEP 1: Start with ALL PEOPLE
The query starts with the `people` table and gets ALL people from your system.

```sql
FROM people p
```

---

## STEP 2: Find Positions That Qualify for THIS Election

This is a complex subquery that looks for leadership assignments that match the election's scope and location.

### Key Requirements:
1. **Position must be ACTIVE**
   ```
   WHERE la.status = 'ACTIVE'
   ```

2. **Position must be in an ELIGIBLE POSITION for this election**
   - This is the "election_positions" join
   - The position MUST exist in the "election_positions" table for this specific election
   ```
   JOIN election_positions ep ON ep.fellowship_position_id = fp.id AND ep.election_id = :electionId
   ```

3. **Position location must match election scope**

   This is where the organizational hierarchy check happens:

   **For DIOCESE-level elections:**
   ```
   e.scope = 'DIOCESE' 
   AND la.archdeaconry_id IS NOT NULL
   AND ad.diocese_id = e.diocese_id
   ```
   - Person must have position at ARCHDEACONRY level
   - That archdeaconry must belong to the election's diocese

   **For ARCHDEACONRY-level elections:**
   ```
   e.scope = 'ARCHDEACONRY'
   AND la.church_id IS NOT NULL
   AND ch.archdeaconry_id = e.archdeaconry_id
   ```
   - Person must have position at CHURCH level
   - That church must belong to the election's archdeaconry

   **For CHURCH-level elections:**
   ```
   e.scope = 'CHURCH'
   AND la.church_id = e.church_id
   ```
   - Person must have a position at that specific church

4. **If person has multiple qualifying positions, select the FIRST one**
   ```
   ROW_NUMBER() OVER (PARTITION BY la.person_id ORDER BY la.id ASC) AS rn
   ```
   Then filter:
   ```
   WHERE rn = 1
   ```

### Result of STEP 2:
You get a table called `positionOnly` with columns:
- `person_id` - Person who has qualifying position
- `la_id` - Leadership assignment ID
- `fellowship_name` - Name of fellowship
- `scope` - Scope level (DIOCESE, ARCHDEACONRY, CHURCH)
- `scope_name` - Name of the scope (diocese/archdeaconry/church name)
- `position_name` - Position title (Chairperson, Secretary, etc.)
- `f_id` - Fellowship ID
- `ep_id` - Election position ID

### ⚠️ Common Reasons This Returns EMPTY:
1. **No leadership_assignments for this person**
   - Person doesn't have any position assignments

2. **Position is not ACTIVE**
   ```
   la.status != 'ACTIVE'
   ```
   - Position may be ENDED, or in some other status

3. **Position not in election_positions for this election**
   - Fellowship position exists but not registered for this specific election
   - Check: `election_positions` table doesn't have entry for this fellowship position and election

4. **Position at wrong organizational level**
   - Diocese election but person has CHURCH position (not ARCHDEACONRY)
   - Archdeaconry election but person has DIOCESE position (not CHURCH)

5. **Position in wrong organizational location**
   - Person has ARCHDEACONRY position but in different diocese
   - Person has CHURCH position but in different archdeaconry
   - Example: Position at Kampala Archdeaconry but election is for Mukono Diocese

6. **Organizational hierarchy broken in database**
   - Archdeaconry.diocese_id is NULL (should point to diocese)
   - Church.archdeaconry_id is NULL (should point to archdeaconry)

---

## STEP 3: Check for Manual Overrides

The query also looks for manual overrides in the voter roll.

```sql
LEFT JOIN (
    SELECT evr.person_id, evr.id AS evr_id, evr.reason
    FROM election_voter_roll evr
    WHERE evr.election_id = :electionId 
      AND evr.voting_period_id = :votingPeriodId
      AND evr.eligible = true
) evr ON evr.person_id = p.id
```

### Requirements:
1. **Person must be in election_voter_roll table**
2. **For this specific election**
   ```
   evr.election_id = :electionId
   ```
3. **For this specific voting period**
   ```
   evr.voting_period_id = :votingPeriodId
   ```
4. **Must be marked as eligible**
   ```
   evr.eligible = true
   ```

### Result:
A person is an override if they have an entry in this join.

---

## STEP 4: Final Filter - MUST Have Either Position OR Override

This is the critical WHERE clause:

```sql
WHERE (positionOnly.person_id IS NOT NULL OR evr.person_id IS NOT NULL)
```

### Translation:
**A person appears in eligible voters if:**
- `positionOnly.person_id IS NOT NULL` → They have a qualifying position, **OR**
- `evr.person_id IS NOT NULL` → They are in the manual override list

### ⚠️ If you're getting ZERO results:
This means NEITHER condition is true:
- No one has a qualifying position for this election, **AND**
- No one is in the election_voter_roll as an override

---

## STEP 5: Other Filters (Optional)

If you passed additional parameters, they're also applied:

```sql
AND (:fellowshipId IS NULL OR positionOnly.f_id = :fellowshipId)
AND (:electionPositionId IS NULL OR positionOnly.ep_id = :electionPositionId)
AND (:status = 'ALL'
     OR (:status = 'VOTED' AND vr_vote.person_id IS NOT NULL)
     OR (:status = 'NOT_VOTED' AND vr_vote.person_id IS NULL))
AND (:q IS NULL OR search conditions)
```

These can REDUCE results if you filtered by:
- `fellowshipId` - Only show people in specific fellowship
- `electionPositionId` - Only show people in specific position
- `status` - Only show VOTED or NOT_VOTED
- `q` - Search by name/phone/email

---

## Diagnostic Checklist

To figure out why you're getting zero voters, follow these steps:

### ☑️ STEP 1: Check if election exists
```sql
SELECT * FROM elections WHERE id = 380;
```
- **Look for:**
  - `scope` value (DIOCESE, ARCHDEACONRY, or CHURCH)
  - `diocese_id`, `archdeaconry_id`, or `church_id` (depending on scope)
  - Make sure one of these is NOT NULL

### ☑️ STEP 2: Check if there are leadership assignments at all
```sql
SELECT COUNT(*) FROM leadership_assignments 
WHERE status = 'ACTIVE';
```
- **Should be > 0**
- If 0, then no one has positions at all

### ☑️ STEP 3: Check if those positions are registered for this election

For your election, get the scope and location:
```sql
SELECT scope, diocese_id, archdeaconry_id, church_id FROM elections WHERE id = 380;
```

Then check if there are matching positions:

**If DIOCESE-level election (e.g., diocese_id = 5):**
```sql
SELECT la.person_id, la.id, la.archdeaconry_id, ad.diocese_id
FROM leadership_assignments la
LEFT JOIN archdeaconries ad ON la.archdeaconry_id = ad.id
WHERE la.status = 'ACTIVE'
  AND la.archdeaconry_id IS NOT NULL
  AND ad.diocese_id = 5;
```
- **Should return people with archdeaconry positions in diocese 5**
- If empty, then no one qualifies by position

**If ARCHDEACONRY-level election (e.g., archdeaconry_id = 10):**
```sql
SELECT la.person_id, la.id, la.church_id, ch.archdeaconry_id
FROM leadership_assignments la
LEFT JOIN churches ch ON la.church_id = ch.id
WHERE la.status = 'ACTIVE'
  AND la.church_id IS NOT NULL
  AND ch.archdeaconry_id = 10;
```
- **Should return people with church positions in archdeaconry 10**
- If empty, then no one qualifies by position

**If CHURCH-level election (e.g., church_id = 20):**
```sql
SELECT la.person_id, la.id, la.church_id
FROM leadership_assignments la
WHERE la.status = 'ACTIVE'
  AND la.church_id = 20;
```
- **Should return people with positions at church 20**
- If empty, then no one qualifies by position

### ☑️ STEP 4: Check if positions are in election_positions
```sql
SELECT ep.id, ep.fellowship_position_id, ep.election_id
FROM election_positions ep
WHERE ep.election_id = 380;
```
- **Should show fellowship positions that are "active" for this election**
- If empty, this election has no positions defined!
- This is likely the problem - the election was created but positions weren't added to it

### ☑️ STEP 5: Check if leadership assignments match election positions
```sql
SELECT la.person_id
FROM leadership_assignments la
JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
WHERE la.status = 'ACTIVE'
  AND EXISTS (
    SELECT 1 FROM election_positions ep 
    WHERE ep.fellowship_position_id = fp.id 
      AND ep.election_id = 380
  );
```
- **Should return people whose positions are in this election**
- If empty, then no leadership assignments match this election's positions

### ☑️ STEP 6: Check if there are manual overrides
```sql
SELECT person_id FROM election_voter_roll
WHERE election_id = 380
  AND voting_period_id = 438
  AND eligible = true;
```
- **If this returns people, they should appear as eligible voters**
- If this is also empty, then definitely no one is eligible

### ☑️ STEP 7: Run the actual query
Once you've diagnosed with the above, try running the actual query manually:

```sql
SELECT p.id, p.full_name, 
       MAX(positionOnly.position_name) AS position,
       MAX(positionOnly.scope_name) AS location,
       (CASE WHEN MIN(evr.evr_id) IS NOT NULL THEN 'OVERRIDE' ELSE 'POSITION' END) AS how_eligible
FROM people p
LEFT JOIN (
    SELECT la.person_id, la.id AS la_id, f.name AS fellowship_name, 
           CASE WHEN la.diocese_id IS NOT NULL THEN 'DIOCESE'
                WHEN la.archdeaconry_id IS NOT NULL THEN 'ARCHDEACONRY'
                WHEN la.church_id IS NOT NULL THEN 'CHURCH' END AS scope,
           COALESCE(d.name, ad.name, ch.name) AS scope_name,
           pt.name AS position_name, f.id AS f_id, ep.id AS ep_id,
           ROW_NUMBER() OVER (PARTITION BY la.person_id ORDER BY la.id ASC) AS rn
    FROM leadership_assignments la
    JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
    JOIN position_titles pt ON pt.id = fp.title_id
    JOIN fellowships f ON f.id = fp.fellowship_id
    JOIN election_positions ep ON ep.fellowship_position_id = fp.id AND ep.election_id = 380
    JOIN elections e ON e.id = ep.election_id
    LEFT JOIN dioceses d ON la.diocese_id = d.id
    LEFT JOIN archdeaconries ad ON la.archdeaconry_id = ad.id
    LEFT JOIN churches ch ON la.church_id = ch.id
    WHERE la.status = 'ACTIVE'
      AND (
          (e.scope = 'DIOCESE' AND la.archdeaconry_id IS NOT NULL AND ad.diocese_id = e.diocese_id)
       OR (e.scope = 'ARCHDEACONRY' AND la.church_id IS NOT NULL AND ch.archdeaconry_id = e.archdeaconry_id)
       OR (e.scope = 'CHURCH' AND la.church_id = e.church_id)
      )
) ranked
WHERE rn = 1
) positionOnly ON positionOnly.person_id = p.id
LEFT JOIN (
    SELECT evr.person_id, evr.id AS evr_id
    FROM election_voter_roll evr
    WHERE evr.election_id = 380 
      AND evr.voting_period_id = 438
      AND evr.eligible = true
) evr ON evr.person_id = p.id
WHERE (positionOnly.person_id IS NOT NULL OR evr.person_id IS NOT NULL)
GROUP BY p.id, p.full_name;
```

---

## Summary Table

| # | What We're Checking | SQL Condition | If Fails | Impact |
|---|---|---|---|---|
| 1 | Person has ACTIVE position | `la.status = 'ACTIVE'` | Position is ended/inactive | Person doesn't qualify |
| 2 | Position is in election_positions | `ep.election_id = :electionId` | Fellowship position not registered for election | Person doesn't qualify |
| 3 | Position at right level | `e.scope = 'DIOCESE' AND la.archdeaconry_id IS NOT NULL` (etc.) | Position at wrong level | Person doesn't qualify |
| 4 | Position in right location | `ad.diocese_id = e.diocese_id` (etc.) | Position in different diocese/archdeaconry | Person doesn't qualify |
| 5 | Either position OR override | `positionOnly.person_id IS NOT NULL OR evr.person_id IS NOT NULL` | Neither condition true | **Person NOT listed** ✗ |

---

## Most Common Issues (in order of likelihood)

### 🔴 Issue #1: election_positions is empty for this election
- **Check:** `SELECT COUNT(*) FROM election_positions WHERE election_id = 380;`
- **If 0:** This election has no positions defined
- **Fix:** Add positions to the election in the election management UI

### 🔴 Issue #2: Leadership positions are at wrong organizational level
- **Check:** Diocese election but people only have CHURCH positions
- **Example:** Diocese of Mukono election requires ARCHDEACONRY positions, but all people only have CHURCH level positions
- **Fix:** Either change positions in leadership_assignments, or change the election scope

### 🔴 Issue #3: Leadership positions in wrong location
- **Check:** Person has ARCHDEACONRY position but in different diocese
- **Example:** Person has position at Kampala Archdeaconry (diocese_id=3), but election is for Mukono Diocese (diocese_id=5)
- **Fix:** Change person's leadership assignment to correct archdeaconry, or change election diocese

### 🔴 Issue #4: Broken organizational hierarchy
- **Check:** Archdeaconry doesn't have diocese_id, or Church doesn't have archdeaconry_id
- **Example:** `SELECT * FROM archdeaconries WHERE diocese_id IS NULL;`
- **Fix:** Update archdeaconry and church records to have proper parent references

### 🔴 Issue #5: No one in election_voter_roll
- **Check:** `SELECT COUNT(*) FROM election_voter_roll WHERE election_id = 380 AND eligible = true;`
- **If 0 AND no positions match:** This explains zero voters
- **Fix:** Either add people to voter roll, or fix the position matching (issues 1-4 above)

---

## Test with This Query

Run this on your database to quickly diagnose the issue:

```sql
-- Test for election 380, voting period 438
SELECT 
  'ELECTION_INFO' AS info_type,
  e.id, e.name, e.scope, e.diocese_id, e.archdeaconry_id, e.church_id
FROM elections e
WHERE e.id = 380

UNION ALL

SELECT 
  'POSITIONS_DEFINED' AS info_type,
  COUNT(*) AS count, NULL, NULL, NULL, NULL, NULL
FROM election_positions
WHERE election_id = 380

UNION ALL

SELECT 
  'QUALIFYING_BY_POSITION' AS info_type,
  COUNT(DISTINCT la.person_id) AS count, NULL, NULL, NULL, NULL, NULL
FROM leadership_assignments la
JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
JOIN election_positions ep ON ep.fellowship_position_id = fp.id AND ep.election_id = 380
JOIN elections e ON e.id = ep.election_id
LEFT JOIN archdeaconries ad ON la.archdeaconry_id = ad.id
LEFT JOIN churches ch ON la.church_id = ch.id
WHERE la.status = 'ACTIVE'
  AND (
      (e.scope = 'DIOCESE' AND la.archdeaconry_id IS NOT NULL AND ad.diocese_id = e.diocese_id)
   OR (e.scope = 'ARCHDEACONRY' AND la.church_id IS NOT NULL AND ch.archdeaconry_id = e.archdeaconry_id)
   OR (e.scope = 'CHURCH' AND la.church_id = e.church_id)
  )

UNION ALL

SELECT 
  'MANUAL_OVERRIDES' AS info_type,
  COUNT(*) AS count, NULL, NULL, NULL, NULL, NULL
FROM election_voter_roll
WHERE election_id = 380 AND voting_period_id = 438 AND eligible = true;
```

This will show you:
1. Election details
2. How many positions are defined for it
3. How many people qualify by position
4. How many people are in manual overrides

---

## Next Steps to Diagnose Your Issue

1. **Run the diagnostic test query above** on your database
2. **Share the results** - this will show exactly where the problem is
3. **Based on results:**
   - If `POSITIONS_DEFINED` = 0 → Need to add positions to election
   - If `QUALIFYING_BY_POSITION` = 0 → Need to check leadership assignments
   - If `MANUAL_OVERRIDES` = 0 → Need to check voter roll
   - If all 0 → No one is eligible (and that's expected if election is new)

Would you like to run these diagnostic queries and share the results? That will tell us exactly what's happening!
