# SSB Benchmark System - Quick Start

## What This Does

Extracts digital maturity benchmarks from Statistics Norway (SSB) and populates your Firestore database with **110 pre-computed benchmark documents** covering every possible user lens:

- 1 National aggregate
- 21 Sector-specific benchmarks
- 4 Size-specific benchmarks
- 84 Segment benchmarks (sector × size)

Each benchmark includes:
- **Dimension scores** with percentiles (p25, p50, p75)
- **Success patterns** (what works for peers: cloud benefits, AI use cases)
- **Common challenges** (cybersecurity incidents, AI barriers)
- **Pre-computed intelligence** for instant recommendations

## One-Time Setup

```bash
# 1. Ensure Firebase Admin SDK credentials in .env.local
#    (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)

# 2. Test that script can run
npx tsx script/generate-all-benchmarks.ts --dry-run
```

## Generate & Upload All Benchmarks

### Full Generation (Monthly - when SSB updates)

```bash
# Generate all 110 benchmarks and upload to Firestore
npx tsx script/generate-all-benchmarks.ts

# Time: ~15-20 minutes
# Storage: ~55MB (110 docs × ~500KB each)
# Rate limit: Automatic (30/min SSB API limit)
```

### Preview First (Recommended)

```bash
# Dry run - see what will be generated
npx tsx script/generate-all-benchmarks.ts --dry-run

# Save to JSON for inspection
npx tsx script/generate-all-benchmarks.ts --output ./benchmarks.json

# Then upload when confident
npx tsx script/generate-all-benchmarks.ts
```

## What Gets Created in Firestore

```
/benchmarks/
  ├── national/data/all
  │
  ├── by-sector/data/
  │   ├── A  (Agriculture)
  │   ├── C  (Manufacturing)
  │   ├── J  (Tech/IT)
  │   └── ... (21 sectors)
  │
  ├── by-size/data/
  │   ├── micro
  │   ├── small
  │   ├── medium
  │   └── large
  │
  └── segments/data/
      ├── C_small     (Manufacturing SMB)
      ├── C_medium    (Manufacturing medium)
      ├── J_large     (Tech enterprise)
      └── ... (84 total)
```

## Using in Your Application

```typescript
// Example: Get benchmark for a user
const { sector, companySize } = userProfile;

// Try exact segment match first
const benchmark = await db
  .collection('benchmarks')
  .doc('segments')
  .collection('data')
  .doc(`${sector}_${companySize}`)
  .get();

// Fallback to sector-only if needed
if (!benchmark.exists || !benchmark.data().hasSufficientData) {
  const sectorBenchmark = await db
    .collection('benchmarks')
    .doc('by-sector')
    .collection('data')
    .doc(sector)
    .get();
}

// Intelligence is already pre-computed!
const intelligence = benchmark.data().intelligence;
const cloudBenefits = intelligence.successPatterns.cloudServices;
const cybersecurityChallenges = intelligence.commonChallenges.cybersecurity;
```

## Benchmark Document Structure

```javascript
{
  type: 'segment',
  id: 'C_medium',
  sector: 'C',
  sectorName: 'Industri',
  companySize: 'medium',

  // Dimension scores (0-100)
  dimensions: {
    digitalStrategy: { score: 65, p25: 55, p50: 65, p75: 78, sampleSize: 450 },
    digitalReadiness: { score: 72, ... },
    // ... 4 more dimensions
  },

  overall: {
    average: 63,
    top25: 75,
    sampleSize: 450
  },

  // Strategic intelligence (pre-computed!)
  intelligence: {
    successPatterns: {
      cloudServices: {
        adoptionRate: 72,
        topBenefits: [
          { benefit: 'Kostnadsreduksjon', percentage: 65, rank: 1 },
          { benefit: 'Fleksibilitet', percentage: 58, rank: 2 }
        ],
        roi: 'high'
      },
      aiApplications: {
        adoptionRate: 28,
        topUseCases: [
          { purpose: 'Automatisering av prosesser', percentage: 42, dimension: 'automation' }
        ],
        maturityLevel: 'growing'
      }
    },

    commonChallenges: {
      cybersecurity: {
        incidentRate: 23,
        topIncidents: [
          { type: 'Phishing/social engineering', percentage: 58, severity: 'medium' }
        ],
        preparednessGap: 0.35
      },
      aiAdoption: {
        nonAdopterRate: 72,
        topBarriers: [
          { barrier: 'Manglende kompetanse', percentage: 52, addressable: true }
        ]
      }
    },

    recommendations: [] // Will be computed at runtime based on user scores
  },

  dataSource: 'ssb',
  hasSufficientData: true,
  lastUpdated: '2025-10-06T...',
  ssbTables: ['10974', '10966', ...]
}
```

