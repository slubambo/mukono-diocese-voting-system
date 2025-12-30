# Voting Period Reactivate Endpoint Implementation

## Objective
Implement a `reactivate` endpoint for voting periods that allows admins to undo a cancellation and restore a cancelled voting period to a usable state (e.g., OPEN or SCHEDULED).

## Endpoint Specification

### Path
```
POST /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/reactivate
```

### Security
- Requires `ROLE_ADMIN`
- Same as `open`, `close`, `cancel` endpoints

### Request
- No body required
- Optional: Support request body for audit logging (e.g., `{ reactivatedBy: string, notes?: string }`)

### Response
- **Status 200 OK**
- Return the updated `VotingPeriod` object with new status

### Response Body Example
```json
{
  "id": 5,
  "electionId": 1,
  "name": "Main Voting Period",
  "label": "Period 1",
  "status": "OPEN",
  "startTime": "2024-11-01T09:00:00Z",
  "endTime": "2024-11-01T18:00:00Z",
  "positionsCount": 10,
  "createdAt": "2024-10-15T10:00:00Z",
  "updatedAt": "2024-12-30T14:30:00Z"
}
```

## Behavior

### Status Transitions
- **From**: `CANCELLED`
- **To**: `OPEN` (recommended) or a configurable status (default behavior: OPEN)

### Side Effects
- Update `status` field in the database
- Update `updatedAt` timestamp
- Log the action (audit trail)
- Clear any cancellation reason (if stored)

### Validation
1. **Period exists**: Return 404 if voting period not found
2. **Is cancelled**: Only allow reactivate if status is `CANCELLED`; otherwise, return 400 with message "Cannot reactivate a voting period that is not cancelled"
3. **Election exists**: Return 404 if election not found

### Error Responses
- **400 Bad Request**: Period is not in CANCELLED status
- **404 Not Found**: Election or voting period not found
- **403 Forbidden**: User is not ROLE_ADMIN

## Implementation Notes

### Database
- Update the `VotingPeriod` entity's `status` field from `CANCELLED` to `OPEN`
- Set `updatedAt` to current timestamp

### Parallel with Existing Methods
- Follow the same pattern as `openVotingPeriod`, `closeVotingPeriod`, `cancelVotingPeriod`
- Reuse the lifecycle/state management logic if possible

### Optional Enhancements
- Support a request body with reactivation metadata:
  ```json
  {
    "reactivatedBy": "admin@example.com",
    "notes": "Cancelled in error; reopening for voting"
  }
  ```
- Store cancellation and reactivation history in a separate audit table

## Frontend Integration
- UI button (Restore icon) will appear only when period status is `CANCELLED`
- Button will be disabled for non-cancelled periods
- Toast notification on success: "Voting period reactivated"
- Error toast on failure: "Failed to reactivate voting period"

## Testing Checklist
- [ ] Create a voting period
- [ ] Cancel it (verify status is CANCELLED)
- [ ] Call reactivate endpoint (verify status returns to OPEN)
- [ ] Attempt reactivate on non-cancelled period (verify 400 error)
- [ ] Attempt reactivate as non-admin user (verify 403 error)
- [ ] Verify audit trail / timestamps updated
