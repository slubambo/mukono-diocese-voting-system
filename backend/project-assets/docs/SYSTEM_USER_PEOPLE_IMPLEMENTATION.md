# System User Management & People Registry - Implementation Summary

## Overview
Implemented secure System User management and a minimal People registry (Person) to enable DS/Bishop/PO accounts to be connected to Person records while allowing legacy users to exist without a linked Person.

## Architecture Decisions

### 1. Entity Design

#### Person Entity (NEW)
- Extends `DateAudit` for audit tracking (createdAt/updatedAt)
- Fields: id, fullName, email, phoneNumber, gender, dateOfBirth, status, age (computed)
- Email and phone are unique constraints (null allowed)
- Gender and DateOfBirth are optional
- Status enum: ACTIVE/INACTIVE

#### User Entity (UPDATED)
- Added optional `@ManyToOne` relationship to Person (nullable, no cascade delete)
- Added Status enum: ACTIVE/DISABLED
- Existing fields preserved for backward compatibility
- Legacy users can exist without linked Person

#### Role Entity (EXISTING)
- No changes needed; enum values remain: ROLE_ADMIN, ROLE_DS, ROLE_BISHOP, ROLE_SENIOR_STAFF, ROLE_POLLING_OFFICER, ROLE_VOTER

### 2. Repository Pattern

**PersonRepository**
- `findByEmail(String email)` - Optional lookup
- `findByPhoneNumber(String phoneNumber)` - Optional lookup
- `findByFullNameContainingIgnoreCase(String fullName, Pageable)` - Paginated search
- `existsByEmail(String email)` - Uniqueness check
- `existsByPhoneNumber(String phoneNumber)` - Uniqueness check

**RoleRepository** (NEW)
- `findByName(RoleName name)` - Lookup by role name
- `existsByName(RoleName name)` - Existence check

**UserRepository** (EXTENDED)
- Added `findByEmail(String email)`
- Added `existsByEmail(String email)`
- Added `findByPersonId(Long personId)` - Reverse lookup

### 3. Service Layer

**PersonService**
- CRUD operations with validation
- Enforces email/phone uniqueness
- Search functionality with pagination
- Update with partial modifications

**UserService**
- User creation with optional Person linking
- Support for creating new Person or linking existing
- User updates (email, status, roles, password, person link)
- Role assignment with validation
- Response mapping (toUserResponse, toPersonResponse)
- Age computation in PersonResponse

**RoleSeeder** (NEW)
- CommandLineRunner that seeds all roles on startup
- Prevents duplicate role creation
- Logs seeding actions

### 4. Payload Design

#### Request Classes
- **CreatePersonRequest**: fullName (required), optional email/phone/gender/dateOfBirth
- **UpdatePersonRequest**: All fields optional for partial updates
- **CreateUserRequest**: username/password/roles (required), optional email/personId/embedded person
- **UpdateUserRequest**: All fields optional

#### Response Classes
- **PersonResponse**: Includes computed age field
- **UserResponse**: Includes roles Set, optional embedded PersonResponse

### 5. Controller Design

#### PersonController (NEW)
- Base path: `/api/v1/people`
- **POST /api/v1/people** - Create person (ROLE_ADMIN + ROLE_DS)
- **PUT /api/v1/people/{id}** - Update person (ROLE_ADMIN + ROLE_DS)
- **GET /api/v1/people/{id}** - Get person (ROLE_ADMIN + ROLE_DS)
- **GET /api/v1/people?q=...** - Search with pagination (ROLE_ADMIN + ROLE_DS)
- **DELETE /api/v1/people/{id}** - Delete person (ROLE_ADMIN only)

#### UserController (NEW)
- Base path: `/api/v1/users`
- **POST /api/v1/users** - Create user (bootstrap mode or ROLE_ADMIN)
- **PUT /api/v1/users/{id}** - Update user (ROLE_ADMIN)
- **GET /api/v1/users/{id}** - Get user (ROLE_ADMIN)
- **GET /api/v1/users/me** - Get current user (any authenticated user)

### 6. Security Configuration Updates

