# Section C3B: Leadership Payloads (DTOs) - Implementation Summary

**Date:** December 15, 2025
**Status:** ✅ COMPLETE - BUILD SUCCESS

## Overview
Implemented comprehensive request/response DTOs for the Leadership module following existing project conventions. All DTOs are properly validated, support mapping via static `fromEntity()` methods, and provide clean separation between JPA entities and REST API contracts.

---

## Build Verification

### Build Status: ✅ BUILD SUCCESS

**Command:** `mvn clean install -DskipTests`

**Result:**
```
[INFO] Compiling 96 source files with javac [debug parameters release 17] to target/classes
[INFO] BUILD SUCCESS
[INFO] Total time:  1.657 s
[INFO] Finished at: 2025-12-15T23:42:58+03:00
```

---

## 1. Request DTOs (6 files created)

### Package: `com.mukono.voting.payload.request`

#### 1.1 PositionTitle Requests

**CreatePositionTitleRequest.java** (12 lines)
```java
@NotBlank(message = "Position title name is required")
@Size(max = 255, message = "...")
private String name;
```
- **Required field:** name
- **Validation:** NotBlank, max 255 chars

**UpdatePositionTitleRequest.java** (15 lines)
```java
@Size(max = 255)
private String name;        // optional

private RecordStatus status; // optional
```
- **All fields optional** - supports partial updates
- Follows pattern for update DTOs

#### 1.2 FellowshipPosition Requests

**CreateFellowshipPositionRequest.java** (25 lines)
```java
@NotNull
private Long fellowshipId;

@NotNull
private Long titleId;

@NotNull
private PositionScope scope;

private Integer seats; // optional, service defaults to 1
```
- **Required fields:** fellowshipId, titleId, scope
- **Optional field:** seats (service defaults to 1)

**UpdateFellowshipPositionRequest.java** (23 lines)
```java
private Long titleId;              // optional
private PositionScope scope;       // optional
private Integer seats;             // optional
private RecordStatus status;       // optional
```
- **All fields optional** - supports partial updates

#### 1.3 LeadershipAssignment Requests

**CreateLeadershipAssignmentRequest.java** (41 lines)
```java
@NotNull
private Long personId;

@NotNull
private Long fellowshipPositionId;

private Long dioceseId;            // nullable, scope-driven
private Long archdeaconryId;       // nullable, scope-driven
private Long churchId;             // nullable, scope-driven

@NotNull
private LocalDate termStartDate;

private LocalDate termEndDate;     // optional

@Size(max = 1000)
private String notes;              // optional
```
- **Required fields:** personId, fellowshipPositionId, termStartDate
- **Scope-driven targets:** diocese/archdeaconry/church (validated in service)
- **Term support:** start/end dates for 4-year terms

**UpdateLeadershipAssignmentRequest.java** (41 lines)
```java
private Long personId;
private Long fellowshipPositionId;
private Long dioceseId;
private Long archdeaconryId;
private Long churchId;
private LocalDate termStartDate;
private LocalDate termEndDate;
private RecordStatus status;
@Size(max = 1000)
private String notes;
```
- **All fields optional** - supports partial updates
- Service layer handles complex validation logic

---

## 2. Response DTOs (8 files - 5 new + 3 reused)

### Package: `com.mukono.voting.payload.response`

#### 2.1 PositionTitle Response

**PositionTitleResponse.java** (31 lines)
```java
private Long id;
private String name;
private RecordStatus status;
private Instant createdAt;
private Instant updatedAt;

public static PositionTitleResponse fromEntity(PositionTitle e)
```
- **Full response** with timestamps
- **Follows existing pattern** for entity responses

**PositionTitleSummary.java** (22 lines) - NEW
```java
private Long id;
private String name;

public static PositionTitleSummary fromEntity(PositionTitle e)
```
- **Lightweight summary** for nesting in FellowshipPositionResponse
- Used in FellowshipPositionResponse to avoid exposing full entity

