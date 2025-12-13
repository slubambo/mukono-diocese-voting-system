# System User & People Management - Quick Reference

## Quick Start

### 1. Bootstrap First Admin
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_001",
    "password": "AdminPass123",
    "email": "admin@diocese.local",
    "roles": ["ROLE_ADMIN"],
    "person": {
      "fullName": "Bishop Admin",
      "email": "bishop.admin@diocese.local",
      "phoneNumber": "+256701234567",
      "gender": "MALE",
      "dateOfBirth": "1980-05-15"
    }
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_001",
    "password": "AdminPass123"
  }'
```

### 3. Get Current User
```bash
curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## API Endpoints Summary

### People Management `/api/v1/people`
| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| POST | /api/v1/people | ADMIN, DS | Create person |
| GET | /api/v1/people | ADMIN, DS | List/search people |
| GET | /api/v1/people/{id} | ADMIN, DS | Get person |
| PUT | /api/v1/people/{id} | ADMIN, DS | Update person |
| DELETE | /api/v1/people/{id} | ADMIN | Delete person |

### User Management `/api/v1/users`
| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| POST | /api/v1/users | NONE (bootstrap) or ADMIN | Create user |
| GET | /api/v1/users/me | Any | Get current user |
| GET | /api/v1/users/{id} | ADMIN | Get user by ID |
| PUT | /api/v1/users/{id} | ADMIN | Update user |

## Key Classes

### Entities
- **Person** - Records with name, contact, demographics
- **User** - System accounts with roles
- **Role** - ROLE_ADMIN, ROLE_DS, ROLE_BISHOP, etc.

### Services
- **PersonService** - CRUD, search, validation
- **UserService** - User management, Person linking, role assignment
- **RoleSeeder** - Auto-seeds roles on startup

### Repositories
- **PersonRepository** - Person data access
- **UserRepository** - User data access
- **RoleRepository** - Role data access

## Common Tasks

### Create a DS User
```java
CreateUserRequest request = new CreateUserRequest();
request.setUsername("ds_001");
request.setPassword("password");
request.setRoles(Set.of("ROLE_DS"));
request.setPersonId(1L); // Link to existing person

User user = userService.createUser(request);
```

### Create a Person
```java
Person person = new Person();
person.setFullName("John Doe");
person.setEmail("john@example.com");
person.setGender(Person.Gender.MALE);
person.setDateOfBirth(LocalDate.of(1990, 1, 1));

Person created = personService.createPerson(person);
```

### Search People
```java
Page<Person> results = personService.searchByFullName(
    "John", 
    PageRequest.of(0, 10)
);
```

### Update User Role
```java
UpdateUserRequest request = new UpdateUserRequest();
request.setRoles(Set.of("ROLE_DS", "ROLE_SENIOR_STAFF"));

User updated = userService.updateUser(userId, request);
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Email already in use | Duplicate Person email | Use unique email |
| Phone already in use | Duplicate Person phone | Use unique phone |
| Cannot provide both personId and embedded person | Invalid request | Provide only one |
| User not found | Invalid ID | Verify ID |
| Role not found | Invalid role name | Use valid role |
| User creation requires ROLE_ADMIN | Bootstrap ended | Use ADMIN token |

## Database Tables

### people
```
id (PK), full_name, email, phone_number, gender, 
date_of_birth, status, created_at, updated_at
```

### users
```
id (PK), username, email, password, status, person_id (FK),
created_at, updated_at
```

### roles
```
id (PK), name (enum)
```

### user_roles
```
user_id (FK), role_id (FK)
```

## Validation Rules

### Person
- `fullName`: Required, max 200 chars
- `email`: Optional, unique if provided, max 100 chars
- `phoneNumber`: Optional, unique if provided, max 20 chars
- `gender`: Optional, enum: MALE, FEMALE, OTHER
- `dateOfBirth`: Optional, date
- `status`: Required, enum: ACTIVE, INACTIVE

### User
- `username`: Required, unique, 3-50 chars
- `password`: Required, min 6 chars
- `email`: Optional, unique if provided
- `roles`: Required, set of valid role names
- `status`: Enum: ACTIVE, DISABLED
- `person`: Optional, nullable

## Security Notes

1. **Bootstrap Mode**: First user created without auth, then locked to ADMIN
2. **Password Encoding**: BCrypt encoding applied automatically
3. **JWT Tokens**: Required for all endpoints except auth and bootstrap
4. **Role-Based Access**: Enforced via @PreAuthorize annotations
5. **No Cascade Delete**: Deleting User doesn't delete linked Person

## File Locations

```
src/main/java/com/mukono/voting/
├── people/
│   ├── Person.java
│   ├── PersonRepository.java
│   ├── PersonService.java
│   └── PersonController.java
├── user/
│   ├── User.java
│   ├── Role.java
│   ├── UserRepository.java
│   ├── RoleRepository.java
│   ├── UserService.java
│   ├── UserController.java
│   └── RoleSeeder.java
└── payload/
    ├── request/
    │   ├── CreatePersonRequest.java
    │   ├── UpdatePersonRequest.java
    │   ├── CreateUserRequest.java
    │   └── UpdateUserRequest.java
    └── response/
        ├── PersonResponse.java
        └── UserResponse.java
```

## Testing Tips

1. Always create first user without authentication (bootstrap)
2. Save JWT token from login response
3. Use token in Authorization header: `Bearer {token}`
4. Test with both ADMIN and DS roles
5. Verify role-based access control
6. Check validation errors for duplicate data
7. Verify linked person appears in user responses

## Performance Considerations

- Person search uses case-insensitive LIKE (indexed on fullName)
- Email/phone lookups use indexed unique columns
- User-Person relationship uses LAZY loading
- Pagination recommended for large people searches
- Role seeding is one-time on startup

## Future Enhancements

1. **RoleAssignment** - Link roles directly to Person records
2. **Voter Import** - Batch person creation
3. **Audit Trails** - Detailed change history
4. **Advanced Search** - Multiple criteria filtering
5. **Multi-tenancy** - Support for multiple dioceses

## Support & Documentation

- Full implementation guide: `SYSTEM_USER_PEOPLE_IMPLEMENTATION.md`
- Postman test guide: `POSTMAN_TEST_GUIDE.md`
- Completion checklist: `IMPLEMENTATION_COMPLETION_CHECKLIST.md`
- API Docs: http://localhost:8080/swagger-ui.html
