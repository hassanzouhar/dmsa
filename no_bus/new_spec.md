
# Mål

Bygg en modul som:

1. Konverterer svar fra `AssessmentSpec` (survey) til **dimensjonsscorer (0–100)**.
2. Henter **benchmark-statistikk fra SSB** (p25/p50/p75/average/sampleSize) pr. segment (NACE × størrelsesbånd) fra Firestore.
3. Sammenligner brukerens scorer mot bench (banding + delta).
4. Returnerer et strukturert resultat klar til UI.

---

# Forutsetninger (inputs & konvensjoner)

* Koden bruker **TypeScript** (ES modules).
* Det finnes en Firestore-kolleksjon med pre-kalkulerte benchmarks:

  * `/benchmarks/segments/data/{nace}_{size}` (primær)
  * `/benchmarks/by-sector/data/{nace}` (fallback 1)
  * `/benchmarks/national/data/all` (fallback 2)
    hvor hvert dokument inneholder p25/p50/p75/average/sampleSize for **seks dimensjoner**:
    `digitalStrategy|digitalReadiness|humanCentric|dataManagement|automation|greenDigitalization`.
* Du har hjelpefiler:

  * `company-options.ts` (størrelsesbånd)
  * `nace-sectors.ts` (NACE-koder A–U, inkl. mapping fra detaljerte koder → hovedbokstav)
  * `norwegian-counties.ts` (valgfritt, brukes ikke av kjernelogikk)
* Denne instruksen antar at **SSB-dataene allerede er ferdig prosessert** inn i Firestore (dvs. du slipper API-kall her).

---

# Prosjektstruktur (forslag)

```
src/
  benchmarks/
    fetch.ts               // Hent benchmark doc m/fallback
    types.ts               // Typer for benchmark-dokumenter
  mapping/
    dimensionMapping.ts    // Survey-dimensjon -> SSB-dimensjon (for dokumentasjon)
    questionAdapters.ts    // Scoring-adaptere per spørsmåls-type
  scoring/
    normalize.ts           // Normalisering 0–100, vektregler, negative indikatorer
    aggregate.ts           // Aggregering: spørsmål -> dimensjon -> totalscore
  report/
    compare.ts             // Banding, delta, percentileHint
    builder.ts             // buildReport(survey, nace, size)
  util/
    nace.ts                // Hjelpere for NACE-normalisering
    size.ts                // Hjelpere for størrelsesbånd
    types.ts               // Felles typer (AssessmentSpec, svarstruktur, enums)
  index.ts                 // Entry (re-eksporter hoved-API)
tests/
  unit/
    adapters.test.ts
    aggregate.test.ts
    compare.test.ts
    builder.test.ts
```

---

# Typer

```ts
// src/benchmarks/types.ts
export type DimensionKey =
  | 'digitalStrategy'
  | 'digitalReadiness'
  | 'humanCentric'
  | 'dataManagement'
  | 'automation'
  | 'greenDigitalization';

export type DimensionScore = {
  average: number;   // 0–100
  p25: number;       // 0–100
  p50: number;       // 0–100
  p75: number;       // 0–100
  sampleSize: number;
};

export type BenchmarkDoc = {
  segmentId: string; // f.eks. "C_small"
  dimensions: Record<DimensionKey, DimensionScore>;
  intelligence?: {
    successPatterns?: string[];
    commonChallenges?: string[];
  };
  metadata?: Record<string, unknown>;
};
```

```ts
// src/util/types.ts
export type CompanySize = 'micro'|'small'|'medium'|'large';
export type NaceLetter =
  | 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'|'M'|'N'|'O'|'P'|'Q'|'R'|'S'|'T'|'U';

export type AssessmentResponses = Record<string, any>; // dine faktiske svar (per Q.id)

export type Band = 'red'|'yellow'|'lightgreen'|'green';

export type DimensionResult = {
  user: number; // 0–100
  ref: import('../benchmarks/types').DimensionScore;
  band: Band;
  deltaToMedian: number;     // user - p50 (avrundet)
  percentileHint: number;    // 20|40|60|80 (enkelt hint)
};

export type Report = {
  segment: string; // resolved segmentId
  results: Record<import('../benchmarks/types').DimensionKey, DimensionResult>;
  tips?: string[]; // valgfritt: 2–3 råd basert på intelligence + svakeste dims
};
```

