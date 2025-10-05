# Session-Based Authentication Flow

This document describes how users can access their surveys using session tokens from the magic link flow.

## Authentication Methods

The results page now supports **three authentication methods**, checked in order:

### 1. Direct Token (Primary)
**URL Pattern:** `/results?id=SURVEY_ID&token=RETRIEVAL_TOKEN`
- Used when: User clicks link from assessment completion email
- Token Source: Retrieval token created during survey submission
- Validity: Permanent (doesn't expire)
- Access Level: Full access to that specific survey

### 2. Session Token (Magic Link Flow)
**URL Pattern:** `/results?id=SURVEY_ID` (no token parameter)
- Used when: User clicks survey card from `/access` page after magic link verification
- Token Source: Session token stored in `sessionStorage` as `dmsa-session`
- Validity: 7 days from magic link verification
- Access Level: Full access to ALL surveys in the session

### 3. Legacy Store (Fallback)
- Used when: User just completed assessment in same browser session
- Token Source: Zustand store + localStorage
- Validity: Until browser storage cleared
- Access Level: Only the most recently completed survey

---

## Session Token Structure

```typescript
interface SessionToken {
  email: string;        // Hashed email (SHA-256)
  surveyIds: string[];  // Array of survey IDs user has access to
  expiresAt: number;    // Unix timestamp (7 days from creation)
}
```

**Encoding:** Base64-encoded JSON
**Storage:** `sessionStorage.setItem('dmsa-session', btoa(JSON.stringify(sessionToken)))`

**Example:**
```json
{
  "email": "a1b2c3d4e5f6...",
  "surveyIds": ["abc123def4", "xyz789ghi0"],
  "expiresAt": 1736121850000
}
```

---

## Flow Diagram: Magic Link → Results

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User requests magic link from /access page                   │
│    POST /api/auth/request-magic-link { email: "user@example.com" }│
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Magic link email sent with token                             │
│    https://app.com/access?token=XXX&email=user@example.com      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. User clicks magic link                                        │
│    /access page verifies token via POST /api/auth/verify-magic-link│
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Session token created and stored                             │
│    sessionStorage.setItem('dmsa-session', sessionToken)          │
│    Displays list of user's surveys                              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. User clicks survey card                                       │
│    router.push(`/results?id=SURVEY_ID`)                         │
│    (Note: No token parameter in URL)                            │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Results page checks authentication                            │
│    - No urlToken in URL ✗                                       │
│    - Session token in sessionStorage ✓                          │
│    - Survey ID in session's allowed list ✓                      │
│    - Session not expired ✓                                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Fetch survey via session auth                                │
│    GET /api/my-surveys/SURVEY_ID                                │
│    Headers: { Authorization: "Bearer SESSION_TOKEN" }           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. API validates session and returns survey data                │
│    - Verifies session token structure                           │
│    - Checks expiration                                           │
│    - Confirms survey ID in allowed list                          │
│    - Returns: survey, results, retrievalToken, hasExpandedAccess │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. Results page displays with full access                       │
│    User can view results, download PDF, manage leaderboard      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### ✅ Secure
- **Email Hashing**: Emails stored as SHA-256 hashes, not plaintext
- **Token Expiry**: Sessions expire after 7 days
- **Access Scope**: Session only grants access to user's own surveys
- **Server Validation**: All checks performed server-side, not client-side
- **One-Time Magic Links**: Magic link tokens can only be used once

### ⚠️ Potential Risks
- **Session Storage**: Cleared when tab closes (intentional - users must re-authenticate)
- **No Encryption**: Session token is base64-encoded, not encrypted (but only contains hashed email + survey IDs)
- **XSS Vulnerability**: If site has XSS vulnerabilities, sessionStorage can be read by malicious scripts

### 🔒 Mitigation Strategies
- Session tokens only grant access to survey metadata, not sensitive data
- Retrieval tokens (from private subcollection) required for write operations
- No PII stored in session token (email is hashed)
- Short expiry window (7 days) limits damage if token leaked

---

## Code Locations

### Frontend (Results Page)
**File:** `app/results/page.tsx`
**Lines:** 86-163 (session auth check in `loadSurveyData`)

```typescript
// Check for session token
const sessionToken = sessionStorage.getItem('dmsa-session');

if (urlSurveyId && !urlToken && sessionToken) {
  const sessionData = JSON.parse(atob(sessionToken));

  // Verify expiry
  if (sessionData.expiresAt > Date.now()) {
    // Verify survey access
    if (sessionData.surveyIds.includes(urlSurveyId)) {
      // Fetch via session endpoint
      const response = await fetch(`/api/my-surveys/${urlSurveyId}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
    }
  }
}
```

### Backend (Session Auth API)
**File:** `app/api/my-surveys/[id]/route.ts`
**Lines:** 18-141 (full GET handler)

```typescript
// Validate session token from Authorization header
const sessionToken = authHeader.substring(7);
const session = JSON.parse(Buffer.from(sessionToken, 'base64').toString());

