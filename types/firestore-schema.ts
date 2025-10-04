/**
 * Unified Firestore Schema Types
 * 
 * This defines the new schema structure that separates public and private data,
 * removes Firebase Storage dependency, and provides proper security boundaries.
 */

import { Timestamp } from 'firebase/firestore';

// Survey lifecycle states
export type SurveyState = 'T0' | 'T1';
export type SurveyVersion = 'v1.0' | 'v1.1';
export type Language = 'no' | 'en';

// Company and user details
export interface CompanyDetails {
  companyName: string;
  companySize: 'micro' | 'small' | 'medium' | 'large'; // EU size categories
  nace: string; // NACE industry code
  sector: 'manufacturing' | 'services' | 'retail' | 'healthcare' | 'education' | 'government' | 'other';
  region: string; // Geographic region
}

export interface UserDetails {
  email: string;
  emailDomain: string; // Extracted from email for analytics
  contactName?: string;
  createdAt: string; // ISO timestamp
  consentAcceptedAt?: string; // GDPR compliance
  policyVersion?: string; // Privacy policy version accepted
}

// Survey flags for state tracking
export interface SurveyFlags {
  isCompleted: boolean; // Assessment completed
  hasResults: boolean; // Results computed and stored
  hasExpandedAccess: boolean; // User provided email (T1 state)
  isAnonymous?: boolean; // Participate anonymously in public leaderboard
}

// Retrieval token for secure access
export interface RetrievalToken {
  tokenHash: string; // SHA-256 hash of token + salt
  createdAt: string; // ISO timestamp
  revoked: boolean; // Token revocation status
}

// Main survey document (no PII, limited client access)
export interface SurveyDocument {
  id: string;
  state: SurveyState;
  surveyVersion: SurveyVersion;
  language: Language;
  createdAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  upgradedAt?: string; // ISO timestamp when T0 -> T1
  companyDetails: CompanyDetails;
  flags: SurveyFlags;
  overallScore?: number; // 0-100 overall maturity score
  retrieval: RetrievalToken;
  scores?: PublicResultsDocument; // Full scores for leaderboard queries
}

// Dimension scores for results
export interface DimensionScore {
  score: number; // 0-100
  target: number; // Target score for improvement
  gap: number; // Gap to target
}

// Maturity classification
export interface MaturityClassification {
  level: number; // 1-4 (Basic, Average, Moderately Advanced, Advanced)
  label: string; // Human-readable label
  band: string; // CSS-friendly band identifier
}

// Public results document (client readable)
export interface PublicResultsDocument {
  dimensions: Record<string, DimensionScore>; // dimensionId -> score
  overall: number; // 0-100 overall score
  maturityClassification: MaturityClassification;
}

// Answers document (client write-only)
export interface AnswersDocument {
  answers: Record<string, unknown>; // questionId -> answer value
}

// Private user details document (client write-only, never readable)
export type PrivateUserDetailsDocument = UserDetails;

// Analytics event types
export type AnalyticsEventType = 
  | 'assessment_started'
  | 'assessment_completed'
  | 'email_captured'
  | 'results_retrieved'
  | 'pdf_downloaded'
  | 'json_exported'
  | 'expanded_access_unlocked'
  | 'assessment_abandoned'
  | 'survey_created'
  | 'survey_upgraded';

// Analytics event document
export interface AnalyticsEvent {
  event: AnalyticsEventType;
  timestamp: string; // ISO timestamp (client-side)
  serverTimestamp: Timestamp | Date; // Server timestamp
  surveyId?: string;
  language?: Language;
  surveyVersion?: SurveyVersion;
  completionTime?: number; // Duration in seconds
  emailDomain?: string; // Domain only, no PII
  companySize?: string;
  sector?: string;
  region?: string;
  abandonedAt?: string; // Where in flow user abandoned
  userAgent?: string;
}

// Global metrics for analytics dashboard
export interface GlobalMetrics {
  totalSurveys: number;
  completedSurveys: number;
  emailCaptures: number;
  retrievalAttempts: number;
  pdfDownloads: number;
  jsonExports: number;
  conversionRate: number; // Email captures / Completed surveys
  lastUpdated: Timestamp | Date;
}

// Benchmark data structure
export interface BenchmarkData {
  mean: number;
  p25: number; // 25th percentile
  p50: number; // Median
  p75: number; // 75th percentile
}

// Benchmark document for industry/size combinations
export interface BenchmarkDocument {
  dimensions: Record<string, BenchmarkData>; // dimensionId -> benchmark stats
  updatedAt: Timestamp | Date;
}

// Collection paths as constants for type safety
export const COLLECTIONS = {
  SURVEYS: 'surveys',
  ANALYTICS_EVENTS: 'analytics_events',
  ANALYTICS: 'analytics',
  BENCHMARKS: 'benchmarks',
  // Subcollections
  RESULTS: 'results',
  ANSWERS: 'answers',
  PRIVATE: 'private',
} as const;

// Document IDs as constants
export const DOCUMENT_IDS = {
  PUBLIC_RESULTS: 'public',
  CURRENT_ANSWERS: 'current',
  USER_DETAILS: 'userDetails',
  GLOBAL_METRICS: 'global_metrics',
} as const;

// Helper types for Firestore operations
export type SurveyRef = `${typeof COLLECTIONS.SURVEYS}/${string}`;
export type AnalyticsEventRef = `${typeof COLLECTIONS.ANALYTICS_EVENTS}/${string}`;
export type BenchmarkRef = `${typeof COLLECTIONS.BENCHMARKS}/${string}/sizes/${string}`;

// Type guards for runtime type checking
export function isSurveyState(value: string): value is SurveyState {
  return value === 'T0' || value === 'T1';
}

export function isLanguage(value: string): value is Language {
  return value === 'no' || value === 'en';
}

export function isAnalyticsEventType(value: string): value is AnalyticsEventType {
  const validEvents: AnalyticsEventType[] = [
    'assessment_started', 'assessment_completed', 'email_captured',
    'results_retrieved', 'pdf_downloaded', 'json_exported',
    'expanded_access_unlocked', 'assessment_abandoned',
    'survey_created', 'survey_upgraded'
  ];
  return validEvents.includes(value as AnalyticsEventType);
}

// Utility types for API responses
export interface CreateSurveyResponse {
  surveyId: string;
  retrievalToken: string; // Only returned once
}

export interface SurveyResultsResponse {
  survey: SurveyDocument;
  results: PublicResultsDocument;
  answers?: AnswersDocument; // Only if authorized
  userDetails?: Partial<UserDetails>; // Only non-sensitive fields if authorized
  hasExpandedAccess: boolean;
}

// Error types for API responses
export interface ApiError {
  error: string;
  code: string;
  details?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// Migration types for data conversion
export interface LegacySurveySubmission {
  id: string;
  version: string;
  language: string;
  timestamp: string;
  answers: Record<string, unknown>;
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

// Token utilities
export interface TokenUtils {
  generateToken(): string;
  hashToken(token: string, salt: string): string;
  verifyToken(token: string, hash: string, salt: string): boolean;
}