## JWT Authentication Implementation Summary

This document describes the JWT-based authentication system that has been implemented for the Mukono Diocese Voting System.

### Components Implemented

#### 1. **JwtTokenProvider** (`src/main/java/com/mukono/voting/security/JwtTokenProvider.java`)
- **@Component** annotation for dependency injection
- Configurable via `application.properties`:
  - `app.jwtSecret`: JWT signing secret (default: "change_me")
  - `app.jwtExpirationInMs`: Token expiration time in milliseconds (default: 86400000 = 24 hours)

**Methods:**
- `generateToken(UserPrincipal userPrincipal)`: Creates JWT with:
  - Subject: User ID
  - Claims: username, roles
  - Issue and expiration timestamps
  - HS512 signature algorithm

- `getUserIdFromJWT(String token)`: Parses token and returns user ID as Long

- `validateToken(String authToken)`: Returns true if token is valid, false otherwise
  - Handles: SecurityException, MalformedJwtException, ExpiredJwtException, UnsupportedJwtException, IllegalArgumentException

#### 2. **JwtAuthenticationFilter** (`src/main/java/com/mukono/voting/security/JwtAuthenticationFilter.java`)
- Extends `OncePerRequestFilter`
- Autowired: `JwtTokenProvider`, `CustomUserDetailsService`, `jwtSecret` configuration

**Flow:**
1. Extracts JWT from `Authorization: Bearer <token>` header
2. Validates token via `JwtTokenProvider.validateToken()`
3. Extracts username from token claims
4. Loads `UserPrincipal` via `CustomUserDetailsService`
5. Creates `UsernamePasswordAuthenticationToken` with authorities
6. Sets authentication in `SecurityContextHolder`
7. Continues filter chain (catches exceptions silently)

#### 3. **JwtAuthenticationEntryPoint** (`src/main/java/com/mukono/voting/security/JwtAuthenticationEntryPoint.java`)
- **@Component** implementing `AuthenticationEntryPoint`
- Returns 401 with JSON response:
  ```json
  {
    "status": 401,
    "error": "Unauthorized",
    "message": "Full authentication is required to access this resource"
  }
  ```

#### 4. **Updated SecurityConfig** (`src/main/java/com/mukono/voting/config/SecurityConfig.java`)
- Injected: `CustomUserDetailsService`, `JwtAuthenticationEntryPoint`
- **Bean: jwtAuthenticationFilter()** - creates filter instance

**SecurityFilterChain Configuration:**
- CSRF disabled (stateless REST API)
- CORS enabled with permissive configuration
- Exception handling with `jwtAuthenticationEntryPoint`
- Session management: `STATELESS`
- **JwtAuthenticationFilter** added before `UsernamePasswordAuthenticationFilter`
- Public endpoints:
  - `/api/v1/auth/**`
  - `/api/v1/vote/login`
  - Swagger/OpenAPI: `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`
- All other requests require authentication

#### 5. **Test Endpoint** (`src/main/java/com/mukono/voting/test/TestController.java`)
- **@RestController** at `/api/v1/test`
- **GET /api/v1/test/secure**: Returns "secure ok" (requires authentication)
- Use this to verify 401 responses for unauthenticated requests

#### 6. **Updated Dependencies** (`pom.xml`)
- Added JWT library: `io.jsonwebtoken:jjwt:0.9.1`

#### 7. **Configuration Properties** (`application.properties`)
```properties
app.jwtSecret=my_super_secret_jwt_key_change_in_production_please
app.jwtExpirationInMs=86400000
```

### Architecture Flow

**Authentication Flow:**
```
1. Client sends: GET /api/v1/test/secure
                 Headers: Authorization: Bearer <jwt_token>

2. JwtAuthenticationFilter intercepts request
   - Extracts token from Authorization header
   - Validates token signature and expiration
   - Extracts username from token claims
   - Loads UserPrincipal from database via CustomUserDetailsService
   - Creates UsernamePasswordAuthenticationToken
   - Sets it in SecurityContextHolder

3. Request proceeds to controller with authenticated context

4. Controller returns response
```

**Unauthorized Access Flow:**
```
1. Client sends: GET /api/v1/test/secure (without Authorization header)

2. JwtAuthenticationFilter:
   - No token found or token invalid
   - Does not set authentication context

3. Controller requires authentication

4. JwtAuthenticationEntryPoint.commence() triggered

5. Returns 401 JSON response:
   {
     "status": 401,
     "error": "Unauthorized",
     "message": "Full authentication is required to access this resource"
   }
```

### Testing the Implementation

**Build the application:**
```bash
cd /Users/Simon/Dev/ThisIsMe/mukono-diocese-voting-system/backend
mvn clean install
```

**Run the application:**
```bash
mvn spring-boot:run
```

**Test unauthorized access (should return 401):**
```bash
curl -X GET http://localhost:8080/api/v1/test/secure
```

Expected response:
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource"
}
```

**Test public endpoint (should return 200):**
```bash
curl -X GET http://localhost:8080/api/v1/auth/test
# (assuming an endpoint exists at /api/v1/auth/test)
```

### Security Features

✅ **Stateless Authentication**: No session state, all info in JWT
✅ **CSRF Protection**: Disabled for stateless REST API
✅ **CORS**: Configured for cross-origin requests
✅ **Password Encoding**: BCryptPasswordEncoder for user passwords
✅ **Method-Level Security**: @EnableMethodSecurity for @PreAuthorize annotations
✅ **Token Validation**: Signature, expiration, format checks
✅ **Proper Error Handling**: JSON error responses instead of HTML
✅ **Filter Order**: JWT filter runs before standard authentication

### Next Steps

1. Create authentication endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`)
2. Implement JWT token generation on login
3. Add refresh token mechanism (optional)
4. Implement role-based access control with @PreAuthorize
5. Add more granular endpoint security rules
6. Consider token blacklist/logout functionality

### Configuration Notes

- **Development Secret**: The default secret in `application.properties` is for development only
- **Production Secret**: Change `app.jwtSecret` to a strong random string in production
- **Token Expiration**: Default 24 hours (86400000 ms) - adjust as needed
- **CORS Origins**: Currently allows all origins - restrict in production

### Dependencies

- **Spring Security 6.x**: Authentication and authorization
- **Spring Security OAuth2**: (included in Spring Security)
- **jjwt 0.9.1**: JWT token creation and parsing
- **Jackson**: JSON serialization (already included)
- **Spring Data JPA**: Database access
- **MariaDB**: User storage

All components compile successfully with Java 21 and Spring Boot 4.0.0.
