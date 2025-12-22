# ElectionPositionService Multi-Fellowship Fixes

**Date:** December 22, 2025  
**Status:** ✅ COMPLETE - All errors resolved

## Issues Fixed

### 1. Removed Fellowship Validation from Election
**Problem:** Service was checking if `fellowshipPosition.fellowship` matched `election.fellowship`, but elections no longer have a single fellowship in the multi-fellowship architecture.

**Old Code:**
```java
// Validate fellowship match
if (!fellowshipPosition.getFellowship().getId().equals(election.getFellowship().getId())) {
    throw new IllegalArgumentException(
            "Fellowship position belongs to a different fellowship than the election");
}
```

**Fix:** Removed this validation entirely. Elections can now have positions from multiple fellowships.

### 2. Updated Duplicate Check to Include Fellowship
**Problem:** Duplicate check was only using `(electionId, fellowshipPositionId)` but the new unique constraint is `(electionId, fellowshipId, fellowshipPositionId)`.

**Old Code:**
```java
if (electionPositionRepository.existsByElectionIdAndFellowshipPositionId(electionId, fellowshipPositionId)) {
    throw new IllegalArgumentException("Position is already added to this election");
}
```

**New Code:**
```java
if (electionPositionRepository.existsByElectionIdAndFellowshipIdAndFellowshipPositionId(
        electionId, fellowshipPosition.getFellowship().getId(), fellowshipPositionId)) {
    throw new IllegalArgumentException(
            "Position is already added to this election for this fellowship");
}
```

**Impact:** Now allows the same position title to exist for different fellowships in the same election.

### 3. Added Fellowship to ElectionPosition Constructor
**Problem:** ElectionPosition entity now requires fellowship field to be set.

**Old Code:**
```java
ElectionPosition electionPosition = new ElectionPosition();
electionPosition.setElection(election);
electionPosition.setFellowshipPosition(fellowshipPosition);
electionPosition.setSeats(finalSeats);
```

**New Code:**
```java
ElectionPosition electionPosition = new ElectionPosition();
electionPosition.setElection(election);
electionPosition.setFellowship(fellowshipPosition.getFellowship());
electionPosition.setFellowshipPosition(fellowshipPosition);
electionPosition.setSeats(finalSeats);
electionPosition.setMaxVotesPerVoter(finalSeats); // Default max votes = seats
```

### 4. Added Repository Method
**Problem:** Repository didn't have the new uniqueness check method.

**Added to ElectionPositionRepository:**
```java
/**
 * Check if a position is already added to an election for a specific fellowship.
 * Used in multi-fellowship architecture where same position can exist for different fellowships.
 * Matches the unique constraint (election_id, fellowship_id, fellowship_position_id).
 */
boolean existsByElectionIdAndFellowshipIdAndFellowshipPositionId(
        Long electionId, Long fellowshipId, Long fellowshipPositionId);
```

## Validation Logic Preserved

### What Still Works
✅ Election must exist  
✅ Election must be in DRAFT status to modify positions  
✅ Fellowship position must exist  
✅ Scope must match (position.scope == election.scope)  
✅ Fellowship must be associated with the position  
✅ Seats must be >= 1  
✅ Duplicate prevention (now fellowship-aware)  

### What Changed
- ❌ NO LONGER validates fellowship matches election.fellowship (removed constraint)
- ✅ NOW allows same position for different fellowships in one election
- ✅ NOW sets maxVotesPerVoter = seats by default

## Example Use Case

With these fixes, you can now:

```java
// Election 364: "2026 Cathedral Elections" (no single fellowship)
Election election = ...;

// Add Chairman position for Fathers Union
electionPositionService.addPosition(364L, 45L, 1); 
// Creates: election_id=364, fellowship_id=2, fellowship_position_id=45

// Add Chairman position for Mothers Union (same title, different fellowship)
electionPositionService.addPosition(364L, 78L, 1);
// Creates: election_id=364, fellowship_id=3, fellowship_position_id=78

// Both positions can now coexist in the same election!
```

## Compilation Status
✅ Clean compilation - no errors  
✅ All dependencies resolved  
✅ Repository methods recognized  

## Next Steps
Service is now fully compatible with multi-fellowship architecture. The logic correctly:
1. Extracts fellowship from the FellowshipPosition
2. Validates at the fellowship level
3. Allows multiple fellowships per election
4. Sets maxVotesPerVoter for ballot constraints

## Files Modified
1. `ElectionPositionService.java` - Updated validation and entity creation
2. `ElectionPositionRepository.java` - Added new uniqueness check method

## Testing Recommendation
When updating tests, ensure they create Fellowship entities and pass them to ElectionPosition constructors:
```java
Fellowship fellowship = new Fellowship();
fellowship.setId(1L);
fellowship.setName("Test Fellowship");

ElectionPosition pos = new ElectionPosition(
    election,
    fellowship,        // NOW REQUIRED
    fellowshipPosition,
    seats
);
```
