/**
 * Magic Link Authentication Service
 *
 * Generates and verifies secure magic links for email-based authentication.
 */

import { getAdminFirestore } from './firebase-admin';
import crypto from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { hashEmail } from './email-survey-mapping';

const MAGIC_LINKS_COLLECTION = 'magic_links';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours (reusable)
const SALT = process.env.DMSA_TOKEN_SALT || 'default-magic-link-salt';

interface MagicLinkData {
  token: string;
  tokenHash: string;
  emailHash: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  used: boolean; // Kept for backward compatibility, but no longer enforced
  usedAt?: Timestamp;
  lastUsedAt?: Timestamp; // Track most recent use
  useCount: number; // Track how many times used
}

/**
 * Generate a cryptographically secure magic link token
 */
export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hash a magic link token for storage
 */
function hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token + SALT)
    .digest('hex');
}

/**
 * Create a magic link for an email address
 * Returns the token to be sent via email
 */
export async function createMagicLink(email: string): Promise<{
  token: string;
  expiry: Date;
  emailHash: string;
}> {
  const db = getAdminFirestore();
  const token = generateMagicLinkToken();
  const tokenHash = hashToken(token);
  const emailHash = hashEmail(email);
  const now = Timestamp.now();
  const expiry = new Date(Date.now() + TOKEN_EXPIRY_MS);

  const magicLinkData: MagicLinkData = {
    token, // Store plaintext temporarily for debugging (remove in production)
    tokenHash,
    emailHash,
    createdAt: now,
    expiresAt: Timestamp.fromDate(expiry),
    used: false,
    useCount: 0,
  };

  try {
    // Use token hash as document ID for easy lookup
    await db
      .collection(MAGIC_LINKS_COLLECTION)
      .doc(tokenHash)
      .set(magicLinkData);

    console.log(`✅ Created magic link for email hash: ${emailHash}`);

    return {
      token,
      expiry,
      emailHash,
    };
  } catch (error) {
    console.error('Failed to create magic link:', error);
    throw new Error('Failed to create magic link');
  }
}

/**
 * Verify a magic link token and return the associated email hash
 * Tokens are reusable for 24 hours - we just track usage, not enforce one-time use
 */
export async function verifyMagicLinkToken(
  token: string,
  email: string
): Promise<{
  valid: boolean;
  emailHash?: string;
  reason?: string;
}> {
  const db = getAdminFirestore();
  const tokenHash = hashToken(token);
  const expectedEmailHash = hashEmail(email);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const docRef = db.collection(MAGIC_LINKS_COLLECTION).doc(tokenHash);
      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        return { valid: false, reason: 'Token not found' };
      }

      const data = doc.data() as MagicLinkData;

      // Check if email hash matches
      if (data.emailHash !== expectedEmailHash) {
        return { valid: false, reason: 'Email mismatch' };
      }

      // Check if expired
      const now = Timestamp.now();
      if (data.expiresAt.toMillis() < now.toMillis()) {
        return { valid: false, reason: 'Token expired' };
      }

      // Token is valid and reusable - just update usage tracking
      transaction.update(docRef, {
        used: true, // Keep for backward compatibility
        usedAt: data.usedAt || now, // First use timestamp
        lastUsedAt: now, // Most recent use
        useCount: (data.useCount || 0) + 1,
      });

      return { valid: true, emailHash: data.emailHash };
    });

    if (result.valid) {
      console.log(`✅ Magic link verified for email hash: ${result.emailHash}`);
    } else {
      console.warn(`❌ Magic link verification failed: ${result.reason}`);
    }

    return result;
  } catch (error) {
    console.error('Failed to verify magic link:', error);
    return { valid: false, reason: 'Verification error' };
  }
}

/**
 * Clean up expired magic links (should be run periodically)
 */
export async function cleanupExpiredMagicLinks(): Promise<number> {
  const db = getAdminFirestore();
  const now = Timestamp.now();

  try {
    const expiredQuery = db
      .collection(MAGIC_LINKS_COLLECTION)
      .where('expiresAt', '<', now)
      .limit(100);

    const snapshot = await expiredQuery.get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`🧹 Cleaned up ${snapshot.size} expired magic links`);
    return snapshot.size;
  } catch (error) {
    console.error('Failed to cleanup expired magic links:', error);
    return 0;
  }
}

/**
 * Invalidate all magic links for an email
 */
export async function invalidateMagicLinksForEmail(
  email: string
): Promise<number> {
  const db = getAdminFirestore();
  const emailHash = hashEmail(email);

  try {
    const query = db
      .collection(MAGIC_LINKS_COLLECTION)
      .where('emailHash', '==', emailHash)
      .where('used', '==', false);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    const now = Timestamp.now();

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        used: true,
        usedAt: now,
      });
    });

    await batch.commit();

    console.log(
      `🔒 Invalidated ${snapshot.size} magic links for email hash: ${emailHash}`
    );
    return snapshot.size;
  } catch (error) {
    console.error('Failed to invalidate magic links:', error);
    return 0;
  }
}
