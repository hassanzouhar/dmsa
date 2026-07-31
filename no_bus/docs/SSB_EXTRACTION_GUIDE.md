# SSB Benchmark Extraction Guide

This guide explains how to extract digital maturity benchmark data from Statistics Norway (SSB) and populate your Firebase database with realistic, sector-specific intelligence.

## Overview

The SSB extraction system consists of three main components:

1. **SSB API Client** (`lib/ssb-api-client.ts`) - Handles API requests with rate limiting
2. **SSB Transformer** (`lib/ssb-transformer.ts`) - Converts SSB stats to benchmark scores + intelligence
3. **Extraction Script** (`script/extract-ssb-benchmarks.ts`) - Orchestrates the full extraction process

## Quick Start

### Prerequisites

```bash
# Install dependencies (if needed)
npm install

# Ensure Firebase Admin SDK is configured
# Set these in .env.local:
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_CLIENT_EMAIL=your-service-account@...
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Basic Extraction

```bash
# Extract all sectors and sizes (takes ~15-20 minutes)
npx tsx script/extract-ssb-benchmarks.ts

# Dry run (preview without uploading)
npx tsx script/extract-ssb-benchmarks.ts --dry-run

# Extract specific sector only
npx tsx script/extract-ssb-benchmarks.ts --sector C

# Extract specific size only
npx tsx script/extract-ssb-benchmarks.ts --size medium

# Save to JSON file instead of Firestore
npx tsx script/extract-ssb-benchmarks.ts --output ./benchmarks.json

# Skip intelligence layers (faster, scoring only)
npx tsx script/extract-ssb-benchmarks.ts --skip-intelligence
```

## What Gets Extracted

### Scoring Data (40+ SSB Tables)

For each of the **6 dimensions**:

| Dimension | Tables | Metrics |
|-----------|--------|---------|
| Digital Strategy | 10974, 10980, 12357, 12769 | E-commerce, automation, security investment |
| Digital Readiness | 10970, 10971, 10966, 10975, 10977 | Connectivity, cloud, social media, websites |
| Human-Centric | 10964, 10965, 12768, 13737, 13738 | ICT skills, specialists, remote work |
| Data Management | 10966, 10980, 14034, 14035, 12769 | Cloud, analytics, data integration, security |
| Automation/AI | 13265, 13271, 12351, 14034 | AI usage, robotics, data analytics |
| Green Digital | 13740, 13739, 12357 | Environmental practices, e-waste, e-invoicing |

### Intelligence Data (10 Strategic Tables)

**Success Patterns:**
- **10967** - Cloud benefits achieved (cost savings, flexibility, scalability)
- **13271** - AI use cases that work (process automation, customer service, analytics)
- **12350** - 3D printing applications (prototyping, spare parts, custom products)

**Challenge Intelligence:**
- **12771** - Cybersecurity incidents (phishing, ransomware, data breaches)
- **13272** - AI adoption barriers (skills gap, cost, uncertainty)
- **10968** - Cloud adoption barriers (security concerns, cost uncertainty)
- **10979** - E-commerce barriers (product fit, cost, complexity)
- **14041** - Public data challenges (access, quality, usability)

### Output Format

For each sector × size combination (23 sectors × 3 sizes = 69 segments):

```javascript
{
  sector: 'C',  // Manufacturing
  companySize: 'medium',

  // Standard benchmark scores
  dimensions: {
    digitalStrategy: {
      score: 65,      // 0-100
      p25: 55,        // 25th percentile
      p50: 65,        // median
      p75: 78,        // 75th percentile
      sampleSize: 450
    },
    // ... 5 more dimensions
  },

  overall: {
    average: 63,
    top25: 75,
    sampleSize: 450
  },

  // Strategic intelligence (NEW!)
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
        maturityLevel: 'emerging'
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
        ],
        overcomePotential: 'high'
      }
    },

    recommendations: [
      {
        dimension: 'automation',
        priority: 'high',
        insight: 'Din sektor har 28% AI-bruk, topp-kvartil på 45%...',
        action: 'Start med AI for prosessautomatisering - 42% av peers hadde suksess',
        challenge: 'Manglende kompetanse (52%) - vurder opplæring',
        successRate: 0.73,
        timeToValue: '6-12 months',
        investment: 'medium'
      }
    ]
  },

  dataSource: 'ssb',
  hasSufficientData: true,
  lastUpdated: '2025-01-15T10:00:00Z',
  ssbTables: ['10974', '10966', '10967', ...] // source tables used
}
```

## Rate Limiting

SSB API limits:
- **30 requests per minute**
- **800,000 cells per query**

The client automatically handles rate limiting:
```typescript
// Automatic rate limit handling
await ssbClient.getTableData('10974');  // Waits if needed

// Check rate limit status
const status = ssbClient.getRateLimitStatus();
console.log(`Used: ${status.used}/${status.limit}, resets in ${status.resetsIn}s`);
```

**Extraction times:**
- Single sector: ~2-3 minutes
- All sectors (23): ~15-20 minutes
- With intelligence: +5-10 minutes

## Data Transformation Logic

### Score Calculation

```
SSB Percentage → Dimension Score (0-100)

Basic Technologies:
- 0-20%   → 20  (Low maturity)
- 21-40%  → 40
- 41-60%  → 60  (Average)
- 61-80%  → 80
- 81-100% → 100 (High maturity)

Advanced Technologies (0-5 scale):
- SSB value / 5 × 100