#### 2.2 FellowshipPosition Response

**FellowshipPositionResponse.java** (50 lines)
```java
private Long id;
private PositionScope scope;
private Integer seats;
private RecordStatus status;
private FellowshipSummary fellowship;    // nested
private PositionTitleSummary title;      // nested
private Instant createdAt;
private Instant updatedAt;

public static FellowshipPositionResponse fromEntity(FellowshipPosition e)
```
- **Full response** with nested summaries
- Uses FellowshipSummary and PositionTitleSummary for clean nesting

**FellowshipSummary.java** (22 lines) - NEW
```java
private Long id;
private String name;
private String code;

public static FellowshipSummary fromEntity(Fellowship f)
```
- **Lightweight summary** for nesting
- Reuses Fellowship entity mapping pattern

#### 2.3 LeadershipAssignment Response

**LeadershipAssignmentResponse.java** (66 lines)
```java
private Long id;
private RecordStatus status;
private LocalDate termStartDate;
private LocalDate termEndDate;
private String notes;
private PersonSummary person;                      // nested
private FellowshipPositionSummary fellowshipPosition; // nested
private DioceseSummary diocese;                    // optional target
private ArchdeaconrySummary archdeaconry;          // optional target
private ChurchSummary church;                      // optional target
private Instant createdAt;
private Instant updatedAt;

public static LeadershipAssignmentResponse fromEntity(LeadershipAssignment e)
```
- **Full response** with comprehensive nesting
- **Smart target mapping:** only includes the relevant target (diocese/archdeaconry/church)
- Uses existing DioceseSummary and ArchdeaconrySummary from Section B

**PersonSummary.java** (26 lines) - NEW
```java
private Long id;
private String fullName;
private String phoneNumber;
private String email;

public static PersonSummary fromEntity(Person e)
```
- **Lightweight summary** of person
- Exposes essential contact info

**FellowshipPositionSummary.java** (52 lines) - NEW
```java
private Long id;
private PositionScope scope;
private Integer seats;
private RecordStatus status;
private Long fellowshipId;
private String fellowshipName;
private Long titleId;
private String titleName;

public static FellowshipPositionSummary fromEntity(FellowshipPosition e)
```
- **Detailed summary** for assignment response
- Includes both IDs and names for context
- Allows client to understand position details without full entity

**ChurchSummary.java** (28 lines) - NEW
```java
private Long id;
private String name;
private String code;
private Long archdeaconryId;

public static ChurchSummary fromEntity(Church e)
```
- **Lightweight summary** of church
- Includes archdeaconry reference for context

---

## 3. DTO Summary Table

| DTO | Type | Purpose | Fields | Validation |
|-----|------|---------|--------|-----------|
| CreatePositionTitleRequest | Request | Create title | name | @NotBlank, @Size(255) |
| UpdatePositionTitleRequest | Request | Update title | name, status | @Size(255) (optional) |
| CreateFellowshipPositionRequest | Request | Create position | fellowshipId, titleId, scope, seats | @NotNull, seats optional |
| UpdateFellowshipPositionRequest | Request | Update position | titleId, scope, seats, status | All optional |
| CreateLeadershipAssignmentRequest | Request | Create assignment | personId, fellowshipPositionId, diocese/arch/church, termStartDate, termEndDate, notes | @NotNull on required |
| UpdateLeadershipAssignmentRequest | Request | Update assignment | All fields | All optional |
| PositionTitleResponse | Response | Full title | id, name, status, createdAt, updatedAt | - |
| PositionTitleSummary | Response | Title summary | id, name | - |
| FellowshipPositionResponse | Response | Full position | id, scope, seats, status, fellowship, title, createdAt, updatedAt | Nested summaries |
| FellowshipSummary | Response | Fellowship summary | id, name, code | - |
| LeadershipAssignmentResponse | Response | Full assignment | id, status, termStart/End, notes, person, fellowshipPosition, diocese/arch/church, createdAt, updatedAt | Smart target mapping |
| PersonSummary | Response | Person summary | id, fullName, phoneNumber, email | - |
| FellowshipPositionSummary | Response | Position summary | id, scope, seats, status, fellowshipId, fellowshipName, titleId, titleName | - |
| ChurchSummary | Response | Church summary | id, name, code, archdeaconryId | - |

