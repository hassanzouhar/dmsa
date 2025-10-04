# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Digital Maturity Assessment (DMSA)** - A comprehensive self-assessment platform for SME digital transformation readiness based on the EU/JRC framework. The app delivers an 11-question assessment across 6 digital maturity dimensions with real-time scoring, visualization, and Firebase-backed persistence.

**Production**: https://digital-modenhet.rastla.us

## Development Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Build for production with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm test             # Run Jest unit tests
npm run test:watch   # Watch mode for tests
npm run test:e2e     # Run Playwright E2E tests

# Firebase (from scripts/)
node scripts/test-firebase-connection.js    # Test Firebase connectivity
node scripts/create-test-survey.js          # Generate test survey data
node scripts/test-api.js                    # Test API endpoints
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 App Router + TypeScript (strict mode)
- **State**: Zustand with subscribeWithSelector middleware
- **UI**: shadcn/ui + TailwindCSS 4 + Radix UI primitives
- **Backend**: Firebase (Storage for survey JSON, Firestore for metadata)
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
5. Results saved to Firebase Storage as JSON with unique 10-char ID
6. Metadata indexed in Firestore for retrieval

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

lib/
├── scoring.ts                # Question/dimension scoring algorithms
├── survey-api.ts             # Survey session & Firebase integration
├── firebase.ts               # Firebase client config
├── firebase-admin.ts         # Server-side Firebase Admin SDK
└── i18n.ts                   # i18next configuration

store/
└── assessment.ts             # Zustand assessment state (answers, progress, session)

types/
├── assessment.ts             # Question/Answer/Dimension type definitions
└── firestore-schema.ts       # Firebase data structures

components/assessment/
├── QuestionRenderer.tsx      # Type-based question component dispatcher
├── CheckboxGroup.tsx         # Multi-select checkboxes
├── DualCheckbox.tsx          # Independent dual checkboxes (invested/planning)
├── LikertScale05.tsx         # 0-5 scale selector
├── TriState.tsx              # Yes/Partial/No selector
└── *Table.tsx                # Table variants for batch input
```

## Firebase Integration

### Environment Variables
Required in `.env.local` and Vercel:

**Client-side (NEXT_PUBLIC_* prefix)**:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

**Server-side (Admin SDK - required for API routes)**:
```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
DMSA_TOKEN_SALT=
```

**IMPORTANT**: Both client and server-side variables must be configured in Vercel production. Use `scripts/setup-vercel-env.sh` or manually add via `vercel env add`.

### Data Storage Pattern
- **Storage**: Survey JSON files at `/surveys/{uniqueId}.json`
- **Firestore**: Metadata collection `surveys` with survey IDs, timestamps, scores
- **No Authentication**: Public access with ID-based retrieval (survey IDs are unguessable 10-char alphanumeric)

### Storage Rules
Configured in `storage.rules` - allows read/write to `/surveys/` and `/test/` paths.

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

### Testing Firebase Integration
```bash
# Test connection and environment
node scripts/test-firebase-connection.js

# Create sample survey
node scripts/create-test-survey.js

# Test production API
node scripts/test-api.js
```

### Deploying to Production
```bash
# Deploy to Vercel (requires Vercel CLI)
vercel --prod

# Deploy Firebase rules only
firebase deploy --only storage
firebase deploy --only firestore
```

### Type Checking
TypeScript runs in strict mode. Common type locations:
- Question/Answer types: `types/assessment.ts`
- Store types: `store/assessment.ts` (inline with Zustand create)
- API types: `types/firestore-schema.ts`

Path aliases use `@/*` for root imports (configured in `tsconfig.json`).

## Key Implementation Details

### State Persistence
- **Answers**: Auto-saved to localStorage on change via `lib/persistence.ts`
- **Session**: Survey session stored in Zustand + localStorage
- **Firebase**: Final results saved on completion to Storage + Firestore

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

## Firebase Admin SDK Usage

When working with server-side Firebase operations (API routes):
- Use `lib/firebase-admin.ts` for Admin SDK initialization
- Admin SDK has elevated permissions compared to client SDK
- Used in `app/api/surveys/` routes for server-side operations
- Service account credentials managed via environment variables

## Notable Gotchas

1. **Turbopack**: Build uses `--turbopack` flag in package.json scripts
2. **i18next SSR**: Must use `I18nProvider` client component to avoid hydration mismatches
3. **RadioGroup Warnings**: Ensure all radio groups have default values to avoid controlled/uncontrolled warnings
4. **Firebase Storage URLs**: Use `getDownloadURL()` not direct bucket paths
5. **Question IDs**: Must be stable across versions (used as keys in answers map)
6. **Zustand Selectors**: Use `subscribeWithSelector` middleware for computed getters
7. **Firebase Admin SDK**: API routes (`/api/surveys`) require server-side env vars (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). If surveys fail to create with 500 error, check Vercel env variables include both client and admin credentials.

## Performance Optimizations

- Code splitting via Next.js App Router automatic chunking
- Lazy loading for charts and PDF components
- localStorage caching for partial progress
- Debounced auto-save (currently immediate, consider adding debounce if performance issues)

## Security Notes

- No authentication system (public assessment)
- Survey IDs are cryptographically random 10-char strings (unguessable)
- Firebase rules allow public read/write to `/surveys/` path
- Environment variables must be prefixed `NEXT_PUBLIC_` for client access
- No sensitive data collected (optional company details only)

---

*This codebase emphasizes type safety, modular architecture, and clear separation between question types, scoring logic, and visualization. When extending functionality, maintain the established patterns for consistency.*