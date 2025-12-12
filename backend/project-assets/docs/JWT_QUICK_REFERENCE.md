## JWT Authentication - Quick Reference

### Files Created/Modified

**New JWT Security Components:**
1. ✅ `src/main/java/com/mukono/voting/security/JwtTokenProvider.java` - Token creation and validation
2. ✅ `src/main/java/com/mukono/voting/security/JwtAuthenticationFilter.java` - Request filter for JWT
3. ✅ `src/main/java/com/mukono/voting/security/JwtAuthenticationEntryPoint.java` - Unauthorized response handler
4. ✅ `src/main/java/com/mukono/voting/security/CustomUserDetailsService.java` - Load user from database

**Updated Components:**
5. ✅ `src/main/java/com/mukono/voting/config/SecurityConfig.java` - Integrated JWT into Spring Security
6. ✅ `src/main/java/com/mukono/voting/test/TestController.java` - Test protected endpoint
7. ✅ `pom.xml` - Added jjwt dependency
8. ✅ `src/main/resources/application.properties` - JWT configuration

### Configuration

In `application.properties`:
```properties
# JWT settings
app.jwtSecret=my_super_secret_jwt_key_change_in_production_please
app.jwtExpirationInMs=86400000  # 24 hours
```

### How It Works

#### 1. User Authentication (future login endpoint)
```
POST /api/v1/auth/login
{
  "username": "user",
  "password": "pass"
}

↓ Response:
{
  "token": "eyJhbGc...",
  "expiresIn": 86400000
}
```

#### 2. Protected API Calls
```
GET /api/v1/test/secure
Authorization: Bearer eyJhbGc...

↓ Filter processes:
- Extracts token from header
- Validates signature & expiration
- Loads user from database
- Sets authentication context
- Request proceeds

↓ Response:
200 OK
secure ok
```

#### 3. Unauthorized Access
```
GET /api/v1/test/secure
(no Authorization header)

↓ Filter skips (no token)
↓ Endpoint requires authentication
↓ JwtAuthenticationEntryPoint handles

↓ Response:
401 Unauthorized
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource"
}
```

### Public Endpoints (No Auth Required)
- `/api/v1/auth/**` - All auth endpoints
- `/api/v1/vote/login` - Voter login
- `/v3/api-docs/**` - OpenAPI docs
- `/swagger-ui/**` - Swagger UI
- `/swagger-ui.html` - Swagger UI

### Protected Endpoints (Auth Required)
- Everything else by default

### JWT Token Structure

The JWT token contains:
- **Header**: Algorithm (HS512)
- **Payload**:
  - `sub`: User ID (subject)
  - `username`: User's username
  - `roles`: Comma-separated user roles
  - `iat`: Issued at timestamp
  - `exp`: Expiration timestamp
- **Signature**: HMAC-SHA512 with secret

Example decoded token:
```json
{
  "sub": "1",
  "username": "john",
  "roles": "ROLE_ADMIN,ROLE_USER",
  "iat": 1702425600,
  "exp": 1702512000
}
```

### Testing

**Quick test - unauthorized access:**
```bash
curl -X GET http://localhost:8080/api/v1/test/secure
# Should return 401 JSON
```

**Quick test - public endpoint:**
```bash
curl -X GET http://localhost:8080/swagger-ui.html
# Should return 200 HTML
```

**Run test script:**
```bash
chmod +x test-jwt.sh
./test-jwt.sh
```

### Building & Running

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run

# App starts on http://localhost:8080
```

### Important Notes

⚠️ **Security Best Practices:**
1. Change `app.jwtSecret` to a strong random value in production
2. Use HTTPS in production
3. Set appropriate token expiration times
4. Don't store sensitive data in JWT claims
5. Implement token refresh mechanism
6. Add logout/token blacklist functionality

⚠️ **Database Requirements:**
- Users table with username and password columns
- User roles configured in database
- BCrypt hashed passwords

⚠️ **First Time Setup:**
1. Configure database connection in `application-dev.properties`
2. Ensure `spring.jpa.hibernate.ddl-auto=update` is set
3. Create test users in database
4. Start application - entities will be created

### Next Implementation Steps

1. **Create Login Endpoint**
   - Accept username/password
   - Validate credentials against UserDetails
   - Generate JWT via JwtTokenProvider
   - Return token to client

2. **Create Registration Endpoint**
   - Accept new user data
   - Hash password with BCryptPasswordEncoder
   - Save to database

3. **Add Role-Based Security**
   - Use `@PreAuthorize("hasRole('ADMIN')")` on methods
   - Implement role-based endpoint access

4. **Token Refresh (Optional)**
   - Implement refresh token mechanism
   - Allow token renewal without full re-authentication

5. **Logout Mechanism**
   - Implement token blacklist
   - Or use short expiration + refresh tokens

### Troubleshooting

**404 on /api/v1/test/secure**
- Ensure TestController is in correct package under `com.mukono.voting`
- Check Spring component scan includes this package

**Always returns 401 even with valid token**
- Check `app.jwtSecret` matches between generation and validation
- Verify token format: `Authorization: Bearer <token>`
- Check token expiration time

**Cannot login (endpoint not implemented)**
- This is expected - create `/api/v1/auth/login` endpoint
- Use `JwtTokenProvider.generateToken()` to create tokens

**Database connection errors**
- Configure database URL, username, password in `application-dev.properties`
- Ensure MariaDB is running on expected port

### Documentation Files

- `JWT_IMPLEMENTATION.md` - Detailed technical documentation
- `test-jwt.sh` - Testing script
- This file - Quick reference guide

---

**Status**: ✅ All JWT components implemented and integrated successfully
**Compilation**: ✅ No errors (Java 21, Spring Boot 4.0.0)
**Next**: Implement authentication endpoints and test with real users
