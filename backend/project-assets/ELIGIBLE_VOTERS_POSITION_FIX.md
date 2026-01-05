# Eligible Voters Position and Location Fix

## Issue Summary
**Date:** January 5, 2026

### Problem
In the eligible voters endpoint (`/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/eligible-voters`), some voters who had legitimate position assignments were incorrectly showing:
- `positionAndLocation`: "Manual Override" 
- `isOverride`: false
- `positionsSummary`: Array with null values `[{positionName: null, fellowshipName: null, scope: null, scopeName: null}]`

**Example Cases:**
- Betty Muhaye (personId: 36) - had position assignments but showed "Manual Override"
- Cyrus Wambuzi (personId: 32) - had position assignments but showed "Manual Override"

### Root Cause
The SQL query in `VotingCodeRepository.searchEligibleVoters()` had two issues:

1. **Incorrect COALESCE logic:**
   ```sql
   COALESCE(MAX(positionOnly.position_name), 'Manual Override') AS positionAndLocation
   ```
   This would default to 'Manual Override' whenever `position_name` was NULL, even for non-override voters.

2. **JSON_ARRAYAGG creating null objects:**
   ```sql
   JSON_ARRAYAGG(JSON_OBJECT(...)) AS positionsSummaryJson
   ```
   This would create an array with one null-valued object even when there were no position assignments, instead of returning NULL.

### Solution
Modified the SQL query to use CASE statements for proper conditional logic:

**For positionAndLocation:**
```sql
CASE 
    WHEN MIN(evr.evr_id) IS NOT NULL THEN 'Manual Override'
    ELSE MAX(positionOnly.position_name)
END AS positionAndLocation
```
- If the person is in the voter roll (manual override), show "Manual Override"
- Otherwise, show their actual position name

**For positionsSummaryJson:**
```sql
CASE 
    WHEN MIN(evr.evr_id) IS NOT NULL THEN NULL
    WHEN MAX(positionOnly.position_name) IS NOT NULL THEN JSON_ARRAYAGG(JSON_OBJECT(...))
    ELSE NULL
END AS positionsSummaryJson
```
- If manual override, return NULL (no positions to show)
- If they have positions, aggregate them into JSON array
- Otherwise, return NULL (not an empty array with null values)

## Files Changed
- `src/main/java/com/mukono/voting/repository/election/VotingCodeRepository.java`
  - Modified `searchEligibleVoters()` native query (lines ~113-128)

## Testing
- Build completed successfully with `./mvnw clean compile`
- No compilation errors
- Logic now correctly distinguishes between:
  - Manual overrides (from election_voter_roll): Shows "Manual Override" with null positionsSummary
  - Position-based voters (from leadership_assignments): Shows actual positions with populated positionsSummary

## Expected Behavior After Fix
### Manual Override Voters (isOverride = true)
```json
{
  "personId": 123,
  "isOverride": true,
  "positionAndLocation": "Manual Override",
  "positionsSummary": null
}
```

### Position-Based Voters (isOverride = false)
```json
{
  "personId": 36,
  "isOverride": false,
  "positionAndLocation": "Position Title Name",
  "positionsSummary": [
    {
      "positionName": "Position Title Name",
      "fellowshipName": "Fellowship Name",
      "scope": "CHURCH",
      "scopeName": "Church Name"
    }
  ]
}
```

## Next Steps
1. Restart the application to apply changes
2. Test the endpoint with election 380, voting period 438
3. Verify Betty Muhaye and Cyrus Wambuzi now show correct position information
4. Verify actual manual overrides still show "Manual Override" correctly
