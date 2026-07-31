/**
 * Firestore Schema Definitions
 *
 * Type-safe collection and document references
 */

// Collection names
export const COLLECTIONS = {
  SURVEYS: 'surveys',
  ANALYTICS: 'analytics',
  ANALYTICS_EVENTS: 'analytics_events',
  BENCHMARKS: 'benchmarks',
  RESULTS: 'results',
  ANSWERS: 'answers',
  PRIVATE: 'private',
} as const;

// Document IDs
export const DOCUMENT_IDS = {
  GLOBAL_METRICS: 'global',
  PUBLIC_RESULTS: 'public',
  CURRENT_ANSWERS: 'current',
  USER_DETAILS: 'user',
} as const;

// Type definitions
export interface CompanyDetails {
  companyName?: string;
  companySize: 'micro' | 'small' | 'medium' | 'large';
  sector: string;
  nace?: string;
  region?: string;
}

export interface DimensionScore {
  score: number;
  target: number;
  gap: number;
  weight?: number;
}

export interface SurveyDocument {
  id: string;
  state: 'T0' | 'T1';
  surveyVersion: string;
  language: string;
  createdAt: string;
  completedAt?: string;
  companyDetails: CompanyDetails;
  flags: {
    isCompleted: boolean;
    hasResults: boolean;
    hasExpandedAccess: boolean;
    includeInLeaderboard: boolean;
  };
  overallScore?: number;
  retrieval: {
    tokenHash: string;
    createdAt: string;
    revoked: boolean;
  };
  scores?: {
    dimensions: Record<string, DimensionScore>;
    overall: number;
    maturityClassification: {
      level: number;
      label: string;
      band: string;
    };
  };
  upgradedAt?: string;
}

export interface BenchmarkDocument {
  sector: string;
  companySize: string;
  dimensions: Record<string, {
    score: number;
    average: number;
    /** Spredning mellom dimensjonens SSB-indikatorer — ikke en foretaksfordeling. */
    indicatorMin: number;
    indicatorMedian: number;
    indicatorMax: number;
    /** Antall SSB-tabeller som faktisk ga en verdi. */
    indicatorCount: number;
  }>;
  overall: {
    average: number;
    /** Kun satt når det finnes et reelt datagrunnlag — SSB-uttrekket setter dem ikke. */
    top25?: number;
    sampleSize?: number;
  };
  intelligence?: {
    successPatterns?: any;
    commonChallenges?: any;
    recommendations?: any[];
  };
  dataSource: 'ssb' | 'ssb-inferred' | 'fallback' | 'user-data';
  hasSufficientData: boolean;
  lastUpdated: string;
  ssbTables?: string[];
  updatedAt?: string;
}

export interface AnalyticsEvent {
  event: string;
  timestamp: string;
  surveyId?: string;
  language?: string;
  surveyVersion?: string;
  [key: string]: any;
}

export interface GlobalMetrics {
  totalSurveys: number;
  completedSurveys: number;
  emailCaptures: number;
  retrievalAttempts: number;
  pdfDownloads: number;
  jsonExports: number;
  conversionRate: number;
  lastUpdated: any; // Firestore Timestamp
}
