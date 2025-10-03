export type TSnapshot = "T0" | "T1" | "T2";

export interface DmaDimensionScore {
  key: string;          // e.g. "digital_business_strategy"
  label: string;        // i18n key or display name
  score: number;        // 0..100
}

export interface DmaScores {
  respondentId: string;
  entityName: string;
  snapshot: TSnapshot;   // optional, defaults T0
  overall: number;       // 0..100
  dimensions: DmaDimensionScore[]; // length 6
  timestamp?: string;
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
  sampleSize: number;               // for "insufficient data" handling
}

export interface DmaResultsPayload {
  scores: DmaScores;
  benchmarks?: DmaBenchmark[];      // optional
  timeSeries?: DmaScores[];         // T0/T1/T2
}

// Component props interfaces
export interface ResultsModalProps {
  open: boolean;
  onClose: () => void;
  data: DmaResultsPayload;
  onDownloadPdf: () => void;
  onRequestSupport?: () => void;
}

export interface OverallScoreProps {
  value: number;
  classification?: {
    level: number;
    label: string;
  };
}

export interface DimensionRadarProps {
  data: DmaDimensionScore[];
  showTarget?: boolean;
  targetData?: DmaDimensionScore[];
}

export interface BenchmarkBarsProps {
  myScores: DmaScores;
  benchmarks: DmaBenchmark[];
}

export interface DimensionGaugesProps {
  data: DmaDimensionScore[];
  interpretations?: Record<string, {
    level: 'Basic' | 'Average' | 'Advanced';
    description: string;
    hints: string[];
  }>;
}

export interface InterpretationHelpProps {
  className?: string;
}

export interface ActionsProps {
  onDownloadPdf: () => void;
  onRequestSupport?: () => void;
  disabled?: boolean;
}

// Analytics and tracking interfaces
export interface SurveyAnalytics {
  submissionCount: number;
  emailCaptures: number;
  retrievalAttempts: number;
  upgradeConversionRate: number; // percentage
  lastUpdated: string;
}

// Email capture form interface
export interface EmailCaptureData {
  email: string;
  companyName: string;
  sector?: string;
  companySize?: "micro" | "small" | "medium" | "large";
  region?: string;
  country?: string;
}