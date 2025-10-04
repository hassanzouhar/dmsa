/**
 * Modern Survey API Service - Token-based architecture
 * 
 * Replaces the legacy Firebase Storage approach with secure token-based APIs
 */

import {
  SurveyDocument,
  AnswersDocument,
  CompanyDetails as FirestoreCompanyDetails,
  CreateSurveyResponse,
  SurveyResultsResponse,
  ApiResponse
} from '@/types/firestore-schema';
import { AssessmentResults, AnswerMap } from '@/types/assessment';

// Extended company details for frontend form
export interface CompanyDetailsForm extends Omit<FirestoreCompanyDetails, 'sector'> {
  // Frontend collects NACE, backend derives sector
  sector?: FirestoreCompanyDetails['sector'];
}

export interface SurveySession {
  surveyId: string;
  retrievalToken: string;
  companyDetails: FirestoreCompanyDetails;
  createdAt: string;
}

export interface SurveyResults {
  survey: SurveyDocument;
  results: PublicResultsResponse | null;
  answers?: AnswersDocument;
  hasExpandedAccess: boolean;
}

interface PublicResultsResponse {
  dimensions: Record<string, {
    score: number;
    target: number; 
    gap: number;
  }>;
  overall: number;
  maturityClassification: {
    level: number;
    label: string;
    band: string;
  };
}

/**
 * Create a new survey with company details
 */
export const createSurvey = async (
  companyDetails: CompanyDetailsForm,
  language: 'no' | 'en' = 'no',
  surveyVersion: 'v1.0' | 'v1.1' = 'v1.0'
): Promise<SurveySession> => {
  try {
    const response = await fetch('/api/surveys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyDetails,
        language,
        surveyVersion,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const apiResponse: ApiResponse<CreateSurveyResponse> = await response.json();
    
    if (!apiResponse.success || !apiResponse.data) {
      throw new Error(apiResponse.error?.error || 'Failed to create survey');
    }

    // Return session info for client-side storage
    return {
      surveyId: apiResponse.data.surveyId,
      retrievalToken: apiResponse.data.retrievalToken,
      companyDetails: {
        ...companyDetails,
        sector: 'other' // Will be set properly by backend based on NACE
      },
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating survey:', error);
    throw error instanceof Error ? error : new Error('Failed to create survey');
  }
};

/**
 * Complete survey with assessment answers and results
 */
export const completeSurvey = async (
  surveyId: string,
  answers: AnswerMap,
  results: AssessmentResults,
  retrievalToken?: string,
  isAnonymous?: boolean
): Promise<boolean> => {
  try {
    // This will be implemented as part of the complete survey API
    // For now, we'll use the new results submission approach
    
    const response = await fetch(`/api/surveys/${surveyId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${retrievalToken || ''}`,
      },
      body: JSON.stringify({
        answers,
        isAnonymous,
        results: {
          dimensions: results.dimensions.reduce((acc, dim) => {
            acc[dim.id] = {
              score: Math.round(dim.score),
              target: Math.round(dim.target),
              gap: Math.round(dim.gap)
            };
            return acc;
          }, {} as Record<string, { score: number; target: number; gap: number }>),
          overall: Math.round(results.overall),
          maturityClassification: {
            level: results.classification.level,
            label: results.classification.labelKey,
            band: `level-${results.classification.level}`
          }
        }
      }),
    });

    if (!response.ok) {
      console.error('Failed to complete survey:', response.status, response.statusText);
      return false;
    }

    const apiResponse: ApiResponse = await response.json();
    return apiResponse.success === true;
  } catch (error) {
    console.error('Error completing survey:', error);
    return false;
  }
};

/**
 * Retrieve survey results with token authentication
 */
