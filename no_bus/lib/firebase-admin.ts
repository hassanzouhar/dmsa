/**
 * Firebase Admin SDK Initialization
 *
 * Server-side Firebase operations with elevated privileges
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let adminApp: App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Safe to call multiple times - will reuse existing instance
 */
export function initializeAdminSDK(): App {
  // Return existing app if already initialized
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // Best-effort: load .env.local or .env (without external deps)
  preloadDotEnv();

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT;

  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // If GOOGLE_APPLICATION_CREDENTIALS is set, parse service account JSON
  // and use it if explicit vars are missing
  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if ((!clientEmail || !privateKey) && gac && fs.existsSync(gac)) {
    try {
      const json = JSON.parse(fs.readFileSync(gac, 'utf8'));
      clientEmail = json.client_email || clientEmail;
      privateKey = (json.private_key || privateKey)?.replace(/\\n/g, '\n');
      if (!process.env.FIREBASE_PROJECT_ID && json.project_id) {
        process.env.FIREBASE_PROJECT_ID = json.project_id;
      }
    } catch (e) {
      console.warn('⚠️  Failed to parse GOOGLE_APPLICATION_CREDENTIALS file:', e);
    }
  }

  try {
    if (clientEmail && privateKey) {
      // Initialize with explicit service account
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || projectId,
          clientEmail,
          privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID || projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('✅ Firebase Admin SDK initialized with service account');
    } else if (projectId) {
      // Initialize with default credentials + explicit projectId
      adminApp = initializeApp({ projectId });
      console.log('✅ Firebase Admin SDK initialized with default credentials (projectId set)');
    } else {
      // Last resort: let Admin SDK discover projectId from ADC or metadata
      adminApp = initializeApp();
      console.log('✅ Firebase Admin SDK initialized with default credentials (auto-discovery)');
    }
  } catch (err) {
    const help =
      'Set FIREBASE_PROJECT_ID and either (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY) or provide GOOGLE_APPLICATION_CREDENTIALS.';
    throw new Error(`Failed to initialize Firebase Admin SDK: ${(err as Error).message}. ${help}`);
  }

  return adminApp;
}

/**
 * Minimal .env loader: reads ./.env.local and ./.env if present
 * and sets process.env keys that are not already defined.
 */
function preloadDotEnv() {
  for (const filename of ['.env.local', '.env']) {
    const filePath = path.resolve(process.cwd(), filename);
    if (!fs.existsSync(filePath)) continue;
    try {
      const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    } catch (e) {
      console.warn(`⚠️  Failed to preload env from ${filename}:`, e);
    }
  }

  // Auto-discover a local service account JSON if env is not set
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const candidates = [
      path.resolve(process.cwd(), 'script/service-account-key.json.json'),
      path.resolve(process.cwd(), 'script/service-account-key.json'),
      path.resolve(process.cwd(), 'service-account.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = p;
        break;
      }
    }
  }
}

/**
 * Get Firestore instance
 */
export function getAdminFirestore(): Firestore {
  if (!adminApp) {
    initializeAdminSDK();
  }

  return getFirestore(adminApp!);
}

/**
 * Get Firebase Admin App instance
 */
export function getAdminApp(): App {
  if (!adminApp) {
    initializeAdminSDK();
  }

  return adminApp!;
}
