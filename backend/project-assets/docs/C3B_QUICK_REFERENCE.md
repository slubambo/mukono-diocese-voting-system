# Section C3B: Quick Reference Card

## Request DTOs (6 files)

### PositionTitle
```
CreatePositionTitleRequest:
  - name: @NotBlank, @Size(255)

UpdatePositionTitleRequest:
  - name: @Size(255) [optional]
  - status: RecordStatus [optional]
```

### FellowshipPosition
```
CreateFellowshipPositionRequest:
  - fellowshipId: @NotNull
  - titleId: @NotNull
  - scope: @NotNull (PositionScope)
  - seats: Integer [optional, defaults to 1]

UpdateFellowshipPositionRequest:
  - titleId: Long [optional]
  - scope: PositionScope [optional]
  - seats: Integer [optional]
  - status: RecordStatus [optional]
```

### LeadershipAssignment
```
CreateLeadershipAssignmentRequest:
  - personId: @NotNull
  - fellowshipPositionId: @NotNull
  - dioceseId: Long [nullable, scope-driven]
  - archdeaconryId: Long [nullable, scope-driven]
  - churchId: Long [nullable, scope-driven]
  - termStartDate: @NotNull LocalDate
  - termEndDate: LocalDate [optional]
  - notes: @Size(1000) [optional]

UpdateLeadershipAssignmentRequest:
  - All fields optional
  - Service validates complex rules
```

---

## Response DTOs (8 files)

### PositionTitle
```
PositionTitleResponse:
  - id, name, status
  - createdAt, updatedAt
  + fromEntity(PositionTitle)

PositionTitleSummary: [nested]
  - id, name
  + fromEntity(PositionTitle)
```

### FellowshipPosition
```
FellowshipPositionResponse:
  - id, scope, seats, status
  - fellowship: FellowshipSummary
  - title: PositionTitleSummary
  - createdAt, updatedAt
  + fromEntity(FellowshipPosition)

FellowshipSummary: [nested]
  - id, name, code
  + fromEntity(Fellowship)
```

### LeadershipAssignment
```
LeadershipAssignmentResponse:
  - id, status, termStartDate, termEndDate, notes
  - person: PersonSummary
  - fellowshipPosition: FellowshipPositionSummary
  - diocese: DioceseSummary [optional target]
  - archdeaconry: ArchdeaconrySummary [optional target]
  - church: ChurchSummary [optional target]
  - createdAt, updatedAt
  + fromEntity(LeadershipAssignment)

PersonSummary: [nested, NEW]
  - id, fullName, phoneNumber, email
  + fromEntity(Person)

FellowshipPositionSummary: [nested, NEW]
  - id, scope, seats, status
  - fellowshipId, fellowshipName
  - titleId, titleName
  + fromEntity(FellowshipPosition)

ChurchSummary: [nested, NEW]
  - id, name, code, archdeaconryId
  + fromEntity(Church)
```

---

## Reused from Section B

✅ DioceseSummary  
✅ ArchdeaconrySummary

---

## New Files Created

**Request (6):**
1. CreatePositionTitleRequest
2. UpdatePositionTitleRequest
3. CreateFellowshipPositionRequest
4. UpdateFellowshipPositionRequest
5. CreateLeadershipAssignmentRequest
6. UpdateLeadershipAssignmentRequest

**Response (8):**
7. PositionTitleResponse
8. PositionTitleSummary
9. FellowshipPositionResponse
10. FellowshipSummary
11. LeadershipAssignmentResponse
12. PersonSummary
13. FellowshipPositionSummary
14. ChurchSummary

---

## Key Features

✅ Jakarta.validation annotations on create requests  
✅ All update fields optional (partial update support)  
✅ Static fromEntity() methods on all responses  
✅ Instant timestamps (createdAt, updatedAt)  
✅ LocalDate for term dates  
✅ Enum types (PositionScope, RecordStatus)  
✅ Comprehensive nesting with summaries  
✅ Smart target mapping (only set diocese/arch/church based on scope)  
✅ No JPA entities exposed via DTOs

---

## Build Status

✅ BUILD SUCCESS - 96 source files compiled  
✅ 1.657 seconds build time  
✅ All DTOs validated and ready

---

## Next: Controllers (Section C3C)

Controllers will use these DTOs:

- PositionTitleController
- FellowshipPositionController  
- LeadershipAssignmentController

With endpoints:
- POST (Create)
- PUT (Update)
- GET (Fetch)
- GET (List/Filter)
- DELETE (Deactivate)