---

# Segment-resolusjon (NACE + størrelse) + fallback

```ts
// src/util/nace.ts
export function toNaceLetter(naceCode: string): import('./types').NaceLetter {
  // Tar "C10.1" eller "C" og returnerer "C".
  const letter = (naceCode?.trim()?.toUpperCase() || 'U')[0];
  const valid = 'ABCDEFGHIJKLMNOPQRSTU'.includes(letter) ? letter : 'U';
  return valid as import('./types').NaceLetter;
}
```

```ts
// src/util/size.ts
import { CompanySize } from './types';
export function normalizeSize(s: string): CompanySize {
  const t = s.toLowerCase();
  if (t.startsWith('micro')) return 'micro';
  if (t.startsWith('small')) return 'small';
  if (t.startsWith('medium')) return 'medium';
  return 'large';
}
```

```ts
// src/benchmarks/fetch.ts
import { BenchmarkDoc } from './types';
import { NaceLetter, CompanySize } from '../util/types';

// Forutsetter en `db` klient er tilgjengelig (Firestore). Injiser via parameter.
export async function fetchBenchmarkDoc(
  db: any,
  nace: NaceLetter,
  size: CompanySize
): Promise<BenchmarkDoc> {
  const segId = `${nace}_${size}`;
  const segRef = db.doc(`/benchmarks/segments/data/${segId}`);
  const segSnap = await segRef.get();
  if (segSnap.exists && segSnap.data()?.dimensions?.digitalReadiness?.sampleSize >= 30) {
    return segSnap.data() as BenchmarkDoc;
  }

  const sectorRef = db.doc(`/benchmarks/by-sector/data/${nace}`);
  const sectorSnap = await sectorRef.get();
  if (sectorSnap.exists) return sectorSnap.data() as BenchmarkDoc;

  const natRef = db.doc(`/benchmarks/national/data/all`);
  const natSnap = await natRef.get();
  if (natSnap.exists) return natSnap.data() as BenchmarkDoc;

  throw new Error(`Benchmark not found for ${segId} and no fallback available`);
}
```

---

# Scoring-adaptere per spørsmåls-type

```ts
// src/mapping/questionAdapters.ts

// Checkboxes: antall valgte / antall mulige (med opsjonal vekt per valg)
export function scoreCheckboxes(
  selectedIds: string[] = [],
  options: { id: string; weight?: number }[]
): number {
  if (!options?.length) return 0;
  const weights = options.map(o => o.weight ?? 1);
  const total = weights.reduce((a,b)=>a+b,0);
  const got = options.reduce((sum, o) =>
    sum + (selectedIds.includes(o.id) ? (o.weight ?? 1) : 0), 0);
  return (got / total) * 100;
}

// Table-dual-checkboxes (Q1): venstre = «allerede investert» (vekt 1), høyre = «planlegger» (vekt 0.5)
export function scoreTableDualCheckboxes(
  rows: { id: string }[],
  leftSelected: string[] = [],
  rightSelected: string[] = [],
  leftWeight = 1,
  rightWeight = 0.5
): number {
  if (!rows?.length) return 0;
  const total = rows.length * (leftWeight + rightWeight);
  const got = rows.reduce((sum, r) =>
    sum
    + (leftSelected.includes(r.id) ? leftWeight : 0)
    + (rightSelected.includes(r.id) ? rightWeight : 0)
  , 0);
  return (got / total) * 100;
}

// Scale-table (Q4/Q9): hver rad 0–5 → 0–100; gjennomsnitt
export function scoreScaleTable(values: number[] = []): number {
  if (!values.length) return 0;
  const norm = values.map(v => Math.max(0, Math.min(5, v)) / 5 * 100);
  return norm.reduce((a,b)=>a+b,0) / norm.length;
}

// Tri-state-table (Q11): map Nei=0, Delvis=0.5, Ja=1
export function scoreTriStateTable(values: ('no'|'partial'|'yes')[] = []): number {
  if (!values.length) return 0;
  const map = { no: 0, partial: 0.5, yes: 1 };
  const norm = values.map(v => map[v] ?? 0);
  return (norm.reduce((a,b)=>a+b,0) / values.length) * 100;
}
```

---

# Negativ indikator & vekter

