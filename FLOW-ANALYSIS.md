# User Flow Analysis & Implementation Status

## Scenario 1: First-Time Visitor ✅ COMPLETE

### User Flow
1. ✅ User completes assessment → redirected to `/results`
2. ✅ Results page displays basic results (overall score, dimensions preview)
3. ✅ User sees "Unlock Expanded Results" gate with email capture
4. ✅ User provides email → **Triggers**:
   - Survey upgraded to T1 state
   - Email → survey ID mapping created in Firestore
   - **📧 Assessment completion email sent** with direct results link
   - Expanded results unlocked immediately
5. ✅ User can now:
   - View full radar chart
   - Download PDF report
   - See benchmark comparisons
   - Toggle leaderboard inclusion
   - Export JSON data

### Implementation Status
- ✅ Email capture UI in results page (lines 759-816 in app/results/page.tsx)
- ✅ Survey upgrade API (`POST /api/surveys/[id]/upgrade`)
- ✅ Email mapping service (`lib/email-survey-mapping.ts`)
- ✅ Assessment completion email (`sendAssessmentCompleteEmail()`)
- ✅ Email sent automatically after upgrade (lines 220-239 in upgrade/route.ts)

### Email Content (Scenario 1)
```
Subject: 🎉 Din Digital Modenhet vurdering er klar!

- Direct link to results with token embedded
- Overall score displayed
- Rapport ID for future reference
- Reminder: can access via /access page with email
```

---

## Scenario 2: Returning Visitor ✅ COMPLETE

### User Flow
1. ✅ User visits `/access` page (or clicks link from homepage - **needs adding**)
2. ✅ Enters email address
3. ✅ Receives magic link email (1-hour expiry)
4. ✅ Clicks magic link → **Redirects to** `/access?token=XXX&email=YYY`
5. ✅ Token verified → Shows list of all their surveys with:
   - Company name
   - Completion date
   - Overall score + maturity badge
   - Sector/size badges
   - Rapport ID
6. ✅ User clicks survey → Redirected to `/results?id=XXX` with session auth
7. ✅ Results page loads with full access (using session token)

### Implementation Status
- ✅ Magic link request component (`components/MagicLinkRequest.tsx`)
- ✅ Access page with verification (`app/access/page.tsx`)
- ✅ Magic link request API (`POST /api/auth/request-magic-link`)
- ✅ Magic link verify API (`POST /api/auth/verify-magic-link`)
- ✅ Survey list API (`GET /api/my-surveys/[id]`)
- ⚠️  **NEEDS**: Homepage link to `/access` page
- ⚠️  **NEEDS**: Results page to accept session-based auth (currently only token-based)

### Email Content (Scenario 2)
```
Subject: Tilgang til dine X Digital Modenhet vurderinger

- Magic link button (1-hour expiry)
- Survey count
- List of features after login
- Fallback text link if button doesn't work
```

---

## Missing Pieces

### High Priority
1. **Homepage Access Link** ⚠️
   - Add prominent "Access Previous Results" button to homepage
   - Link to `/access` page

2. **Session-Based Auth in Results Page** ⚠️
   - Currently results page only accepts `?id=X&token=Y` (direct token)
   - Needs to also accept `?id=X` with session token in sessionStorage
   - Check sessionStorage for `dmsa-session` token
   - Use that to call authenticated API if direct token not provided

### Medium Priority
3. **Results Page Magic Link CTA**
   - Add small banner: "Want to access this later? We've sent you an email with a secure link."
   - Or: "Lost this page? Request a magic link to access all your results anytime."

4. **Email Template Testing**
   - Test assessment completion email rendering
   - Test magic link email rendering
   - Verify links work correctly in production

### Low Priority
5. **Session Expiry Handling**
   - Magic link sessions expire after 7 days
   - Add UI to detect expired session and prompt for new magic link

---

## Data Flow Diagrams

