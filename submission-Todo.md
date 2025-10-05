# Survey Submission & Retrieval Implementation Plan

## Problem Statement

**Current Issues:**
1. **No email-based retrieval**: Users cannot retrieve past surveys using only their email address
2. **Token dependency**: Current system requires both surveyId + retrievalToken (manual copy/paste)
3. **Anonymous confusion**: The "anonymous" flag is misleading - ALL submissions should be anonymous by default
4. **Leaderboard opt-out missing**: Users need ability to opt OUT of leaderboard, not opt into anonymity
5. **Results page overload**: Results page handles too many concerns (first-time view, retrieval, email capture)

**Desired State:**
- Users submit surveys anonymously by default
- Users can retrieve ALL their past surveys using ONLY their email address (magic link flow)
- Users can opt OUT of public leaderboard on per-survey basis
- Results page is clean and focused on single survey context
- Firebase handles email → surveys mapping securely

---

## Revised Architecture (No Separate My-Surveys Page)

**Key Decision**: The results page handles EVERYTHING - current results, past survey access via magic link, and leaderboard settings. No separate "my-surveys" page needed.

## Architecture Design

### Data Model Changes

#### 1. Email-to-Survey Mapping (New Collection) ✅ COMPLETED
```typescript
// Collection: email_surveys
// Document ID: SHA256(email.toLowerCase())
{
  emailHash: string;           // SHA256 of normalized email
  surveyIds: string[];         // Array of survey IDs owned by this email
  lastUpdated: Timestamp;
  surveyCount: number;
}
```

#### 2. Survey Document Updates
```typescript
// surveys/{surveyId}
{
  // ... existing fields ...
  flags: {
    isCompleted: boolean;
    hasResults: boolean;
    hasExpandedAccess: boolean;
    includeInLeaderboard: boolean;  // NEW: default true, user can opt out
  },
  // Remove isAnonymous - it's confusing
}
```

#### 3. Private User Details (Enhanced)
```typescript
// surveys/{surveyId}/private/userDetails
{
  email: string;               // Stored encrypted or hashed
  emailDomain: string;
  contactName?: string;
  magicLinkToken?: string;     // One-time use token for magic link
  magicLinkExpiry?: Timestamp; // Token expiration
  createdAt: string;
  consentAcceptedAt?: string;
}
```

---

## Implementation Plan

### Phase 1: Backend Infrastructure

#### Task 1.1: Create email mapping service
- [ ] Create `lib/email-survey-mapping.ts`
  - `hashEmail(email: string): string` - SHA256 normalized email
  - `addSurveyToEmail(email: string, surveyId: string): Promise<void>`
  - `getSurveysByEmail(email: string): Promise<string[]>`
  - `removeSurveyFromEmail(email: string, surveyId: string): Promise<void>`

#### Task 1.2: Create magic link service
- [ ] Create `lib/magic-link.ts`
  - `generateMagicLinkToken(): string` - Cryptographically secure token
  - `createMagicLink(email: string): Promise<{ token: string, expiry: Date }>`
  - `verifyMagicLinkToken(token: string, email: string): Promise<boolean>`
  - `sendMagicLinkEmail(email: string, token: string): Promise<void>` - Integration with email service

#### Task 1.3: Update survey API routes
- [ ] Modify `POST /api/surveys` (create)
  - When survey upgraded to T1 (email captured), add to email mapping

- [ ] Modify `POST /api/surveys/[id]/upgrade`
  - Call `addSurveyToEmail()` after successful email capture

- [ ] Create `POST /api/auth/magic-link`
  - Accept email, generate magic link, send email
  - Response: `{ success: true, message: "Check your email" }`

- [ ] Create `GET /api/auth/verify-magic-link`
  - Accept token + email
  - Return: `{ surveys: string[], retrievalTokens: Record<surveyId, token> }`
  - Store session data for authenticated access

#### Task 1.4: Update leaderboard opt-out
- [ ] Rename `isAnonymous` to `includeInLeaderboard` (inverted logic)
- [ ] Update `POST /api/surveys/[id]/leaderboard-settings`
  - Toggle `includeInLeaderboard` flag
  - Require retrieval token for auth

- [ ] Update leaderboard query to filter by `includeInLeaderboard: true`

---

### Phase 2: Frontend Implementation

#### Task 2.1: Create "My Surveys" page
- [ ] Create `app/my-surveys/page.tsx`
  - Email input form
  - Magic link request flow
  - List of user's surveys after authentication
  - Quick actions: View, Download PDF, Toggle leaderboard

#### Task 2.2: Update results page
- [ ] Simplify `app/results/page.tsx`
  - Remove anonymous participation toggle (move to settings)
  - Focus on single survey context
  - Add "View all my surveys" link (if email captured)

#### Task 2.3: Create survey settings modal
- [ ] Create `components/modals/SurveySettingsModal.tsx`
  - Leaderboard inclusion toggle
  - Delete survey option (future)
  - Download data options

#### Task 2.4: Update leaderboard UX
- [ ] Update `app/leaderboard/page.tsx`
  - Update copy to reflect "all surveys shown unless opted out"
  - Remove confusing "anonymous" language

---

### Phase 3: Email Integration

#### Task 3.1: Choose email service
- [ ] Evaluate options:
  - **Resend** (recommended - simple API, generous free tier)
  - **SendGrid** (robust, more complex)
  - **Firebase Cloud Functions + Nodemailer** (self-hosted)

#### Task 3.2: Set up email templates
- [ ] Magic link email template
  ```
  Subject: Access your Digital Maturity Assessments

  Hi there,

  Click the link below to access all your assessment reports:
  [Magic Link Button - expires in 1 hour]

  This link will give you access to:
  - View all your completed assessments
  - Download PDF reports
  - Manage leaderboard visibility

  Link expires: [timestamp]
  ```

