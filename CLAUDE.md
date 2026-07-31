# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Digital Maturity Assessment (DMSA)** - A comprehensive self-assessment platform for SME digital transformation readiness based on the EU/JRC framework. The app delivers an 11-question assessment across 6 digital maturity dimensions with real-time scoring, visualization, and Postgres-backed persistence.

**Production**: https://digital-modenhet.rastla.us

## Development Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Build for production with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # tsc --noEmit

# Database
npm run db:migrate   # Apply db/schema.sql to DATABASE_URL (idempotent)
vercel env pull .env.local   # Fetch DATABASE_URL and other secrets

# Testing
node scripts/test-api.js     # Smoke-test the API endpoints against a running dev server
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 App Router + TypeScript (strict mode)
- **State**: Zustand with subscribeWithSelector middleware
- **UI**: shadcn/ui + TailwindCSS 4 + Radix UI primitives
- **Backend**: Neon Postgres via `postgres` (postgres.js), accessed only from API routes
- **Charts**: Recharts for radar visualizations
- **i18n**: react-i18next (Norwegian primary, English planned)
- **PDF**: @react-pdf/renderer for export
- **Deployment**: Vercel, manual vercel --prod

### Core Architecture Patterns

**Assessment Flow State Machine**:
The assessment follows a linear progression managed by Zustand store (`store/assessment.ts`):
1. Spec loaded → Questions rendered one-by-one
2. Answers auto-saved to localStorage on change
3. Real-time validation via `validateAnswers()` in `lib/scoring.ts`
4. Completion triggers score calculation via `computeDimensionScores()`
5. Results POSTed to `/api/surveys/{id}/complete` with the retrieval token
6. Stored as one row in `surveys`, keyed by a unique 10-char ID

**Scoring System** (`lib/scoring.ts`):
- Question scores: 0-10 scale (type-specific algorithms)
- Dimension scores: 0-100 scale (weighted averages of constituent questions)
- Overall score: 0-100 (average of 6 dimension scores)
- Maturity levels: Basic (0-25%), Average (26-50%), Moderately Advanced (51-75%), Advanced (76-100%)

**Question Renderer Architecture** (`components/assessment/QuestionRenderer.tsx`):
- Type-based component switching for 7 question types
- Each question type has dedicated component (CheckboxGroup, DualCheckbox, LikertScale05, TriState, and table variants)
- Table variants render questions as grids for better UX on multi-row inputs

### Key File Structure

```
app/
├── assessment/page.tsx        # Main questionnaire interface
├── results/page.tsx          # Results visualization with radar chart
├── retrieve/page.tsx         # Survey retrieval by ID
├── company-details/page.tsx  # User metadata collection
└── api/
    ├── surveys/route.ts      # Survey CRUD operations
    └── dma/results/route.ts  # Results retrieval API

db/
└── schema.sql                # The whole database: two tables

lib/
├── scoring.ts                # Question/dimension scoring algorithms
├── survey-api.ts             # Survey session & client-side API calls
├── db.ts                     # Postgres client + every query in the app
└── i18n.ts                   # i18next configuration

store/
└── assessment.ts             # Zustand assessment state (answers, progress, session)

types/
├── assessment.ts             # Question/Answer/Dimension type definitions
└── survey.ts                 # API request/response shapes

components/assessment/
├── QuestionRenderer.tsx      # Type-based question component dispatcher
├── CheckboxGroup.tsx         # Multi-select checkboxes
├── DualCheckbox.tsx          # Independent dual checkboxes (invested/planning)
├── LikertScale05.tsx         # 0-5 scale selector
├── TriState.tsx              # Yes/Partial/No selector
└── *Table.tsx                # Table variants for batch input
```

## Database

### Environment Variables
Server-side only — the browser never talks to the database:
```bash
DATABASE_URL=        # Injected by the Neon integration in all environments
DMSA_TOKEN_SALT=     # Salt for retrieval-token and magic-link hashing
RESEND_API_KEY=      # Transactional email
```

Pull them locally with `vercel env pull .env.local`.

### Schema
Two tables, defined in `db/schema.sql`:

- **`surveys`** — one row per assessment. Company details, retrieval token hash,
  `scores` and `answers` as `jsonb`, and contact fields set on T0→T1 upgrade.
- **`magic_links`** — token hash, email hash, expiry, usage counters.

Lifecycle state is **derived, never stored**: `T0`/`T1` is `upgraded_at is null`,
`isCompleted` is `completed_at is not null`, `hasResults` is `scores is not null`.
`lib/db.ts:toSurveyDocument()` reassembles the nested shape the frontend expects,
so API responses are unchanged from the Firestore era.

### Access Pattern
- All queries live in `lib/db.ts`. API routes must not write SQL directly.
- No authentication system: access is by unguessable 10-char survey ID plus a
  256-bit retrieval token, verified against a salted SHA-256 hash.
- `lib/db.ts` connects lazily on first query, so `next build` succeeds without
  `DATABASE_URL`.

## Assessment Framework

### Six Dimensions
1. **Digital Business Strategy** (Q1-Q2): Investment areas, digital readiness prep
2. **Digital Readiness** (Q3-Q4): Basic + advanced technology adoption
3. **Human-Centric Digitalization** (Q5-Q6): Training, employee engagement
4. **Data Management** (Q7-Q8): Data governance, cybersecurity
5. **Automation & AI** (Q9): AI/ML technology adoption
6. **Green Digitalization** (Q10-Q11): Environmental sustainability practices

