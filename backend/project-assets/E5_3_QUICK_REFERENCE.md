# E5.3 Voting Services - Quick Reference Guide

## Quick Start

### 1. Inject Services
```java
@Service
public class YourVotingController {
    @Autowired
    private ElectionVoterEligibilityService eligibilityService;
    
    @Autowired
    private ElectionVotingService votingService;
    
    @Autowired
    private ElectionResultsService resultsService;
}
```

---

## Eligibility Service Quick Calls

### Check if voter is eligible
```java
// Simple boolean check
boolean eligible = eligibilityService.isEligible(electionId, voterId);

// Detailed check with reason
EligibilityDecision decision = eligibilityService.checkEligibility(electionId, voterId);
System.out.println(decision.getReason());  // "Whitelisted voter: ..."
```

### Manage voter roll overrides (admin)
```java
// Whitelist a special voter
eligibilityService.addOrUpdateOverride(
    electionId, personId, 
    true,  // eligible=true
    "admin@example.com", 
    "Special voter exception"
);

// Blacklist a voter
eligibilityService.addOrUpdateOverride(
    electionId, personId, 
    false,  // eligible=false
    "admin@example.com", 
    "Disqualified due to ..."
);

// Remove override (revert to normal eligibility rules)
eligibilityService.removeOverride(electionId, personId);

// List all overrides
Page<ElectionVoterRoll> overrides = eligibilityService.listOverrides(
    electionId, null, PageRequest.of(0, 10)  // null = all, or Boolean.TRUE/FALSE
);
```

---

## Voting Service Quick Calls

### Cast a vote
```java
try {
    ElectionVote vote = votingService.castVote(
        electionId,
        electionPositionId,
        candidateId,
        voterId,
        "WEB"  // source: WEB, MOBILE, USSD, etc.
    );
    System.out.println("Vote cast: " + vote.getId());
} catch (IllegalArgumentException e) {
    System.err.println("Vote failed: " + e.getMessage());
}
```

### Check if voter can still vote
```java
boolean alreadyVoted = votingService.hasVoted(electionId, electionPositionId, voterId);
if (alreadyVoted) {
    System.out.println("Voter already voted. Must revoke first or use recast.");
}
```

### Revoke a vote
```java
ElectionVote revoked = votingService.revokeVote(
    electionId,
    electionPositionId,
    voterId,
    "admin@example.com",
    "Voter requested change"
);
System.out.println("Vote revoked, status: " + revoked.getStatus());
```

### Recast a vote (change vote)
```java
// Automatically revokes existing vote, then casts new one
ElectionVote newVote = votingService.recastVote(
    electionId,
    electionPositionId,
    newCandidateId,
    voterId,
    "WEB"
);
System.out.println("Vote changed to candidate: " + newCandidateId);
```

### Retrieve voter's vote
```java
Optional<ElectionVote> myVote = votingService.getMyVote(
    electionId, electionPositionId, voterId
);
if (myVote.isPresent()) {
    System.out.println("You voted for candidate: " + myVote.get().getCandidate().getId());
}
```

### List votes (for audit)
```java
Page<ElectionVote> allVotes = votingService.listVotes(
    electionId, 
    PageRequest.of(0, 20)
);

Page<ElectionVote> positionVotes = votingService.listVotesForPosition(
    electionId, 
    electionPositionId, 
    PageRequest.of(0, 20)
);
```

### Get vote counts
```java
long totalForPosition = votingService.countVotesForPosition(electionId, electionPositionId);
long uniqueVoters = votingService.countUniqueVoters(electionId);
System.out.println("Total votes: " + totalForPosition + ", Unique voters: " + uniqueVoters);
```

---

## Results Service Quick Calls

### Get tally for a position
```java
List<CandidateVoteCount> tally = resultsService.tallyPosition(electionId, electionPositionId);
for (CandidateVoteCount result : tally) {
    System.out.println("Candidate " + result.getCandidateId() + ": " + result.getVotes() + " votes");
}
```

### Get turnout by position
```java
List<PositionVoteCount> turnout = resultsService.turnoutByPosition(electionId);
for (PositionVoteCount result : turnout) {
    System.out.println("Position " + result.getElectionPositionId() + ": " + result.getVotes() + " votes");
}
```

### Determine winner
```java
WinnerResult result = resultsService.getWinner(electionId, electionPositionId);
if (result.isTie()) {
    System.out.println("TIE! Candidates: " + result.getTopCandidateIds() + 
                       " with " + result.getTopVotes() + " votes each");
} else {
    System.out.println("Winner: Candidate " + result.getWinnerCandidateId() + 
                       " with " + result.getTopVotes() + " votes");
}
```

### Vote breakdown (reporting)
```java
Map<Long, Long> breakdown = resultsService.getVoteBreakdown(electionId, electionPositionId);
breakdown.forEach((candidateId, votes) -> 
    System.out.println("Candidate " + candidateId + ": " + votes + " votes")
);
```

