# Benchmark Data Schema

## Overview

Benchmarks are pre-computed and stored in Firestore for fast retrieval. Each benchmark aggregates SSB data and provides comparison points for user assessments.

## Firestore Structure

```
/benchmarks/
  ├── national/              # National aggregates (all companies)
  │   └── all
  │
  ├── by-sector/            # Sector-specific (all sizes)
  │   ├── A                 # Agriculture
  │   ├── C                 # Manufacturing
  │   ├── J                 # Tech/IT
  │   └── ...
  │
  ├── by-size/              # Size-specific (all sectors)
  │   ├── micro
  │   ├── small
  │   ├── medium
  │   └── large
  │
  ├── by-region/            # Region-specific (all sectors/sizes)
  │   ├── NO-03             # Oslo
  │   ├── NO-11             # Rogaland
  │   └── ...
  │
  └── segments/             # Sector × Size combinations (most specific)
      ├── C_small           # Manufacturing SMB
      ├── C_medium          # Manufacturing medium
      ├── C_large           # Manufacturing enterprise
      ├── J_small           # Tech SMB
      └── ...               # (23 sectors × 4 sizes = 92 segments)
```

## Document Schema

Each benchmark document contains:

```typescript
{
  // Identifiers
  id: string;                    // e.g., "C_medium", "J", "national"
  type: 'national' | 'sector' | 'size' | 'region' | 'segment';

  // Filters (for segment type)
  sector?: string;               // NACE code (A-V)
  sectorName?: string;           // "Industri", "Informasjon og kommunikasjon"
  companySize?: 'micro' | 'small' | 'medium' | 'large';
  region?: string;               // "NO-03" (Oslo)

  // Dimension scores (0-100 scale)
  dimensions: {
    digitalStrategy: {
      average: number;           // Mean score
      p25: number;               // 25th percentile
      p50: number;               // Median (50th percentile)
      p75: number;               // 75th percentile (top quartile)
      p90: number;               // 90th percentile (top decile)
      min: number;               // Minimum observed
      max: number;               // Maximum observed
      stdDev: number;            // Standard deviation
      sampleSize: number;        // N companies
    },
    digitalReadiness: { ... },
    humanCentric: { ... },
    dataManagement: { ... },
    automation: { ... },
    greenDigitalization: { ... }
  },

  // Overall aggregate
  overall: {
    average: number,
    p25: number,
    p50: number,
    p75: number,
    p90: number,
    min: number,
    max: number,
    stdDev: number,
    sampleSize: number
  },

  // Strategic Intelligence (from SSB benefits/challenges tables)
  intelligence: {

    // Success patterns (what works)
    successPatterns: {
      cloudServices: {
        adoptionRate: number;              // % using cloud
        topBenefits: Array<{
          benefit: string;                 // "Kostnadsreduksjon"
          percentage: number;              // % reporting this benefit
          rank: number;                    // 1, 2, 3...
          impact: 'high' | 'medium' | 'low';
        }>;
        roi: 'high' | 'medium' | 'low';
        recommendedFor: string[];          // Dimension IDs where cloud helps
      },

      aiApplications: {
        adoptionRate: number;
        topUseCases: Array<{
          purpose: string;                 // "Automatisering av prosesser"
          percentage: number;
          dimension: string;               // Links to assessment dimension
          businessValue: 'high' | 'medium' | 'low';
        }>;
        maturityLevel: 'emerging' | 'growing' | 'established' | 'advanced';
        avgTimeToValue: string;            // "6-12 months"
      },

      printing3D?: {
        adoptionRate: number;
        topApplications: Array<{
          purpose: string;
          percentage: number;
        }>;
        relevanceScore: number;            // 0-1 (how relevant to this segment)
      },

      // Add more as SSB data becomes available
      eCommerce?: { ... },
      socialMedia?: { ... },
      remoteWork?: { ... }
    },

    // Common challenges (what to watch out for)
    commonChallenges: {
      cybersecurity: {
        incidentRate: number;              // % experiencing incidents
        topThreats: Array<{
          type: string;                    // "Phishing/social engineering"
          percentage: number;              // % affected
          severity: 'high' | 'medium' | 'low';
          preventable: boolean;            // Can be mitigated?
          mitigation: string;              // "Implementer ansatteopplæring"
        }>;
        preparednessGap: number;           // 0-1 (gap between risk and readiness)
      },

      aiAdoption: {
        nonAdopterRate: number;            // % NOT using AI
        topBarriers: Array<{
          barrier: string;                 // "Manglende kompetanse"
          percentage: number;
          addressable: boolean;            // Can be overcome?
          solution: string;                // "Hire AI consultant"
          estimatedCost: 'low' | 'medium' | 'high';
        }>;
        overcomePotential: 'high' | 'medium' | 'low';
      },

      cloudAdoption: {
        nonAdopterRate: number;
        topBarriers: Array<{
          barrier: string;
          percentage: number;
          mitigation: string;
        }>;
      },

      eCommerce?: {
        nonAdopterRate: number;
        topBarriers: Array<{
          barrier: string;
          percentage: number;
          applicability: number;           // 0-1 (is this barrier relevant?)
        }>;
      }
    },

    // Pre-generated recommendations (dimension-specific)
    recommendationTemplates: Array<{
      dimension: string;                   // 'automation', 'digitalReadiness'
      priority: 'high' | 'medium' | 'low';

      // Score-based triggers
      triggers: {
        minGapToP75: number;               // Recommend if gap > this
        minGapToP50: number;
      },

      // Insight template (interpolate with user data)
      insightTemplate: string;
      // "Din sektor har {p50}% gjennomsnitt, topp-kvartil på {p75}%.
      //  Du scorer {userScore}%, {gap} poeng under topp-kvartil."

      // Action guidance
      action: {
        title: string;                     // "Implementer cloud services"
        description: string;
        successRate: number;               // 0-1
        timeToValue: string;               // "1-3 months"
        investment: 'low' | 'medium' | 'high';
        estimatedCost: string;             // "< 50k NOK"
        steps: string[];                   // ["1. Start with email", "2. Add file storage"]
      },

      // Challenge awareness
      challenge: {
        description: string;
        frequency: number;                 // % encountering this
        mitigation: string;
      },

      // Success metrics
      successMetrics: {
        adoptionRate: number;              // % of peers doing this
        satisfactionRate: number;          // % reporting positive outcome
        averageROI: string;                // "15-20% cost savings"
      }
    }>
  },

  // Metadata
  dataSource: 'ssb' | 'ssb-inferred' | 'user-data' | 'combined';
  ssbTables: string[];                     // Source table IDs
  hasSufficientData: boolean;              // >= 15 samples for reliability
  lastUpdated: string;                     // ISO timestamp
  extractedAt: string;                     // When SSB data was pulled
  version: string;                         // Schema version (for migrations)
}
```