---

## 4. Reused vs. New DTOs

### ✅ Reused from Prior Sections
- **DioceseSummary** (Section B) - Used in LeadershipAssignmentResponse
- **ArchdeaconrySummary** (Section B) - Used in LeadershipAssignmentResponse

### ✅ New DTOs Created

**Request DTOs (6):**
1. CreatePositionTitleRequest
2. UpdatePositionTitleRequest
3. CreateFellowshipPositionRequest
4. UpdateFellowshipPositionRequest
5. CreateLeadershipAssignmentRequest
6. UpdateLeadershipAssignmentRequest

**Response DTOs (8):**
7. PositionTitleResponse
8. PositionTitleSummary
9. FellowshipPositionResponse
10. FellowshipSummary
11. LeadershipAssignmentResponse
12. PersonSummary
13. FellowshipPositionSummary
14. ChurchSummary

**Total New DTOs:** 14 files

---

## 5. Key Design Features

### ✅ Validation Pattern
- **Create requests:** Use @NotBlank, @NotNull, @Size for required fields
- **Update requests:** All fields optional (partial update support)
- **Consistent style:** Follows existing project conventions

### ✅ Mapping Pattern
- **Static fromEntity() methods** on all response DTOs
- **Clean separation:** DTOs never expose raw JPA entities
- **Nested mappings:** Uses summaries to avoid circular references

### ✅ Response Structure
- **All responses include timestamps:** createdAt, updatedAt (where applicable)
- **Comprehensive nesting:** Uses summary DTOs for related entities
- **Smart field inclusion:** LeadershipAssignmentResponse only includes relevant target

### ✅ Type Safety
- **LocalDate for dates:** Term start/end dates use LocalDate (not String)
- **Instant for timestamps:** Audit fields use Instant
- **Enum types:** PositionScope, RecordStatus as proper enums

---

## 6. DTO Compilation Results

### Request DTOs
```
CreatePositionTitleRequest.class (965 bytes)
UpdatePositionTitleRequest.class (1,211 bytes)
CreateFellowshipPositionRequest.class (1,807 bytes)
UpdateFellowshipPositionRequest.class (1,628 bytes)
CreateLeadershipAssignmentRequest.class (2,747 bytes)
UpdateLeadershipAssignmentRequest.class (2,849 bytes)
```

### Response DTOs
```
PositionTitleResponse.class (2,201 bytes)
PositionTitleSummary.class (1,278 bytes)
FellowshipPositionResponse.class (3,910 bytes)
FellowshipSummary.class (1,457 bytes)
LeadershipAssignmentResponse.class (6,045 bytes)
PersonSummary.class (1,695 bytes)
FellowshipPositionSummary.class (3,365 bytes)
ChurchSummary.class (1,889 bytes)
```

**All classes compiled successfully!**

---

## 7. Usage Examples

### Example 1: Create Position Title
**Request:**
```json
{
  "name": "Chairperson"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Chairperson",
  "status": "ACTIVE",
  "createdAt": "2025-12-15T23:42:00.000Z",
  "updatedAt": "2025-12-15T23:42:00.000Z"
}
```

### Example 2: Create Fellowship Position
**Request:**
```json
{
  "fellowshipId": 5,
  "titleId": 1,
  "scope": "DIOCESE",
  "seats": 1
}
```

