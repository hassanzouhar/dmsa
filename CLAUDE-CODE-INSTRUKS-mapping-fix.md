# Instruks til Claude Code: Fix NACE/størrelse-mapping i DMSA-benchmarks

> **For Claude Code:** Dette er en konkret implementasjonsoppgave. Les hele dokumentet før du begynner å endre kode. Ikke gå utover det som er beskrevet her — endringene er tett-koblede og må gjøres samlet.

---

## Kontekst

DMSA (Digital Maturity Assessment) er en Next.js 15-app for digital modenhet i norske SMB. Den henter benchmark-data fra SSB (Statistics Norway) for å sammenligne brukerens score mot tilsvarende foretak (samme sektor + størrelse).

**Problemet:** Mappingen mellom DMSAs størrelseskategorier og SSBs sysselsettings-koder er **systematisk feil** — alle størrelseskategoriene er off-by-one mot SSB-skalaen. I tillegg behandles flere sektorer som om de finnes i SSB ICT-bruk-tabellene når de faktisk ikke gjør det. Resultatet er at brukere får benchmarks fra feil populasjon.

**Mål:** Korrigere mappingen slik at hver bruker får riktig SSB-baseline, eller en eksplisitt "ingen baseline tilgjengelig"-melding der SSB ikke har data.

---

## DMSAs canonical definisjoner (skal IKKE endres)

Disse ligger i `data/company-options.ts` (også duplisert i `no_bus/entities/company-options.ts`):

```typescript
COMPANY_SIZES = [
  { id: 'micro',  label: 'Mikrobedrift (1-9 ansatte)' },
  { id: 'small',  label: 'Liten bedrift (10-49 ansatte)' },
  { id: 'medium', label: 'Mellomstor bedrift (50-249 ansatte)' },
  { id: 'large',  label: 'Stor bedrift (250+ ansatte)' }
]
```

NACE-sektorene i `data/nace-sectors.ts` (21 sektorer A-U) skal beholdes — men hver sektor må berikes med metadata om SSB-dekning (se Endring 3).

---

## SSBs faktiske skala (referanse for korrekt mapping)

**SSB ICT-bruk-i-foretak-tabellene** (10970, 10974, 10980, 10966 osv.) bruker sysselsettings-koder:
- `02` = 10-19 ansatte
- `03` = 20-49 ansatte
- `04` = 50-99 ansatte
- `05` = 100+ ansatte (inkluderer 100-249 OG 250+)

**SSB ICT-bruk har INGEN data for foretak med 1-9 ansatte.**

**SSB Strukturstatistikk (12936)** bruker andre koder:
- `000-001`, `002-009`, `010-019`, `020-049`, `050-249`, `250-`

**SSB CIS Innovasjons-tabeller (12808, 12798, etc.)** bruker:
- `5-9`, `10-19`, `20-49`, `50-99`, `100-199`, `200-499`, `500+`

**SSB ICT-bruk-tabellene bruker NACE-RANGER, ikke rene seksjoner:**
- `10-39` = C+D+E (industri-aggregat)
- `41-43` = F (bygg)
- `45`, `46`, `47` = G splittet i 3 (handel)
- `49-53` = H (transport)
- `55-56` = I (overnatting/servering)
- `58-63` = J (IT/media)
- `64-66` = K (finans)
- `68-75+77-82+95.1` = L+M+N+S (mixed services)

**Sektorer som IKKE finnes i SSB ICT-bruk:** A (jordbruk), B (bergverk — finnes som '05-09' men sjelden), O (offentlig admin), P (undervisning), Q (helse), T (husholdninger), U (internasjonale org).

---

## Filer som skal endres

