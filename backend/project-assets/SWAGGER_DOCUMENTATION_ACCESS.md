# Swagger/OpenAPI Documentation Access

## Overview
The Mukono Diocese Voting System API is fully documented using OpenAPI 3.0 (Swagger). The interactive API documentation is accessible without authentication during development.

**Date:** December 17, 2025  
**Status:** ✅ Configured and accessible

---

## Access Points

### Swagger UI (Interactive Documentation)
```
http://localhost:8080/swagger-ui.html
```
or
```
http://localhost:8080/swagger-ui/index.html
```

**Features:**
- Interactive API testing
- Request/response examples
- Schema definitions
- Try-it-out functionality for all endpoints

### OpenAPI JSON Specification
```
http://localhost:8080/v3/api-docs
```

**Use Cases:**
- Import into Postman/Insomnia
- Generate client SDKs
- API contract validation

### OpenAPI YAML Specification
```
http://localhost:8080/v3/api-docs.yaml
```

---

## Authentication Status

### Development Environment ✅
**Authentication: DISABLED for Swagger**

All Swagger/OpenAPI endpoints are publicly accessible:
- `/swagger-ui/**`
- `/swagger-ui.html`
- `/v3/api-docs/**`
- `/swagger-resources/**`
- `/webjars/**`

This allows easy API exploration and testing during development.

### Production Environment ⚠️
**Authentication: TO BE ENABLED**

Before production deployment:
1. Remove Swagger endpoints from `permitAll()` in `SecurityConfig.java`
2. Add role-based access (e.g., `hasRole('ADMIN')`)
3. Update `OpenApiConfig.java` to reflect production security
4. Consider completely disabling Swagger in production profile

**Files to Update:**
- `src/main/java/com/mukono/voting/config/SecurityConfig.java` (lines 130-135)
- `src/main/java/com/mukono/voting/config/OpenApiConfig.java`

---

## Configuration Files

### 1. OpenApiConfig.java
**Location:** `src/main/java/com/mukono/voting/config/OpenApiConfig.java`

Defines:
- API metadata (title, version, description)
- Contact information
- License information
- Server URLs (dev/prod)
- JWT security scheme definition

### 2. SecurityConfig.java
**Location:** `src/main/java/com/mukono/voting/config/SecurityConfig.java`

**Swagger Exemptions (Lines 130-136):**
```java
// Swagger/OpenAPI endpoints (authentication disabled for development)
// TODO: Re-enable authentication for Swagger in production
.requestMatchers("/v3/api-docs/**").permitAll()
.requestMatchers("/swagger-ui/**").permitAll()
.requestMatchers("/swagger-ui.html").permitAll()
.requestMatchers("/swagger-resources/**").permitAll()
.requestMatchers("/webjars/**").permitAll()
```

### 3. application-dev.properties
**Location:** `src/main/resources/application-dev.properties`

**Swagger Settings:**
```properties
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.enabled=true
springdoc.swagger-ui.operationsSorter=method
springdoc.swagger-ui.tagsSorter=alpha
springdoc.swagger-ui.tryItOutEnabled=true
springdoc.swagger-ui.filter=true
springdoc.swagger-ui.syntaxHighlight.activated=true
```

---

## How to Use Swagger UI

### 1. Start the Application
```bash
cd backend
./mvnw spring-boot:run
```

### 2. Access Swagger UI
Open your browser and navigate to:
```
http://localhost:8080/swagger-ui.html
```

### 3. Explore the API
- **Browse Endpoints:** All endpoints are organized by controller
- **View Schemas:** Click on "Schemas" at the bottom to see all request/response models
- **Read Descriptions:** Each endpoint has detailed documentation

### 4. Test Endpoints

#### Public Endpoints (No Auth Required)
1. Expand any endpoint under "Auth Controller"
2. Click "Try it out"
3. Fill in the request body
4. Click "Execute"
5. View the response

#### Protected Endpoints (Auth Required)
1. First, login via `/api/v1/auth/login`
2. Copy the JWT token from the response
3. Click the **"Authorize"** button at the top of Swagger UI
4. Enter: `Bearer {your-token-here}`
5. Click "Authorize"
6. Now you can test protected endpoints

### 5. Example: Login and Test Protected Endpoint

**Step 1: Login**
```
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

**Step 2: Copy Token**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTYzOTc0MjQwMCwiZXhwIjoxNjM5ODI4ODAwfQ..."
}
```

**Step 3: Authorize**
- Click "Authorize" button
- Enter: `Bearer eyJhbGciOiJIUzUxMiJ9...`
- Click "Authorize"

**Step 4: Test**
- Try any protected endpoint
- Requests will now include the Authorization header

---

## API Organization

### Namespaces

#### 🔓 Public
- **Auth Controller** - `/api/v1/auth/**`
  - Login, register, token refresh

#### 🔐 Admin Only
- **Admin Namespace Controller** - `/api/v1/admin/**`
- **Voting Period Admin Controller**
- **Election Tally Admin Controller**
- **Election Results Admin Controller**

