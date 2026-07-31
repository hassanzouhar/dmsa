/**
 * SSB Data Transformer
 *
 * Transforms SSB statistics into benchmark scores and strategic intelligence
 * for the 6 digital maturity dimensions.
 */

import type { DimensionKey } from '../src/benchmarks/types';
import { tableMapping, type DimensionConfig } from '../src/mapping/dimensionMapping';
import { mapSectorToNaceCodes, mapSizeToSSBCodes, regionCodeVariants } from './ssb-mapping';

// Re-eksporter for bakoverkompatibilitet (tidligere kallesteder importerte
// `tableMapping` fra denne filen). Canonical bor nå i dimensionMapping.ts.
export { tableMapping };
export type { DimensionConfig };

/**
 * Spredningen mellom SSB-indikatorene som mater én dimensjon.
 *
 * NB: dette er IKKE en fordeling over virksomheter. Hver dimensjon har 1–3
 * SSB-tabeller, og feltene beskriver spredningen mellom de tabellenes skårer.
 * De het tidligere p25/p50/p75, noe som fikk «indikator nr. 3» til å se ut som
 * «topp-kvartilen av foretak».
 */
interface DimensionScore {
  average: number;
  indicatorMin: number;
  indicatorMedian: number;
  indicatorMax: number;
  /** Antall SSB-tabeller som faktisk bidro med en verdi (0–3). */
  indicatorCount: number;
  score?: number;
}

interface BenchmarkData {
  sector: string;
  companySize: string;
  dimensions: Record<string, DimensionScore>;
  overall: {
    average: number;
  };
  dataSource: 'ssb' | 'ssb-inferred' | 'fallback';
  hasSufficientData: boolean;
  lastUpdated: string;
  ssbTables: string[];
  metadata?: {
    generatedAt: string;
    /** Dimensjoner der for få SSB-indikatorer ga en verdi. */
    lowCoverageDimensions: string[];
    sector?: string;
    companySize?: string;
    region?: string;
    dimensionSources?: Record<DimensionKey, { tables: string[]; indicators: string[] }>;
  };
}

// Merk: `intelligence`-blokken (successPatterns/commonChallenges) er fjernet.
// Den var i sin helhet hardkodede tall som ble skrevet til Firestore merket
// `dataSource: 'ssb'`. Feltet er fortsatt valgfritt i skjemaet og kan fylles
// igjen når tallene faktisk kan utledes fra SSB-tabellene.

interface Recommendation {
  dimension: string;
  priority: 'high' | 'medium' | 'low';
  insight: string;
  action: string;
  challenge?: string;
  successRate?: number;
  timeToValue?: string;
  investment?: 'low' | 'medium' | 'high';
}

export class SSBTransformer {
  private missingSectorMappings = new Set<string>();
  private missingSizeMappings = new Set<string>();
  private nullValueHits = new Map<string, number>();

  /**
   * Resolverer SSB ICT-bruk NACE-koder for en DMSA-sektor.
   * Returnerer tom array hvis sektoren ikke har SSB-dekning — kalleren
   * må sjekke og hoppe over uthenting når det er tilfelle.
   * (Tidligere fall-back til 'Total' osv. er fjernet — det skjulte
   * dekningshull mer enn det hjalp.)
   *
   * `tableId` beholdes i signaturen for fremtidig bruk (per-tabell-overstyring),
   * men brukes ikke i dag — alle tabeller deler samme NACE-mapping.
   */
  private resolveSectorCodes(sector: string, tableId: string): string[] {
    void tableId;
    return mapSectorToNaceCodes(sector);
  }

  /**
   * Transform SSB percentage to 0-100 score
   */
  private percentageToScore(percentage: number, isAdvancedTech: boolean = false): number {
    if (isAdvancedTech) {
      // For advanced tech (0-5 scale), direct conversion
      return Math.round((percentage / 5) * 100);
    }

    // For basic adoption percentages
    return Math.round(percentage);
  }