### Scenario 1: Email Capture Flow
```
User → Results Page (T0 state)
  ↓ Provides email
Survey Upgrade API
  ├─→ Firestore: Update survey to T1
  ├─→ Firestore: Create private/userDetails
  ├─→ Firestore: Add email_surveys mapping
  └─→ Resend: Send assessment completion email
       ↓
User Inbox: Email with direct link
  → /results?id=XXX&token=YYY
```

### Scenario 2: Magic Link Flow
```
User → /access
  ↓ Enters email
Request Magic Link API
  ├─→ Firestore: Query email_surveys collection
  ├─→ Firestore: Create magic_links document
  └─→ Resend: Send magic link email
       ↓
User Inbox: Email with magic link
  → /access?token=XXX&email=YYY
       ↓
Verify Magic Link API
  ├─→ Firestore: Verify token hash
  ├─→ Firestore: Mark token as used
  ├─→ Firestore: Fetch survey metadata
  └─→ Return: Survey list + session token
       ↓
Access Page: Display survey cards
  ↓ User clicks survey
/results?id=XXX (with sessionStorage token)
```

---

## Security Features

### Implemented ✅
- Email addresses hashed (SHA-256) in `email_surveys` collection
- Magic link tokens are one-time use only
- Tokens expire after 1 hour
- Rate limiting: 3 magic link requests per hour per email
- Session tokens expire after 7 days
- Retrieval tokens never exposed in listings

### To Consider
- Email verification (send confirmation link before allowing magic links)
- IP-based rate limiting for abuse prevention
- Suspicious activity alerts (many failed token attempts)

---

## Testing Checklist

### Scenario 1 Testing
- [ ] Complete new assessment without email
- [ ] See results page with basic preview
- [ ] Provide email in unlock modal
- [ ] Verify email received (check spam)
- [ ] Click link in email → lands on results page with full access
- [ ] Verify PDF download works
- [ ] Verify leaderboard toggle works

### Scenario 2 Testing
- [ ] Visit `/access` page
- [ ] Enter email used in previous assessment
- [ ] Verify magic link email received
- [ ] Click magic link
- [ ] Verify redirected to `/access` with survey list
- [ ] Verify all surveys shown with correct data
- [ ] Click on a survey
- [ ] Verify redirected to results page with full access
- [ ] Try clicking magic link again (should fail - one-time use)

### Edge Cases
- [ ] Request magic link for email with no surveys (should show error)
- [ ] Request magic link 4 times in a row (should hit rate limit)
- [ ] Click expired magic link (should show error + request new link option)
- [ ] Complete 2 surveys with same email → magic link should show both

---

## Production Deployment Checklist

- [x] RESEND_API_KEY added to Vercel (production, preview, development)
- [x] Email domain verified in Resend (updates.rastla.us)
- [ ] Test emails in production (send to real email)
- [ ] Monitor Resend dashboard for delivery issues
- [ ] Set up email analytics (open rates, click rates)
- [ ] Add error tracking for failed email sends
- [ ] Create admin dashboard to view email mapping stats

---

## Future Enhancements

### Phase 2
- **Survey Comparison View**: Compare multiple assessments side-by-side
- **Progress Tracking**: Track improvements over time with charts
- **Team Collaboration**: Share results with team members
- **Survey Deletion**: Allow users to delete surveys from their account

### Phase 3
- **Account System**: Full user accounts with password auth (alternative to magic links)
- **Scheduled Assessments**: Reminder emails to retake assessment quarterly
- **Custom Branding**: White-label for enterprise customers
- **API Access**: Allow programmatic access to survey data

---

## Notes
- ALL surveys appear anonymously on leaderboard (unless user opts out)
- NO separate "my-surveys" page - `/access` handles everything
- Results page is the single source of truth for viewing a survey
- Magic links are the ONLY way to access multiple surveys
- Direct links (with token) work for single-survey access
