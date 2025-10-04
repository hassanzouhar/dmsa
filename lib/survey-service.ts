import { ref, uploadString, getDownloadURL, getMetadata } from 'firebase/storage';
import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { storage, db } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { SurveySubmission } from '@/types/assessment';

/**
 * Save survey data to both Firebase Storage (full data) and Firestore (metadata + summary)
 */
export const saveSurvey = async (data: Omit<SurveySubmission, 'id'>): Promise<string> => {
  const id = uuidv4().replace(/-/g, '').substring(0, 10); // 10 character unique ID
  
  const surveyData: SurveySubmission = {
    id,
    ...data,
  };

  try {
    // 1. Save full data to Firebase Storage as JSON file
    const storageRef = ref(storage, `surveys/${id}.json`);
    await uploadString(storageRef, JSON.stringify(surveyData, null, 2), 'raw', {
      contentType: 'application/json',
    });

    // 2. Save metadata and summary to Firestore for querying
    const firestoreRef = doc(db, 'surveys', id);
    await setDoc(firestoreRef, {
      id,
      timestamp: surveyData.timestamp,
      version: surveyData.version,
      language: surveyData.language,
      scores: surveyData.scores,
      userDetails: surveyData.userDetails || null,
      hasExpandedAccess: !!(surveyData.userDetails?.email),
    });

    return id;
  } catch (error) {
    console.error('Error saving survey:', error);
    throw new Error('Failed to save survey data');
  }
};

/**
 * Retrieve survey data from Firebase Storage (server-side)
 * Used directly by API routes to avoid circular dependencies
 */
export const fetchSurveyFromStorage = async (id: string): Promise<SurveySubmission | null> => {
  try {
    const storageRef = ref(storage, `surveys/${id}.json`);
    const url = await getDownloadURL(storageRef);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data as SurveySubmission;
  } catch (error) {
    console.error('Error fetching survey from storage:', error);
    return null;
  }
};

/**
 * Retrieve survey data via API route (client-side)
 * Avoids CORS issues by proxying through Next.js API
 */
export const fetchSurvey = async (id: string): Promise<SurveySubmission | null> => {
  try {
    const response = await fetch(`/api/dma/results?respondentId=${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Survey not found
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiResponse = await response.json();
    return apiResponse.data?.survey as SurveySubmission || null;
  } catch (error) {
    console.error('Error fetching survey:', error);
    return null;
  }
};

/**
 * Update survey with user details for expanded access
 */
export const updateSurveyUserDetails = async (
  id: string, 
  userDetails: SurveySubmission['userDetails']
): Promise<boolean> => {
  try {
    // 1. Get existing data from storage
    const existingData = await fetchSurveyFromStorage(id);
    if (!existingData) {
      throw new Error('Survey not found');
    }

    // 2. Update with user details
    const updatedData: SurveySubmission = {
      ...existingData,
      userDetails,
    };

    // 3. Save updated data back to storage
    const storageRef = ref(storage, `surveys/${id}.json`);
    await uploadString(storageRef, JSON.stringify(updatedData, null, 2), 'raw', {
      contentType: 'application/json',
    });

    // 4. Update Firestore metadata
    const firestoreRef = doc(db, 'surveys', id);
    await setDoc(firestoreRef, {
      userDetails,
      hasExpandedAccess: true,
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error updating survey user details:', error);
    return false;
  }
};

/**
 * Check if survey exists and get basic metadata
 */
export const checkSurveyExists = async (id: string): Promise<{
  exists: boolean;
  hasExpandedAccess?: boolean;
  timestamp?: string;
} | null> => {
  try {
    const firestoreRef = doc(db, 'surveys', id);
    const docSnap = await getDoc(firestoreRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        exists: true,
        hasExpandedAccess: data.hasExpandedAccess || false,
        timestamp: data.timestamp,
      };
    } else {
      return { exists: false };
    }
  } catch (error) {
    console.error('Error checking survey existence:', error);
    return null;
  }
};

/**
 * Get recent surveys (for admin/analytics - requires Firestore)
 */
export const getRecentSurveys = async (limitCount: number = 10) => {
  try {
    const surveysRef = collection(db, 'surveys');
    const q = query(surveysRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching recent surveys:', error);
    return [];
  }
};

/**
 * Export survey data for download
 */
export const exportSurveyData = (surveyData: SurveySubmission, format: 'json' | 'text' | 'pdf' = 'json') => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `dma-survey-${surveyData.id}-${timestamp}`;
  
  if (format === 'pdf') {
    // PDF export is handled by the PDFDownloadButton component
    // This is just a placeholder - actual PDF generation happens in the component
    console.log('PDF export requested - use PDFDownloadButton component instead');
    return;
  } else if (format === 'json') {
    const dataStr = JSON.stringify(surveyData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${filename}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  } else {
    // Text summary format
    const textSummary = `
Digital Maturity Assessment Results
Survey ID: ${surveyData.id}
Completed: ${new Date(surveyData.timestamp).toLocaleDateString()}
Language: ${surveyData.language.toUpperCase()}

OVERALL SCORE: ${surveyData.scores.overall}/100
Maturity Level: ${surveyData.scores.maturityClassification.label}

DIMENSION SCORES:
${Object.entries(surveyData.scores.dimensions).map(([dim, score]) => 
  `- ${dim}: ${score.score}/100 (Target: ${score.target}, Gap: ${score.gap})`
).join('\n')}

${surveyData.userDetails ? `
COMPANY DETAILS:
Company: ${surveyData.userDetails.companyName || 'N/A'}
Email: ${surveyData.userDetails.email || 'N/A'}
Sector: ${surveyData.userDetails.sector || 'N/A'}
Size: ${surveyData.userDetails.companySize || 'N/A'}
Region: ${surveyData.userDetails.region || 'N/A'}
` : ''}
    `.trim();
    
    const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(textSummary);
    const exportFileDefaultName = `${filename}.txt`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
};