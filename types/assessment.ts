// Assessment TypeScript definitions for Digital Maturity Assessment (DMA)

export type QuestionType = 'checkboxes' | 'dual-checkboxes' | 'scale-0-5' | 'tri-state' | 'table-dual-checkboxes' | 'scale-table' | 'tri-state-table';

export interface Dimension {
  id: string;            // e.g., 'strategy'
  name: string;          // localized key
  description?: string;  // localized key
  weight?: number;       // default 1
  targetLevel?: number;  // 0..1 default 1 (fully mature) for gap analysis
}

export interface Option {
  id: string;            // stable id
  label: string;         // localized key
  weight?: number;       // default 1, used by checkboxes
}

export interface DualOption {
  left: { id: string; label: string; weight?: number };
  right: { id: string; label: string; weight?: number };
}

export interface BaseQuestion {
  id: string;                    // stable id
  dimensionId: string;           // references Dimension.id
  type: QuestionType;
  title: string;                 // localized key
  description?: string;          // localized key
  weight?: number;               // default 1, per question
  required?: boolean;            // default true
}

export interface CheckboxesQuestion extends BaseQuestion {
  type: 'checkboxes';
  options: Option[];
  minSelect?: number;  // optional validation
  maxSelect?: number;  // optional validation
}

export interface DualCheckboxesQuestion extends BaseQuestion {
  type: 'dual-checkboxes';
  options: DualOption;
}

export interface ScaleQuestion extends BaseQuestion {
  type: 'scale-0-5';
  min?: 0; 
  max?: 5; 
  step?: 1;   // fixed to 0..5 discrete
  scaleLabels?: string[];  // optional labels for scale points
}

export interface TriStateQuestion extends BaseQuestion {
  type: 'tri-state';
  triLabels?: { yes: string; partial: string; no: string }; // localized keys
}

export interface TableDualCheckboxesQuestion extends BaseQuestion {
  type: 'table-dual-checkboxes';
  rows: { id: string; label: string }[];
  columns: {
    left: { id: string; label: string; weight?: number };
    right: { id: string; label: string; weight?: number };
  };
}

export interface ScaleTableQuestion extends BaseQuestion {
  type: 'scale-table';
  rows: { id: string; label: string }[];
  scaleLabels: string[]; // localized keys for 0-5 scale
}

export interface TriStateTableQuestion extends BaseQuestion {
  type: 'tri-state-table';
  rows: { id: string; label: string }[];
  triLabels: { yes: string; partial: string; no: string }; // localized keys
}

export type Question =
  | CheckboxesQuestion
  | DualCheckboxesQuestion
  | ScaleQuestion
  | TriStateQuestion
  | TableDualCheckboxesQuestion
  | ScaleTableQuestion
  | TriStateTableQuestion;

export interface AssessmentSpec {
  version: string;
  language: 'no' | 'en';
  dimensions: Dimension[];     // 6 dimensions
  questions: Question[];       // 11 questions
}

// Answer types for different question types
export type Answer =
  | { type: 'checkboxes'; selected: string[] }
  | { type: 'dual-checkboxes'; left: boolean; right: boolean }
  | { type: 'scale-0-5'; value: number } // 0..5
  | { type: 'tri-state'; value: 'yes' | 'partial' | 'no' }
  | { type: 'table-dual-checkboxes'; rows: Record<string, { left: boolean; right: boolean }> }
  | { type: 'scale-table'; rows: Record<string, number> } // rowId -> scale value 0-5
  | { type: 'tri-state-table'; rows: Record<string, 'yes' | 'partial' | 'no'> };

export type AnswerMap = Record<string, Answer>; // questionId -> answer

// Scoring and results types
export interface DimensionScore {
  id: string;
  score: number;    // 0-100
  target: number;   // 0-100
  gap: number;      // 0-100
  weight: number;
}

export interface MaturityBand {
  min: number;      // 0-100
  max: number;      // 0-100
  labelKey: string; // localization key
  level: number;    // 1-4
}

export interface AssessmentResults {
  dimensions: DimensionScore[];
  overall: number;              // 0-100
  classification: MaturityBand;
}

// Export data structure
export interface ExportData {
  version: string;
  language: string;
  timestamp: string;
  answers: AnswerMap;
  scores: {
    dimensions: Array<{
      id: string;
      score: number;
      target: number;
      gap: number;
    }>;
    overall: number;
    classification: {
      level: number;
      label: string;
    };
  };
}

// Company details collected at survey start
export interface CompanyDetails {
  companyName: string;
  naceSector: string; // NACE sector code (A-U)
  companySize: 'micro' | 'small' | 'medium' | 'large';
  country?: string;
  county?: string; // Norwegian county code (03, 11, ...)
}

// User details for T1 survey upgrade
export interface UserDetails {
  email: string;
  companyName: string;
  sector: string; // Mapped from NACE to simple categories
  companySize: 'micro' | 'small' | 'medium' | 'large';
  region?: string;
  country?: string;
}

// Survey assessment timeline (business maturity measurement)
export type AssessmentTimeline = 'T0' | 'T1';
export type SurveyVersion = 'v1.0' | 'v2.0'; // For future platform versioning

// Base survey structure
export interface BaseSurvey {
  id: string;
  timeline: AssessmentTimeline; // T0 = baseline, T1 = after changes
  surveyVersion: SurveyVersion;
  language: 'no' | 'en';
  createdAt: string; // ISO 8601 when survey started
  completedAt?: string; // ISO 8601 when assessment completed
  companyDetails: CompanyDetails;
  answers?: AnswerMap;
  scores?: {
    dimensions: Record<string, { score: number; target: number; gap: number }>;
    overall: number;
    maturityClassification: {
      level: number;
      label: string;
      band: string;
    };
  };
  userDetails?: UserDetails; // Optional email for expanded access
  hasExpandedAccess?: boolean; // Whether user provided email
}

// T0 Survey - Baseline assessment (before implementing changes)
export interface T0Survey extends BaseSurvey {
  timeline: 'T0';
  // This is the initial state assessment
  // Company can use this to plan digital transformation
}

// T1 Survey - Post-implementation assessment (after implementing changes)  
export interface T1Survey extends BaseSurvey {
  timeline: 'T1';
  baselineId: string; // Links back to the original T0 survey
  implementationPeriod?: {
    startDate?: string; // When changes began
    endDate?: string;   // When changes completed
    description?: string; // What changes were made
    investmentAmount?: number; // Optional investment tracking
  };
}

// Union type for all survey timelines
export type Survey = T0Survey | T1Survey;

// Legacy interface for backward compatibility
export interface SurveySubmission {
  id: string;
  version: string;
  language: string;
  timestamp: string; // ISO 8601 string
  answers: AnswerMap;
  scores: {
    dimensions: Record<string, { score: number; target: number; gap: number }>;
    overall: number;
    maturityClassification: {
      level: number;
      label: string;
      band: string;
    };
  };
  userDetails?: {
    email?: string;
    companyName?: string;
    sector?: string;
    companySize?: string;
    region?: string;
    country?: string;
  };
}