## Benchmark Hierarchy & Fallbacks

When looking up benchmarks for a user (e.g., sector=C, size=medium, region=NO-03):

1. **Most Specific**: `/benchmarks/segments/C_medium` ✅ Best match
2. **Sector Only**: `/benchmarks/by-sector/C` (if segment has low N)
3. **Size Only**: `/benchmarks/by-size/medium` (if sector unavailable)
4. **Region**: `/benchmarks/by-region/NO-03` (regional patterns)
5. **National**: `/benchmarks/national/all` (ultimate fallback)

Mark fallback source in response:
```typescript
dataSource: 'segment',     // Exact match
dataSource: 'sector',      // Sector fallback
dataSource: 'size',        // Size fallback
dataSource: 'national'     // National fallback
```

## Storage Optimization

### Pre-compute Everything
- Extract once per month (SSB updates quarterly)
- All 92+ benchmark documents generated in one batch
- ~500KB per document × 92 = ~46MB total (very affordable in Firestore)

### Index for Fast Queries
```javascript
// No queries needed! Direct document reads:
db.collection('benchmarks').doc('segments').collection('data').doc('C_medium').get()
db.collection('benchmarks').doc('by-sector').collection('data').doc('C').get()
```

## Intelligence Data Considerations

### What to Store
✅ **Store**: SSB-derived intelligence (changes slowly)
- Success patterns from benefits tables (10967, 13271, 12350)
- Challenge patterns from barriers tables (12771, 13272, 10968, 10979)
- Pre-computed recommendation templates

❌ **Don't Store**: User-specific calculations (computed at runtime)
- User's specific gap to benchmarks
- Personalized priority ranking
- User's current scores

