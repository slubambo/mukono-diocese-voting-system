# UI-F Quick Reference

## Voter Voting Flow Routes

```
GET  /vote/login              → Voter code input
POST /api/v1/vote/login       → Authenticate voter
GET  /vote/ballot             → Display candidates for voting
GET  /api/v1/vote/ballot      → Fetch ballot data
GET  /vote/review             → Confirm selections
POST /api/v1/vote/submit      → Submit vote
GET  /vote/success            → Success confirmation
GET  /vote/error              → Error display
```

## Using Voter Authentication

```typescript
import { useVoterAuth } from '../context/VoterAuthContext'

function MyComponent() {
  const { session, isAuthenticated, clearSession, hasSessionExpired } = useVoterAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/vote/login" />
  }
  
  return (
    <div>
      {/* Use session data */}
      <p>Voter ID: {session?.personId}</p>
      <p>Election ID: {session?.electionId}</p>
    </div>
  )
}
```

## Protecting Routes

```typescript
<Route
  path="/vote/ballot"
  element={
    <VoterGuard>
      <VoteBallotPage />
    </VoterGuard>
  }
/>
```

## API Calls with Voter Token

```typescript
import { voteApi } from '../api/vote.api'
import { useVoterAuth } from '../context/VoterAuthContext'

function MyComponent() {
  const { session } = useVoterAuth()
  
  const loadBallot = async () => {
    const ballot = await voteApi.getBallot({
      headers: { Authorization: `Bearer ${session?.accessToken}` }
    })
  }
}
```

## Bilingual Text Examples

```typescript
// Use consistently across all voter screens
"Vote (Londa)"
"Voting Code (Koodi y'Okulonda)"
"Continue (Weyongereyo)"
"Back (Ddayo)"
"Review (Kebera)"
"Confirm & Submit (Kakasa Osindike)"
```

## VoterLayout Usage

```typescript
<VoterLayout showHeader={true}>
  <Card>
    {/* Your content */}
  </Card>
</VoterLayout>
```

## Key Features to Test

- [ ] Login with valid code → redirects to ballot
- [ ] Login with invalid code → shows error message
- [ ] Session expiry → redirects to login with message
- [ ] Ballot loads positions and candidates
- [ ] Candidate selection works (radio/checkbox)
- [ ] Navigation between ballot/review works
- [ ] Review shows correct selections
- [ ] Submission succeeds → success page
- [ ] Submission fails → error page
- [ ] Success page blocks back navigation
- [ ] Mobile layout responsive
- [ ] Luganda keywords appear correctly

## Debugging

### Session not found?
Check `localStorage` for key `mdvs_voter_session`

### Routes not working?
Ensure `VoterAuthProvider` wraps `AppRoutes` in App.tsx

### API calls failing?
Check Authorization header: `Bearer ${token}`

### Mobile layout broken?
Check responsive sx properties: `{ xs: small, sm: medium }`

## Common Tasks

### Add new voter page
1. Create in `src/pages/Vote*.tsx`
2. Add to `AppRoutes.tsx` with `<VoterGuard>` if protected
3. Use `VoterLayout` component

### Change Luganda keywords
Find and replace in:
- All Vote*.tsx files
- VoterLayout component
- Look for pattern: `Label (Luganda)`

### Modify ballot display
Edit `PositionCard` component in `VoteBallotPage.tsx`

### Change colors/spacing
Edit theme in `src/theme/theme.ts` (affects all pages)

---

**Last Updated**: December 31, 2025