Dimension Score:
- Weighted average of all questions in dimension
- Sector adjustments: Tech +10%, Traditional -5%
```

### Intelligence Extraction

**Success Patterns:**
1. Extract adoption rates (% using technology)
2. Rank benefits/use cases by percentage
3. Calculate ROI (high if multiple high-impact benefits)
4. Determine maturity level (emerging < 25%, growing 25-50%, etc.)

**Challenge Data:**
1. Extract incident rates or non-adoption rates
2. Rank barriers by percentage
3. Categorize addressability (training vs regulatory)
4. Calculate overcome potential (% addressable barriers)

### Recommendations:**
1. Calculate gap to top quartile (p75)
2. Prioritize by gap size + dimension criticality
3. Link to relevant success patterns
4. Add challenge awareness
5. Estimate ROI, timeline, investment

## Missing Data Handling

### Micro Companies (1-9 employees)
SSB data starts at 10+ employees. For micro segment:
```typescript
// Infer from small company data
microScore = smallCompanyScore * 0.6;
dataSource = 'ssb-inferred';
hasSufficientData = false;
```

### Missing Sectors
If sector data unavailable:
```typescript
// Use national average for that size
fallbackScore = nationalAverageBySize[companySize];
dataSource = 'fallback';
```

### Old Datasets (2017-2019)
```typescript
// Apply growth factor to estimate current values
currentEstimate = oldValue * (1 + 0.025 * yearsSince);  // +2.5% per year
```

## Firestore Upload

Extracted benchmarks are stored in:
```
/benchmarks/{sector}/sizes/{companySize}

Example:
/benchmarks/C/sizes/medium
/benchmarks/J/sizes/large
```

Each document contains the full benchmark data structure shown above.

## Testing & Validation

### 1. Dry Run Test
```bash
# Preview extraction without uploading
npx tsx script/extract-ssb-benchmarks.ts --dry-run --sector C

# Check output
# - Verify scores are 0-100
# - Check intelligence data is populated
# - Validate recommendations are generated
```

### 2. Single Sector Test
```bash
# Extract one sector to JSON
npx tsx script/extract-ssb-benchmarks.ts --sector J --output ./test-benchmark.json

# Inspect JSON file
cat test-benchmark.json | jq '.benchmarks[0]'
```

### 3. Validation Checklist

- [ ] All 6 dimensions have scores
- [ ] Scores are between 0-100
- [ ] p25 < p50 < p75
- [ ] Intelligence patterns populated
- [ ] Recommendations generated (if gaps exist)
- [ ] SSB tables list is accurate
- [ ] Data source correctly labeled
- [ ] Sample sizes reasonable (>50)

## Troubleshooting

### Error: "Rate limit exceeded"
**Cause:** Too many requests in 1 minute
**Fix:** Script automatically waits - be patient

### Error: "Dataset too large (>800k cells)"
**Cause:** Query returns too much data
**Fix:** Add more specific filters in `getTableDataBySegment`

### Error: "Table not found (404)"
**Cause:** Table ID incorrect or discontinued
**Fix:** Check SSB website, update table ID

### Warning: "Failed to extract from table X"
**Cause:** Table structure doesn't match expectations
**Fix:** Check JSON-stat2 format, update `extractDataFromJSONStat`

### Low scores across all dimensions
**Cause:** Possible data extraction bug
**Fix:** Validate `percentageToScore` transformation

## Advanced Usage

### Custom Table Selection

Edit `SSB_TABLE_MAPPING` in `lib/ssb-transformer.ts`:

```typescript
export const SSB_TABLE_MAPPING = {
  scoring: {
    digitalStrategy: ['10974', '10980', 'YOUR_TABLE_ID'],
    // ... add more
  }
};
```

### Custom Intelligence Extraction

Extend `SSBTransformer` class:

```typescript
transformCustomIntelligence(ssbData: any, sector: string, size: string) {
  // Your custom extraction logic
  return {
    // ... custom intelligence data
  };
}
```

### Sector-Specific Adjustments

Add sector logic to `transformDimensionScore`:

```typescript
// Apply sector multipliers
if (sector === 'J') {  // Tech sector
  score = Math.min(100, score * 1.1);  // +10%
} else if (['A', 'B', 'F'].includes(sector)) {  // Traditional industries
  score = Math.max(0, score * 0.95);  // -5%
}
```

## Maintenance

### Regular Updates

Run extraction:
- **Monthly**: Keep benchmarks current
- **After SSB releases**: New data typically quarterly

### Monitoring

Check extraction quality:
```bash
# Count benchmarks in Firestore
npx tsx script/admin-examine-data.js | grep "benchmarks"

# Validate scores are realistic
# Manufacturing (C) should score 50-70
# Tech (J) should score 70-85
# Agriculture (A) should score 40-60
```

### Data Freshness

Update `lastUpdated` timestamp:
```typescript
lastUpdated: new Date().toISOString()
```

Display age in UI:
```typescript
const age = Date.now() - new Date(benchmark.lastUpdated).getTime();
if (age > 90 * 24 * 60 * 60 * 1000) {  // 90 days
  showWarning('Data may be outdated');
}
```

## Next Steps

1. **Run first extraction**: `npx tsx script/extract-ssb-benchmarks.ts --dry-run`
2. **Validate output**: Check JSON structure
3. **Upload to Firestore**: Remove `--dry-run` flag
4. **Integrate with app**: Update `benchmark-service.ts` to use SSB data
5. **Display intelligence**: Add UI components for success patterns and challenges
6. **Monitor usage**: Track which recommendations users act on
7. **Iterate**: Refine transformation logic based on user feedback

## Support

- **SSB API Docs**: https://data.ssb.no/api/pxwebapi/v2/
- **SSB Contact**: statistikkbanken@ssb.no
- **Mapping Document**: `docs/SSB_DIMENSION_MAPPING.md`
- **Code Structure**: `CLAUDE.md`
