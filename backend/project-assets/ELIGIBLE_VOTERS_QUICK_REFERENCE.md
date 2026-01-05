# Eligible Voters - Quick Reference Card

## The Rule
```
A person appears in eligible voters if:
  (Has ACTIVE position at right level/location for this election)
  OR
  (Is manual override for this election+period)
```

---

## Step-by-Step Verification

### STEP 1: Get Election Details
```
What is the scope and location for election 380?
```

**SQL:**
```sql
SELECT scope, diocese_id, archdeaconry_id, church_id FROM elections WHERE id = 380;
```

**Example Results:**
- `scope = DIOCESE, diocese_id = 5` → Diocese of Mukono
- `scope = ARCHDEACONRY, archdeaconry_id = 10` → Namirembe Archdeaconry
- `scope = CHURCH, church_id = 20` → Misindye Church

---

### STEP 2: What Organization Level Do People Need?

| Election Scope | People Must Have | Location Must Be |
|---|---|---|
| **DIOCESE** | ARCHDEACONRY position | IN that DIOCESE |
| **ARCHDEACONRY** | CHURCH position | IN that ARCHDEACONRY |
| **CHURCH** | Position | AT that CHURCH |

**Example:**
- Election 380 is Diocese of Mukono → Need people with archdeaconry positions in Mukono

---

### STEP 3: Do Such People Exist?

**For DIOCESE election:**
```sql
SELECT p.id, p.full_name, ad.name as archdeaconry, d.name as diocese
FROM people p
JOIN leadership_assignments la ON p.id = la.person_id
JOIN archdeaconries ad ON la.archdeaconry_id = ad.id
JOIN dioceses d ON ad.diocese_id = d.id
WHERE la.status = 'ACTIVE'
  AND ad.diocese_id = 5;  -- Replace 5 with your diocese_id
```

**For ARCHDEACONRY election:**
```sql
SELECT p.id, p.full_name, ch.name as church, ad.name as archdeaconry
FROM people p
JOIN leadership_assignments la ON p.id = la.person_id
JOIN churches ch ON la.church_id = ch.id
JOIN archdeaconries ad ON ch.archdeaconry_id = ad.id
WHERE la.status = 'ACTIVE'
  AND ch.archdeaconry_id = 10;  -- Replace 10 with your archdeaconry_id
```

**For CHURCH election:**
```sql
SELECT p.id, p.full_name, ch.name as church
FROM people p
JOIN leadership_assignments la ON p.id = la.person_id
JOIN churches ch ON la.church_id = ch.id
WHERE la.status = 'ACTIVE'
  AND la.church_id = 20;  -- Replace 20 with your church_id
```

**Result:**
- If returns people → They should appear in eligible voters
- If returns empty → No one qualifies by position alone

---

### STEP 4: Are Those Positions Registered for This Election?

```sql
SELECT ep.id, fp.id as fellowship_position_id
FROM election_positions ep
JOIN fellowship_positions fp ON ep.fellowship_position_id = fp.id
WHERE ep.election_id = 380;
```

**Result:**
- If empty → Election has no positions defined
- If has rows → These fellowship positions are active for this election

---

### STEP 5: Do Any People Have Those Positions?

```sql
SELECT DISTINCT p.id, p.full_name
FROM people p
JOIN leadership_assignments la ON p.id = la.person_id
JOIN fellowship_positions fp ON la.fellowship_position_id = fp.id
WHERE la.status = 'ACTIVE'
  AND fp.id IN (
    SELECT fp.id
    FROM fellowship_positions fp
    JOIN election_positions ep ON ep.fellowship_position_id = fp.id
    WHERE ep.election_id = 380
  );
```

**Result:**
- If returns people → They should appear in eligible voters
- If empty → No one's positions match this election

---

### STEP 6: Any Manual Overrides?

```sql
SELECT person_id, reason
FROM election_voter_roll
WHERE election_id = 380
  AND voting_period_id = 438
  AND eligible = true;
```

**Result:**
- If returns people → They should appear even without positions
- If empty → No manual overrides

---

## Quick Diagnostic

Run this ONE query to see the summary:

```sql
SELECT 'Election Info' as test,
       COUNT(*) as result,
       'Should have 1 row' as expected
FROM elections WHERE id = 380

UNION ALL

SELECT 'Positions Defined',
       COUNT(*),
       'Should be > 0'
FROM election_positions WHERE election_id = 380

UNION ALL

SELECT 'People with Qualifying Positions',
       COUNT(DISTINCT la.person_id),
       'Should be > 0 if expecting results'
FROM leadership_assignments la
JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
JOIN election_positions ep ON ep.fellowship_position_id = fp.id AND ep.election_id = 380
JOIN elections e ON e.id = 380
LEFT JOIN archdeaconries ad ON la.archdeaconry_id = ad.id
LEFT JOIN churches ch ON la.church_id = ch.id
WHERE la.status = 'ACTIVE'
  AND (
      (e.scope = 'DIOCESE' AND la.archdeaconry_id IS NOT NULL AND ad.diocese_id = e.diocese_id)
   OR (e.scope = 'ARCHDEACONRY' AND la.church_id IS NOT NULL AND ch.archdeaconry_id = e.archdeaconry_id)
   OR (e.scope = 'CHURCH' AND la.church_id = e.church_id)
  )

UNION ALL

SELECT 'Manual Overrides',
       COUNT(*),
       'Should be 0 or more'
FROM election_voter_roll
WHERE election_id = 380 AND voting_period_id = 438 AND eligible = true;
```

---

## Interpretation Guide

### If "Election Info" = 0
❌ **Problem:** Election doesn't exist
✅ **Fix:** Use correct election ID

### If "Positions Defined" = 0
❌ **Problem:** No positions registered for this election
✅ **Fix:** Add positions to the election in the admin UI

### If "People with Qualifying Positions" = 0 AND "Manual Overrides" = 0
❌ **Problem:** No one qualifies
✅ **Possible fixes:**
- Assign people positions at the right level/location
- Add manual overrides to election_voter_roll
- Check data integrity (diocese_id, archdeaconry_id, church_id in org tables)

### If "People with Qualifying Positions" > 0
✅ **Should return results** from the eligible voters endpoint
❌ **If not:** There may be a code deployment issue

### If "Manual Overrides" > 0
✅ **Those people should appear** even if "Positions" = 0
❌ **If not:** There may be a code deployment issue

---

## The 3 Most Common Issues

### Issue 1: No Positions Defined
**Symptom:** "Positions Defined" = 0
**Cause:** Election created but no fellowship positions added to it
**Fix:** Go to election settings and add the positions that can vote

### Issue 2: Positions at Wrong Level
**Symptom:** Election is DIOCESE but people only have CHURCH positions
**Cause:** Data mismatch
**Fix:** Either change people's positions or change election scope

### Issue 3: Positions in Wrong Location
**Symptom:** Person has archdeaconry position but in different diocese than election
**Cause:** Person's leadership assignment location doesn't match election
**Fix:** Update person's leadership assignment to correct location

---

## Single Line Summary

**Eligible voters = (People with ACTIVE positions at right level+location for this election) OR (Manual overrides)**

If empty: Check if positions are defined and configured correctly.

---

## Files to Check

1. **Elections Table**
   - `id` = 380
   - `scope` must be DIOCESE, ARCHDEACONRY, or CHURCH
   - Must have one of: diocese_id, archdeaconry_id, church_id

2. **Election_Positions Table**
   - `election_id` = 380
   - `fellowship_position_id` must reference fellowship_positions

3. **Fellowship_Positions Table**
   - Must have entry for each position that can vote in election

4. **Leadership_Assignments Table**
   - `status` = ACTIVE
   - `fellowship_position_id` must match election_positions
   - For DIOCESE elections: `archdeaconry_id` must be NOT NULL
   - For ARCHDEACONRY elections: `church_id` must be NOT NULL
   - For CHURCH elections: `church_id` must match election

5. **Election_Voter_Roll Table**
   - If need to add overrides: insert row with `eligible = true`

---

## Test It Yourself

1. Run the diagnostic query above
2. Share the results
3. I can tell you exactly what's wrong

That's it! The diagnostic query will show you where the issue is.
