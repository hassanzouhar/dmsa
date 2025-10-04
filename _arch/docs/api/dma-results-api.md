# Digital Maturity Assessment API - Results Endpoint

## Overview

The DMA Results API provides programmatic access to assessment data with support for time series snapshots, benchmark comparisons, and flexible response formats.

**Base URL:** `/api/dma/results`

## Authentication

Currently no authentication is required, but access is limited by the respondent ID which serves as a natural access control.

## Endpoints

### GET /api/dma/results

Retrieve a single assessment result by respondent ID.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `respondentId` | string | Yes | 10-character alphanumeric survey ID |
| `snapshot` | string | No | Time series snapshot: `T0`, `T1`, or `T2` |
| `includeBenchmark` | boolean | No | Include benchmark comparison (default: `true`) |
| `format` | string | No | Response format: `json` or `summary` (default: `json`) |

#### Examples

```bash
# Get basic assessment results
GET /api/dma/results?respondentId=30117a12cc

# Get specific time series snapshot with benchmarks
GET /api/dma/results?respondentId=30117a12cc&snapshot=T1&includeBenchmark=true

# Get summary format (lightweight response)
GET /api/dma/results?respondentId=30117a12cc&format=summary
```

#### Response Format

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "survey": {
      "id": "30117a12cc",
      "version": "1.0.0",
      "language": "no",
      "timestamp": "2024-12-04T01:03:35Z",
      "scores": {
        "overall": 73,
        "dimensions": {
          "digitalBusinessStrategy": { "score": 78, "target": 85, "gap": 7 },
          "digitalReadiness": { "score": 71, "target": 80, "gap": 9 },
          // ... other dimensions
        },
        "maturityClassification": {
          "level": 3,
          "label": "Digital Adopter",
          "band": "intermediate"
        }
      },
      "userDetails": {
        "email": "test@example.com",
        "companyName": "Test Company AS",
        "sector": "manufacturing",
        "companySize": "medium",
        "region": "europe"
      },
      "answers": { /* ... */ }
    },
    "benchmark": {
      "overall": {
        "userScore": 73,
        "benchmark": { /* benchmark data */ },
        "percentile": 65,
        "performanceLevel": "above_average",
        "gap": 8,
        "gapToTop25": 3,
        "message": "Above average performance. You're ahead of most organizations."
      },
      "dimensions": { /* dimension-specific comparisons */ },
      "insights": {
        "strongest": { "dimension": "dataManagement", /* ... */ },
        "weakest": { "dimension": "automationAndAI", /* ... */ }
      },
      "summary": {
        "aboveAverageCount": 4,
        "belowAverageCount": 2,
        "topQuartileCount": 2
      }
    },
    "meta": {
      "respondentId": "30117a12cc",
      "snapshot": "T1",
      "retrievalTime": "2024-12-04T01:03:35Z",
      "version": "1.0.0"
    }
  }
}
```

**Error Response (400, 404, 500):**

```json
{
  "success": false,
  "error": {
    "error": "SURVEY_NOT_FOUND",
    "code": 404,
    "message": "No survey found with ID: 30117a12cc_T1"
  }
}
```

### POST /api/dma/results

Batch retrieval of multiple assessment results.

#### Request Body

```json
{
  "respondentIds": ["30117a12cc", "basic123456"],
  "snapshot": "T1",
  "includeBenchmark": true,
  "format": "json"
}
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "respondentId": "30117a12cc",
        "survey": { /* survey data */ },
        "benchmark": { /* benchmark data */ }
      }
    ],
    "errors": [
      {
        "respondentId": "invalid123",
        "error": "Survey not found: invalid123"
      }
    ],
    "meta": {
      "totalRequested": 2,
      "successful": 1,
      "failed": 1,
      "snapshot": "T1",
      "retrievalTime": "2024-12-04T01:03:35Z"
    }
  }
}
```

## Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `MISSING_RESPONDENT_ID` | 400 | respondentId query parameter is required |
| `INVALID_RESPONDENT_ID` | 400 | respondentId must be 10-character alphanumeric |
| `INVALID_SNAPSHOT` | 400 | snapshot must be T0, T1, or T2 |
| `INVALID_FORMAT` | 400 | format must be json or summary |
| `SURVEY_NOT_FOUND` | 404 | No survey found with the given ID |
| `BATCH_SIZE_EXCEEDED` | 400 | Maximum batch size is 50 respondent IDs |
| `INVALID_REQUEST_BODY` | 400 | Request body validation failed |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

## Time Series Support

The API supports time series snapshots for tracking assessment progress over time:

- **T0**: Initial baseline assessment
- **T1**: First follow-up assessment (typically 3-6 months later)
- **T2**: Second follow-up assessment (typically 6-12 months later)

Time series IDs are constructed as: `{respondentId}_{snapshot}`

Example: `30117a12cc_T1`

## Benchmark Data

When `includeBenchmark=true` and user details are available, the API includes:

- **Overall comparison** against industry averages
- **Dimension-specific comparisons** for each of the 6 digital maturity dimensions
- **Performance insights** identifying strongest and weakest areas
- **Summary statistics** showing performance distribution

Benchmarks are based on:
- Company sector (manufacturing, services, etc.)
- Company size (micro, small, medium, large)
- Geographic region (currently Europe-focused)

## Response Formats

### JSON Format (Default)
Complete survey data including answers, full benchmark analysis, and metadata.

### Summary Format
Lightweight response containing only:
- Core scores and classifications
- Basic user details (if available)
- Simplified benchmark insights
- Metadata

## Usage Examples

### JavaScript/TypeScript

```typescript
// Single result with benchmarks
const response = await fetch('/api/dma/results?respondentId=30117a12cc&includeBenchmark=true');
const data = await response.json();

if (data.success) {
  console.log('Overall Score:', data.data.survey.scores.overall);
  console.log('Benchmark Performance:', data.data.benchmark.overall.performanceLevel);
} else {
  console.error('API Error:', data.error.message);
}

// Batch retrieval
const batchResponse = await fetch('/api/dma/results', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    respondentIds: ['30117a12cc', 'basic123456'],
    format: 'summary',
    includeBenchmark: true
  })
});

const batchData = await batchResponse.json();
console.log(`Retrieved ${batchData.data.meta.successful} out of ${batchData.data.meta.totalRequested} surveys`);
```

### cURL

```bash
# Single survey
curl "http://localhost:3000/api/dma/results?respondentId=30117a12cc"

# With time series
curl "http://localhost:3000/api/dma/results?respondentId=30117a12cc&snapshot=T1"

# Batch request
curl -X POST http://localhost:3000/api/dma/results \
  -H "Content-Type: application/json" \
  -d '{"respondentIds":["30117a12cc"],"includeBenchmark":true}'
```

## Rate Limiting

Currently no rate limiting is implemented, but consider implementing:
- **Per-IP limits**: 100 requests/hour for GET, 10 requests/hour for POST
- **Batch size limits**: Maximum 50 respondent IDs per batch request
- **Concurrent request limits**: Maximum 5 concurrent requests per IP

## Future Enhancements

1. **Authentication**: API keys or JWT tokens for enterprise clients
2. **Filtering**: Query parameters for date ranges, score ranges, sectors
3. **Aggregation**: Statistical summaries across multiple surveys
4. **Real-time**: WebSocket support for live updates
5. **Export formats**: CSV, XML, PDF report generation
6. **Webhooks**: Notifications when new assessments are completed

## Testing

Use the test survey IDs:
- `30117a12cc` - Full assessment with user details and benchmarks
- `basic123456` - Basic assessment without user details