```ts
// src/scoring/normalize.ts

// Justerer for negative indikatorer i Q7 (f.eks. 'no-digital-collection')
export function applyNegativeIndicators(baseScore: number, negatives: boolean[], penaltyPerNeg = 15): number {
  const penalties = (negatives || []).filter(Boolean).length * penaltyPerNeg;
  return Math.max(0, Math.min(100, baseScore - penalties));
}
```

---

# Aggregere spørsmål → dimensjon

```ts
// src/scoring/aggregate.ts
import { DimensionKey } from '../benchmarks/types';

export type QuestionScore = { id: string; score: number; weight?: number };
export function aggregateDimension(questions: QuestionScore[]): number {
  if (!questions.length) return 0;
  const weighted = questions.map(q => q.score * (q.weight ?? 1));
  const wsum = questions.reduce((a,b)=>a + (b.weight ?? 1), 0);
  return weighted.reduce((a,b)=>a+b,0) / wsum;
}

// Hjelp: clamp 0–100
export const clamp100 = (x:number)=>Math.max(0, Math.min(100, x));
```

---

# Banding & sammenligning

```ts
// src/report/compare.ts
import { Band } from '../util/types';
import { DimensionScore } from '../benchmarks/types';

export function band(user: number, p25: number, p50: number, p75: number): Band {
  if (user < p25) return 'red';
  if (user < p50) return 'yellow';
  if (user < p75) return 'lightgreen';
  return 'green';
}

export function compareToBenchmark(user: number, ref: DimensionScore) {
  const b = band(user, ref.p25, ref.p50, ref.p75);
  const deltaToMedian = Math.round(user - ref.p50);
  const percentileHint = user < ref.p25 ? 20 : user < ref.p50 ? 40 : user < ref.p75 ? 60 : 80;
  return { band: b, deltaToMedian, percentileHint };
}
```

---

# Mapping (dokumentasjon/konfig – kan være statisk fil)

```ts
// src/mapping/dimensionMapping.ts
// For dokumentasjon (hvilke survey-spørsmål inngår i hver dimensjon + SSB-proxy)
export const DimensionToQuestions: Record<string, string[]> = {
  digitalStrategy: ['Q1','Q2'],
  digitalReadiness: ['Q3','Q4'],
  humanCentric: ['Q5','Q6'],
  dataManagement: ['Q7','Q8'],
  automation: ['Q9'],
  greenDigitalization: ['Q10','Q11']
};

// (Valgfritt) SSB-rådet: hvilke SSB-tabeller/indikatorer ble brukt under prosesseringen
export const SsbProxies = {
  digitalStrategy: ['10966','10974'],
  digitalReadiness: ['10966','10974','14034'],
  humanCentric: ['10964','12769'],
  dataManagement: ['10983','14034','12769','12771'],
  automation: ['13265','13271','14034'],
  greenDigitalization: ['10974','10966'] // proksy (papirløst/eFaktura) inntil bedre finnes
};
```

---

# Bygge rapport (end-to-end)