### Question Types
- `checkboxes`: Multi-select with weighted options
- `dual-checkboxes`: Two independent checkboxes (e.g., "already invested" vs "planning")
- `scale-0-5`: 0-5 Likert scale (Not used → In use)
- `tri-state`: Yes/Partial/No selector
- `table-dual-checkboxes`, `scale-table`, `tri-state-table`: Grid variants for batch input

### Adding New Questions
1. Define question in `data/questions.no.ts` following `Question` type from `types/assessment.ts`
2. Add corresponding renderer component if new type (see `components/assessment/`)
3. Update `QuestionRenderer.tsx` switch statement
4. Add scoring logic in `lib/scoring.ts` following normalization pattern (0-10 scale)
5. Update dimension mappings if introducing new dimension

## Common Development Tasks

### Running Tests
```bash
# Unit tests with coverage
npm test -- --coverage

# Single test file
npm test -- lib/scoring.test.ts

# E2E tests (requires running dev server)
npm run dev  # Terminal 1
npm run test:e2e  # Terminal 2
```

### Testing the Database Integration
```bash
# Apply the schema (idempotent)
npm run db:migrate

# Smoke-test the API endpoints against a running dev server
node scripts/test-api.js
```

### Deploying to Production
```bash
# Deploy to Vercel (requires Vercel CLI)
vercel --prod

# Schema changes: edit db/schema.sql, then
DATABASE_URL=<production-url> npm run db:migrate
```

### Type Checking
TypeScript runs in strict mode. Common type locations:
- Question/Answer types: `types/assessment.ts`
- Store types: `store/assessment.ts` (inline with Zustand create)
- Database row and API types: `lib/db.ts` and `types/survey.ts`

Path aliases use `@/*` for root imports (configured in `tsconfig.json`).

## Key Implementation Details

### State Persistence
- **Answers**: Auto-saved to localStorage on change via `lib/persistence.ts`
- **Session**: Survey session stored in Zustand + localStorage
- **Database**: Final results POSTed to `/api/surveys/{id}/complete` on completion

### Scoring Algorithm
Each question type has dedicated scoring function in `lib/scoring.ts`:
- All question scores normalized to 0-10 scale
- Dimension scores computed as weighted average of questions × 10 (to get 0-100 scale)
- Overall score is unweighted average of 6 dimension scores

Special cases:
- Q7 has "Data not collected digitally" negative option (scores 0 if selected)
- Dual-checkboxes weight "already invested" higher than "planning" (1.0 vs 0.5)

### Results Visualization
- Radar chart shows all 6 dimensions with current vs target
- Built with Recharts (`components/charts/RadarChart.tsx`)
- Target levels default to 100 unless specified in dimension config
- Gap analysis computed as `target - current` for each dimension

### Internationalization
- Primary: Norwegian (`locales/no/common.json`)
- Questions defined in `data/questions.no.ts`
- i18next configured in `lib/i18n.ts`
- Provider wraps app in `components/providers/I18nProvider.tsx`
- English translation planned but not yet implemented

## Database Access

- Every query lives in `lib/db.ts`. API routes call its functions; they do not
  write SQL. That keeps the schema's blast radius to one file.
- `prepare: false` is required — Neon's pooler runs PgBouncer in transaction
  mode, which does not support prepared statements.
- Guards that used to be a read followed by a write (already completed? already
  upgraded?) are now part of the `UPDATE ... WHERE ... RETURNING`, so concurrent
  requests cannot both succeed. A `null` return means the guard rejected it.

## Notable Gotchas

1. **Turbopack**: Build uses `--turbopack` flag in package.json scripts
2. **i18next SSR**: Must use `I18nProvider` client component to avoid hydration mismatches
3. **RadioGroup Warnings**: Ensure all radio groups have default values to avoid controlled/uncontrolled warnings
4. **Derived state**: `state`, `isCompleted`, `hasResults` and `hasExpandedAccess` are computed from timestamps in `toSurveyDocument()`. Never add them as columns — the Firestore schema stored them redundantly and they drifted out of sync with reality.
5. **Question IDs**: Must be stable across versions (used as keys in answers map)
6. **Zustand Selectors**: Use `subscribeWithSelector` middleware for computed getters
7. **Lazy DB connection**: `lib/db.ts` exports `sql` as a Proxy that connects on first query. Do not replace it with a top-level `postgres(...)` call — that breaks `next build` when `DATABASE_URL` is absent.

## Performance Optimizations

- Code splitting via Next.js App Router automatic chunking
- Lazy loading for charts and PDF components
- localStorage caching for partial progress
- Debounced auto-save (currently immediate, consider adding debounce if performance issues)

## Security Notes

- No authentication system (public assessment)
- Survey IDs are cryptographically random 10-char strings (unguessable)
- The browser has no database credentials — every read and write goes through an
  API route, so there are no security rules to get wrong
- Retrieval tokens and magic-link tokens are stored only as salted SHA-256
  hashes; the plaintext is returned to the user exactly once
- Email addresses are stored alongside a SHA-256 `email_hash` used for lookups,
  so the magic-link flow never compares addresses in cleartext

---

*This codebase emphasizes type safety, modular architecture, and clear separation between question types, scoring logic, and visualization. When extending functionality, maintain the established patterns for consistency.*