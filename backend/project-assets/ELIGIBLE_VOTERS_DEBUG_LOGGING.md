# Eligible Voters - Debug Logging Implementation

**Date:** January 5, 2026

## Overview

Comprehensive logging has been added to the eligible voters endpoint to track exactly where voters are being filtered out. The implementation now:

1. ✅ Separates data retrieval from filtering
2. ✅ Moves filtering from SQL to Java logic (for debugging)
3. ✅ Logs every step with counts
4. ✅ Shows which voters pass/fail each filter
5. ✅ Provides audit trail of the entire process

---

## How to Enable Logging

### Option 1: Console Output (For Development)

Add this to `application.properties` or `application.yml`:

**For application.properties:**
```properties
logging.level.com.mukono.voting.service.election=DEBUG
logging.level.com.mukono.voting.repository.election=DEBUG
```

**For application.yml:**
```yaml
logging:
  level:
    com.mukono.voting.service.election: DEBUG
    com.mukono.voting.repository.election: DEBUG
```

Then restart your application and call the endpoint. Logs will appear in the console.

### Option 2: Log File

Add file output to `application.yml`:

```yaml
logging:
  file:
    name: logs/application.log
  level:
    com.mukono.voting.service.election: DEBUG
```

---

## Log Output Format

When you call the endpoint, you'll see logs like this:

```
========== ELIGIBLE VOTERS REQUEST ==========
Election ID: 380
Voting Period ID: 438
Status Filter: ALL
Search Query: null
Fellowship ID Filter: null
Election Position ID Filter: null
Pageable: page=0, size=10

--- STEP 1: Fetching ALL potential eligible voters from database ---
Total unfiltered voters from database: 15

--- STEP 2: Mapping to EligibleVoterResponse objects ---
  Mapping: Betty Muhaye (ID: 36)
  Mapping: Cyrus Wambuzi (ID: 32)
  ... (more voters)
Total mapped responses: 15

--- STEP 3: Applying status filter: ALL ---
  Before status filter: 15
  After status filter: 15

--- STEP 4: Applying fellowship filter: null ---
  (No filtering applied - fellowshipId is null)

--- STEP 5: Applying election position filter: null ---
  (No filtering applied - electionPositionId is null)

--- STEP 6: Applying search query filter: null ---
  (No filtering applied - q is null)

--- STEP 7: Applying pagination ---
  Total results: 15
  Requested page: 0, size: 10
  Returning records 0 to 10 (of 15)
  Records in this page: 10

--- STEP 8: Creating pageable response ---
========== ELIGIBLE VOTERS RESPONSE ==========
Total eligible voters: 15
Total pages: 2
Current page: 0
Records in this page: 10
Voters in response:
  - Betty Muhaye (ID: 36) [Position: Chairperson, Location: Namirembe Archdeaconry, Override: false]
  - Cyrus Wambuzi (ID: 32) [Position: Secretary, Location: Buikwe Archdeaconry, Override: false]
  ... (more voters)
===========================================
```

---

## Step-by-Step Log Analysis

### STEP 1: Database Query
```
Total unfiltered voters from database: X
```

**What this tells you:**
- How many people match the basic eligibility criteria (have position OR override)
- If 0 → No one is eligible in the database
- If > 0 → Keep investigating the filtering

### STEP 2: Mapping to Response Objects
```
Total mapped responses: X
```

**What this tells you:**
- Whether the mapping succeeded
- Should match Step 1 count
- If different → There was an error during mapping

### STEP 3-6: Filter Application
```
Before [filter]: X
After [filter]: Y
```

**What this tells you:**
- How many voters were removed by each filter
- Which filter is most restrictive
- If a filter unexpectedly removes everyone → That's the problem

**Example:**
```
--- STEP 3: Applying status filter: VOTED ---
  Before status filter: 15
  After status filter: 2
  ✓ Betty Muhaye - voted: true
  ✓ Cyrus Wambuzi - voted: true
```

This shows only 2 people out of 15 have actually voted.

### STEP 7: Pagination
```
Total results: X
Requested page: Y, size: Z
Returning records A to B (of X)
Records in this page: N
```

**What this tells you:**
- How many records are in the final result set
- Whether pagination is working correctly
- If page is empty but results exist → Check page number

### STEP 8: Response
```
Voters in response:
  - [Name] (ID: X) [Position: Y, Location: Z, Override: true/false]
```

**What this tells you:**
- Exactly which voters are being returned
- Their position and location info
- Whether they're overrides

---

## Debugging Guide

### Scenario 1: Zero Results from Start

```
Total unfiltered voters from database: 0
```

**Problem:** No one is eligible at the database level