#### 🔐 DS (Diocesan Secretary)
- **DS Namespace Controller** - `/api/v1/ds/**`
- **DS Diocese Controller**
- **DS Archdeaconry Controller**
- **DS Church Controller**
- **DS Fellowship Controller**
- **DS Fellowship Position Controller**
- **DS Position Title Controller**
- **DS Leadership Assignment Controller**
- **DS Election Controller**
- **DS Election Position Controller**
- **DS Election Applicant Controller**
- **DS Election Candidate Controller**

#### 🔐 Bishop
- **Bishop Namespace Controller** - `/api/v1/bishop/**`

#### 🔐 Staff
- **Staff Namespace Controller** - `/api/v1/staff/**`

#### 🔐 Polling Officer
- **Polling Namespace Controller** - `/api/v1/polling/**`

#### 🔐 Voter
- **Vote Auth Controller** - `/api/v1/vote/login`
- **Vote Ballot Controller** - `/api/v1/vote/ballot`
- **Vote Submission Controller** - `/api/v1/vote/submit`

#### 🔐 Other
- **Person Controller** - `/api/v1/people/**`
- **User Controller** - `/api/v1/users/**`

---

## Swagger UI Features

### Operations Sorting
Operations are sorted by HTTP method (GET, POST, PUT, DELETE, PATCH)

### Tags Sorting
Controller tags are sorted alphabetically

### Try It Out
All endpoints have "Try it out" enabled for immediate testing

### Syntax Highlighting
Request/response bodies have syntax highlighting enabled

### Filter
Search bar to filter endpoints by name or path

---

## Common Issues & Solutions

### Issue: Swagger UI shows "Failed to load API definition"
**Solution:** 
- Ensure the application is running
- Check that port 8080 is accessible
- Verify no firewall blocking

### Issue: "Unauthorized" when testing protected endpoints
**Solution:**
- Login first to get a JWT token
- Click "Authorize" button in Swagger UI
- Enter `Bearer {token}` (include the word "Bearer")

### Issue: Swagger UI not loading
**Solution:**
- Clear browser cache
- Try incognito/private mode
- Check browser console for errors
- Verify `springdoc.swagger-ui.enabled=true` in application-dev.properties

### Issue: Some endpoints not showing
**Solution:**
- Ensure controllers have `@RestController` annotation
- Verify `@RequestMapping` paths are correct
- Check that methods are `public`

---

## Export & Import

### Export OpenAPI Spec to Postman
1. Open Postman
2. Click "Import"
3. Enter URL: `http://localhost:8080/v3/api-docs`
4. Click "Continue" → "Import"
5. All endpoints will be imported as a collection

### Generate Client SDK
Use OpenAPI Generator to create client libraries:

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:8080/v3/api-docs \
  -g typescript-axios \
  -o ./client-sdk

# Generate Java client
openapi-generator-cli generate \
  -i http://localhost:8080/v3/api-docs \
  -g java \
  -o ./java-client
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Review and update `OpenApiConfig.java` description
- [ ] Update server URLs in `OpenApiConfig.java`
- [ ] **CRITICAL:** Remove Swagger endpoints from `permitAll()` in `SecurityConfig.java`
- [ ] Add authentication requirement for Swagger (e.g., `hasRole('ADMIN')`)
- [ ] Consider disabling Swagger entirely in production
- [ ] Update contact information in API metadata
- [ ] Test Swagger authentication in staging environment
- [ ] Document production Swagger access procedure

### Disable Swagger in Production

**Option 1: Profile-based**

In `application-prod.properties`:
```properties
springdoc.swagger-ui.enabled=false
springdoc.api-docs.enabled=false
```

**Option 2: Security-based**

In `SecurityConfig.java`:
```java
// Production: Require ADMIN role
.requestMatchers("/v3/api-docs/**").hasRole("ADMIN")
.requestMatchers("/swagger-ui/**").hasRole("ADMIN")
.requestMatchers("/swagger-ui.html").hasRole("ADMIN")
```

---

## Dependencies

### Maven Dependency
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.0.2</version>
</dependency>
```

**Version:** 2.0.2  
**License:** Apache 2.0  
**Documentation:** https://springdoc.org/

---

## Additional Resources

- **Swagger Editor:** https://editor.swagger.io/ (Validate OpenAPI specs)
- **OpenAPI Specification:** https://swagger.io/specification/
- **SpringDoc Documentation:** https://springdoc.org/
- **JWT.io:** https://jwt.io/ (Debug JWT tokens)

---

## Quick Reference

| Feature | URL |
|---------|-----|
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |
| OpenAPI YAML | http://localhost:8080/v3/api-docs.yaml |
| Application Health | http://localhost:8080/actuator/health |

---

## Support

For issues or questions:
- Check application logs: `logs/spring.log`
- Review security configuration: `SecurityConfig.java`
- Verify OpenAPI config: `OpenApiConfig.java`
- Check dependencies: `pom.xml`

---

**Last Updated:** December 17, 2025  
**Maintained By:** Mukono Diocese IT Team