| # | Fil | Endring |
|---|---|---|
| 1 | `data/nace-sectors.ts` | Legg til `ssbCoverage` + `ssbNaceCodes`-felter |
| 2 | `no_bus/entities/nace-sectors.ts` | Speil endring fra fil 1 (samme innhold) |
| 3 | `no_bus/lib/ssb-api-client.ts` | Fix `mapSizeToSSBCode` (returner array), fix `mapSectorToNaceCodes` |
| 4 | `no_bus/lib/ssb-transformer.ts` | Slett duplikat `mapSizeToSSBCode` og NACE-mapping (importer fra api-client) |
| 5 | `no_bus/src/mapping/dimensionMapping.ts` | Gjør canonical: importer fra én kilde, slett `SsbProxies`-duplikatet i `ssb-transformer.ts` (hvis fortsatt der) |
| 6 | `no_bus/script/extract-ssb-benchmarks.ts` | Tilpass til ny multi-kode-respons fra mappingfunksjonene (aggregeringslogikk) |

**IKKE endre:** `lib/benchmark-service.ts` (hardkodet mock-data, brukes ikke for benchmarks). `app/company-details/page.tsx` (UI-en for brukervalg). `data/questions.no.ts` (spørsmålene). Selve scoring-logikken i `lib/scoring.ts` eller `no_bus/scoring.ts`.

---

## Endring 1 — `data/nace-sectors.ts`

Utvid `NaceSector`-interfacet og hvert sektor-objekt:

```typescript
export type SsbCoverage = 'full' | 'partial' | 'none';

export interface NaceSector {
  code: string;
  name: string;
  /** Dekning i SSB ICT-bruk-i-foretak-tabellene */
  ssbCoverage: SsbCoverage;
  /** SSB ICT-bruk NACE-koder denne sektoren mapper til (tom array hvis 'none') */
  ssbNaceCodes: string[];
}

export const NACE_SECTORS: NaceSector[] = [
  { code: 'A', name: 'Jordbruk, skogbruk og fiske',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'B', name: 'Bergverksdrift og utvinning',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'C', name: 'Industri',
    ssbCoverage: 'partial', ssbNaceCodes: ['10-39'] }, // aggregat med D+E
  { code: 'D', name: 'Kraftforsyning',
    ssbCoverage: 'partial', ssbNaceCodes: ['10-39'] },
  { code: 'E', name: 'Vannforsyning, avløp og renovasjon',
    ssbCoverage: 'partial', ssbNaceCodes: ['10-39'] },
  { code: 'F', name: 'Bygge- og anleggsvirksomhet',
    ssbCoverage: 'full', ssbNaceCodes: ['41-43'] },
  { code: 'G', name: 'Varehandel og reparasjon av motorvogner',
    ssbCoverage: 'full', ssbNaceCodes: ['45', '46', '47'] },
  { code: 'H', name: 'Transport og lagring',
    ssbCoverage: 'full', ssbNaceCodes: ['49-53'] },
  { code: 'I', name: 'Overnattings- og serveringsvirksomhet',
    ssbCoverage: 'full', ssbNaceCodes: ['55-56'] },
  { code: 'J', name: 'Informasjon og kommunikasjon',
    ssbCoverage: 'full', ssbNaceCodes: ['58-63'] },
  { code: 'K', name: 'Finansiell tjenesteyting og forsikring',
    ssbCoverage: 'full', ssbNaceCodes: ['64-66'] },
  { code: 'L', name: 'Eiendomsdrift',
    ssbCoverage: 'partial', ssbNaceCodes: ['68-75+77-82+95.1'] },
  { code: 'M', name: 'Faglig, vitenskapelig og teknisk tjenesteyting',
    ssbCoverage: 'partial', ssbNaceCodes: ['68-75+77-82+95.1'] },
  { code: 'N', name: 'Forretningsmessig tjenesteyting',
    ssbCoverage: 'partial', ssbNaceCodes: ['68-75+77-82+95.1'] },
  { code: 'O', name: 'Offentlig administrasjon og forsvar',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'P', name: 'Undervisning',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'Q', name: 'Helse- og sosialtjenester',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'R', name: 'Kultur, underholdning og fritid',
    ssbCoverage: 'partial', ssbNaceCodes: ['68-75+77-82+95.1'] },
  { code: 'S', name: 'Annen tjenesteyting',
    ssbCoverage: 'partial', ssbNaceCodes: ['68-75+77-82+95.1'] },
  { code: 'T', name: 'Private husholdninger som arbeidsgivere',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'U', name: 'Internasjonale organisasjoner og organer',
    ssbCoverage: 'none', ssbNaceCodes: [] }
];

// Eksisterende getNaceName og NACE_MAP beholdes uendret
```

