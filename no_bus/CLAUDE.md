# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Norwegian digital maturity assessment platform that evaluates companies' digital transformation progress across six dimensions. The system collects survey responses, calculates scores, and generates benchmark comparisons against industry peers based on sector and company size.

## Core Architecture

### Assessment System

The assessment is built around a strongly-typed question-answer-scoring pipeline:

1. **Question Types** (`entities/questions.no.ts`): Seven distinct question types
   - `checkboxes`: Multi-select with weighted options
   - `dual-checkboxes`: Two independent boolean choices
   - `scale-0-5`: Numeric rating (0-5)
   - `tri-state`: Yes/Partial/No responses
   - `table-dual-checkboxes`: Matrix of dual checkbox rows
   - `scale-table`: Multiple scale questions in table format
   - `tri-state-table`: Multiple tri-state questions in table format

2. **Scoring Engine** (`scoring.ts`): Each question type has a dedicated scorer that:
   - Normalizes all scores to 0-10 scale at question level
   - Applies weights to options/columns
   - Validates completeness for required questions
   - Aggregates to dimension scores (0-100 scale)

3. **Dimension Architecture**: Six weighted dimensions
   - Digital Business Strategy (digitalStrategy)
   - Digital Readiness (digitalReadiness)
   - Human-Centric Digitalization (humanCentric)
   - Data Management & Connectivity (dataManagement)
   - Automation & AI (automation)
   - Green Digitalization (greenDigitalization)

### Benchmark System

**Data Sources** (`benchmark/BenchmarkSection.tsx`, `benchmark/BenchmarkChart.tsx`):
- Primary: Exact sector + size match
- Fallback hierarchy: sector-only → size-only → all-companies
- Minimum 15 samples for reliable benchmarks
- Uses Statistics Norway (SSB) API for sector/region data

**Comparison Metrics**:
- Overall maturity score vs industry average
- Dimension-level gaps and percentile rankings
- Performance levels: top_decile, top_quartile, above_average, average, below_average
- Top 25% threshold for aspirational targeting

### Data Entities

**Company Metadata** (`entities/company-options.ts`, `entities/nace-sectors.ts`, `entities/norwegian-counties.ts`):
- NACE sector classification (23 sectors A-V)
- Company sizes: micro (1-9), small (10-49), medium (50-249), large (250+)
- Norwegian county codes (16 counties)

**SSB API Integration** (`SSB_APIdoc.md`):
- Statistics Norway public data API
- Rate limit: 30 requests/minute per IP
- Max 800,000 data cells per query
- Uses PxWebApi 2 with json-stat2 format

## Key Functions

### Scoring (`scoring.ts`)

- `scoreQuestion(question, answer)` → 0-10 normalized score
- `isAnswerComplete(question, answer)` → boolean validation
- `computeDimensionScores(spec, answers)` → DimensionScore[] (0-100 scale)
- `computeOverallScore(dimensionScores)` → weighted average (0-100)
- `validateAnswers(spec, answers)` → missing required question IDs

### Validation (`ValidationFeedback.tsx`)

Component provides contextual feedback for incomplete required questions with Norwegian messages.

## Scoring Logic Details

**Normalization Pipeline**:
1. Question-level: Each question scorer returns 0-10
2. Dimension-level: Weighted average of questions → converted to 0-100
3. Overall: Weighted average of dimensions → 0-100

**Important Weighting**:
- Questions have individual weights (default: 1)
- Dimensions have weights (default: 1)
- Options in checkboxes can have custom weights
- Negative weights possible (e.g., "Data not collected digitally" = -1 weight)

**Table Question Scoring**:
- `table-dual-checkboxes`: Averages across all rows
- `scale-table`: Averages scale values across rows
- `tri-state-table`: Converts yes=1, partial=0.5, no=0, then averages

## Development Notes

### Testing Scoring Changes

When modifying scoring logic:
1. Test with all 7 question types
2. Verify normalization (question → 0-10, dimension → 0-100)
3. Check weight application at both question and dimension levels
4. Validate required vs optional question handling
5. Test table questions with partial row completion

### Adding New Question Types

1. Define TypeScript type in `@/types/assessment`
2. Add scorer function in `scoring.ts`
3. Add completion validator in `isAnswerComplete()`
4. Update `ValidationFeedback.tsx` for user messaging
5. Create UI component for question rendering

### Benchmark Data Requirements

- Store survey results with `sector`, `companySize`, `dimensionScores`, `overallScore`
- Minimum 15 samples per segment for reliable benchmarks
- Calculate percentiles: p25, p50, p75, p90 for each dimension and overall
- Flag fallback data sources in UI with transparency

### Norwegian Language

All user-facing strings are in Norwegian:
- Question labels and descriptions
- Validation messages
- Benchmark insights
- Dimension names

## Common Tasks

Since this repository has no package.json or build configuration files visible, development commands are not documented. The codebase appears to be a collection of TypeScript/React components and utilities that would be integrated into a larger Next.js or React application.

## Key Constraints

- **Score Normalization**: Always maintain 0-10 at question level, 0-100 at dimension/overall
- **Required Questions**: Default is `required: true` unless explicitly set to false
- **Benchmark Thresholds**: 15 samples minimum for reliable stats
- **SSB API Limits**: 30 req/min, 800k cells per query
- **Type Safety**: Strict TypeScript with discriminated unions for question/answer types
