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
