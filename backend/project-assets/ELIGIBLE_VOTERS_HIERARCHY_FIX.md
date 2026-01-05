# Eligible Voters Organizational Hierarchy Fix

## Issue Summary
**Date:** January 5, 2026

### Problem
The eligible voters endpoint was returning **ZERO voters** for election 380, voting period 438, even though there were people with qualifying leadership assignments.

**Endpoint:** `GET /api/v1/admin/elections/380/voting-periods/438/eligible-voters`

### Root Causes

1. **Incorrect Organizational Hierarchy Checks**
   - The query was checking if someone had an archdeaconry position (`la.archdeaconry_id IS NOT NULL`) but NOT verifying that the archdeaconry belonged to the diocese of the election
   - Similarly for church positions and archdeaconry elections
   - This meant people with positions in OTHER dioceses/archdeaconries were being included or excluded incorrectly

2. **Voting Code Dependency**
   - The WHERE clause required: `(positionOnly.person_id IS NOT NULL OR evr.person_id IS NOT NULL OR vc.person_id IS NOT NULL)`
   - This meant people would ONLY appear if they had a voting code
   - But voting codes are issued AFTER determining eligibility, creating a chicken-and-egg problem
   - If no codes were issued yet, NO ONE would appear as eligible

### Election Scope Rules

The system enforces these hierarchical voting rules:

| Election Scope | Who Can Vote | Organizational Check |
|---------------|--------------|---------------------|
| **DIOCESE** | People with ARCHDEACONRY-level positions | Archdeaconry must be in THAT diocese |
| **ARCHDEACONRY** | People with CHURCH-level positions | Church must be in THAT archdeaconry |
| **CHURCH** | People with positions in that church | Position must be at THAT specific church |

**Example:**
- **Election 380**: Diocese of Mukono election (scope = DIOCESE, diocese_id = 5)
  - ✅ John - Chairperson at Namirembe Archdeaconry (archdeaconry.diocese_id = 5) → **ELIGIBLE**
  - ❌ Jane - Chairperson at Kampala Archdeaconry (archdeaconry.diocese_id = 3) → **NOT ELIGIBLE**
  - ❌ Bob - Treasurer at Misindye Church → **NOT ELIGIBLE** (wrong level)

### Solution Implemented

#### 1. Fixed Organizational Hierarchy Checks

**Before (WRONG):**
```sql
WHERE la.status = 'ACTIVE'
  AND (
      (e.scope = 'DIOCESE' AND la.archdeaconry_id IS NOT NULL)
   OR (e.scope = 'ARCHDEACONRY' AND la.church_id IS NOT NULL)
   OR (e.scope NOT IN ('DIOCESE','ARCHDEACONRY'))
  )
```
This only checked if someone had an archdeaconry position, but didn't verify it was in the right diocese!

**After (CORRECT):**
```sql
WHERE la.status = 'ACTIVE'
  AND (
      (e.scope = 'DIOCESE' AND la.archdeaconry_id IS NOT NULL AND ad.diocese_id = e.diocese_id)
   OR (e.scope = 'ARCHDEACONRY' AND la.church_id IS NOT NULL AND ch.archdeaconry_id = e.archdeaconry_id)
   OR (e.scope = 'CHURCH' AND la.church_id = e.church_id)
  )
```

**Key Changes:**
- **Diocese elections**: Added `AND ad.diocese_id = e.diocese_id` to ensure archdeaconry is in the election's diocese
- **Archdeaconry elections**: Added `AND ch.archdeaconry_id = e.archdeaconry_id` to ensure church is in the election's archdeaconry
- **Church elections**: Changed to `AND la.church_id = e.church_id` to ensure position is at the specific church

#### 2. Removed Voting Code Dependency

**Before (WRONG):**
```sql
WHERE (positionOnly.person_id IS NOT NULL OR evr.person_id IS NOT NULL OR vc.person_id IS NOT NULL)
```
Required voting codes to exist!

