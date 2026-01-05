# Eligible Voters - Step by Step Process (Visual Guide)

## The Complete Flow

```
START
  │
  ├─► STEP 1: Get all people from database
  │        people table
  │        
  ├─► STEP 2: For each person, check if they have a QUALIFYING POSITION
  │        
  │        Does person have ACTIVE position?
  │        ├─ NO  ─► Not qualified by position
  │        └─ YES ─► Check next conditions...
  │
  │        Is that position registered for THIS election?
  │        ├─ NO  ─► Not qualified by position
  │        └─ YES ─► Check next conditions...
  │
  │        Is position at the RIGHT ORGANIZATIONAL LEVEL?
  │        ├─ NO  ─► Not qualified by position
  │        └─ YES ─► Check next conditions...
  │
  │        Is position in the RIGHT ORGANIZATIONAL LOCATION?
  │        ├─ NO  ─► Not qualified by position
  │        └─ YES ─► ✅ QUALIFIED BY POSITION
  │
  ├─► STEP 3: For each person, check if they are a MANUAL OVERRIDE
  │        
  │        Is person in election_voter_roll?
  │        ├─ NO  ─► Not an override
  │        └─ YES ─► Check next conditions...
  │
  │        Is override marked as eligible?
  │        ├─ NO  ─► Not an override
  │        └─ YES ─► ✅ QUALIFIED BY OVERRIDE
  │
  ├─► STEP 4: Final Filter - Must have POSITION OR OVERRIDE
  │        
  │        Has qualifying position OR is manual override?
  │        ├─ NO  ─► ❌ SKIP THIS PERSON
  │        └─ YES ─► ✅ INCLUDE IN ELIGIBLE VOTERS
  │
  └─► END
       Return all people who passed STEP 4
```

---

## Detailed Breakdown by Election Type

### For DIOCESE-Level Elections (e.g., Mukono Diocese)

```
┌─ ELECTION 380 ─────────────────────────────┐
│ scope: DIOCESE                             │
│ diocese_id: 5 (Mukono)                     │
└────────────────────────────────────────────┘
          │
          ├─ WHO QUALIFIES?
          │
          └─► Must have ARCHDEACONRY position
              in MUKONO DIOCESE (diocese_id = 5)
                  │
                  ├─ Betty Muhaye
                  │  └─ Position: Chairperson
                  │     Location: Namirembe Archdeaconry
                  │     Archdeaconry.diocese_id = 5 ✅
                  │
                  ├─ Cyrus Wambuzi
                  │  └─ Position: Secretary
                  │     Location: Buikwe Archdeaconry
                  │     Archdeaconry.diocese_id = 5 ✅
                  │
                  └─ ❌ Jane Doe (NOT eligible)
                     └─ Position: Chairperson
                        Location: Kampala Archdeaconry
                        Archdeaconry.diocese_id = 3 (Wrong diocese!)
```

### For ARCHDEACONRY-Level Elections (e.g., Namirembe)

```
┌─ ELECTION 381 ─────────────────────────────┐
│ scope: ARCHDEACONRY                        │
│ archdeaconry_id: 10 (Namirembe)           │
└────────────────────────────────────────────┘
          │
          ├─ WHO QUALIFIES?
          │
          └─► Must have CHURCH position
              in NAMIREMBE ARCHDEACONRY (archdeaconry_id = 10)
                  │
                  ├─ John Kabuubi
                  │  └─ Position: Treasurer
                  │     Location: Misindye Church
                  │     Church.archdeaconry_id = 10 ✅
                  │
                  └─ ❌ Bob Smith (NOT eligible)
                     └─ Position: Treasurer
                        Location: Different Church
                        Church.archdeaconry_id = 5 (Wrong archdeaconry!)
```

### For CHURCH-Level Elections (e.g., Misindye Church)