// Check expiry
if (session.expiresAt < Date.now()) {
  return 401 Unauthorized;
}

// Check access
if (!session.surveyIds.includes(surveyId)) {
  return 403 Forbidden;
}

// Fetch survey + retrieval token from private subcollection
const userDetailsDoc = await db
  .collection('surveys')
  .doc(surveyId)
  .collection('private')
  .doc('userDetails')
  .get();

return {
  survey, results, retrievalToken, hasExpandedAccess
};
```

### Session Creation (Magic Link Verification)
**File:** `app/api/auth/verify-magic-link/route.ts`
**Lines:** ~50-70 (session token generation)

```typescript
const sessionToken = Buffer.from(JSON.stringify({
  email: verification.emailHash,
  surveyIds,
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
})).toString('base64');

return {
  success: true,
  data: { surveys, sessionToken, email }
};
```

---

## Testing Checklist

### Manual Testing

**Scenario: Happy Path**
1. ✅ Complete assessment and provide email
2. ✅ Request magic link from `/access` page
3. ✅ Click magic link in email
4. ✅ Verify redirected to `/access` with survey list
5. ✅ Click survey card
6. ✅ Verify redirected to `/results?id=XXX` (no token in URL)
7. ✅ Verify results load successfully
8. ✅ Verify all features work (PDF download, leaderboard toggle)

**Scenario: Session Expiry**
1. ✅ Verify magic link
2. ✅ Manually edit session token expiry to past date
3. ✅ Click survey card
4. ✅ Verify session cleared and access denied
5. ✅ Request new magic link
6. ✅ Verify works again

**Scenario: Wrong Survey**
1. ✅ Verify magic link for email with 2 surveys
2. ✅ Manually navigate to `/results?id=DIFFERENT_SURVEY_ID`
3. ✅ Verify 403 Forbidden response
4. ✅ Verify error message shown

**Scenario: No Session**
1. ✅ Clear sessionStorage
2. ✅ Navigate to `/results?id=XXX`
3. ✅ Verify falls back to legacy store or shows error

### Automated Testing

```typescript
// Test session token creation
test('verify-magic-link creates valid session token', async () => {
  const response = await POST('/api/auth/verify-magic-link', {
    email: 'test@example.com',
    token: validMagicLinkToken
  });

  const sessionToken = response.data.sessionToken;
  const decoded = JSON.parse(atob(sessionToken));

  expect(decoded.email).toBeTruthy();
  expect(decoded.surveyIds).toBeInstanceOf(Array);
  expect(decoded.expiresAt).toBeGreaterThan(Date.now());
});

// Test session-based access
test('results page loads with valid session', async () => {
  const sessionToken = createTestSession(['survey123']);
  sessionStorage.setItem('dmsa-session', sessionToken);

  render(<ResultsPage />, {
    searchParams: { id: 'survey123' }
  });

  await waitFor(() => {
    expect(screen.getByText(/Resultater/)).toBeInTheDocument();
  });
});

// Test session expiry
test('expired session is rejected', async () => {
  const expiredSession = createTestSession(['survey123'], Date.now() - 1000);

  const response = await GET('/api/my-surveys/survey123', {
    headers: { 'Authorization': `Bearer ${expiredSession}` }
  });

  expect(response.status).toBe(401);
  expect(response.body.error.code).toBe('SESSION_EXPIRED');
});
```

---

## Troubleshooting

### Issue: "Session expired" immediately after magic link
**Cause:** Server clock skew or client-side clock issues
**Fix:** Verify server and client times are synchronized

### Issue: Session clears on page refresh
**Cause:** Using `sessionStorage` instead of `localStorage`
**Expected:** This is intentional - sessions are per-tab and clear on tab close

### Issue: Can't access survey even with valid session
**Cause:** Survey ID not in session's `surveyIds` array
**Fix:** Verify magic link flow correctly adds all surveys to session

### Issue: Results show "no expanded access" even after email capture
**Cause:** Survey not upgraded to T1 state
**Fix:** Check `/api/surveys/[id]/upgrade` route executed successfully

---

## Future Enhancements

### Phase 2 (Planned)
- **Refresh tokens**: Allow 30-day sessions with refresh mechanism
- **Multiple devices**: Sync sessions across devices via Firebase Auth
- **Activity log**: Track when/where users accessed surveys
- **Session revocation**: Allow users to revoke sessions from settings page

### Phase 3 (Backlog)
- **Full account system**: Optional password-based auth alongside magic links
- **OAuth integration**: Sign in with Google/Microsoft
- **Two-factor auth**: Optional 2FA for high-security scenarios
- **API keys**: Allow programmatic access for enterprise customers