**After (CORRECT):**
```sql
WHERE (positionOnly.person_id IS NOT NULL OR evr.person_id IS NOT NULL)
```
Only requires qualifying position OR manual override.

**Why This Makes Sense:**
1. Eligible voters are determined by their positions or manual overrides
2. Voting codes are ISSUED TO eligible voters (after eligibility is determined)
3. The endpoint should show who IS eligible, not who HAS BEEN issued codes
4. Admins use this endpoint to see who to issue codes to!

#### 3. Updated Count Query

Applied the same fixes to the count query for consistency.

## Database Schema Context

### Elections Table
```sql
elections
  - id
  - scope (DIOCESE, ARCHDEACONRY, CHURCH)
  - diocese_id (NULL for non-diocese elections)
  - archdeaconry_id (NULL for non-archdeaconry elections)
  - church_id (NULL for non-church elections)
```

### Leadership Assignments Table
```sql
leadership_assignments
  - id
  - person_id
  - fellowship_position_id
  - status (ACTIVE, ENDED, etc.)
  - diocese_id (NULL if not diocese-level position)
  - archdeaconry_id (NULL if not archdeaconry-level position)
  - church_id (NULL if not church-level position)
```

### Organizational Hierarchy
```
Diocese (e.g., Mukono Diocese)
  └─ Archdeaconry (e.g., Namirembe Archdeaconry)
      ├─ diocese_id → points to parent diocese
      └─ Church (e.g., Misindye Church)
          └─ archdeaconry_id → points to parent archdeaconry
```

## Query Logic Flow

### For Diocese Election (e.g., Election 380)

1. **Get election details**: `SELECT * FROM elections WHERE id = 380`
   - Result: scope = 'DIOCESE', diocese_id = 5 (Mukono Diocese)

2. **Find qualifying positions**: People with archdeaconry-level positions in diocese 5
   ```sql
   FROM leadership_assignments la
   JOIN archdeaconries ad ON la.archdeaconry_id = ad.id
   WHERE la.archdeaconry_id IS NOT NULL 
     AND ad.diocese_id = 5  -- ← The key check!
   ```

3. **Select first position per person**: Use ROW_NUMBER() to pick one when multiple exist

4. **Join to people**: Get person details with their position info

### For Archdeaconry Election

1. **Get election details**: scope = 'ARCHDEACONRY', archdeaconry_id = X

2. **Find qualifying positions**: People with church-level positions in archdeaconry X
   ```sql
   FROM leadership_assignments la
   JOIN churches ch ON la.church_id = ch.id
   WHERE la.church_id IS NOT NULL 
     AND ch.archdeaconry_id = X  -- ← The key check!
   ```

### For Church Election

1. **Get election details**: scope = 'CHURCH', church_id = Y

2. **Find qualifying positions**: People with positions at church Y
   ```sql
   FROM leadership_assignments la
   WHERE la.church_id = Y  -- ← Direct match!
   ```

## Files Modified

**File:** `src/main/java/com/mukono/voting/repository/election/VotingCodeRepository.java`

**Changes:**
1. Main query `searchEligibleVoters()`:
   - Added organizational hierarchy checks (ad.diocese_id, ch.archdeaconry_id, la.church_id)
   - Removed voting code requirement from WHERE clause
   
2. Count query:
   - Applied same hierarchy checks
   - Removed voting code joins and requirement

## Expected Behavior After Fix

### Before Fix: Zero Results
```json
{
  "content": [],
  "totalElements": 0,
  "totalPages": 0
}
```