**Notat:** `ssbCoverage: 'partial'` betyr at SSB har data men aggregert sammen med andre sektorer (f.eks. C+D+E i `10-39`, eller L+M+N+S+R i `68-75+77-82+95.1`). UI-en bør vise dette eksplisitt: "Vi sammenligner deg mot et industri-aggregat som inkluderer kraft og vannforsyning."

---

## Endring 2 — `no_bus/entities/nace-sectors.ts`

Identisk innhold som Endring 1 (filene er duplikater av samme data). Hold begge i synk.

---

## Endring 3 — `no_bus/lib/ssb-api-client.ts`

### 3a. Fix `mapSizeToSSBCode` (linje 374-385)

Erstatt med:

```typescript
/**
 * Map our company size to SSB ICT-bruk size codes.
 * Returns an array because some DMSA sizes aggregate multiple SSB codes.
 *
 * SSB ICT-bruk codes:
 *   '02' = 10-19, '03' = 20-49, '04' = 50-99, '05' = 100+
 *
 * IMPORTANT: SSB ICT-bruk does NOT cover micro (1-9 employees).
 * For DMSA "micro" we return an empty array — caller must handle no-data case.
 */
private mapSizeToSSBCodes(size: string): string[] {
  const sizeMap: Record<string, string[]> = {
    'micro':  [],            // SSB ICT-bruk has no 1-9 data
    'small':  ['02', '03'],  // 10-19 + 20-49 = 10-49
    'medium': ['04', '05'],  // 50-99 + 100+ — note: 100+ includes 250+ (lossy)
    'large':  ['05']         // 100+ (best available; includes some medium)
  };
  return sizeMap[size] ?? [];
}
```

**Behold den gamle `mapSizeToSSBCode`-funksjonen som deprecated wrapper:**

```typescript
/** @deprecated Use mapSizeToSSBCodes (returns array). */
private mapSizeToSSBCode(size: string): string {
  const codes = this.mapSizeToSSBCodes(size);
  return codes[0] ?? '00';
}
```

### 3b. Fix sector → NACE-koder (linje 340-370)

Erstatt med en versjon som leser fra `nace-sectors.ts`:

```typescript
import { NACE_SECTORS } from '../entities/nace-sectors';

/**
 * Map a DMSA sector code (A-U) to SSB ICT-bruk NACE-range codes.
 * Returns empty array for sectors not covered by SSB ICT-bruk.
 */
private mapSectorToNaceCodes(sector: string): string[] {
  const entry = NACE_SECTORS.find(s => s.code === sector.toUpperCase());
  return entry?.ssbNaceCodes ?? [];
}
```

Slett den hardkodede `mapping`-konstanten i den gamle implementasjonen.

### 3c. Oppdater alle kallesteder

Søk gjennom `ssb-api-client.ts` for `mapSizeToSSBCode(` og `mapping[sector]` — der den brukes til å bygge `valueCodes`-parameteren mot SSB API. Endre:

- Hvis `codes.length === 0`: returner umiddelbart med `{ data: null, reason: 'no-ssb-coverage' }`
- Hvis `codes.length === 1`: bruk single value som før
- Hvis `codes.length > 1`: send komma-separert liste til SSB API (`valueCodes[SyssGrpIKT]=02,03`)

---

## Endring 4 — `no_bus/lib/ssb-transformer.ts`

### 4a. Slett duplikat `mapSizeToSSBCode` (linje 419-432)

Erstatt med import fra api-client (eller flytt felles funksjon til ny `no_bus/lib/ssb-mapping.ts`):

```typescript
import { mapSizeToSSBCodes, mapSectorToNaceCodes } from './ssb-mapping';
```