export const getSurveyResults = async (
  surveyId: string,
  token: string
): Promise<SurveyResults | null> => {
  try {
    const response = await fetch(`/api/surveys/${surveyId}/results?token=${encodeURIComponent(token)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Survey not found
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const apiResponse: ApiResponse<SurveyResultsResponse> = await response.json();
    
    if (!apiResponse.success || !apiResponse.data) {
      throw new Error(apiResponse.error?.error || 'Failed to retrieve survey results');
    }

    const { survey, results, answers, hasExpandedAccess } = apiResponse.data;

    return {
      survey,
      results: results ? {
        dimensions: results.dimensions,
        overall: results.overall,
        maturityClassification: results.maturityClassification,
      } : null,
      answers,
      hasExpandedAccess,
    };
  } catch (error) {
    console.error('Error retrieving survey results:', error);
    return null;
  }
};

/**
 * Upgrade survey to T1 with user details (email capture)
 */
export const upgradeSurveyToT1 = async (
  surveyId: string,
  userDetails: {
    email: string;
    contactName?: string;
  },
  retrievalToken?: string
): Promise<boolean> => {
  try {
    const response = await fetch(`/api/surveys/${surveyId}/upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${retrievalToken || ''}`,
      },
      body: JSON.stringify({
        userDetails: {
          ...userDetails,
          emailDomain: userDetails.email.split('@')[1]?.toLowerCase(),
          createdAt: new Date().toISOString(),
          consentAcceptedAt: new Date().toISOString(),
          policyVersion: 'v1.0', // Current privacy policy version
        }
      }),
    });

    if (!response.ok) {
      console.error('Failed to upgrade survey:', response.status, response.statusText);
      return false;
    }

    const apiResponse: ApiResponse = await response.json();
    return apiResponse.success === true;
  } catch (error) {
    console.error('Error upgrading survey:', error);
    return false;
  }
};

/**
 * Check if survey exists and get basic info
 */
export const checkSurvey = async (
  surveyId: string,
  token: string
): Promise<{
  exists: boolean;
  isCompleted: boolean;
  hasResults: boolean;
  hasExpandedAccess: boolean;
} | null> => {
  try {
    const results = await getSurveyResults(surveyId, token);
    
    if (!results) {
      return { exists: false, isCompleted: false, hasResults: false, hasExpandedAccess: false };
    }

    return {
      exists: true,
      isCompleted: results.survey.flags.isCompleted,
      hasResults: results.survey.flags.hasResults,
      hasExpandedAccess: results.survey.flags.hasExpandedAccess,
    };
  } catch (error) {
    console.error('Error checking survey:', error);
    return null;
  }
};

/**
 * Update anonymous flag for leaderboard participation
 */
export const updateAnonymousFlag = async (
  surveyId: string,
  isAnonymous: boolean,
  retrievalToken?: string
): Promise<boolean> => {
  try {
    const response = await fetch(`/api/surveys/${surveyId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${retrievalToken || ''}`,
      },
      body: JSON.stringify({
        isAnonymous
      }),
    });

    if (!response.ok) {
      console.error('Failed to update anonymous flag:', response.status);
      return false;
    }

    const apiResponse: ApiResponse = await response.json();
    return apiResponse.success === true;
  } catch (error) {
    console.error('Error updating anonymous flag:', error);
    return false;
  }
};

/**
 * Session management utilities
 */
export const SessionStorage = {
  key: 'dma-survey-session',
  
  save(session: SurveySession): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.key, JSON.stringify(session));
      } catch (error) {
        console.error('Failed to save survey session:', error);
      }
    }
  },

  load(): SurveySession | null {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.key);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error('Failed to load survey session:', error);
        return null;
      }
    }
    return null;
  },

  clear(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.key);
    }
  },

  exists(): boolean {
    return this.load() !== null;
  }
};

/**
 * Legacy compatibility layer - gradually remove these
 */

// For backward compatibility with existing results page
export interface LegacySurveyData {
  id: string;
  version: string;
  language: string;
  timestamp: string;
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
  };
  hasExpandedAccess?: boolean;
}

/**
 * Convert new API response to legacy format for existing components
 */
export const convertToLegacyFormat = (surveyResults: SurveyResults): LegacySurveyData | null => {
  if (!surveyResults.results) return null;

  return {
    id: surveyResults.survey.id,
    version: surveyResults.survey.surveyVersion,
    language: surveyResults.survey.language,
    timestamp: surveyResults.survey.createdAt,
    scores: {
      dimensions: surveyResults.results.dimensions,
      overall: surveyResults.results.overall,
      maturityClassification: surveyResults.results.maturityClassification,
    },
    userDetails: surveyResults.hasExpandedAccess ? {
      companyName: surveyResults.survey.companyDetails.companyName,
      sector: surveyResults.survey.companyDetails.sector,
      companySize: surveyResults.survey.companyDetails.companySize,
      region: surveyResults.survey.companyDetails.region,
    } : undefined,
    hasExpandedAccess: surveyResults.hasExpandedAccess,
  };
};