## Maintenance Schedule

### Monthly (Recommended)
```bash
# SSB updates data quarterly, but run monthly to stay current
npx tsx script/generate-all-benchmarks.ts
```

### After Major SSB Release
```bash
# When SSB adds new tables or updates methodology
# 1. Update SSB_TABLE_MAPPING in lib/ssb-transformer.ts
# 2. Run full regeneration
npx tsx script/generate-all-benchmarks.ts
```

### Incremental Updates (Future)
```bash
# Update only intelligence layers (faster)
npx tsx script/generate-all-benchmarks.ts --intelligence-only
```

## Troubleshooting

### "Rate limit exceeded"
**Normal behavior** - script automatically waits. Full extraction takes ~15-20 minutes due to SSB's 30 req/min limit.

### "Firebase permission denied"
Check `.env.local` has correct credentials:
```bash
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Scores look unrealistic
Currently using **mock data transformation**. To use real SSB data:
1. Implement `extractDataFromJSONStat()` in `lib/ssb-transformer.ts:238`
2. Parse JSON-stat2 format properly
3. Filter by sector/size within SSB response

### Want to test without uploading
```bash
# Always safe to run:
npx tsx script/generate-all-benchmarks.ts --dry-run --output ./test.json

# Inspect output:
cat test-overview.json | jq '.metadata'
```

## Files Reference

- **`script/generate-all-benchmarks.ts`** - Main extraction script
- **`lib/ssb-api-client.ts`** - SSB API wrapper with rate limiting
- **`lib/ssb-transformer.ts`** - Transform SSB data → benchmarks
- **`docs/BENCHMARK_SCHEMA.md`** - Complete schema documentation
- **`docs/SSB_DIMENSION_MAPPING.md`** - Question → SSB table mapping
- **`docs/SSB_EXTRACTION_GUIDE.md`** - Detailed extraction guide

## Next Steps

1. ✅ **Run generation**: `npx tsx script/generate-all-benchmarks.ts`
2. **Verify Firestore**: Check that benchmarks collection was created
3. **Update app code**: Use new benchmark paths in your application
4. **Test user flow**: Ensure benchmarks load for different user profiles
5. **Schedule monthly**: Add to cron/CI to keep data fresh

## Pro Tips

💡 **Start with one sector** to test:
```bash
# Test with just Manufacturing
npx tsx script/extract-ssb-benchmarks.ts --sector C --output ./test-manufacturing.json
```

💡 **Inspect before uploading**:
```bash
npx tsx script/generate-all-benchmarks.ts --output ./benchmarks.json
cat benchmarks-overview.json | jq '.structure[] | select(.type == "segment") | {id, sector, size, score: .overallScore}'
```

💡 **Save historical snapshots**:
```bash
# Monthly backup
npx tsx script/generate-all-benchmarks.ts --output ./backups/benchmarks-2025-10.json
```

---

## Summary

**One command** generates 110 pre-computed benchmarks with strategic intelligence:

```bash
npx tsx script/generate-all-benchmarks.ts
```

Then your app has **instant access** to peer comparisons, success patterns, and challenges for any user profile. No runtime aggregation needed! 🚀