```ts
// src/report/builder.ts
import { fetchBenchmarkDoc } from '../benchmarks/fetch';
import { toNaceLetter } from '../util/nace';
import { normalizeSize } from '../util/size';
import { AssessmentResponses, CompanySize, NaceLetter, Report, DimensionResult } from '../util/types';
import { DimensionKey } from '../benchmarks/types';
import { compareToBenchmark } from './compare';
import { aggregateDimension, clamp100 } from '../scoring/aggregate';
import { scoreCheckboxes, scoreScaleTable, scoreTableDualCheckboxes, scoreTriStateTable } from '../mapping/questionAdapters';
import { applyNegativeIndicators } from '../scoring/normalize';

type BuildParams = {
  db: any;             // Firestore client
  nace: string;        // f.eks. "C10.1"
  size: string;        // "small" | ...
  survey: AssessmentResponses;
};

export async function buildReport(params: BuildParams): Promise<Report> {
  const nace: NaceLetter = toNaceLetter(params.nace);
  const size: CompanySize = normalizeSize(params.size);

  // 1) Scor spørsmål per dimensjon
  // Merk: Tilpass input-lesing her til din faktiske svarstruktur.
  const q1 = clamp100(scoreTableDualCheckboxes(
    params.survey.Q1?.rows ?? [],
    params.survey.Q1?.left ?? [],
    params.survey.Q1?.right ?? [],
    1, 0.5
  ));
  const q2 = clamp100(scoreCheckboxes(params.survey.Q2?.selected ?? [], params.survey.Q2?.options ?? []));

  const q3 = clamp100(scoreCheckboxes(params.survey.Q3?.selected ?? [], params.survey.Q3?.options ?? []));
  const q4 = clamp100(scoreScaleTable(params.survey.Q4?.values ?? []));

  const q5 = clamp100(scoreCheckboxes(params.survey.Q5?.selected ?? [], params.survey.Q5?.options ?? []));
  const q6 = clamp100(scoreCheckboxes(params.survey.Q6?.selected ?? [], params.survey.Q6?.options ?? []));

  // Q7 med negativ indikator
  let q7base = clamp100(scoreCheckboxes(params.survey.Q7?.selected ?? [], params.survey.Q7?.options ?? []));
  const negatives = [ params.survey.Q7?.selected?.includes('no-digital-collection') ];
  const q7 = clamp100(applyNegativeIndicators(q7base, negatives, 15));

  const q8 = clamp100(scoreCheckboxes(params.survey.Q8?.selected ?? [], params.survey.Q8?.options ?? []));

  const q9 = clamp100(scoreScaleTable(params.survey.Q9?.values ?? []));

  const q10 = clamp100(scoreCheckboxes(params.survey.Q10?.selected ?? [], params.survey.Q10?.options ?? []));
  const q11 = clamp100(scoreTriStateTable(params.survey.Q11?.values ?? []));

  const dimScores: Record<DimensionKey, number> = {
    digitalStrategy:  aggregateDimension([{ id: 'Q1', score: q1 }, { id: 'Q2', score: q2 }]),
    digitalReadiness: aggregateDimension([{ id: 'Q3', score: q3 }, { id: 'Q4', score: q4 }]),
    humanCentric:     aggregateDimension([{ id: 'Q5', score: q5 }, { id: 'Q6', score: q6 }]),
    dataManagement:   aggregateDimension([{ id: 'Q7', score: q7 }, { id: 'Q8', score: q8 }]),
    automation:       aggregateDimension([{ id: 'Q9', score: q9 }]),
    greenDigitalization: aggregateDimension([{ id: 'Q10', score: q10 }, { id: 'Q11', score: q11 }]),
  };

  // 2) Hent benchmark (med fallback)
  const bm = await fetchBenchmarkDoc(params.db, nace, size);

  // 3) Sammenlign og bygg resultater
  const results = (Object.keys(dimScores) as DimensionKey[]).reduce((acc, key) => {
    const user = dimScores[key];
    const ref = bm.dimensions[key];
    const cmp = compareToBenchmark(user, ref);
    acc[key] = { user, ref, ...cmp } as DimensionResult;
    return acc;
  }, {} as Record<DimensionKey, DimensionResult>);

  // 4) Valgfri tips: bruk intelligence + svakeste dimensjoner
  const weakest = (Object.entries(results) as [DimensionKey, DimensionResult][])
    .sort((a,b)=>a[1].user - b[1].user)
    .slice(0,2)
    .map(([k]) => k);
  const tips: string[] = [
    ...(bm.intelligence?.successPatterns ?? [])
      .filter((_, i)=>i<2)
      .map(s => `Mulig tiltak: ${s}`),
    ...(bm.intelligence?.commonChallenges ?? [])
      .filter((_, i)=>i<1)
      .map(c => `Vær obs: ${c}`)
  ];

  return { segment: bm.segmentId, results, tips };
}
```

---

# Public API

```ts
// src/index.ts
export { buildReport } from './report/builder';
export type { Report } from './util/types';
```

---

# Test-spec (Jest eller Vitest)

```ts
// tests/unit/adapters.test.ts
import { scoreCheckboxes, scoreScaleTable, scoreTriStateTable, scoreTableDualCheckboxes } from '../../src/mapping/questionAdapters';

test('checkboxes basic', () => {
  const score = scoreCheckboxes(['a','c'], [{id:'a'},{id:'b'},{id:'c'}]);
  expect(Math.round(score)).toBe(67);
});

test('scale-table', () => {
  const score = scoreScaleTable([0,3,5]); // -> (0 + 60 + 100)/3 = 53.33
  expect(Math.round(score)).toBe(53);
});

test('tri-state', () => {
  const score = scoreTriStateTable(['no','partial','yes']); // (0 + 0.5 + 1)/3 *100 = 50
  expect(score).toBe(50);
});

test('dual-table', () => {
  const rows = [{id:'r1'},{id:'r2'}];
  const score = scoreTableDualCheckboxes(rows, ['r1'], ['r1','r2'], 1, 0.5);
  // total = 2*(1+0.5)=3; got = r1:1+0.5, r2:0+0.5 = 2.0 -> 66.66%
  expect(Math.round(score)).toBe(67);
});
```

