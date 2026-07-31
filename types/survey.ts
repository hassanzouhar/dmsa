/**
 * API-typer for survey-endepunktene.
 *
 * Erstatter types/firestore-schema.ts. Datamodell-typene (SurveyRow,
 * SurveyDocument, Scores, CompanySize …) bor nå i lib/db.ts sammen med
 * spørringene som produserer dem; her ligger bare formen på HTTP-svarene.
 *
 * Firestore-spesifikke typer er fjernet: Timestamp-baserte felter,
 * AnalyticsEvent, GlobalMetrics, BenchmarkDocument og COLLECTIONS/
 * DOCUMENT_IDS-konstantene hadde ingen lesere.
 */

import type {
  CompanySize,
  DimensionScore,
  Language,
  Scores,
  SurveyDocument,
  SurveyVersion,
} from '@/lib/db';

export type {
  CompanySize,
  DimensionScore,
  Language,
  Scores,
  SurveyDocument,
  SurveyVersion,
};

/** Svarene på ett survey, slik de returneres fra API-et. */
export interface AnswersDocument {
  answers: Record<string, unknown>;
}

export type SurveyState = 'T0' | 'T1';

export interface CompanyDetails {
  companyName: string;
  companySize: CompanySize;
  nace: string;
  sector: string;
  region: string;
}

/** Ikke-sensitive kontaktfelter som kan returneres til en autorisert bruker. */
export interface PublicUserDetails {
  emailDomain: string;
  createdAt: string;
  consentAcceptedAt?: string;
  policyVersion?: string;
}

export interface CreateSurveyResponse {
  surveyId: string;
  retrievalToken: string; // Only returned once
}

export interface SurveyResultsResponse {
  survey: SurveyDocument;
  results: Scores | null;
  answers?: { answers: Record<string, unknown> };
  userDetails?: PublicUserDetails;
  hasExpandedAccess: boolean;
}

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

export function isSurveyState(value: string): value is SurveyState {
  return value === 'T0' || value === 'T1';
}

export function isLanguage(value: string): value is Language {
  return value === 'no' || value === 'en';
}
