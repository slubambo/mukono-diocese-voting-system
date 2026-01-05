# Root Cause Analysis - Zero Eligible Voters Issue

**Date:** January 5, 2026  
**Status:** Issue Identified

---

## The Problem

```
Total unfiltered voters from database: 0
```

The database query returns **ZERO voters** for election 380, but:
- ✅ Leadership assignments exist (Winnie Nabulya, Doreen Desire Nansamba with ARCHDEACONRY positions)
- ✅ These assignments are ACTIVE
- ✅ They belong to the correct organizational hierarchy

**But:** The SQL query is NOT finding them.

---

## Why This Is Happening

Based on the data you showed:

### Leadership Assignment Data (Working Fine):
- **Person:** Winnie Nabulya (ID: 39)
- **Position:** Assistant Chairperson (ARCHDEACONRY scope)
- **Fellowship:** Youth Fellowship  
- **Diocese:** Mukono Diocese (ID: 1)
- **Archdeaconry:** Cathedral Deanery (ID: 1, diocese_id: 1)
- **Status:** ACTIVE

### The Issue

The SQL query in VotingCodeRepository has this condition:

```sql
JOIN election_positions ep ON ep.fellowship_position_id = fp.id AND ep.election_id = :electionId
```

**This join is FAILING** because:
1. The leadership assignment references fellowship_position_id = 22 (or 26)
2. But **election_positions table doesn't have an entry** for that fellowship_position_id with election_id = 380

**Result:** The JOIN produces no rows → Query returns 0 voters

---

## How to Fix This

### Option 1: Check if Election 380 Has Positions Defined (Quick Check)

Run this to see how many positions are defined for election 380:

```sql
SELECT COUNT(*) FROM election_positions WHERE election_id = 380;
```

**If result is 0:** No positions are defined for this election - need to add them

**If result is > 0:** Need to check which positions, and why they don't match

---

### Option 2: Find What Positions Are Defined

```sql
SELECT ep.id, ep.fellowship_position_id, fp.scope, fp.fellowshipName
FROM election_positions ep
JOIN fellowship_positions fp ON fp.id = ep.fellowship_position_id
WHERE ep.election_id = 380;
```

This will show which fellowship positions are eligible for this election.

**Compare with:**
```sql
SELECT DISTINCT la.fellowship_position_id, fp.scope, f.name
FROM leadership_assignments la
JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
JOIN fellowships f ON f.id = fp.fellowship_id
WHERE la.status = 'ACTIVE';
```

---

## The Real Solution

### Step 1: Understand Election 380
```sql
SELECT id, name, scope, diocese_id, archdeaconry_id, church_id 
FROM elections 
WHERE id = 380;
```

What you're looking for:
- Is it a **DIOCESE** election? (diocese_id should be NOT NULL)
- If yes, which diocese?

### Step 2: Check if Fellowship Positions Are Registered
```sql
SELECT ep.id, fp.id, fp.scope, f.name as fellowship_name, pt.name as position_title
FROM election_positions ep
JOIN fellowship_positions fp ON fp.id = ep.fellowship_position_id
JOIN fellowships f ON f.id = fp.fellowship_id
JOIN position_titles pt ON pt.id = fp.title_id
WHERE ep.election_id = 380;
```

### Step 3: Match With Leadership Assignments
```sql
SELECT la.id, p.full_name, la.fellowship_position_id, pt.name, f.name
FROM leadership_assignments la
JOIN people p ON p.id = la.person_id
JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
JOIN position_titles pt ON pt.id = fp.title_id
JOIN fellowships f ON f.id = fp.fellowship_id
WHERE la.status = 'ACTIVE'
  AND EXISTS (
    SELECT 1 FROM election_positions ep 
    WHERE ep.fellowship_position_id = fp.id 
      AND ep.election_id = 380
  );
```

**If this returns 0 rows:** The positions exist but aren't registered for this election

---

## Most Likely Scenario

Based on typical setup:

1. **Election 380** is a Diocese-level election (scope = DIOCESE, diocese_id = 1)
2. **Leadership assignments** exist for Archdeaconry positions in that diocese
3. **But:** These specific fellowship positions haven't been added to `election_positions` for election 380

**Fix:** Add the Archdeaconry fellowship positions to the election

```sql
-- Example: If Youth Fellowship Assistant Chairperson (FP ID 22) should be eligible
INSERT INTO election_positions (fellowship_position_id, election_id)
VALUES (22, 380);

-- And Youth Fellowship Secretary (FP ID 26)
INSERT INTO election_positions (fellowship_position_id, election_id)
VALUES (26, 380);

-- And other relevant positions...
```

---

## The Data Flow That Should Happen

```
For Election 380 (Diocese election for Mukono Diocese):

1. Query should find leadership_assignments where:
   - status = 'ACTIVE'
   - archdeaconry_id IS NOT NULL (position at archdeaconry level)
   - archdeaconry.diocese_id = 1 (archdeaconry belongs to Mukono)

2. And those positions must be registered in election_positions:
   - election_positions.fellowship_position_id = leadership_assignments.fellowship_position_id
   - election_positions.election_id = 380

3. If step 2 fails → No voters returned
```

---

## What To Do Next

1. **Run diagnostic queries** above in your MariaDB client
2. **Share the results**, specifically:
   - How many positions are in election_positions for election 380?
   - Which fellowship_position_ids are registered?
   - Do leadership assignments reference any of those positions?

3. **Most likely fix:**
   - Add the fellowship positions to election_positions for election 380

---

## Quick Diagnostic Command

Run this single query to see everything:

```sql
SELECT 
  'Election Details' as 'Check',
  COUNT(*) as 'Count'
FROM elections WHERE id = 380

UNION ALL

SELECT 
  'Positions Defined for Election 380',
  COUNT(*)
FROM election_positions WHERE election_id = 380

UNION ALL

SELECT 
  'ARCHDEACONRY Positions in DB',
  COUNT(*)
FROM leadership_assignments la
WHERE la.status = 'ACTIVE' 
  AND la.archdeaconry_id IS NOT NULL

UNION ALL

SELECT 
  'ARCHDEACONRY Positions Matching Election 380',
  COUNT(*)
FROM leadership_assignments la
JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
JOIN election_positions ep ON ep.fellowship_position_id = fp.id
WHERE la.status = 'ACTIVE'
  AND la.archdeaconry_id IS NOT NULL
  AND ep.election_id = 380;
```

---

## Summary

**The Issue:** No eligible voters because the SQL query's `election_positions` join fails.

**Why:** The fellowship positions for those leadership assignments aren't registered in `election_positions` for election 380.

**The Fix:** Add the fellowship positions to `election_positions` table for election 380.

**Next Step:** Run the diagnostic queries above and share the results so we can confirm and proceed with the fix.