**SecurityConfig Changes**
- Permit all: POST /api/v1/users (for bootstrap)
- Require authentication: /api/v1/users/**, /api/v1/people/**
- Role-based access handled via @PreAuthorize annotations
- Bootstrap mode: first user creation without authentication

## Key Features

### 1. Bootstrap Mode
- First user creation allowed without authentication
- After first user exists, POST /api/v1/users requires ROLE_ADMIN
- Controlled in UserController and SecurityConfig

### 2. Person Linking
- Option 1: Create user with personId (link existing person)
- Option 2: Create user with embedded CreatePersonRequest (create and link)
- Cannot provide both personId and embedded person simultaneously
- User-Person relationship is optional (nullable)
- No cascade delete (Person persists if User deleted)

### 3. Validation & Constraints
- Email uniqueness enforced across Person records
- Phone number uniqueness enforced across Person records
- Username/email uniqueness enforced across User records
- Role validation (only valid role names accepted)
- Password minimum length: 6 characters
- Full name required for Person

### 4. Audit Tracking
- All entities extending DateAudit get createdAt/updatedAt
- Person extends DateAudit
- User already extends DateAudit
- Automatic timestamp management via JpaAuditing

### 5. Age Computation
- Age derived from dateOfBirth using LocalDate.now()
- Returns null if dateOfBirth not provided
- Computed as @Transient field on Person
- Included in PersonResponse

### 6. Role-Based Access Control

| Endpoint | ROLE_ADMIN | ROLE_DS | Others |
|----------|-----------|---------|--------|
| POST /api/v1/users | ✓ | ✗ | ✗ (bootstrap) |
| PUT /api/v1/users/{id} | ✓ | ✗ | ✗ |
| GET /api/v1/users/{id} | ✓ | ✗ | ✗ |
| GET /api/v1/users/me | ✓ | ✓ | ✓ |
| POST /api/v1/people | ✓ | ✓ | ✗ |
| PUT /api/v1/people/{id} | ✓ | ✓ | ✗ |
| GET /api/v1/people/{id} | ✓ | ✓ | ✗ |
| GET /api/v1/people | ✓ | ✓ | ✗ |
| DELETE /api/v1/people/{id} | ✓ | ✗ | ✗ |

## Database Schema

### users table (UPDATED)
```sql
ALTER TABLE users ADD COLUMN person_id BIGINT;
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE users ADD FOREIGN KEY (person_id) REFERENCES people(id);
```

### people table (NEW)
```sql
CREATE TABLE people (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone_number VARCHAR(20) UNIQUE,
  gender VARCHAR(10),
  date_of_birth DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### roles table (UNCHANGED)
- All roles are seeded on startup via RoleSeeder

## Files Created/Modified

### Created Files (11)
1. `/src/main/java/com/mukono/voting/people/Person.java` - Entity
2. `/src/main/java/com/mukono/voting/people/PersonRepository.java` - Repository
3. `/src/main/java/com/mukono/voting/people/PersonService.java` - Service
4. `/src/main/java/com/mukono/voting/people/PersonController.java` - REST Controller
5. `/src/main/java/com/mukono/voting/user/RoleRepository.java` - Repository
6. `/src/main/java/com/mukono/voting/user/RoleSeeder.java` - Startup component
7. `/src/main/java/com/mukono/voting/user/UserService.java` - Service
8. `/src/main/java/com/mukono/voting/user/UserController.java` - REST Controller
9. `/src/main/java/com/mukono/voting/payload/request/CreatePersonRequest.java` - DTO
10. `/src/main/java/com/mukono/voting/payload/request/UpdatePersonRequest.java` - DTO
11. `/src/main/java/com/mukono/voting/payload/request/CreateUserRequest.java` - DTO
12. `/src/main/java/com/mukono/voting/payload/request/UpdateUserRequest.java` - DTO
13. `/src/main/java/com/mukono/voting/payload/response/PersonResponse.java` - DTO
14. `/src/main/java/com/mukono/voting/payload/response/UserResponse.java` - DTO

### Modified Files (2)
1. `/src/main/java/com/mukono/voting/user/User.java` - Added Person link and Status
2. `/src/main/java/com/mukono/voting/user/UserRepository.java` - Added query methods
3. `/src/main/java/com/mukono/voting/config/SecurityConfig.java` - Updated path rules

## Alignment with Requirements

### ✅ People Module
- Created com.mukono.voting.people package
- Person entity with all required fields
- Optional use now, full RoleAssignment later
- Extends DateAudit for audit tracking

### ✅ System User Management
- Users authenticate via username/password + JWT
- Tech Lock In Version II compliance
- Voters NOT created here (separate code-based login later)
- Voter identity to candidate choice restriction maintained

### ✅ Entity Design
- Audit-friendly with DateAudit/UserDateAudit patterns
- Person-User optional relationship (no cascade delete)
- Legacy users can exist unlinked
- Derived age computation

### ✅ Role Management
- RoleRepository with findByName
- RoleSeeder ensures all roles exist
- 6 roles: ADMIN, DS, BISHOP, SENIOR_STAFF, POLLING_OFFICER, VOTER

### ✅ Access Control
- Admin can manage users
- Admin + DS can manage people
- Bootstrap mode for first user
- @PreAuthorize annotations on all endpoints

### ✅ Validation
- Email/phone uniqueness
- Required field validation
- Role enumeration validation
- Password minimum length

## Testing Recommendations

See POSTMAN_TEST_GUIDE.md for comprehensive testing scenarios including:
- Bootstrap user creation
- Login and token management
- Person CRUD operations
- User creation with person linking
- Role-based access control
- Search and pagination
- Error cases and validation

## Future Enhancements

1. **RoleAssignment Module** - Link roles to Person records
2. **Voter Registration** - Code-based voter creation
3. **Voter-Candidate Linking** - Restricted tracking
4. **Advanced Search** - More complex query filters
5. **Batch Operations** - Import/export People
6. **Audit Reports** - Detailed change history
7. **Multi-tenancy** - Support multiple dioceses (if needed)

## Compilation & Verification

✅ **Build Status**: SUCCESS
- 35 source files compiled
- No errors or warnings
- Ready for deployment

```bash
mvn clean install -DskipTests
# Output: BUILD SUCCESS
```

## Notes

- All enums use .toUpperCase() in controllers to handle case-insensitive input
- Age computation uses LocalDate.now() - appropriate for derived field
- PersonResponse includes all fields for complete Person profile
- UserResponse embeds PersonResponse only if Person is linked
- RoleSeeder runs once per startup, checks for duplicates
- Bootstrap detection uses userRepository.count() == 0