- [ ] Assessment completion email (optional enhancement)
  ```
  Subject: Your Digital Maturity Assessment is Complete

  Your assessment is ready!
  [View Results Button]

  Retrieval ID: [surveyId]
  ```

#### Task 3.3: Configure email sending
- [ ] Add environment variables (Resend example):
  ```bash
  RESEND_API_KEY=...
  RESEND_FROM_EMAIL=noreply@digital-modenhet.rastla.us
  ```

- [ ] Create `lib/email-service.ts`
  - `sendMagicLink(email, token, surveyIds[])`
  - `sendAssessmentComplete(email, surveyId, retrievalToken)` (optional)

---

### Phase 4: Security & Privacy

#### Task 4.1: Implement rate limiting
- [ ] Magic link requests: 3 per email per hour
- [ ] Token verification: 5 attempts per token
- [ ] Use Vercel KV or Upstash Redis for rate limit storage

#### Task 4.2: Security rules updates
- [ ] Firestore rules for email_surveys collection:
  ```javascript
  match /email_surveys/{emailHash} {
    // Only server-side writes
    allow read: if false;
    allow write: if false;
  }
  ```

#### Task 4.3: GDPR compliance
- [ ] Add privacy policy section for email storage
- [ ] Implement email deletion request flow (future)
- [ ] Add consent checkbox for email capture
- [ ] Update privacy policy to mention magic link auth

---

### Phase 5: Migration & Testing

#### Task 5.1: Data migration script
- [ ] Create `scripts/migrate-email-mappings.ts`
  - Scan all surveys with T1 state
  - Extract email from private/userDetails
  - Create email_surveys documents
  - Backfill email mappings

#### Task 5.2: Update seed script
- [ ] Modify `scripts/seed-firestore.js`
  - Add email mappings for T1 surveys
  - Include sample magic link tokens (expired)

#### Task 5.3: Testing checklist
- [ ] Unit tests for email hashing
- [ ] Unit tests for magic link generation/verification
- [ ] E2E test: Complete survey → capture email → request magic link → verify → access surveys
- [ ] E2E test: Opt out of leaderboard → verify not shown
- [ ] Security test: Expired token rejection
- [ ] Security test: Rate limiting

---

## UI/UX Flow Diagrams

### Current Flow (Broken)
```
Complete Assessment
  ↓
Results Page (needs token manually)
  ↓
Optional: Provide email → "Anonymous" toggle appears (confusing!)
  ↓
User confused about leaderboard vs anonymity
```

### New Flow (Fixed)
```
Complete Assessment
  ↓
Results Page
  ↓
Optional: Provide email → Added to email_surveys mapping
  ↓
Email sent: "Assessment complete! [View Results]"
  ↓
Later: User visits /my-surveys
  ↓
Enters email → Magic link sent
  ↓
Clicks link → See all surveys
  ↓
Per-survey: [View] [Download PDF] [⚙️ Settings]
  ↓
Settings: Toggle "Include in public leaderboard" (default: ON)
```

---

## Technical Considerations

### Firebase Constraints
- **Email privacy**: Never query email_surveys directly from client
- **Token security**: Magic link tokens must be one-time use or expire quickly
- **Rate limiting**: Prevent abuse of magic link endpoint

### Recommended Stack Additions
- **Email**: Resend (simple, reliable, good DX)
- **Rate limiting**: Vercel KV (if on Vercel) or Upstash Redis
- **Token storage**: Firebase Firestore with TTL cleanup (Cloud Functions)

---

## Success Criteria

### Must Have (MVP)
- [x] User can retrieve surveys using ONLY email (magic link)
- [x] User can view list of all their surveys
- [x] User can opt out of leaderboard per survey
- [x] "Anonymous" terminology removed (replaced with "Include in leaderboard")
- [x] Results page simplified to focus on single survey

### Nice to Have (Future)
- [ ] Email notifications on assessment completion
- [ ] Survey comparison view (compare multiple assessments side-by-side)
- [ ] Data export for all surveys as ZIP
- [ ] Account dashboard with progress tracking over time
- [ ] Survey deletion with confirmation
- [ ] Email verification before capturing

---

## Rollout Plan

### Week 1: Backend Foundation
- Email mapping service
- Magic link service
- API routes for auth

### Week 2: Frontend Pages
- My Surveys page
- Survey settings modal
- Results page cleanup

### Week 3: Email Integration
- Resend setup
- Email templates
- Testing email delivery

### Week 4: Security & Launch
- Rate limiting
- Security audit
- Data migration
- Phased rollout (beta users → public)

---

## Open Questions

1. **Email service choice**: Resend vs SendGrid vs self-hosted?
   - **Recommendation**: Resend (simpler API, better DX, 3000 emails/month free)

2. **Magic link expiry**: 1 hour? 24 hours?
   - **Recommendation**: 1 hour (security), with easy re-request flow

3. **Session management**: How long should magic link session last?
   - **Recommendation**: 7 days client-side session, re-auth via magic link after expiry

4. **Default leaderboard inclusion**: Opt-in or opt-out?
   - **Recommendation**: Opt-out (include by default, let users remove if desired)

5. **Retroactive email mapping**: Migrate existing T1 surveys?
   - **Recommendation**: Yes, run migration script to backfill email_surveys collection

---

## Notes

- All submissions remain anonymous on leaderboard (show company alias, not real name)
- Email is ONLY used for multi-survey retrieval, not for identification on leaderboard
- Leaderboard opt-out is per-survey (user may want to hide specific assessments)
- Magic link approach avoids password management complexity
- Email hashing in email_surveys ensures privacy even if collection is compromised
