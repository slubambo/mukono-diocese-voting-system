# E5.5: Integration Tests for Voting API - Implementation Guide

**Date:** December 17, 2025  
**Status:** ✅ FRAMEWORK READY  
**Build:** ✅ SUCCESS (2.046 seconds)

---

## Overview

This document provides guidance for implementing comprehensive integration tests for the Voting REST API (E5.4) using Spring Boot + MockMvc.

---

## Test Framework Components Created

### 1. IntegrationTestBase.java
Base class for all integration tests with:
- ✅ @SpringBootTest
- ✅ @AutoConfigureMockMvc
- ✅ @Transactional (automatic rollback per test)
- ✅ MockMvc injection
- ✅ ObjectMapper for JSON serialization

**Usage:**
```java
@DisplayName("My Controller Integration Tests")
public class MyControllerIntegrationTest extends IntegrationTestBase {
    // Tests automatically get @SpringBootTest, MockMvc, @Transactional
}
```

### 2. TestDataBuilder.java
Reusable builders for domain objects:
- ✅ buildPerson()
- ✅ buildDiocese()
- ✅ buildArchdeaconry()
- ✅ buildChurch()
- ✅ buildFellowship()
- ✅ buildFellowshipPosition()
- ✅ buildElection()
- ✅ buildElectionPosition()
- ✅ buildElectionCandidate()
- ✅ buildElectionVote()
- ✅ buildElectionVoterRoll()

**Usage:**
```java
Person voter = personRepository.save(TestDataBuilder.buildPerson("John Voter"));
Diocese diocese = dioceseRepository.save(TestDataBuilder.buildDiocese("Mukono"));
```

### 3. JsonAssertionHelper.java
Helper methods for JSON response validation:
- ✅ assertApiError()
- ✅ assertEligibilityResponse()
- ✅ assertVoteResponse()
- ✅ assertPositionTallyResponse()
- ✅ assertWinnerResponse()
- ✅ assertPagedResponse()
- ✅ getJsonRoot()

**Usage:**
```java
JsonAssertionHelper.assertVoteResponse(result, electionId, positionId, "CAST");
JsonAssertionHelper.assertApiError(result, 400, "Validation Error");
```

### 4. VotingControllersIntegrationTest.java
Skeleton test class ready for expansion

---

## Test Coverage Plan

### Controllers to Test (3)

#### 1. ElectionVotingController (5 endpoints)
**Happy Paths:**
- [ ] Cast vote → 201 Created
- [ ] Recast vote → 200 OK
- [ ] Revoke vote → 200 OK
- [ ] Get my vote → 200 OK
- [ ] Check eligibility → 200 OK

**Validation Errors (400):**
- [ ] Missing candidateId
- [ ] Missing voterId
- [ ] Missing election path variable
- [ ] Missing position path variable
- [ ] Oversized source field

**Business Rule Errors (400):**
- [ ] Cast vote twice for same position
- [ ] Cast vote when not eligible
- [ ] Recast when no prior vote exists

**Not Found Errors (404):**
- [ ] Non-existent election
- [ ] Non-existent position
- [ ] Non-existent candidate

#### 2. ElectionResultsController (5 endpoints)
**Happy Paths:**
- [ ] Get position tally → 200 OK
- [ ] Get winner → 200 OK
- [ ] Get turnout by position → 200 OK
- [ ] Get turnout percentage → 200 OK
- [ ] Get unique voters → 200 OK

**Validation Errors (400):**
- [ ] Missing election path variable
- [ ] Missing position path variable

**Not Found Errors (404):**
- [ ] Non-existent election
- [ ] Non-existent position
- [ ] No votes for position

#### 3. ElectionVoterRollAdminController (4 endpoints)
**Happy Paths:**
- [ ] Add override (whitelist) → 201 Created
- [ ] Add override (blacklist) → 201 Created
- [ ] Remove override → 204 No Content
- [ ] List overrides → 200 OK (paginated)
- [ ] Count overrides → 200 OK