  /**
   * Extract dimension score from multiple SSB tables
   */
  transformDimensionScore(
    dimensionId: DimensionKey,
    ssbData: Record<string, any>,
    sector: string,
    companySize: string,
    region?: string
  ): DimensionScore {
    const empty: DimensionScore = {
      average: 0,
      indicatorMin: 0,
      indicatorMedian: 0,
      indicatorMax: 0,
      indicatorCount: 0,
      score: 0
    };

    const config = tableMapping[dimensionId];
    if (!config) return empty;

    const { tables: tableIds, weights } = config;

    const scores: number[] = [];

    // DMSA "small"/"medium" dekker to SSB-sysselsettingsbins hver. Begge hentes
    // allerede fra SSB — her snittes de uvektet i stedet for at bare den første
    // brukes (som gjorde "small" til bare 10–19 og "medium" til bare 50–99).
    const sizeCodes = mapSizeToSSBCodes(companySize);

    for (const tableId of tableIds) {
      const tableData = ssbData[tableId];
      if (!tableData) continue;

      try {
        const sectorCodes = this.resolveSectorCodes(sector, tableId);
        const tableValues: number[] = [];

        for (const sectorCode of sectorCodes) {
          for (const sizeCode of sizeCodes) {
            const extracted = this.extractDataFromJSONStat(
              tableData,
              sectorCode,
              sizeCode,
              region,
              { tableId, dimensionId, sectorCode }
            );
            if (extracted) {
              tableValues.push(extracted.value);
            }
          }
        }

        if (tableValues.length) {
          const avgValue = tableValues.reduce((sum, v) => sum + v, 0) / tableValues.length;
          const direction = weights?.[tableId] ?? 1;
          const adjustedValue = direction === -1 ? 100 - avgValue : avgValue;
          scores.push(this.percentageToScore(adjustedValue));
        }
      } catch (error) {
        console.warn(`⚠️  Failed to extract from table ${tableId}:`, error);
      }
    }

    if (scores.length === 0) return empty;

    // Spredning mellom indikatorene — ikke en fordeling over foretak.
    const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = (sorted.length - 1) / 2;
    const median = sorted.length % 2 === 1
      ? sorted[mid]
      : (sorted[Math.floor(mid)] + sorted[Math.ceil(mid)]) / 2;
    const average = clamp100(scores.reduce((s, v) => s + v, 0) / scores.length);

    return {
      average,
      indicatorMin: clamp100(sorted[0]),
      indicatorMedian: clamp100(median),
      indicatorMax: clamp100(sorted[sorted.length - 1]),
      indicatorCount: scores.length,
      score: average
    };
  }

  /**
   * Extract value from JSON-stat2 format
   *
   * JSON-stat2 structure:
   * - id: array of dimension names in order (e.g., ["SyssGrpIKT", "NACE2007", "ContentsCode", "Tid"])
   * - size: array of dimension sizes (e.g., [1, 1, 5, 1])
   * - dimension: object with dimension details and category indices
   * - value: flat array in row-major order
   *
   * To find a value:
   * 1. Get index for each dimension from dimension.{name}.category.index
   * 2. Calculate flat array position using row-major formula
   */
  private extractDataFromJSONStat(
    jsonStatData: any,
    resolvedSectorCode: string,
    ssbSizeCode: string,
    region?: string,
    context?: { tableId: string; dimensionId: string; sectorCode: string }
  ): { value: number } | null {
    if (!jsonStatData?.value || !jsonStatData?.dimension || !jsonStatData?.id || !jsonStatData?.size) {
      return null;
    }

    try {
      const dimensions = jsonStatData.id;
      const sizes = jsonStatData.size;
      const dimensionData = jsonStatData.dimension;
      const values = jsonStatData.value;

      // Build index array for the coordinates we want
      const indices: number[] = [];

      for (const dimName of dimensions) {
        const dim = dimensionData[dimName];
        if (!dim?.category?.index) {
          // If dimension has no filtering, use index 0
          indices.push(0);
          continue;
        }

        // Check if this is sector dimension
        if (dimName === 'NACE2007' || dimName.toLowerCase().includes('nace')) {
          const sectorKeys = Object.keys(dim.category.index);
          // If we already filtered by sector in the query, there's only one value
          if (sectorKeys.length === 1) {
            indices.push(0);
          } else {
            const sectorIndex = dim.category.index[resolvedSectorCode];
            if (sectorIndex === undefined) {
              const key = `${context?.tableId ?? 'unknown'}::${resolvedSectorCode}`;
              if (!this.missingSectorMappings.has(key)) {
                this.missingSectorMappings.add(key);
                console.warn(
                  `⚠️ Missing sector mapping for table ${context?.tableId ?? 'unknown'} (${context?.dimensionId ?? 'unknown'}) -> ${context?.sectorCode ?? 'unknown'} resolved as ${resolvedSectorCode}. Available: ${sectorKeys.join(', ')}`
                );
              }
              // Ikke fall tilbake til indeks 0 — det ville lest en HELT ANNEN
              // sektors tall og lagret dem som denne sektorens benchmark.
              return null;
            } else {
              indices.push(sectorIndex);
            }
          }
        }
        // Check if this is size dimension
        else if (dimName === 'SyssGrpIKT' || dimName.toLowerCase().includes('syss')) {
          const sizeKeys = Object.keys(dim.category.index);
          if (sizeKeys.length === 1) {
            indices.push(0);
          } else {
            const sizeIndex = dim.category.index[ssbSizeCode];
            if (sizeIndex === undefined) {
              const key = `${context?.tableId ?? 'unknown'}::${ssbSizeCode}`;
              if (!this.missingSizeMappings.has(key)) {
                this.missingSizeMappings.add(key);
                console.warn(
                  `⚠️ Missing size mapping for table ${context?.tableId ?? 'unknown'} (${context?.dimensionId ?? 'unknown'}) -> SSB-kode ${ssbSizeCode}. Available: ${sizeKeys.join(', ')}`
                );
              }
              // Samme grunn som for sektor: heller ingen verdi enn feil størrelse.
              return null;
            } else {
              indices.push(sizeIndex);
            }
          }
        }
        // Region dimension
        else if (dimName.toLowerCase().match(/region|fylke|county|kommune/)) {
          const keys = Object.keys(dim.category.index);
          if (keys.length === 1) {
            indices.push(0);
          } else {
            const idx = this.resolveRegionIndex(dim.category.index, region);
            if (idx === undefined) return null;
            indices.push(idx);
          }
        }
        // For other dimensions (ContentsCode, Tid, etc), use first value
        else {
          indices.push(0);
        }
      }

      // Calculate flat array position using row-major order
      // Formula: index = i₀ + i₁*s₀ + i₂*s₀*s₁ + ... + iₙ*s₀*s₁*...*sₙ₋₁
      let flatIndex = 0;
      let multiplier = 1;

      for (let i = dimensions.length - 1; i >= 0; i--) {
        flatIndex += indices[i] * multiplier;
        multiplier *= sizes[i];
      }

      const value = values[flatIndex];

      // SSB returns null for missing data
      if (value === null || value === undefined) {
        if (context?.tableId) {
          const key = `${context.tableId}::${context.dimensionId ?? 'unknown'}::${resolvedSectorCode}`;
          const hits = this.nullValueHits.get(key) ?? 0;
          this.nullValueHits.set(key, hits + 1);
        }
        return null;
      }

      // SSB oppgir ikke utvalgsstørrelse i responsen — vi later ikke som noe annet.
      return { value: typeof value === 'number' ? value : parseFloat(value) };
    } catch (error) {
      console.warn('Failed to extract data from JSON-stat2:', error);
      return null;
    }
  }

