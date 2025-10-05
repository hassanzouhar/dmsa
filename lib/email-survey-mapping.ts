/**
 * Email to Survey Mapping Service
 *
 * Manages the relationship between user emails and their surveys.
 * Uses hashed emails for privacy.
 */

import { getAdminFirestore } from './firebase-admin';
import crypto from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';

const EMAIL_SURVEYS_COLLECTION = 'email_surveys';

/**
 * Hash an email for use as a document ID
 * Uses SHA256 of normalized (lowercase, trimmed) email
 */
export function hashEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Add a survey to an email's survey list
 */
export async function addSurveyToEmail(
  email: string,
  surveyId: string
): Promise<void> {
  const db = getAdminFirestore();
  const emailHash = hashEmail(email);
  const docRef = db.collection(EMAIL_SURVEYS_COLLECTION).doc(emailHash);

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      if (doc.exists) {
        // Add survey if not already in list
        const data = doc.data();
        const surveyIds = data?.surveyIds || [];

        if (!surveyIds.includes(surveyId)) {
          transaction.update(docRef, {
            surveyIds: [...surveyIds, surveyId],
            lastUpdated: Timestamp.now(),
            surveyCount: surveyIds.length + 1,
          });
        }
      } else {
        // Create new mapping
        transaction.set(docRef, {
          emailHash,
          surveyIds: [surveyId],
          lastUpdated: Timestamp.now(),
          surveyCount: 1,
        });
      }
    });

    console.log(`✅ Added survey ${surveyId} to email mapping`);
  } catch (error) {
    console.error('Failed to add survey to email mapping:', error);
    throw error;
  }
}

/**
 * Get all survey IDs for an email
 */
export async function getSurveysByEmail(email: string): Promise<string[]> {
  const db = getAdminFirestore();
  const emailHash = hashEmail(email);
  const docRef = db.collection(EMAIL_SURVEYS_COLLECTION).doc(emailHash);

  try {
    const doc = await docRef.get();

    if (!doc.exists) {
      return [];
    }

    const data = doc.data();
    return data?.surveyIds || [];
  } catch (error) {
    console.error('Failed to get surveys by email:', error);
    throw error;
  }
}

/**
 * Remove a survey from an email's list
 */
export async function removeSurveyFromEmail(
  email: string,
  surveyId: string
): Promise<void> {
  const db = getAdminFirestore();
  const emailHash = hashEmail(email);
  const docRef = db.collection(EMAIL_SURVEYS_COLLECTION).doc(emailHash);

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      if (doc.exists) {
        const data = doc.data();
        const surveyIds = data?.surveyIds || [];
        const filtered = surveyIds.filter((id: string) => id !== surveyId);

        if (filtered.length === 0) {
          // Delete document if no surveys remain
          transaction.delete(docRef);
        } else {
          transaction.update(docRef, {
            surveyIds: filtered,
            lastUpdated: Timestamp.now(),
            surveyCount: filtered.length,
          });
        }
      }
    });

    console.log(`✅ Removed survey ${surveyId} from email mapping`);
  } catch (error) {
    console.error('Failed to remove survey from email mapping:', error);
    throw error;
  }
}

/**
 * Get survey count for an email
 */
export async function getSurveyCountForEmail(email: string): Promise<number> {
  const db = getAdminFirestore();
  const emailHash = hashEmail(email);
  const docRef = db.collection(EMAIL_SURVEYS_COLLECTION).doc(emailHash);

  try {
    const doc = await docRef.get();

    if (!doc.exists) {
      return 0;
    }

    const data = doc.data();
    return data?.surveyCount || 0;
  } catch (error) {
    console.error('Failed to get survey count:', error);
    return 0;
  }
}
