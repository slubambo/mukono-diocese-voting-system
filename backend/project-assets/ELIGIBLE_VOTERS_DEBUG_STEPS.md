# Step-by-Step Debugging Guide

## ✅ Phase 1: Setup (Right Now)

### Step 1.1: Configure Logging

**Open file:** `src/main/resources/application.properties`

**Add this line:**
```properties
logging.level.com.mukono.voting.service.election=DEBUG
```

**OR if using application.yml:**
```yaml
logging:
  level:
    com.mukono.voting.service.election: DEBUG
```

### Step 1.2: Rebuild

```bash
cd backend
./mvnw clean compile -DskipTests
```

**You should see:** `BUILD SUCCESS`

### Step 1.3: Restart Application

Stop your currently running application and restart it.

---

## ✅ Phase 2: Test (When Ready)

### Step 2.1: Call the Endpoint

Open your browser and navigate to:
```
http://localhost:8080/api/v1/admin/elections/380/voting-periods/438/eligible-voters?page=0&size=10&sort=fullName,asc
```

### Step 2.2: Check Console

Look at the console where your application is running.

You should see a block of output starting with:
```
========== ELIGIBLE VOTERS REQUEST ==========
```

### Step 2.3: Look for Key Information

Find these lines in the output:

**Line 1 - How many voters from database:**
```
Total unfiltered voters from database: ?
```

If this is `0`, the problem is at database level.
If this is `> 0`, the problem is at filtering level.

**Line 2 - Total eligible voters returned:**
```
Total eligible voters: ?
```

If this matches the database count, no filtering happened.
If this is less, something got filtered out.

**Line 3 - List of voters:**
```
Voters in response:
  - Name1 (ID: X) [Position: Y, Location: Z, Override: ...]
  - Name2 (ID: X) [Position: Y, Location: Z, Override: ...]
```

---

## 🔍 Phase 3: Analyze Results

### Case A: Getting Results (Success!)

```
Total unfiltered voters from database: 15
...
Total eligible voters: 15
Voters in response:
  - Betty Muhaye (ID: 36) [Position: Chairperson, Location: Namirembe, Override: false]
  - Cyrus Wambuzi (ID: 32) [Position: Secretary, Location: Buikwe, Override: false]
  ...
```

**What this means:**
- ✅ Database is returning eligible voters
- ✅ Filtering is working correctly
- ✅ Everything is fine!

**Next action:** Test other scenarios or filters.

---

### Case B: Zero Results from Database

```
Total unfiltered voters from database: 0
Total mapped responses: 0
...
Total eligible voters: 0
Voters in response:
  (empty list)
```

**What this means:**
- ❌ No one is eligible according to the database
- The problem is in the data, not the code

**Investigate:**
1. Check if election 380 exists
2. Check if election_positions are defined for election 380
3. Check if any people have positions at the right organizational level
4. Check organizational hierarchy (diocese_id, archdeaconry_id, church_id)

**Run these SQL queries:**
```sql
-- Does election exist?
SELECT * FROM elections WHERE id = 380;

-- Are positions defined?
SELECT COUNT(*) FROM election_positions WHERE election_id = 380;

-- Do people have right-level positions?
-- (For DIOCESE election, need ARCHDEACONRY positions)
SELECT COUNT(DISTINCT la.person_id) 
FROM leadership_assignments la
WHERE la.status = 'ACTIVE' AND la.archdeaconry_id IS NOT NULL;
```

**Share results so we can help!**

---

### Case C: Database Returns Results, But Gets Filtered Out

```
Total unfiltered voters from database: 15
Total mapped responses: 15

--- STEP 3: Applying status filter: VOTED ---
Before status filter: 15
After status filter: 0

Total eligible voters: 0
Voters in response:
  (empty list)
```

**What this means:**
- ✅ 15 people are eligible
- ❌ But you requested `status=VOTED`
- ❌ None of them have voted yet

**Investigate:**
1. Did you specify `?status=VOTED`?
2. Have any of those 15 people actually voted?

**Check:**
```sql
-- Have any voters voted?
SELECT COUNT(DISTINCT vr.person_id) FROM vote_records vr
WHERE vr.election_id = 380;
```

**Options:**
- Remove the status filter (just call with `?page=0&size=10`)
- Vote some people first in the system
- Check a different election that has voted records

---

### Case D: Strange Filtering Results

```
Total unfiltered voters from database: 15
...
--- STEP 4: Applying fellowship filter: 5 ---
Before fellowship filter: 15
After fellowship filter: 0
  ✗ Betty Muhaye has no fellowship
  ✗ Cyrus Wambuzi has no fellowship
  ... (all 15 have no fellowship)

Total eligible voters: 0
```

**What this means:**
- ✅ 15 people are eligible
- ❌ But all 15 have `fellowship = NULL`
- ❌ So filtering by fellowship removes everyone

**Investigate:**
1. The position assignment doesn't have fellowship linked
2. Or the fellowship table is missing names

**Check the code:**
In the service, check where `position.getFellowship()` comes from:
```java
p.getFellowship()  // This is NULL
```

**Check the SQL:**
Look at the query in VotingCodeRepository:
```sql
MAX(positionOnly.fellowship_name) AS fellowship
```

Is `fellowship_name` being populated? Check:
```sql
SELECT la.id, fp.fellowship_id, f.name AS fellowship_name
FROM leadership_assignments la
JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
LEFT JOIN fellowships f ON f.id = fp.fellowship_id
LIMIT 10;
```

---

## 📋 Checklist for Sharing Results

When you share the logs, include:

- [ ] Full console output from calling the endpoint
- [ ] The counts at each step
- [ ] The list of voters returned (if any)
- [ ] Whether you applied any filters (`?status=VOTED`, `?q=name`, etc.)
- [ ] The election you're testing (380)
- [ ] The voting period you're testing (438)

---

## 🎯 Quick Debug Map

```
Zero results?
  ├─ Total unfiltered voters from database: 0?
  │   └─ Check election_positions, leadership_assignments
  │
  └─ Total unfiltered voters from database: > 0?
      └─ Check which filter removed everyone
          ├─ Status filter?
          ├─ Fellowship filter?
          ├─ Position filter?
          └─ Search filter?
```

---

## 🔧 What Logs Tell You

| Log Line | Tells You |
|----------|-----------|
| `Total unfiltered voters from database: X` | How many people database thinks are eligible |
| `Before [filter]: Y` | How many voters before applying a filter |
| `After [filter]: Z` | How many voters after applying a filter |
| `✓ Name - condition` | Which voters PASS a filter (DEBUG level) |
| `✗ Name` | Which voters FAIL a filter (DEBUG level) |
| `Total eligible voters: W` | Final count after all filters |
| `Voters in response: [list]` | Exactly which voters are being returned |

---

## 📞 When Sharing Results

Share:
1. **Full log output** (copy entire block)
2. **What endpoint you called** (the exact URL with parameters)
3. **Whether you got any results** (yes/no)
4. **If yes, how many?**

**Example:**
```
Endpoint: http://localhost:8080/api/v1/admin/elections/380/voting-periods/438/eligible-voters?page=0&size=10

Results: Getting zero voters

Log shows:
- Total unfiltered from database: 15
- After status filter: 0

[Full log output]
```

---

## ✨ Summary

1. Add logging config → compile → restart
2. Call endpoint → check console logs
3. Find key counts: database → filtered → final
4. Identify where voters are lost
5. Share logs for analysis

That's it! The logs will tell us exactly where the issue is. 🔍