  private resolveRegionIndex(indexObj: Record<string, number>, region?: string): number | undefined {
    if (!region) return undefined;
    for (const variant of regionCodeVariants(region)) {
      if (indexObj[variant] !== undefined) return indexObj[variant];
    }
    return undefined;
  }

  getDebugStats() {
    return {
      missingSectorMappings: Array.from(this.missingSectorMappings),
      missingSizeMappings: Array.from(this.missingSizeMappings),
      nullValueHits: Array.from(this.nullValueHits.entries()).map(([key, hits]) => ({ key, hits }))
    };
  }

  /**
   * Generate recommendations based on benchmark data.
   *
   * Måler mot dimensjonens sterkeste SSB-indikator (`indicatorMax`) — ikke mot
   * en «topp-kvartil av foretak», som datagrunnlaget ikke gir oss.
   */
  generateRecommendations(
    userScore: Record<string, number>,
    benchmarkData: Record<string, DimensionScore>
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const [dimension, benchmark] of Object.entries(benchmarkData)) {
      if (benchmark.indicatorCount === 0) continue;

      const gap = benchmark.indicatorMax - (userScore[dimension] || 0);

      if (gap <= 10) continue; // Only recommend if significant gap

      const priority = this.categorizePriority(gap, dimension);

      const rec: Recommendation = {
        dimension,
        priority,
        insight: `Din sektor ligger på ${benchmark.average}% i snitt over ${benchmark.indicatorCount} ` +
                 `SSB-indikator(er), med ${benchmark.indicatorMax}% på den sterkeste. ` +
                 `Du scorer ${userScore[dimension] || 0}%, ${gap} poeng under den.`,
        action: this.generateAction(dimension),
        challenge: this.generateChallenge(dimension),
        successRate: 0.75,
        timeToValue: gap > 20 ? '6-12 months' : '3-6 months',
        investment: gap > 20 ? 'medium' : 'low'
      };

      recommendations.push(rec);
    }