### Why Pre-compute Intelligence?
1. **Performance**: Instant page loads (no computation)
2. **Consistency**: All users see same peer insights
3. **SSB Rate Limits**: Fetch once, serve millions
4. **Simplicity**: No complex queries or aggregations at runtime

## Extraction Strategy

### Full Extraction (Monthly)
```bash
npx tsx script/extract-ssb-benchmarks.ts --full
```

Generates:
- 1 national benchmark
- 23 sector benchmarks
- 4 size benchmarks
- 16 region benchmarks (optional, if SSB has regional data)
- 92 segment benchmarks (23 sectors × 4 sizes)

**Total**: ~136 documents
**Time**: ~20-30 minutes (SSB rate limit: 30/min)
**Storage**: ~68MB (500KB × 136)

### Incremental Update (Weekly)
```bash
npx tsx script/extract-ssb-benchmarks.ts --intelligence-only
```

Only updates intelligence layers (success patterns, challenges)
**Time**: ~5 minutes
**Updates**: Just the intelligence nested objects

### Sector-Specific Update (As Needed)
```bash
npx tsx script/extract-ssb-benchmarks.ts --sector C
```

Updates only Manufacturing sector and its segments

## Usage in Application

```typescript
// benchmark-service.ts
async function getBenchmarkForUser(user: UserProfile) {
  const { sector, companySize, region } = user;

  // Try segment first (most specific)
  let benchmark = await db
    .collection('benchmarks')
    .doc('segments')
    .collection('data')
    .doc(`${sector}_${companySize}`)
    .get();

  if (benchmark.exists && benchmark.data().hasSufficientData) {
    return { ...benchmark.data(), matchType: 'exact' };
  }

  // Fallback to sector
  benchmark = await db
    .collection('benchmarks')
    .doc('by-sector')
    .collection('data')
    .doc(sector)
    .get();

  if (benchmark.exists) {
    return { ...benchmark.data(), matchType: 'sector' };
  }

  // Fallback to national
  benchmark = await db
    .collection('benchmarks')
    .doc('national')
    .collection('data')
    .doc('all')
    .get();

  return { ...benchmark.data(), matchType: 'national' };
}

// Generate user-specific recommendations at runtime
function generateUserRecommendations(
  userScores: Record<string, number>,
  benchmark: BenchmarkData
) {
  const recommendations = [];

  for (const template of benchmark.intelligence.recommendationTemplates) {
    const gap = benchmark.dimensions[template.dimension].p75 - userScores[template.dimension];

    if (gap < template.triggers.minGapToP75) continue;

    // Interpolate template with actual data
    const insight = template.insightTemplate
      .replace('{p50}', benchmark.dimensions[template.dimension].p50)
      .replace('{p75}', benchmark.dimensions[template.dimension].p75)
      .replace('{userScore}', userScores[template.dimension])
      .replace('{gap}', gap);

    recommendations.push({
      ...template,
      insight,
      actualGap: gap
    });
  }

  return recommendations.sort((a, b) => b.actualGap - a.actualGap);
}
```

## Migration Path

### Phase 1: Add to Existing Structure (Backward Compatible)
Keep current simple structure, add intelligence as optional field:

```javascript
// Current (seed-firestore.js)
{
  dimensions: { digitalStrategy: { mean, p25, p50, p75 } },
  updatedAt: Timestamp
}

// Enhanced (SSB extraction)
{
  dimensions: { digitalStrategy: { average, p25, p50, p75, p90, min, max, stdDev, sampleSize } },
  overall: { average, p25, p50, p75, p90 },
  intelligence: { ... },  // NEW!
  dataSource: 'ssb',
  ssbTables: [...],
  lastUpdated: '2025-10-06T...'
}
```

### Phase 2: Expand Hierarchy
Add new collection paths while keeping `/benchmarks/{sector}/sizes/{size}`:

```
/benchmarks/
  ├── {sector}/sizes/{size}     # Keep existing (backward compat)
  └── v2/                        # New structure
      ├── national/
      ├── by-sector/
      ├── by-size/
      └── segments/
```

### Phase 3: Migrate Fully
Update application code to use new structure, deprecate old paths.

## Next Steps

1. **Update extraction script** to generate all benchmark lenses
2. **Add intelligence extraction** from benefits/challenges tables
3. **Implement fallback logic** in benchmark service
4. **Create migration script** to populate all 136 documents
5. **Add caching layer** (optional) for frequently accessed benchmarks