### Turnout percentage
```java
double turnoutPct = resultsService.getTurnoutPercentage(electionId, electionPositionId);
System.out.println("Turnout for position: " + String.format("%.1f%%", turnoutPct));
```

### Unique voters count
```java
long uniqueVoterCount = resultsService.uniqueVoters(electionId);
System.out.println("Total voters participated: " + uniqueVoterCount);
```

---

## Error Handling Pattern

```java
@PostMapping("/vote")
public ResponseEntity<?> castVote(@RequestBody VoteRequest request) {
    try {
        ElectionVote vote = votingService.castVote(
            request.getElectionId(),
            request.getPositionId(),
            request.getCandidateId(),
            request.getVoterId(),
            "WEB"
        );
        return ResponseEntity.ok(vote);
    } catch (IllegalArgumentException e) {
        // All validation errors from voting service
        return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
    }
}
```

**Common error messages to handle:**
- "Election not found"
- "Voting is not open for this election"
- "You are not eligible to vote in this election"
- "You have already voted for this position"
- "Candidate does not belong to this position/election"
- "Vote not found for this election, position, and voter"

---

## Eligibility Tiers Explained

When checking eligibility, the service checks in this order:

### 1. Voter Roll Override (Highest Priority)
If person has entry in `election_voter_roll` table:
- `eligible=true` → **ALLOW** (whitelisted special voter)
- `eligible=false` → **DENY** (blacklisted)

### 2. Fellowship Membership
If no override, check: Does voter have **active LeadershipAssignment** in this fellowship?
- Yes → Continue to Tier 3
- No → **DENY** ("Not a member of fellowship")

### 3. Scope-Target Membership
If Tier 2 passed, check scope:
- **DIOCESE:** Voter's assignment must target this diocese
- **ARCHDEACONRY:** Voter's assignment must target this archdeaconry
- **CHURCH:** Voter's assignment must target this church

If scope matches → **ALLOW**  
If scope doesn't match → **DENY**

---

## Transaction Boundaries

All methods are transactional:
- **Mutating methods** (cast, revoke, recast, override CRUD): `@Transactional`
  - Automatically rolled back on exception
  - Lock rows for consistency
- **Read methods**: `@Transactional(readOnly = true)`
  - Optimized for read-only access
  - Better performance, no locks

---

## Vote Status Lifecycle

```
Initial State: No vote exists

        ↓ castVote()
        
     CAST (active vote)
        ↓ revokeVote()
        
     REVOKED (canceled vote, not deleted)
        ↓ recastVote()
        
     CAST (new vote for new candidate)
```

**Important:** `REVOKED` votes are excluded from all result computations.

---

## Audit Trail

All transactions are auditable:
- **Votes:** `castAt` timestamp preserved across revoke
- **Overrides:** `addedAt` timestamp, `addedBy` (admin username)
- **Audit fields:** Auto-managed via `DateAudit` base class

---

## Testing Tips

### Test Eligibility
```java
// Test Tier 1 (voter roll)
eligibilityService.addOrUpdateOverride(electionId, voterId, true, "admin", "test");
assertTrue(eligibilityService.isEligible(electionId, voterId));

// Test Tier 2 (fellowship)
// Create LeadershipAssignment linking voter to fellowship
// Verify isEligible() returns true

// Test Tier 3 (scope)
// Verify voter must be assigned to correct diocese/archdeaconry/church
```

### Test Voting
```java
// Test R1: Election status
assertThrows(IllegalArgumentException.class, () ->
    votingService.castVote(draftElectionId, posId, candId, voterId, "WEB")
);

// Test R5: One vote per position
votingService.castVote(electionId, posId, cand1Id, voterId, "WEB");
assertThrows(IllegalArgumentException.class, () ->
    votingService.castVote(electionId, posId, cand2Id, voterId, "WEB")
);

// Test R6: Revoke without delete
ElectionVote vote = votingService.castVote(...);
votingService.revokeVote(...);
assertTrue(electionVoteRepository.existsById(vote.getId()));  // Still exists
```

### Test Results
```java
// Test tie detection
// Cast votes: candidate1=5, candidate2=5, candidate3=3
WinnerResult result = resultsService.getWinner(electionId, posId);
assertTrue(result.isTie());
assertEquals(2, result.getTopCandidateIds().size());
```

---

## See Also

- **E5.2 Voting Repositories:** Tally queries (`tallyByCandidate`, `turnoutByPosition`, etc.)
- **Election Model:** `Election`, `ElectionPosition`, `ElectionCandidate`, `ElectionVote`, `ElectionVoterRoll`
- **Org Model:** `Diocese`, `Archdeaconry`, `Church`, `Fellowship`
- **Leadership Model:** `LeadershipAssignment`, `FellowshipPosition`
