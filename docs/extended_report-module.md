# DMA Results Modal — Technical Description (TypeScript project)
## Purpose
Show immediate, interpretable feedback on an SME/PSO’s digital maturity after questionnaire submission, with optional benchmark comparisons by sector, size and region, and support for T0/T1/T2 snapshots. The guidance explicitly calls for instant feedback, peer comparisons, and downloadable visualizations.  

## Placement and trigger
* Trigger: successful POST of respondent details + completed assessment.
* Modal: full-screen on mobile, centered dialog on desktop. Blocks background scroll.
* Close controls: Escape key, “Close” button, backdrop click. Persistent “Download PDF.”

## Core content (modal body)
1. **Header**
   * Title: “Your Digital Maturity Results”
   * Subtitle: entity name, timestamp T0/T1/T2 if available.

2. **Overall score**
   * Big numeric 0–100% (standardized scale across charts). 

3. **Score by dimension**
   * Radar chart across the 6 DMA dimensions (SME: Strategy, Readiness, Human-centric, Data, Automation & Intelligence, Green; PSO: Strategy & Investments, Readiness, Human-centric, Data & Security, Interoperability, Green). Values are mean per dimension.   

4. **Benchmark comparison**
   * Horizontal bars: “My score” vs average or best peer for selected cohort(s) (sector, size, region/country). If dataset not yet dense, show “Not enough data yet” with explanation.  

5. **Per-dimension explanations**
   * Six mini-gauges with short interpretations and improvement hints. Interpretations align to ranges (e.g., Basic/Average/Advanced) per official guidance. 

6. **Interpretation help**
   * Inline “How to read this” block explaining charts, maturity, and next steps. 

7. **Actions**
   * Primary: “Download PDF”
   * Secondary: “Request EDIH support” or “Book guidance session”

> The example layout with overall score, radar, cohort bars and per-dimension gauges matches the reference visuals. 

## Data model (TypeScript)

```ts
export type TSnapshot = "T0" | "T1" | "T2";

export interface DmaDimensionScore {
  key: string;          // e.g. "digital_business_strategy"
  label: string;        // i18n key
  score: number;        // 0..100
}

export interface DmaScores {
  respondentId: string;
  entityName: string;
  snapshot: TSnapshot;   // optional, defaults T0
  overall: number;       // 0..100
  dimensions: DmaDimensionScore[]; // length 6
}

export interface DmaBenchmark {
  cohort: {
    sector?: string;
    size?: "micro" | "small" | "medium" | "large";
    region?: string;
    country?: string;
  };
  type: "average" | "best_peer";
  overall?: number;                 // 0..100
  dimensions?: Record<string, number>; // 0..100 per dimension key
  sampleSize: number;               // for “insufficient data” handling
}

export interface DmaResultsPayload {
  scores: DmaScores;
  benchmarks?: DmaBenchmark[];      // optional
  timeSeries?: DmaScores[];         // T0/T1/T2
}
```

## API contract
* **Request** `GET /api/dma/results?respondentId=…&snapshot=T0|T1|T2&sector=…&size=…&region=…&country=…&benchmark=avg|best`
* **Response** `DmaResultsPayload` (above). Include `sampleSize` per benchmark so UI can gate comparisons until “critical mass” is reached. 

### Scoring assumptions the backend must honor
* Each dimension scored 0–100; each question 0–10; equal item weights; equal question weights within a dimension. Special cases for Dimension 1 multi-question weighting and single-question dimensions per official rules. The frontend treats values as given and never recomputes. 

## Component structure
```ts
// container
<ResultsModal
  open
  onClose={...}
  data={DmaResultsPayload}
  onDownloadPdf={...}
/>

// children
<OverallScore value={number} />
<DimensionRadar data={DmaDimensionScore[]} />
<BenchmarkBars my={DmaScores} peers={DmaBenchmark[]} />
<DimensionGauges data={DmaDimensionScore[]} />
<InterpretationHelp />
<Actions onDownloadPdf onRequestSupport />
```

## Visualizations
* **Scale:** all charts 0–100% as mandated. 
* **Radar:** one series per

