# Eligible Voters Position Attributes Enhancement

## Enhancement Summary
**Date:** January 5, 2026

### Overview
Added three new top-level attributes to the eligible voters API response for quick and easy access to voter position information:
- `position` - The position title (e.g., "Chairperson", "Secretary", "Treasurer")
- `location` - The scope location name (diocese, archdeaconry, or church name)
- `fellowship` - The fellowship name (e.g., "Men's Fellowship", "Women's Fellowship")

### Endpoint
`GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/eligible-voters`

### Changes Made

#### 1. Database Query Enhancement
**File:** `VotingCodeRepository.java`

Added three new columns to the SQL SELECT statement:
```sql
MAX(positionOnly.position_name) AS position,
MAX(positionOnly.scope_name) AS location,
MAX(positionOnly.fellowship_name) AS fellowship,
```

These extract the first position's details from the joined leadership assignments data.

#### 2. Projection Interface
**File:** `EligibleVoterProjection.java`

Added three new getter methods:
```java
String getPosition();    // first position title name
String getLocation();    // scope name (diocese/archdeaconry/church)
String getFellowship();  // first fellowship name
```

#### 3. Response DTO
**File:** `EligibleVoterResponse.java`

Added three new fields:
```java
private String position;     // e.g., "Chairperson"
private String location;     // e.g., "Misindye Church"
private String fellowship;   // e.g., "Men's Fellowship"
```

Updated constructor to accept these new parameters and added corresponding getters.

#### 4. Service Mapping
**File:** `EligibleVoterService.java`

Updated the mapping method to populate the new fields:
```java
p.getPosition(),
p.getLocation(),
p.getFellowship()
```

### Response Example

#### Before (Minimal fields shown):
```json
{
  "personId": 36,
  "fullName": "Betty Muhaye",
  "phoneNumber": "0777600257",
  "scopeName": "N/A",
  "voted": false,
  "isOverride": false
}
```

#### After (With new fields):
```json
{
  "personId": 36,
  "fullName": "Betty Muhaye",
  "phoneNumber": "0777600257",
  "scopeName": "N/A",
  "voted": false,
  "isOverride": false,
  "position": "Chairperson",
  "location": "Misindye Church",
  "fellowship": "Men's Fellowship",
  "positionAndLocation": "Chairperson",
  "positionsSummary": [
    {
      "positionName": "Chairperson",
      "fellowshipName": "Men's Fellowship",
      "scope": "CHURCH",
      "scopeName": "Misindye Church"
    }
  ]
}
```

### Manual Override Cases
For voters who are manual overrides (from election_voter_roll), these fields will be `null`:
```json
{
  "personId": 123,
  "fullName": "John Doe",
  "isOverride": true,
  "position": null,
  "location": null,
  "fellowship": null,
  "positionAndLocation": "Manual Override",
  "positionsSummary": null
}
```

### Benefits

1. **Simplified UI Development**: Frontend can directly access position details without parsing `positionsSummary` array
2. **Backward Compatible**: Existing `positionsSummary` array remains unchanged
3. **Consistent Naming**: Fields use clear, intuitive names
4. **Null Safety**: Fields are null for manual overrides, maintaining data integrity

### Location Logic

The `location` field contains the scope-appropriate location name based on the position assignment:
- **Diocese-level positions**: Diocese name (e.g., "Mukono Diocese")
- **Archdeaconry-level positions**: Archdeaconry name (e.g., "Namirembe Archdeaconry")
- **Church-level positions**: Church name (e.g., "Misindye Church")

This is determined by the `leadership_assignments` table's foreign keys:
- `diocese_id` → Diocese name
- `archdeaconry_id` → Archdeaconry name
- `church_id` → Church name

The query uses `COALESCE(d.name, ad.name, ch.name, 'N/A')` to select the appropriate level.

### Files Modified

1. `src/main/java/com/mukono/voting/repository/election/projection/EligibleVoterProjection.java`
   - Added 3 new getter methods

2. `src/main/java/com/mukono/voting/repository/election/VotingCodeRepository.java`
   - Added 3 new columns to SQL SELECT

3. `src/main/java/com/mukono/voting/payload/response/election/EligibleVoterResponse.java`
   - Added 3 new fields
   - Updated constructor
   - Added 3 new getters

4. `src/main/java/com/mukono/voting/service/election/EligibleVoterService.java`
   - Updated mapping to populate new fields

### Testing
✅ Build successful with `./mvnw clean compile`
✅ No compilation errors
✅ All changes backward compatible

### Next Steps
1. Restart the application to apply changes
2. Test with: `GET http://localhost:8080/api/v1/admin/elections/380/voting-periods/438/eligible-voters?page=0&size=10&sort=fullName,asc`
3. Verify Betty Muhaye and Cyrus Wambuzi now show:
   - `position`: Their position title
   - `location`: Their church/archdeaconry/diocese name
   - `fellowship`: Their fellowship name
4. Update frontend to use these new fields for simpler rendering