### 4b. Slett duplikat NACE-mapping (linje 138-170)

Samme prinsipp — én canonical kilde.

### 4c. Hvis du heller vil ha en delt mapping-fil

Lag `no_bus/lib/ssb-mapping.ts` som eksporterer:

```typescript
export function mapSizeToSSBCodes(size: string): string[] { ... }
export function mapSectorToNaceCodes(sector: string): string[] { ... }
export const SSB_NO_COVERAGE_REASON = 'no-ssb-coverage';
```

Og importer fra den i både `ssb-api-client.ts` og `ssb-transformer.ts`. Dette er den anbefalte løsningen.

---

## Endring 5 — `no_bus/src/mapping/dimensionMapping.ts`

Sjekk konsistens med `ssb-transformer.ts` `tableMapping` (linje 18-44). Hvis de er ulike — særlig for `automation` — gjør `dimensionMapping.ts` til canonical og importer i `ssb-transformer.ts`. Slett `tableMapping`-konstanten fra `ssb-transformer.ts`.

---

## Endring 6 — `no_bus/script/extract-ssb-benchmarks.ts`

### 6a. Filtrer sektorer ved oppstart

Etter parsing av `--sector`-argumentet, sjekk at sektoren har SSB-dekning før man iterer:

```typescript
import { NACE_SECTORS } from '../entities/nace-sectors';

const sectorsToProcess = NACE_SECTORS
  .filter(s => s.ssbCoverage !== 'none')
  .filter(s => !options.sector || s.code === options.sector);

if (sectorsToProcess.length === 0) {
  console.error('No sectors to process — sektor mangler SSB-dekning');
  process.exit(1);
}
```

### 6b. Filtrer micro-segmenter

Behold linje 37 (`COMPANY_SIZES = ['small','medium','large']`) — micro er fortsatt ekskludert. Men legg til en eksplisitt kommentar som peker til ny `mapSizeToSSBCodes`-funksjon:

```typescript
// Micro (1-9) ekskludert fordi SSB ICT-bruk ikke har data for foretak under 10 ansatte.
// Se mapSizeToSSBCodes() i no_bus/lib/ssb-mapping.ts for håndtering.
const COMPANY_SIZES = ['small', 'medium', 'large'];
```

### 6c. Tilpass aggregerings-logikk

Når `mapSizeToSSBCodes` returnerer flere koder (small → ['02','03'] og medium → ['04','05']), må extract-logikken hente data for begge og **vekte snittet etter populasjon (foretakstall)**. Forenklet for første implementasjon:

```typescript
const codes = mapSizeToSSBCodes(size);
if (codes.length === 0) {
  return { sector, size, data: null, reason: 'no-ssb-coverage' };
}
// Hent data for hver kode, beregn vektet snitt basert på antall foretak
const cellData = await Promise.all(codes.map(c => ssbClient.getTableData(table, { sizeCode: c, naceCodes })));
const aggregated = aggregateBySize(cellData);  // Bruker vekter fra firm-population (12936/07091)
```

Hvis du ikke har firm-population-data tilgjengelig i første pass, bruk **uvektet snitt** og noter dette som en TODO. Det er bedre enn dagens off-by-one.

---

## Tester

Kjør disse etter endringene for å verifisere:

```bash
cd /Users/haz/c0de/dmsa

# 1. TypeScript-kompilering må holde
npx tsc --noEmit

# 2. Eksisterende tests
npm test

# 3. Sanity-test for SSB-mapping (lag denne om den ikke finnes)
npx tsx no_bus/script/test-sector-size-sanity.ts
```

### Manuelle verifiseringer

**Test 1 — small-bedrift i G (varehandel):**
```typescript
mapSizeToSSBCodes('small')              // → ['02', '03']
mapSectorToNaceCodes('G')               // → ['45', '46', '47']
// Forventet API-kall: GET ...?valueCodes[SyssGrpIKT]=02,03&valueCodes[NACE2007]=45,46,47
```

