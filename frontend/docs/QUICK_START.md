# Quick Start Guide - UI Foundation

## Running the Application

### Development
```bash
cd frontend
npm install  # (if not already done)
npm run dev
```
Visit: **http://localhost:5174**

### Production Build
```bash
npm run build
npm run preview
```

---

## Key Component Usage Examples

### Using the Toast System

```tsx
import { useToast } from '@/components/feedback/ToastProvider'

export function MyComponent() {
  const toast = useToast()

  const handleSubmit = async () => {
    try {
      // ... API call
      toast.success('Operation completed successfully!')
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <button onClick={handleSubmit}>Submit</button>
  )
}
```

### Using EmptyState

```tsx
import EmptyState from '@/components/common/EmptyState'
import CollectionsIcon from '@mui/icons-material/Collections'

export function GalleryPage() {
  const [images, setImages] = useState([])

  if (images.length === 0) {
    return (
      <EmptyState
        icon={<CollectionsIcon />}
        title="No images yet"
        description="Upload your first image to get started"
        action={{
          label: 'Upload Image',
          onClick: () => handleUpload()
        }}
      />
    )
  }

  return <div>{/* ... render images ... */}</div>
}
```

### Using StatusChip

```tsx
import StatusChip from '@/components/common/StatusChip'

export function VoterCodeRow({ code }) {
  return (
    <div>
      <span>{code.number}</span>
      <StatusChip status={code.status} />
    </div>
  )
}
```

### Using LoadingState

```tsx
import LoadingState from '@/components/common/LoadingState'
import PageLayout from '@/components/layout/PageLayout'

export function DataPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])

  useEffect(() => {
    // ... fetch data
  }, [])

  return (
    <PageLayout title="My Data">
      {loading ? (
        <LoadingState variant="card" count={6} />
      ) : (
        // ... render data
      )}
    </PageLayout>
  )
}
```

### Using PageLayout

```tsx
import PageLayout from '@/components/layout/PageLayout'
import { Button } from '@mui/material'

export function MyPage() {
  return (
    <PageLayout
      title="Elections"
      subtitle="Manage voting elections"
      actions={
        <>
          <Button variant="contained">Create Election</Button>
          <Button variant="outlined">Export</Button>
        </>
      }
    >
      {/* Page content here */}
    </PageLayout>
  )
}
```

### Using AppShell

```tsx
import AppShell from '@/components/layout/AppShell'
import PageLayout from '@/components/layout/PageLayout'

export function AdminPage() {
  return (
    <AppShell>
      <PageLayout title="Admin Dashboard">
        {/* Content automatically gets sidebar + topbar */}
      </PageLayout>
    </AppShell>
  )
}
```

### Using API Client

```tsx
import { api } from '@/api/axios'

export function ElectionsPage() {
  const [elections, setElections] = useState([])

  useEffect(() => {
    api.get<Election[]>('/elections')
      .then(data => setElections(data))
      .catch(err => toast.error('Failed to load elections'))
  }, [])

  return (
    // ...
  )
}
```

---

## Theme Customization

The theme is in `src/theme/theme.ts`. Key customization points:

### Colors
```typescript
const COLORS = {
  primary: '#8F3493',    // Purple
  secondary: '#0E61AD',  // Blue
  accent: '#D7B161',     // Gold
  // ... etc
}
```

### Typography
```typescript
typography: {
  fontFamily: '...',
  h1: { fontSize: '2.5rem', fontWeight: 700, ... },
  h2: { ... },
  // ... etc
}
```

### Component Overrides
```typescript
components: {
  MuiButton: { styleOverrides: { ... } },
  MuiTextField: { styleOverrides: { ... } },
  // ... etc
}
```

---

## Environment Configuration

1. Create `.env` from `.env.example`:
```bash
cp .env.example .env
```

2. Update `VITE_API_BASE_URL` if needed:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_ENV=development
```

The API client will use this automatically.

---

## Responsive Design

- **Desktop (md+):** Sidebar visible, full layout
- **Tablet (sm-md):** Sidebar hidden, hamburger in topbar
- **Mobile (xs):** Optimized for small screens

Test with: `View → Toggle Device Toolbar` in DevTools (Cmd+Shift+M)

---

## Debugging

### Check Toast System
```typescript
// In browser console
window.__TOAST_CONTEXT__.success('Test notification')
window.__TOAST_CONTEXT__.error('Error message')
```

### Check Theme Colors
```typescript
// In browser console
import { lightTheme } from '@/theme/theme'
console.log(lightTheme.palette.primary.main)  // #8F3493
```

### TypeScript Errors
```bash
npm run build  # Run tsc to catch all errors
```

---

## File Organization

- **Layout:** Components for page structure (`layout/`)
- **Common:** Reusable UI components (`common/`)
- **Feedback:** User feedback patterns (`feedback/`)
- **API:** HTTP client configuration (`api/`)
- **Routes:** Navigation and routing (`routes/`)
- **Theme:** Theming configuration (`theme/`)
- **Context:** Global state (React Context) (`context/`)
- **Pages:** Page-level components (`pages/`)

---

## Next Steps for UI-A

1. Implement login endpoint in `LoginPage.tsx`
2. Implement voter code login in `VoteLoginPage.tsx`
3. Wire axios interceptors to auth context
4. Create admin/DS dashboard content pages
5. Add real API calls with error handling
6. Implement role-based page redirection

---

## Support & Documentation

- **MUI Docs:** https://mui.com/material-ui/
- **React Router:** https://reactrouter.com/
- **Axios:** https://axios-http.com/
- **TypeScript:** https://www.typescriptlang.org/

---

## Build & Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build  # Creates dist/ folder
npm run preview  # Preview build locally
```

### Lint Check
```bash
npm run lint
```

The build output is optimized and ready for deployment to any static host (Netlify, Vercel, AWS S3, etc.).
