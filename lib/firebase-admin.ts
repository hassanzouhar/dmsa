/**
 * Firebase Admin SDK Initializer
 * 
 * Used for server-side operations, scripts, and bypassing security rules.
 * Provides full administrative access to Firebase services.
 */

import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Environment variables for Admin SDK
const adminConfig: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Handle escaped newlines in private key from environment variables
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Initialize Firebase Admin (singleton pattern)
import type { App } from 'firebase-admin/app';
let adminApp: App | undefined;

export const getAdminApp = () => {
  if (!adminApp) {
    // Check if app is already initialized
    if (getApps().length === 0) {
      // Validate required environment variables
      if (!adminConfig.projectId) {
        throw new Error('FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');
      }
      if (!adminConfig.clientEmail) {
        throw new Error('FIREBASE_CLIENT_EMAIL is required');
      }
      if (!adminConfig.privateKey) {
        throw new Error('FIREBASE_PRIVATE_KEY is required');
      }

      adminApp = initializeApp({
        credential: cert(adminConfig),
        projectId: adminConfig.projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      adminApp = getApps()[0];
    }
  }
  return adminApp;
};

// Export initialized services
export const getAdminFirestore = () => {
  return getFirestore(getAdminApp());
};

export const getAdminStorage = () => {
  return getStorage(getAdminApp());
};

// Utility function for script initialization
export const initializeAdminSDK = () => {
  try {
    const app = getAdminApp();
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`📋 Project ID: ${adminConfig.projectId}`);
    console.log(`📧 Client Email: ${adminConfig.clientEmail?.substring(0, 20)}...`);
    return app;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
};

// Export the admin config for scripts that need it
export { adminConfig };