**Validation Errors (400):**
- [ ] Missing eligible field
- [ ] Oversized addedBy field
- [ ] Oversized reason field
- [ ] Missing election path variable
- [ ] Missing person path variable

**Pagination Tests:**
- [ ] Validate page metadata (page, size, totalElements, totalPages, last)
- [ ] Test filter by eligible flag
- [ ] Test sort functionality

---

## Test Data Setup Challenges

### Challenge 1: FellowshipPosition Entity
**Issue:** FellowshipPosition requires PositionTitle entity, which is complex to set up

**Solutions:**
1. **Use SQL fixtures** - Pre-populate test database with SQL scripts
2. **Mock repository calls** - Use Mockito to mock FellowshipPosition lookups
3. **Create minimal PositionTitle** - Build helper for PositionTitle entity

### Challenge 2: LeadershipAssignment for Eligibility
**Issue:** Voter eligibility requires LeadershipAssignment linking person to fellowship

**Solution:**
```java
// In test @BeforeEach:
LeadershipAssignment assignment = new LeadershipAssignment();
assignment.setPerson(voter);
assignment.setFellowshipPosition(fellowshipPosition);
assignment.setDiocese(diocese);
assignment.setTermStartDate(LocalDate.now());
assignment.setStatus(RecordStatus.ACTIVE);
leadershipAssignmentRepository.save(assignment);
```

### Challenge 3: Test Isolation
**Issue:** Tests share database; one test's data affects another

**Solution:**
```java
@Transactional  // Automatic rollback after each test
public class MyTest extends IntegrationTestBase { ... }
```

---

## Writing Integration Tests - Best Practices

### 1. Test Structure (Given/When/Then)
```java
@Test
@DisplayName("Cast vote successfully returns 201 Created")
public void testCastVote_Success() throws Exception {
    // Given: Setup test data
    CastVoteRequest request = new CastVoteRequest(...);
    
    // When: Perform the action
    MvcResult result = mockMvc.perform(
        post("/api/v1/elections/{electionId}/positions/{positionId}/votes", ...)
            .contentType("application/json")
            .content(asJson(request))
    )
    
    // Then: Verify response
    .andExpect(status().isCreated())
    .andReturn();
    
    JsonAssertionHelper.assertVoteResponse(result, electionId, positionId, "CAST");
}
```

### 2. Error Testing
```java
@Test
@DisplayName("Cast vote with missing candidateId returns 400 Validation Error")
public void testCastVote_MissingCandidateId() throws Exception {
    // Given
    String jsonBody = "{\"voterId\": " + voterId + "}";
    
    // When/Then
    MvcResult result = mockMvc.perform(
        post("/api/v1/elections/{electionId}/positions/{positionId}/votes", ...)
            .contentType("application/json")
            .content(jsonBody)
    )
    .andExpect(status().isBadRequest())
    .andReturn();
    
    JsonAssertionHelper.assertApiError(result, 400, "Validation Error");
}
```

### 3. Pagination Testing
```java
@Test
public void testListOverrides_PaginationMetadata() throws Exception {
    // Create test data (multiple records)
    for (int i = 0; i < 25; i++) {
        voterRollRepository.save(...);
    }
    
    // Request page 0
    MvcResult result = mockMvc.perform(
        get("/api/v1/admin/elections/{id}/voter-roll/", electionId)
            .queryParam("page", "0")
            .queryParam("size", "20")
    )
    .andExpect(status().isOk())
    .andReturn();
    
    // Verify pagination metadata
    JsonAssertionHelper.assertPagedResponse(result, 0, 20);
    String content = result.getResponse().getContentAsString();
    assertThat(content, containsString("\"totalElements\":25"));
    assertThat(content, containsString("\"totalPages\":2"));
    assertThat(content, containsString("\"last\":false"));
}
```

---

## Running Tests

### Run All Tests
```bash
mvn test
```

### Run Specific Test Class
```bash
mvn test -Dtest=ElectionVotingControllerIntegrationTest
```

### Run Specific Test Method
```bash
mvn test -Dtest=ElectionVotingControllerIntegrationTest#testCastVote_Success
```