**Test 2 — large-bedrift i K (finans):**
```typescript
mapSizeToSSBCodes('large')              // → ['05']
mapSectorToNaceCodes('K')               // → ['64-66']
// Forventet: GET ...?valueCodes[SyssGrpIKT]=05&valueCodes[NACE2007]=64-66
```

**Test 3 — micro i hvilken som helst sektor:**
```typescript
mapSizeToSSBCodes('micro')              // → []
// extract-script skal returnere { reason: 'no-ssb-coverage' } uten å kalle SSB API
```

**Test 4 — sektor uten SSB-dekning (O, offentlig):**
```typescript
mapSectorToNaceCodes('O')               // → []
// extract-script skal hoppe over denne sektoren
```

---

## Hva som er ute av scope for DENNE endringen

Følgende er identifisert som problemer men **skal IKKE løses i denne PR-en**:

1. **Tabell-utvalget er for lite (10 av 75 mulige).** Behold de 10 nåværende tabellene. Senere PR utvider.
2. **DMSA-spørsmål Q5/Q6/Q10/Q11 har lav SSB-coverage (20-27 %).** Krever endring i selve spørsmålene — separat diskusjon.
3. **Capgemini-rammeverket som rettesnor.** Ingen UI-endringer i denne PR.
4. **Firestore reseed.** Etter at koden er korrekt, må `seed-firestore.js` kjøres for å regenerere alle 92 segmenter. Det er en separat operasjon.
5. **`lib/benchmark-service.ts`** (hardkodet mock-data). Brukes bare for display-helpers. La den være.

---

## Commit-strategi

Anbefalt: én PR med 6 commits, én per endring:

```
1. data/nace-sectors.ts: legg til ssbCoverage + ssbNaceCodes
2. no_bus/entities/nace-sectors.ts: speil endring fra data/
3. no_bus/lib/ssb-mapping.ts: ny canonical mapping-fil
4. no_bus/lib/ssb-api-client.ts: bruk ssb-mapping, deprecate gamle funksjoner
5. no_bus/lib/ssb-transformer.ts: slett duplikat mapping, importer fra ssb-mapping
6. no_bus/script/extract-ssb-benchmarks.ts: håndter multi-code aggregering + no-coverage
```

PR-tittel-forslag: *"Fix SSB size/NACE mapping — off-by-one across all sizes, no-coverage handling"*

---

## Kontekst om hvorfor dette er kritisk

Dette dokumentet kommer fra en større analyse i `/Users/haz/c0de/SMB-research/`. Den analyse-en hentet 75 SSB-tabeller og bygget en thesis-validation-artifact (`data/derived/thesis_validation.html`). I prosessen oppdaget vi at:

1. SMB-segmentet (10-49) bruker 5.6× høyere andel av omsetning på innovasjon enn enterprise (250+) — men får 1.34× mindre tilbake per sysselsatt (ekskl. olje/gass).
2. Hele SMB-debatten i Norge bygger på sammenligninger som er strukturelt feil-spesifisert.
3. DMSA-MVP er per i dag en del av denne feilspesifiseringen.

Å fikse mappingen betyr ikke at DMSA blir "perfekt" — men det betyr at brukerne får et benchmark som matcher det de faktisk er, ikke et som er forskjøvet en hel størrelseskategori.

---

## Spørsmål før du starter?

Hvis noe i instruksene er uklart, **spør** før du implementerer. Bedre å avklare enn å gjøre 6 endringer i feil retning.

Hvis du vil verifisere mappingen mot et SSB API-kall først, gjør det med curl:

```bash
# Test small-bedrift i G (varehandel) mot tabell 10974 (e-handel)
curl "https://data.ssb.no/api/pxwebapi/v2/tables/10974/data?lang=no&outputformat=json-stat2&valueCodes[SyssGrpIKT]=02,03&valueCodes[NACE2007]=45,46,47"
```

Det skal gi en JSON-stat2-respons med 6 celler (2 størrelser × 3 NACE-koder).
