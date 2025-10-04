# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Digital Maturity Assessment (DMA) Tool

This is a Next.js 15 application for assessing digital maturity of SMEs based on the EU/JRC Digital Maturity Assessment framework. The application is client-side only with Firebase integration for data persistence and analytics.

## Development Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing (when configured)
npm test             # Run Jest tests
npm run test:e2e     # Run Playwright E2E tests
```

## Tech Stack & Architecture

- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: shadcn/ui components + TailwindCSS
- **State**: Zustand for client-side state management
- **Database**: Firebase Firestore for survey data persistence
- **Analytics**: Firebase Analytics for tracking
- **Charts**: Recharts for radar visualizations
- **Validation**: Zod for runtime type validation
- **Internationalization**: i18next + react-i18next (Norwegian default)
- **PDF Export**: @react-pdf/renderer for results export

## Core Architecture

### Assessment Flow
1. **Assessment Page** (`app/assessment/page.tsx`) - Multi-step questionnaire with 6 dimensions
2. **Results Page** (`app/results/page.tsx`) - Radar chart visualization and scoring breakdown
3. **Analytics Page** (`app/analytics/page.tsx`) - Aggregate analytics dashboard
4. **Retrieve Page** (`app/retrieve/page.tsx`) - Survey data retrieval by ID

### State Management
- **Assessment Store** (`lib/survey-service.ts`) - Handles survey responses and persistence
- **Firebase Integration** (`lib/firebase.ts`) - Firestore configuration and connection
- **Persistence Layer** (`lib/persistence.ts`) - Local storage utilities

### Scoring System
- **Core Scoring** (`lib/scoring.ts`) - Assessment scoring algorithms
- **Maturity Classification** (`lib/maturity.ts`) - Digital maturity level classification
- **Benchmark Service** (`lib/benchmark-service.ts`) - Comparative analytics

### Question Types & Components
- `checkboxes` - Multi-select with weighted options (`components/assessment/CheckboxGroup.tsx`)
- `dual-checkboxes` - Two independent boolean checks (`components/assessment/DualCheckbox.tsx`)
- `scale-0-5` - 0-5 discrete scale selector (`components/assessment/LikertScale05.tsx`)
- `tri-state` - Yes/Partial/No responses (`components/assessment/TriState.tsx`)
- Table variants for each question type in `components/assessment/`

### Data Structure
- **6 Dimensions**: Digital Strategy, Digital Readiness, Human-Centric, Data Management, AI/Automation, Green Digitalization
- **11 Questions** total across dimensions
- **Scoring**: All normalized to 0-1, then scaled to 0-100 for display
- **Export**: JSON format with full assessment data and scores

## Firebase Configuration

The app uses Firebase for:
- **Firestore**: Survey response storage (`firestore.rules`, `firestore.indexes.json`)
- **Analytics**: User interaction tracking
- **Storage**: File uploads (configured in `storage.rules`)

Firebase config in `lib/firebase.ts` and project settings in `.firebaserc`.

## Component Architecture

### UI Components (`components/ui/`)
- shadcn/ui auto-generated components
- Custom extensions in `components/ui-custom/`

### Assessment Components (`components/assessment/`)
- Question renderers for each question type
- Validation feedback and navigation
- Table-based question layouts

### Charts (`components/charts/`)
- Radar chart visualization (`RadarChart.tsx`)
- Dimension gauges (`DimensionGauge.tsx`, `DimensionGaugesGrid.tsx`)

### Specialized Components
- `TrackedPDFDownloadButton.tsx` - PDF export with analytics tracking
- `BenchmarkSection.tsx` - Comparative analysis display
- `ExtendedResultsModal.tsx` - Detailed results overlay

## Key Libraries & Patterns

### State Management
Uses Zustand for assessment state with Firestore persistence. State is automatically synchronized between local storage and Firebase.

### Internationalization
- Default language: Norwegian
- Translation files in `locales/` directory
- Language switching via `components/ui-custom/LanguageSwitcher.tsx`

### PDF Generation
Uses @react-pdf/renderer for generating assessment reports with charts and detailed scoring breakdowns.

## Development Notes

- All scoring algorithms are deterministic and based on official EU/JRC DMA specification
- Components use TypeScript strict mode with Zod validation
- Assessment data is client-side first with optional Firebase sync
- Charts require "use client" directive for Recharts compatibility
- shadcn/ui components are customizable and stored in `components/ui/`

## Testing

Testing infrastructure includes:
- Jest + React Testing Library for unit/component tests
- Playwright for E2E testing
- Focus on scoring algorithm validation and assessment flow