```
┌─ ELECTION 382 ─────────────────────────────┐
│ scope: CHURCH                              │
│ church_id: 20 (Misindye Church)           │
└────────────────────────────────────────────┘
          │
          ├─ WHO QUALIFIES?
          │
          └─► Must have position at
              MISINDYE CHURCH (church_id = 20)
                  │
                  ├─ Sarah Namutebi
                  │  └─ Position: Vestry Chair
                  │     Location: Misindye Church
                  │     church_id = 20 ✅
                  │
                  └─ ❌ David Muwonge (NOT eligible)
                     └─ Position: Vestry Secretary
                        Location: Different Church
                        church_id = 25 (Wrong church!)
```

---

## The Query Conditions (in Plain English)

### STEP 2: Finding Qualifying Positions

```sql
WHERE la.status = 'ACTIVE'  ◄─ "Is the position ACTIVE?"
  AND (
      (e.scope = 'DIOCESE' 
       AND la.archdeaconry_id IS NOT NULL  ◄─ "Has archdeaconry position?"
       AND ad.diocese_id = e.diocese_id)   ◄─ "Is it in THIS diocese?"
   OR (e.scope = 'ARCHDEACONRY'
       AND la.church_id IS NOT NULL        ◄─ "Has church position?"
       AND ch.archdeaconry_id = e.archdeaconry_id) ◄─ "Is it in THIS archdeaconry?"
   OR (e.scope = 'CHURCH'
       AND la.church_id = e.church_id)     ◄─ "Is it at THIS church?"
  )
```

### STEP 3: Finding Manual Overrides

```sql
WHERE evr.election_id = :electionId     ◄─ "Is override for THIS election?"
  AND evr.voting_period_id = :votingPeriodId ◄─ "Is override for THIS voting period?"
  AND evr.eligible = true                ◄─ "Is override marked eligible?"
```

### STEP 4: Final Filter

```sql
WHERE (positionOnly.person_id IS NOT NULL OR evr.person_id IS NOT NULL)
       ◄─ "Has qualifying position OR is manual override?"
```

---

## Truth Table: Who Gets Listed?

| Has Qualifying Position | Is Manual Override | Result |
|:---:|:---:|:---:|
| ✅ YES | ✅ YES | ✅ **LISTED** |
| ✅ YES | ❌ NO | ✅ **LISTED** |
| ❌ NO | ✅ YES | ✅ **LISTED** |
| ❌ NO | ❌ NO | ❌ **NOT LISTED** |

**In other words:** Person appears if they meet AT LEAST ONE condition.

---

## Why You Might Get Zero Results

### Scenario A: No One Qualifies by Position

```
Check: Do people have the RIGHT position?
       │
       ├─ Position at wrong level?
       │  (e.g., Diocese election but people have CHURCH positions)
       │
       ├─ Position in wrong location?
       │  (e.g., Archdeaconry position but in different diocese)
       │
       └─ Position not registered for this election?
          (e.g., leadership_assignments exist but NOT in election_positions)
          
Result: positionOnly.person_id = NULL for everyone
        → positionOnly join contributes NOTHING
```

### Scenario B: No One in Manual Override List

```
Check: Is election_voter_roll populated for this election?
       │
       ├─ No entries at all?
       │
       ├─ Entries but voting_period_id doesn't match?
       │
       └─ Entries but eligible = false?
       
Result: evr.person_id = NULL for everyone
        → evr join contributes NOTHING
```

### Scenario C: Both A and B are true

```
positionOnly.person_id = NULL (no qualifying positions)
AND
evr.person_id = NULL (no manual overrides)
│
└─► Final WHERE clause:
    (NULL IS NOT NULL OR NULL IS NOT NULL)
    = (FALSE OR FALSE)
    = FALSE
    
    ❌ NO ONE PASSES THE FILTER
    ❌ ZERO RESULTS RETURNED
```

---

## How to Verify Your Setup

### Test 1: Does the election exist and have correct scope?

```sql
SELECT id, name, scope, diocese_id, archdeaconry_id, church_id
FROM elections
WHERE id = 380;
```

**Look for:**
- Scope matches what you expect
- ONE of diocese_id/archdeaconry_id/church_id is NOT NULL
- Other two are NULL

