// Assessment TypeScript definitions for Digital Maturity Assessment (DMA)

export type QuestionType = 'checkboxes' | 'dual-checkboxes' | 'scale-0-5' | 'tri-state';

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

export type Question =
  | CheckboxesQuestion
  | DualCheckboxesQuestion
  | ScaleQuestion
  | TriStateQuestion;

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
  | { type: 'tri-state'; value: 'yes' | 'partial' | 'no' };

export type AnswerMap = Record<string, Answer>; // questionId -> answer

// Scoring and results types
export interface DimensionScore {
  id: string;
  score: number;    // 0..1
  target: number;   // 0..1
  gap: number;      // 0..1
  weight: number;
}

export interface MaturityBand {
  min: number;      // 0..1
  max: number;      // 0..1
  labelKey: string; // localization key
  level: number;    // 1-5
}

export interface AssessmentResults {
  dimensions: DimensionScore[];
  overall: number;              // 0..1
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