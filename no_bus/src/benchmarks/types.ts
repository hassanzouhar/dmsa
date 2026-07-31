export type DimensionKey =
  | 'digitalStrategy'
  | 'digitalReadiness'
  | 'humanCentric'
  | 'dataManagement'
  | 'automation'
  | 'greenDigitalization';

/**
 * Spredningen mellom SSB-indikatorene som mater én dimensjon.
 * Feltene het tidligere p25/p50/p75/sampleSize, men beskrev aldri en fordeling
 * over foretak — bare 1–3 indikatorskårer. Navnene sier nå hva de er.
 */
export type DimensionScore = {
  average: number;
  indicatorMin: number;
  indicatorMedian: number;
  indicatorMax: number;
  indicatorCount: number;
};

export type BenchmarkDoc = {
  segmentId: string;
  dimensions: Record<DimensionKey, DimensionScore>;
  intelligence?: {
    successPatterns?: string[];
    commonChallenges?: string[];
  };
  metadata?: Record<string, unknown>;
};
