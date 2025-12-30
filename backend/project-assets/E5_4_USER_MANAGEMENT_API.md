# User Management API

Base path: `/api/v1/users`

Security: Requires ROLE_ADMIN for write operations; ROLE_ADMIN or ROLE_DS for read operations unless noted.

Endpoints:

- GET `/users?page={page}&size={size}&username={username}&email={email}&active={active}`
  - Returns: Page<User>
  - Filters: optional `username` (contains), `email` (contains), `active` (boolean)

- POST `/users`
  - Body: `{ username, email, password, displayName?, roles?: string[] }`
  - Creates a user; password is stored hashed; response excludes password.

- GET `/users/{id}`
  - Returns single user by id.

- PUT `/users/{id}`
  - Body: `{ email?, displayName?, roles?: string[], active?: boolean }`
  - Updates user; can also accept `status` or `password` if needed.

- DELETE `/users/{id}`
  - Deletes the user (hard delete). Can be adapted later to soft delete.

- POST `/users/{id}/deactivate`
  - Sets active=false (status=DISABLED)

- POST `/users/{id}/activate`
  - Sets active=true (status=ACTIVE)

- POST `/users/{id}/reset-password`
  - Optional query param `newPassword`. If omitted, defaults to `ChangeMe123!`.
  - Returns 200.

Response model (User):
```
{
  id, username, email, displayName, roles: string[], active: boolean,
  createdAt, updatedAt, person: { id, fullName, ... }
}
```

Notes:
- Password is never returned in any response.
- Role names are plain strings, e.g., ROLE_ADMIN, ROLE_DS.
- Only ROLE_ADMIN can create/update/delete/activate/deactivate/reset passwords.

# Eligible Voters Endpoints (Admin)

## List eligible voters by voting period
`GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/eligible-voters`

Query params:
- `page` / `size` / `sort` (default `fullName,asc`)
- `status`: `ALL` (default) | `VOTED` | `NOT_VOTED`
- `q`: search by name/phone/email
- `fellowshipId` (optional filter)
- `electionPositionId` (optional filter)

Response:
```
{
  "content": [
    {
      "personId": 1,
      "fullName": "Jane Doe",
      "phoneNumber": "2567...",
      "email": "jane@example.com",
      "fellowshipName": "Youth",
      "scope": "DIOCESE",
      "scopeName": "Mukono",
      "voted": true,
      "voteCastAt": "2024-11-01T10:00:00Z",
      "lastCodeStatus": "USED",
      "lastCodeIssuedAt": "2024-11-01T09:45:00",
      "lastCodeUsedAt": "2024-11-01T10:00:00"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "page": 0,
  "size": 20,
  "last": true
}
```

## Count eligible voters by voting period
`GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/eligible-voters/count`

Query params:
- `status`: `ALL` (default) | `VOTED` | `NOT_VOTED`
- `fellowshipId` (optional)
- `electionPositionId` (optional)

Response: `{ "count": 123 }`