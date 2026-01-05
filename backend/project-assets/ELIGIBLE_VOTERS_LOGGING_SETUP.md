# Quick Setup Guide - Debug Logging

## Step 1: Enable Logging

### Find your application configuration file:
- `src/main/resources/application.properties` OR
- `src/main/resources/application.yml`

### Add these lines:

**If using application.properties:**
```properties
logging.level.com.mukono.voting.service.election=DEBUG
```

**If using application.yml:**
```yaml
logging:
  level:
    com.mukono.voting.service.election: DEBUG
```

## Step 2: Rebuild and Restart

```bash
cd backend
./mvnw clean package -DskipTests
# Then restart your application
```

## Step 3: Test the Endpoint

Open your browser and go to:
```
http://localhost:8080/api/v1/admin/elections/380/voting-periods/438/eligible-voters?page=0&size=10&sort=fullName,asc
```

## Step 4: Check Console Logs

Look in your application console (where you started the app) for output like:

```
========== ELIGIBLE VOTERS REQUEST ==========
Election ID: 380
Voting Period ID: 438
...
Total unfiltered voters from database: X
...
Total eligible voters: Y
========== ELIGIBLE VOTERS RESPONSE ==========
```

## Step 5: Share the Logs

Copy the entire log output and share it so we can see:
1. How many voters are retrieved from database
2. How many voters pass each filter
3. Which voters are in the final result

---

## What the Logs Will Show

### If returning results:
```
Total unfiltered voters from database: 15
Total mapped responses: 15
...
Total eligible voters: 15
Voters in response:
  - Betty Muhaye (ID: 36) [Position: Chairperson, ...]
  - Cyrus Wambuzi (ID: 32) [Position: Secretary, ...]
```

### If returning zero results:
```
Total unfiltered voters from database: 0
Total mapped responses: 0
...
Total eligible voters: 0
Voters in response:
  (empty)
```

This tells us if the problem is at the database level or filtering level!

---

## Troubleshooting

### If logs don't appear:
- Check you restarted the application
- Check you're using the right config file (app.properties vs app.yml)
- Check the log level is set to DEBUG (not INFO or WARN)
- Check there are no typos in the package name

### If logs show too much:
- Logs at INFO level (counts and main steps) will always show
- Logs at DEBUG level (individual voters) only show if configured
- You can reduce by setting to INFO level instead of DEBUG

---

## Expected Output

When you call the endpoint, you should see something like:

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
  Mapping: John Kabuubi (ID: 37)
  ... (more voters)
Total mapped responses: 15

--- STEP 3: Applying status filter: ALL ---
  Before status filter: 15
  After status filter: 15

--- STEP 4: Applying fellowship filter: null ---

--- STEP 5: Applying election position filter: null ---

--- STEP 6: Applying search query filter: null ---

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
  - John Kabuubi (ID: 37) [Position: Treasurer, Location: Misindye Church, Override: false]
  ... (more voters)
===========================================
```

---

## Next Steps

1. ✅ Add logging configuration
2. ✅ Rebuild application
3. ✅ Restart application
4. ✅ Call endpoint
5. ✅ Check console logs
6. ✅ Share complete log output

Once we see the logs, we'll know exactly where the problem is! 🔍