    return recommendations.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      return priorityScore[b.priority] - priorityScore[a.priority];
    });
  }

  private categorizePriority(gap: number, dimension: string): 'high' | 'medium' | 'low' {
    const criticalDimensions = ['dataManagement', 'automation'];

    if (gap > 20 && criticalDimensions.includes(dimension)) return 'high';
    if (gap > 20 || criticalDimensions.includes(dimension)) return 'medium';
    return 'low';
  }

  private generateAction(dimension: string): string {
    const actions: Record<string, string> = {
      automation: 'Start med AI for prosessautomatisering - 42% av peers oppnådde ROI innen 12 måneder',
      digitalReadiness: 'Implementer cloud services for e-post og fillagring - laveste risiko, høyest benefit',
      dataManagement: 'Implementer phishing-trening for ansatte og backup-prosedyrer',
      digitalStrategy: 'Identifiser digitaliseringsbehov og sikre finansiering for neste år',
      humanCentric: 'Gjennomfør kompetansekartlegging og opprett opplæringsplan',
      greenDigitalization: 'Start med papirløse administrative prosesser (e-faktura)'
    };

    return actions[dimension] || 'Vurder digitaliseringstiltak i denne dimensjonen';
  }

  private generateChallenge(dimension: string): string | undefined {
    const challenges: Record<string, string> = {
      automation: 'Manglende kompetanse (52% barrier) - vurder ekstern opplæring eller konsulentbistand',
      digitalReadiness: 'Sikkerhetshensyn (48% barrier) - velg norsk/EU-basert leverandør',
      dataManagement: 'Balanser sikkerhet med brukervennlighet - 35% sliter med dette',
    };

    return challenges[dimension];
  }

  /**
   * Transform complete benchmark data for a segment
   */
  async transformBenchmark(
    ssbData: Record<string, any>,
    sector: string,
    companySize: string,
    region?: string
  ): Promise<BenchmarkData> {
    const dimensionIds = Object.keys(tableMapping) as DimensionKey[];

    const dimensions: Partial<Record<DimensionKey, DimensionScore>> = {};
    let inferred = false;

    // Handle micro (1–9) inference when SSB lacks coverage
    const sizeForExtraction = companySize === 'micro' ? 'small' : companySize;

    for (const dimensionId of dimensionIds) {
      const raw = this.transformDimensionScore(
        dimensionId,
        ssbData,
        sector,
        sizeForExtraction,
        region
      );

      if (companySize === 'micro') {
        inferred = true;
        const factor = 0.6; // see docs/SSB_EXTRACTION_GUIDE.md
        dimensions[dimensionId] = {
          average: Math.round((raw.average ?? 0) * factor),
          indicatorMin: Math.round(raw.indicatorMin * factor),
          indicatorMedian: Math.round(raw.indicatorMedian * factor),
          indicatorMax: Math.round(raw.indicatorMax * factor),
          indicatorCount: raw.indicatorCount,
          score: Math.round((raw.average ?? 0) * factor)
        };
      } else {
        dimensions[dimensionId] = raw;
      }
    }

    // Calculate overall score
    const overallAvg = Math.round(
      dimensionIds.reduce((sum, id) => sum + (dimensions[id]?.average ?? 0), 0) / dimensionIds.length
    );

    // SSB gir ingen utvalgsstørrelse, så «nok data» må måles i antall indikatorer
    // som faktisk ga en verdi. Den gamle terskelen (`sampleSize < 30`) kunne aldri
    // slå ut, siden hver celle ble tildelt en oppdiktet sampleSize på 100.
    // greenDigitalization har bare én konfigurert tabell, så terskelen må være
    // relativ til hva dimensjonen faktisk kan levere.
    const lowCoverageDimensions = dimensionIds.filter((dimensionId) => {
      const required = Math.min(2, tableMapping[dimensionId].tables.length);
      return (dimensions[dimensionId]?.indicatorCount ?? 0) < required;
    });
    const generatedAt = new Date().toISOString();
    const hasSufficientData = !inferred && lowCoverageDimensions.length === 0;

    const dimensionSources = Object.fromEntries(
      dimensionIds.map(dim => [
        dim,
        {
          tables: tableMapping[dim].tables,
          indicators: tableMapping[dim].indicators
        }
      ])
    ) as Record<DimensionKey, { tables: string[]; indicators: string[] }>;

    return {
      sector,
      companySize,
      dimensions: dimensions as Record<DimensionKey, DimensionScore>,
      // `top25` og `sampleSize` er utelatt med vilje — de var henholdsvis
      // `snitt + 15` og konstanten 450, altså tall uten grunnlag i SSB-dataene.
      overall: {
        average: overallAvg
      },
      dataSource: inferred ? 'ssb-inferred' : 'ssb',
      hasSufficientData,
      lastUpdated: generatedAt,
      ssbTables: Array.from(new Set(Object.values(tableMapping).flatMap(cfg => cfg.tables))),
      metadata: {
        generatedAt,
        lowCoverageDimensions,
        sector,
        companySize,
        ...(region ? { region } : {}),
        dimensionSources
      }
    };
  }
}

export const ssbTransformer = new SSBTransformer();