**Response:**
```json
{
  "id": 10,
  "scope": "DIOCESE",
  "seats": 1,
  "status": "ACTIVE",
  "fellowship": {
    "id": 5,
    "name": "Mothers' Union",
    "code": "MU"
  },
  "title": {
    "id": 1,
    "name": "Chairperson"
  },
  "createdAt": "2025-12-15T23:42:00.000Z",
  "updatedAt": "2025-12-15T23:42:00.000Z"
}
```

### Example 3: Create Leadership Assignment
**Request:**
```json
{
  "personId": 15,
  "fellowshipPositionId": 10,
  "dioceseId": 3,
  "termStartDate": "2024-01-01",
  "termEndDate": "2028-01-01",
  "notes": "Elected unanimously"
}
```

**Response:**
```json
{
  "id": 25,
  "status": "ACTIVE",
  "termStartDate": "2024-01-01",
  "termEndDate": "2028-01-01",
  "notes": "Elected unanimously",
  "person": {
    "id": 15,
    "fullName": "Jane Doe",
    "phoneNumber": "0701234567",
    "email": "jane@example.com"
  },
  "fellowshipPosition": {
    "id": 10,
    "scope": "DIOCESE",
    "seats": 1,
    "status": "ACTIVE",
    "fellowshipId": 5,
    "fellowshipName": "Mothers' Union",
    "titleId": 1,
    "titleName": "Chairperson"
  },
  "diocese": {
    "id": 3,
    "name": "Mukono Diocese",
    "code": "MUK"
  },
  "archdeaconry": null,
  "church": null,
  "createdAt": "2025-12-15T23:42:00.000Z",
  "updatedAt": "2025-12-15T23:42:00.000Z"
}
```

---

## 8. Controller Integration (Next Step)

### Controllers Needed (Section C3C)

The DTOs are now ready for REST controller implementation:

1. **PositionTitleController**
   - POST /api/leadership/titles (CreatePositionTitleRequest → PositionTitleResponse)
   - PUT /api/leadership/titles/{id} (UpdatePositionTitleRequest → PositionTitleResponse)
   - GET /api/leadership/titles/{id} → PositionTitleResponse
   - GET /api/leadership/titles → Page<PositionTitleResponse>
   - DELETE /api/leadership/titles/{id} → void

2. **FellowshipPositionController**
   - POST /api/leadership/positions (CreateFellowshipPositionRequest → FellowshipPositionResponse)
   - PUT /api/leadership/positions/{id} (UpdateFellowshipPositionRequest → FellowshipPositionResponse)
   - GET /api/leadership/positions/{id} → FellowshipPositionResponse
   - GET /api/leadership/positions → Page<FellowshipPositionResponse>
   - DELETE /api/leadership/positions/{id} → void

3. **LeadershipAssignmentController**
   - POST /api/leadership/assignments (CreateLeadershipAssignmentRequest → LeadershipAssignmentResponse)
   - PUT /api/leadership/assignments/{id} (UpdateLeadershipAssignmentRequest → LeadershipAssignmentResponse)
   - GET /api/leadership/assignments/{id} → LeadershipAssignmentResponse
   - GET /api/leadership/assignments → Page<LeadershipAssignmentResponse>
   - DELETE /api/leadership/assignments/{id} → void
   - GET /api/leadership/eligible-voters → List<LeadershipAssignmentResponse> (for voting)

---

## Summary

✅ **Section C3B: Leadership Payloads - COMPLETE**

**Deliverables:**
- 6 request DTOs (3 create + 3 update)
- 8 response DTOs (4 responses + 4 summaries)
- All DTOs properly validated with jakarta.validation annotations
- All DTOs include static fromEntity() mapping methods
- Comprehensive nesting using summary DTOs
- Smart target mapping for scope-driven assignments
- Full separation of DTOs from JPA entities

**Build Status:** ✅ SUCCESS - 96 source files compiled, 1.657 seconds

**DTOs Created:** 14 new files  
**DTOs Reused:** 2 from prior sections (DioceseSummary, ArchdeaconrySummary)

**Next Steps:** Implement REST Controllers (Section C3C) using these DTOs