```ts
// tests/unit/aggregate.test.ts
import { aggregateDimension } from '../../src/scoring/aggregate';
test('aggregate weights', () => {
  const s = aggregateDimension([
    {id:'Q1', score: 80, weight: 2},
    {id:'Q2', score: 60, weight: 1},
  ]);
  // (80*2 + 60*1) / 3 = 220/3 = 73.33
  expect(Math.round(s)).toBe(73);
});
```

```ts
// tests/unit/compare.test.ts
import { compareToBenchmark } from '../../src/report/compare';
test('band/delta', () => {
  const ref = {p25:40,p50:60,p75:80,average:65,sampleSize:100};
  const cmp = compareToBenchmark(72, ref);
  expect(cmp.band).toBe('lightgreen');
  expect(cmp.deltaToMedian).toBe(12);
  expect(cmp.percentileHint).toBe(60);
});
```

```ts
// tests/unit/builder.test.ts
import { buildReport } from '../../src/report/builder';

test('buildReport basic flow', async () => {
  const db = {
    doc: (p:string)=>({
      get: async ()=>({
        exists: true,
        data: ()=>({
          segmentId:'C_small',
          dimensions: {
            digitalStrategy: {p25:30,p50:50,p75:70,average:55,sampleSize:50},
            digitalReadiness:{p25:30,p50:50,p75:70,average:55,sampleSize:50},
            humanCentric:    {p25:30,p50:50,p75:70,average:55,sampleSize:50},
            dataManagement:  {p25:30,p50:50,p75:70,average:55,sampleSize:50},
            automation:      {p25:30,p50:50,p75:70,average:55,sampleSize:50},
            greenDigitalization:{p25:30,p50:50,p75:70,average:55,sampleSize:50},
          },
          intelligence: { successPatterns:['Start smått med sky-integrasjon'], commonChallenges:['Datakvalitet varians'] }
        })
      })
    })
  };

  const survey = {
    Q1: { rows:[{id:'a'},{id:'b'}], left:['a'], right:['b'] },
    Q2: { selected:['needs-identified'], options:[{id:'needs-identified'}] },
    Q3: { selected:['company-website'], options:[{id:'company-website'}] },
    Q4: { values:[5,4,3] },
    Q5: { selected:['training-plan'], options:[{id:'training-plan'}] },
    Q6: { selected:['awareness'], options:[{id:'awareness'}] },
    Q7: { selected:['data-governance'], options:[{id:'data-governance'},{id:'no-digital-collection'}] },
    Q8: { selected:['security-policies'], options:[{id:'security-policies'}] },
    Q9: { values:[2,3] },
    Q10: { selected:['paperless-processes'], options:[{id:'paperless-processes'}] },
    Q11: { values:['yes','partial','no'] }
  };

  const rep = await buildReport({ db, nace:'C10.1', size:'small', survey });
  expect(rep.segment).toBe('C_small');
  expect(rep.results.digitalStrategy.band).toBeDefined();
});
```

---

# Ytelse & robusthet

* **Caching**: Cache benchmark-dokumenter (per `segmentId`) i minne (LRU) i 5–15 min.
* **Terskler**: Hvis `sampleSize < 30`, legg til flagg `lowSample=true` for UI-merknad.
* **Validering**: Clamp alle scorene 0–100; håndter `undefined`-felter på survey-svar.
* **Observability**: Logg `segmentId`, manglende felter, og endelig `dimScores` (debug).

---

# Hvordan ta i bruk

```ts
import { buildReport } from './src';

const report = await buildReport({
  db,                  // Firestore-klient
  nace: 'G47.1',       // valgfri detalj, mappes til 'G'
  size: 'medium',      // fra company-options.ts
  survey: dmaResponses // objekt som matcher Q1..Q11-strukturen over
});

// `report` gir deg band/delta/percentileHint + tips – direkte klar for UI.
```