### Run Tests with Coverage
```bash
mvn test jacoco:report
```

---

## Test Files Location

```
src/test/java/com/mukono/voting/backend/
├── integration/
│   ├── IntegrationTestBase.java (base class)
│   ├── helper/
│   │   ├── TestDataBuilder.java (domain object builders)
│   │   └── JsonAssertionHelper.java (response assertions)
│   └── controller/
│       ├── ElectionVotingControllerIntegrationTest.java (TODO)
│       ├── ElectionResultsControllerIntegrationTest.java (TODO)
│       ├── ElectionVoterRollAdminControllerIntegrationTest.java (TODO)
│       └── VotingControllersIntegrationTest.java (skeleton)
└── ...
```

---

## Next Steps for Implementation

### Step 1: Resolve FellowshipPosition Challenge
**Option A - SQL Fixtures (Recommended):**
```sql
-- src/test/resources/test-data.sql
INSERT INTO position_titles (id, title, status) VALUES (1, 'Bishop', 'ACTIVE');
INSERT INTO fellowship_positions (...) VALUES (...);
```

**Option B - Create Test PositionTitle Builder:**
```java
public static PositionTitle buildPositionTitle(String title) {
    PositionTitle pt = new PositionTitle(title);
    pt.setStatus(RecordStatus.ACTIVE);
    return pt;
}
```

### Step 2: Expand Test Classes
Complete each controller test class with:
- Happy path tests (all endpoints)
- Validation error tests (400 scenarios)
- Business rule error tests (400 scenarios)
- Not found error tests (404 scenarios)
- Admin pagination tests

### Step 3: Add Test Documentation
Create per-test documentation explaining:
- What is being tested
- Why it matters
- How to run it

### Step 4: Set Up CI/CD Integration
Configure Maven/GitHub Actions to run tests on:
- Every commit
- Every pull request
- Before deployment

---

## Utilities Quick Reference

### Building Test Data
```java
// Create person
Person voter = personRepository.save(TestDataBuilder.buildPerson("John"));

// Create election
Election election = electionRepository.save(
    TestDataBuilder.buildElection("2025 Election", fellowship, scope, diocese)
);

// Create vote
ElectionVote vote = voteRepository.save(
    TestDataBuilder.buildElectionVote(voter, election, position, candidate)
);
```

### JSON Assertions
```java
// Check vote response structure
JsonAssertionHelper.assertVoteResponse(result, electionId, positionId, "CAST");

// Check error response
JsonAssertionHelper.assertApiError(result, 400, "Validation Error");

// Check paged response
JsonAssertionHelper.assertPagedResponse(result, 0, 20);

// Get JSON for custom checks
JsonNode root = JsonAssertionHelper.getJsonRoot(result);
assertThat(root.get("eligible").asBoolean(), is(true));
```

### MockMvc Requests
```java
// GET request
mockMvc.perform(get("/api/v1/elections/{id}", electionId))
    .andExpect(status().isOk())
    .andReturn();

// POST request
mockMvc.perform(post("/api/v1/elections/{id}/votes", electionId)
    .contentType("application/json")
    .content(asJson(request)))
    .andExpect(status().isCreated())
    .andReturn();

// DELETE request
mockMvc.perform(delete("/api/v1/admin/voter-roll/{id}", personId))
    .andExpect(status().isNoContent());
```

---

## Status

**Framework:** ✅ READY  
**Build:** ✅ SUCCESS  
**Test Classes:** Created (skeleton ready for expansion)  
**Helper Classes:** ✅ Complete (TestDataBuilder, JsonAssertionHelper)  

---

## Contact & Support

For questions on:
- **Test setup:** See TestDataBuilder.java documentation
- **Assertions:** See JsonAssertionHelper.java documentation
- **Best practices:** See "Writing Integration Tests" section above
- **Troubleshooting:** Check "Test Data Setup Challenges" section

---

**Next Action:** Implement test methods in controller test classes (see Test Coverage Plan)