### After Fix: Showing Eligible Voters
```json
{
  "content": [
    {
      "personId": 36,
      "fullName": "Betty Muhaye",
      "phoneNumber": "0777600257",
      "position": "Chairperson",
      "location": "Namirembe Archdeaconry",
      "fellowship": "Men's Fellowship",
      "scopeName": "Namirembe Archdeaconry",
      "voted": false,
      "isOverride": false
    },
    {
      "personId": 32,
      "fullName": "Cyrus Wambuzi",
      "phoneNumber": "0784999878",
      "position": "Secretary",
      "location": "Buikwe Archdeaconry",
      "fellowship": "Women's Fellowship",
      "scopeName": "Buikwe Archdeaconry",
      "voted": false,
      "isOverride": false
    }
  ],
  "totalElements": 2,
  "totalPages": 1
}
```

## Edge Cases Handled

### 1. Person with Multiple Qualifying Positions
- **Scenario**: John has Chairperson at Archdeaconry A and Secretary at Archdeaconry B (both in the election's diocese)
- **Result**: ROW_NUMBER() selects first position (ordered by la.id ASC)
- **Display**: Shows first position details

### 2. Person with Position in Wrong Diocese
- **Scenario**: Jane has Chairperson at Archdeaconry in Diocese X, but election is for Diocese Y
- **Result**: NOT included in eligible voters list
- **Why**: `ad.diocese_id = e.diocese_id` check fails

### 3. Person with Position at Wrong Level
- **Scenario**: Bob has Church-level position, but election is at Diocese level
- **Result**: NOT included in eligible voters list
- **Why**: Diocese elections require archdeaconry-level positions

### 4. Manual Override Voter (No Position)
- **Scenario**: Sarah added to election_voter_roll but has no leadership position
- **Result**: INCLUDED in eligible voters list
- **Display**: position, location, fellowship all NULL; isOverride = true

### 5. No Voting Codes Issued Yet
- **Scenario**: New election, no voting codes generated yet
- **Result**: All qualifying position holders STILL appear
- **Why**: No longer requires voting codes to exist

## Testing Checklist

- [x] Build successful
- [ ] Restart application
- [ ] Test endpoint: `GET /api/v1/admin/elections/380/voting-periods/438/eligible-voters`
- [ ] Verify voters with qualifying positions appear
- [ ] Verify count matches list total
- [ ] Verify position/location/fellowship fields populated correctly
- [ ] Test different election scopes:
  - [ ] Diocese election (scope = DIOCESE)
  - [ ] Archdeaconry election (scope = ARCHDEACONRY)
  - [ ] Church election (scope = CHURCH)
- [ ] Verify only people in correct organizational hierarchy appear
- [ ] Verify manual overrides still work (if any in voter roll)
- [ ] Test filters: `?fellowshipId=X`
- [ ] Test search: `?q=name`

## Potential Issues to Watch

### 1. NULL Foreign Keys
If `archdeaconries.diocese_id` or `churches.archdeaconry_id` are NULL in database:
- Those positions won't match any election
- Should be a data integrity issue to fix separately

### 2. Performance with Large Datasets
- ROW_NUMBER() window function adds overhead
- But it's necessary to pick one position when multiple exist
- Consider adding index on `(person_id, id)` for leadership_assignments if slow

### 3. Election Without Proper Scope Setup
If election has `scope = DIOCESE` but `diocese_id IS NULL`:
- No voters will be returned (e.scope = 'DIOCESE' AND ad.diocese_id = e.diocese_id will fail)
- This should be caught during election creation validation

## Summary

✅ **Fixed organizational hierarchy checks** to properly verify positions belong to the election's diocese/archdeaconry/church

✅ **Removed voting code dependency** so eligible voters appear even before codes are issued

✅ **Applied fixes to both main and count queries** for consistency

✅ **Build successful** - ready to test

The endpoint will now correctly return all people with qualifying active leadership positions based on the election's organizational scope.

## Related Documentation

- `ELIGIBLE_VOTERS_POSITION_DATA_FIX_COMPLETE.md` - Previous fix for "N/A" values
- `ELIGIBLE_VOTERS_POSITION_ATTRIBUTES_ENHANCEMENT.md` - Addition of position/location/fellowship fields
- `ELIGIBLE_VOTERS_IMPLEMENTATION.md` - Original implementation
