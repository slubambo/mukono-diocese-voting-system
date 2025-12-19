# UI-B Quick Reference Guide

## 🎯 What Was Implemented

**6 Configuration Management Screens** for Master Data & Organizational Structures

---

## 📋 Complete File List

### Types (2 files)
```
src/types/organization.ts    - Diocese, Archdeaconry, Church, Fellowship
src/types/leadership.ts       - PositionTitle, FellowshipPosition
```

### API Clients (6 files)
```
src/api/diocese.api.ts
src/api/archdeaconry.api.ts
src/api/church.api.ts
src/api/fellowship.api.ts
src/api/positionTitle.api.ts
src/api/fellowshipPosition.api.ts
```

### Pages (6 files)
```
src/pages/configuration/DiocesePage.tsx
src/pages/configuration/ArchdeaconryPage.tsx
src/pages/configuration/ChurchPage.tsx
src/pages/configuration/FellowshipPage.tsx
src/pages/configuration/PositionTitlePage.tsx
src/pages/configuration/PositionPage.tsx
```

### Configuration & Navigation (4 files updated)
```
src/config/endpoints.ts           - Added 6 endpoint constant objects
src/routes/menu.ts                - Added Configuration menu section
src/components/layout/Sidebar.tsx - Enhanced with nested menu support
src/routes/AppRoutes.tsx          - Added 6 protected routes
```

### Component Fixes (2 files updated)
```
src/components/common/StatusChip.tsx  - Added uppercase status support
src/components/common/EmptyState.tsx  - Changed action prop type
```

---

## 🔗 Access URLs

| URL | Page | Roles Required |
|-----|------|----------------|
| `/config/diocese` | Diocese Management | ADMIN, DS, BISHOP, SENIOR_STAFF, POLLING_OFFICER |
| `/config/archdeaconry` | Archdeaconry Management | ADMIN, DS, BISHOP, SENIOR_STAFF, POLLING_OFFICER |
| `/config/church` | Church Management | ADMIN, DS, BISHOP, SENIOR_STAFF, POLLING_OFFICER |
| `/config/fellowship` | Fellowship Management | ADMIN, DS, BISHOP, SENIOR_STAFF, POLLING_OFFICER |
| `/config/position-titles` | Position Title Templates | ADMIN, DS, BISHOP, SENIOR_STAFF, POLLING_OFFICER |
| `/config/positions` | Fellowship Positions | ADMIN, DS, BISHOP, SENIOR_STAFF, POLLING_OFFICER |

**Note:** Only `ROLE_ADMIN` has full CRUD access. All other roles are **read-only**.

---

## 🎨 Menu Navigation

Access via sidebar menu:
```
Configuration (click to expand)
  ├── Organizational Structure (sub-section)
  │   ├── Dioceses
  │   ├── Archdeaconries
  │   ├── Churches
  │   └── Fellowships
  └── Master Data (sub-section)
      ├── Position Titles
      └── Positions
```

---

## 🧬 Entity Hierarchy

```
Diocese
  └── Archdeaconry
      └── Church

Fellowship (independent)

PositionTitle (template)
  └── FellowshipPosition (combines Fellowship + Title + Scope + Seats)
```

---

## 🛠️ How to Test

### 1. Start the frontend development server
```bash
cd frontend
npm run dev
```

### 2. Login with different roles
- **Admin user**: Test full CRUD operations
- **DS user**: Verify read-only access (no create/edit/delete buttons)
- **Voter user**: Confirm redirect to unauthorized page

### 3. Test each page
- Create new records
- Edit existing records
- Change status (Active ↔ Inactive)
- Delete/deactivate records
- Test pagination
- Verify empty states
- Check error handling (try invalid data)

### 4. Test hierarchical selections
- **Archdeaconry Page**: Select diocese first, then create archdeaconry
- **Church Page**: Select diocese → archdeaconry → create church
- **Position Page**: Select fellowship + title → set scope and seats

---

## 💡 Common API Endpoints

```typescript
// Diocese
GET    /api/v1/ds/org/dioceses
POST   /api/v1/ds/org/dioceses
GET    /api/v1/ds/org/dioceses/:id
PUT    /api/v1/ds/org/dioceses/:id
DELETE /api/v1/ds/org/dioceses/:id

// Archdeaconry
GET    /api/v1/ds/org/archdeaconries
POST   /api/v1/ds/org/archdeaconries
GET    /api/v1/ds/org/archdeaconries/:id
PUT    /api/v1/ds/org/archdeaconries/:id
DELETE /api/v1/ds/org/archdeaconries/:id

// Church
GET    /api/v1/ds/org/churches
POST   /api/v1/ds/org/churches
GET    /api/v1/ds/org/churches/:id
PUT    /api/v1/ds/org/churches/:id
DELETE /api/v1/ds/org/churches/:id

// Fellowship
GET    /api/v1/ds/org/fellowships
POST   /api/v1/ds/org/fellowships
GET    /api/v1/ds/org/fellowships/:id
PUT    /api/v1/ds/org/fellowships/:id
DELETE /api/v1/ds/org/fellowships/:id

// Position Title
GET    /api/v1/ds/leadership/position-titles
POST   /api/v1/ds/leadership/position-titles
GET    /api/v1/ds/leadership/position-titles/:id
PUT    /api/v1/ds/leadership/position-titles/:id
DELETE /api/v1/ds/leadership/position-titles/:id

// Fellowship Position
GET    /api/v1/ds/leadership/positions
POST   /api/v1/ds/leadership/positions
GET    /api/v1/ds/leadership/positions/:id
PUT    /api/v1/ds/leadership/positions/:id
DELETE /api/v1/ds/leadership/positions/:id
```

---

## 🔍 Troubleshooting

### Import Errors
- ✅ Use **default export** for axios: `import axiosInstance from './axios'`
- ✅ Use **named exports** for API modules: `import { dioceseApi } from '../../api/diocese.api'`

### Component Errors
- ✅ StatusChip now supports `'ACTIVE' | 'INACTIVE'` (uppercase)
- ✅ EmptyState action prop accepts `ReactNode` (not object)
- ✅ LoadingState uses `variant="row"` (no message prop)

### API Errors
- ✅ PositionPage uses `titleId` (not `positionTitleId`)
- ✅ FellowshipPosition has nested `fellowship` and `title` objects
- ✅ List positions requires `fellowshipId` param (use 0 for all)

---

## 📚 Documentation

- **Full Implementation Details**: [UI-B_IMPLEMENTATION_SUMMARY.md](./UI-B_IMPLEMENTATION_SUMMARY.md)
- **OpenAPI Specification**: [openapi.json](./openapi.json)
- **Foundation Setup**: [FOUNDATION_SETUP.md](./FOUNDATION_SETUP.md)

---

*All implementations follow the OpenAPI specification as the single source of truth.*