**Check:**
1. Run diagnostic SQL queries (see ELIGIBLE_VOTERS_QUICK_REFERENCE.md)
2. Verify positions are defined for this election
3. Verify people have assignments at the right organizational level/location
4. Verify no filters are being applied in the query yet (they shouldn't be)

**Fix:**
- Add people to leadership_assignments
- Or add manual overrides to election_voter_roll
- Or check data integrity (diocese_id, archdeaconry_id relationships)

### Scenario 2: Results from Database, But Filtered Out

```
Total unfiltered voters from database: 15
...
--- STEP 3: Applying status filter: VOTED ---
  Before status filter: 15
  After status filter: 0
```

**Problem:** All voters get filtered out by status filter

**This means:**
- 15 people are eligible
- But ALL 15 are NOT_VOTED
- And you requested status=VOTED

**Fix:**
- Either remove the status filter
- Or vote some people in the election first

### Scenario 3: Unexpected Filter Results

```
--- STEP 4: Applying fellowship filter: 5 ---
  Before fellowship filter: 15
  After fellowship filter: 0
  ✗ Betty Muhaye has no fellowship
  ✗ Cyrus Wambuzi has no fellowship
  ... (all 15 have no fellowship)
```

**Problem:** Fellowship filter removes everyone

**This could mean:**
- Your position assignments don't have fellowship_name populated
- Or the fellowship relationship is broken in the database

**Fix:**
- Check fellowship_positions have fellowship_id set
- Check fellowships table has proper names
- Verify the join is working correctly

---

## Code Implementation Details

### Location
**File:** `src/main/java/com/mukono/voting/service/election/EligibleVoterService.java`

### Key Changes

#### 1. Unfiltered Database Query
```java
Page<EligibleVoterProjection> unfilteredPage = votingCodeRepository.searchEligibleVoters(
    electionId,
    votingPeriodId,
    "ALL",     // Don't filter by status
    null,      // Don't filter by search
    null,      // Don't filter by fellowship
    null,      // Don't filter by position
    PageRequest.of(0, Integer.MAX_VALUE)  // Get ALL records
);
```

This gets everyone eligible without any filtering.

#### 2. Java-Based Filtering
```java
statusFiltered = statusFiltered.stream()
    .filter(voter -> {
        if ("VOTED".equals(effectiveStatus)) {
            return voter.isVoted();  // Only include if voted
        }
        // ... more logic
    })
    .collect(Collectors.toList());
```

Each filter is applied sequentially with logging.

#### 3. Pagination in Java
```java
int fromIndex = pageNum * pageSize;
int toIndex = Math.min(fromIndex + pageSize, total);
paginated = queryFiltered.subList(fromIndex, toIndex);
```

Pagination done after all filtering.

#### 4. Logging at Each Step
```java
logger.info("Total unfiltered voters from database: {}", allProjections.size());
logger.info("Before status filter: {}", statusFiltered.size());
logger.debug("  ✓ {} - voted: {}", voter.getFullName(), voter.isVoted());
```

Multiple log levels:
- `info` for high-level counts
- `debug` for individual voter details

---

## Performance Considerations

### Current Approach (For Debugging)
- ❌ Fetches ALL voters into Java (Integer.MAX_VALUE)
- ❌ Filters in application memory
- ✅ Perfect for debugging
- ✅ Shows exactly where filtering happens

### After Debugging (Optimize Later)
- ✅ Move filtering back to SQL
- ✅ Let database do filtering
- ✅ Much faster for large datasets
- ✅ Paginate in SQL

---

## Next Steps

1. **Restart your application** with the new code
2. **Call the endpoint:** `http://localhost:8080/api/v1/admin/elections/380/voting-periods/438/eligible-voters?page=0&size=10&sort=fullName,asc`
3. **Check the console logs** for the debug output
4. **Share the output** with the following info:
   - How many voters in database (Step 1)?
   - Are they getting filtered out? In which step?
   - What do the voters' names show?

5. **Once we know the issue:**
   - We can fix the SQL query
   - Or update the data
   - Or adjust the filtering logic

---

## Example Log Sequences

### Example 1: Success (Returns Results)
```
Total unfiltered voters from database: 15
Total mapped responses: 15
Before status filter: 15
After status filter: 15
...
Total eligible voters: 15
Total pages: 2
Current page: 0
Records in this page: 10
Voters in response:
  - Betty Muhaye (ID: 36) [Position: Chairperson, ...]
  - Cyrus Wambuzi (ID: 32) [Position: Secretary, ...]
  ...
```

**Analysis:** Everything works! 15 people eligible, 10 shown on first page.

### Example 2: No Positions Defined
```
Total unfiltered voters from database: 0
Total mapped responses: 0
...
Total eligible voters: 0
Total pages: 0
Current page: 0
Records in this page: 0
Voters in response:
  (empty)
```

**Analysis:** No one eligible. Check if election_positions exist.

### Example 3: All Filtered by Status
```
Total unfiltered voters from database: 20
Total mapped responses: 20
Before status filter (VOTED): 20
After status filter (VOTED): 0
  (No voters shown - all are NOT_VOTED)
...
Total eligible voters: 0
```

**Analysis:** 20 eligible, but none have voted. Status filter removed all.

---

## Debugging Checklist

- [ ] Restart application after changes
- [ ] Check `application.properties` or `application.yml` has logging enabled
- [ ] Call endpoint and capture full console output
- [ ] Note the counts at each step
- [ ] Identify which step filters out voters
- [ ] Share logs and current findings

---

## Files Modified

**File:** `src/main/java/com/mukono/voting/service/election/EligibleVoterService.java`

**Changes:**
- Added SLF4J Logger
- Refactored listEligibleVoters() to log each step
- Moved filtering from SQL to Java logic
- Added PageImpl for Java-based pagination
- Added debug logs for individual voter matching
- Enhanced error handling in mapping

---

## Summary

The eligible voters endpoint now has comprehensive logging that shows:

✅ How many voters are retrieved from database
✅ How many voters pass each filter
✅ Which specific voters pass/fail each filter
✅ Final result count and pagination info
✅ Exact voters returned in response

This makes it easy to identify:
- If the database query is returning people
- If filters are removing people unexpectedly
- At which step the problem occurs
- What data is causing the issue

Once we see the logs, we'll know exactly what to fix! 🔍