### Test 2: Are there fellowship positions for this election?

```sql
SELECT COUNT(*) as position_count
FROM election_positions
WHERE election_id = 380;
```

**Look for:**
- Should be > 0
- If 0, NO positions defined for election

### Test 3: Do people have leadership assignments at the right level?

**For Diocese election (e.g., need ARCHDEACONRY positions):**
```sql
SELECT COUNT(DISTINCT la.person_id) as person_count
FROM leadership_assignments la
WHERE la.status = 'ACTIVE'
  AND la.archdeaconry_id IS NOT NULL;
```

**For Archdeaconry election (e.g., need CHURCH positions):**
```sql
SELECT COUNT(DISTINCT la.person_id) as person_count
FROM leadership_assignments la
WHERE la.status = 'ACTIVE'
  AND la.church_id IS NOT NULL;
```

**For Church election (e.g., need positions at specific church):**
```sql
SELECT COUNT(DISTINCT la.person_id) as person_count
FROM leadership_assignments la
WHERE la.status = 'ACTIVE'
  AND la.church_id = 20;  -- Replace with your church_id
```

### Test 4: Do those positions belong to this election?

**For Diocese election:**
```sql
SELECT COUNT(DISTINCT la.person_id) as person_count
FROM leadership_assignments la
JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
WHERE la.status = 'ACTIVE'
  AND la.archdeaconry_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM election_positions ep
    WHERE ep.fellowship_position_id = fp.id
      AND ep.election_id = 380
  );
```

**Result:**
- If 0: Positions exist but not registered for this election
- If > 0: Some people qualify

### Test 5: Is the organizational hierarchy correct?

**Check archdeaconries:**
```sql
SELECT id, name, diocese_id
FROM archdeaconries
WHERE diocese_id IS NULL;
```

**Result:**
- If any rows: Broken hierarchy (diocese_id should never be NULL)

**Check churches:**
```sql
SELECT id, name, archdeaconry_id
FROM churches
WHERE archdeaconry_id IS NULL;
```

**Result:**
- If any rows: Broken hierarchy (archdeaconry_id should never be NULL)

### Test 6: Are there manual overrides?

```sql
SELECT COUNT(*) as override_count
FROM election_voter_roll
WHERE election_id = 380
  AND voting_period_id = 438
  AND eligible = true;
```

**Result:**
- If 0: No manual overrides
- If > 0: These people should appear

---

## The Complete Diagnostic Flow

```
Question 1: Are there positions defined for election 380?
            ├─ NO  ─► Need to add positions to election
            └─ YES ─► Continue to Question 2
            
Question 2: Do people have ACTIVE positions at the right level?
            ├─ NO  ─► Need to assign positions to people
            └─ YES ─► Continue to Question 3
            
Question 3: Are those positions registered in election_positions?
            ├─ NO  ─► Need to add positions to this election
            └─ YES ─► Continue to Question 4
            
Question 4: Are those positions in the RIGHT LOCATION (diocese/archdeaconry/church)?
            ├─ NO  ─► Need to update person's location or election scope
            └─ YES ─► They should appear! Continue to Question 5
            
Question 5: Are there any manual overrides in election_voter_roll?
            ├─ YES ─► They should appear too!
            └─ NO  ─► Continue to Question 6
            
Question 6: Running actual endpoint, do you get results?
            ├─ YES ─► ✅ Everything works!
            └─ NO  ─► Something else is wrong
```

---

## Summary: The Single Rule

**A person appears in eligible voters if and only if:**

```
(
  person has ACTIVE position at right level + right location for this election
  OR
  person is in election_voter_roll with eligible=true for this election+period
)
```

If you're getting zero results, ONE of these is true:

1. ❌ No qualifying positions (check Questions 1-4 above)
2. ❌ No manual overrides (check Question 5 above)
3. ❌ Data issue (check Test 5 for hierarchy)

The diagnostic queries above will pinpoint exactly which one! 🔍
