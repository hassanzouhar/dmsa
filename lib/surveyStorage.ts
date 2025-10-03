import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { AssessmentResults } from '@/types/assessment';

export interface StoredSurveyData {
  id: string;
  version: string;
  language: string;
  timestamp: string;
  answers: Record<string, any>;
  scores: {
    dimensions: Array<{
      id: string;
      name: string;
      score: number;
      target?: number;
      gap?: number;
    }>;
    overall: number;
    classification: {
      level: number;
      label: string;
    };
  };
  userDetails?: {
    email?: string;
    companyName?: string;
    sector?: string;
    companySize?: 'micro' | 'small' | 'medium' | 'large';
    region?: string;
    country?: string;
  };
}

/**
 * Save survey results to Firebase Storage
 */
export const saveSurvey = async (data: {
  version: string;
  language: string;
  answers: Record<string, any>;
  results: AssessmentResults;
  userDetails?: StoredSurveyData['userDetails'];
}): Promise<string> => {
  try {
    const id = uuidv4().replace(/-/g, '').substring(0, 10); // Shorter, user-friendly ID
    
    const surveyData: StoredSurveyData = {
      id,
      version: data.version,
      language: data.language,
      timestamp: new Date().toISOString(),
      answers: data.answers,
      scores: {
        dimensions: data.results.dimensions.map(d => ({
          id: d.id,
          name: d.name || d.id,
          score: Math.round(d.score * 100) / 100,
          target: d.targetLevel,
          gap: d.gap ? Math.round(d.gap * 100) / 100 : undefined,
        })),
        overall: Math.round(data.results.overall * 100) / 100,
        classification: data.results.classification,
      },
      userDetails: data.userDetails,
    };

    const surveyRef = ref(storage, `surveys/${id}.json`);
    await uploadString(surveyRef, JSON.stringify(surveyData, null, 2), 'raw', {
      contentType: 'application/json',
    });

    return id;
  } catch (error) {
    console.error('Error saving survey:', error);
    throw new Error('Failed to save survey results');
  }
};

/**
 * Retrieve survey results from Firebase Storage
 */
export const fetchSurvey = async (id: string): Promise<StoredSurveyData> => {
  try {
    const surveyRef = ref(storage, `surveys/${id}.json`);
    const url = await getDownloadURL(surveyRef);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Survey not found');
    }
    
    const data = await response.json();
    return data as StoredSurveyData;
  } catch (error) {
    console.error('Error fetching survey:', error);
    if (error instanceof Error && error.message.includes('object does not exist')) {
      throw new Error('Survey not found with the provided ID');
    }
    throw new Error('Failed to retrieve survey results');
  }
};

/**
 * Update survey with additional user details (for expanded results)
 */
export const updateSurveyDetails = async (
  id: string,
  userDetails: StoredSurveyData['userDetails']
): Promise<void> => {
  try {
    // First fetch the existing survey
    const existingSurvey = await fetchSurvey(id);
    
    // Update with new user details
    const updatedSurvey: StoredSurveyData = {
      ...existingSurvey,
      userDetails: {
        ...existingSurvey.userDetails,
        ...userDetails,
      },
    };

    // Save back to Firebase
    const surveyRef = ref(storage, `surveys/${id}.json`);
    await uploadString(surveyRef, JSON.stringify(updatedSurvey, null, 2), 'raw', {
      contentType: 'application/json',
    });
  } catch (error) {
    console.error('Error updating survey details:', error);
    throw new Error('Failed to update survey details');
  }
};

/**
 * Check if Firebase is properly configured
 */
export const isFirebaseConfigured = (): boolean => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  );
};