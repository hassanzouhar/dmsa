#!/usr/bin/env node

/**
 * Service Account Extractor
 * 
 * This script helps extract Firebase Admin SDK credentials from a service account JSON file
 * and format them for .env.local
 * 
 * Usage:
 * 1. Download service account JSON from Firebase Console
 * 2. Place it in this directory as 'service-account-key.json'
 * 3. Run: node scripts/extract-service-account.js
 */

import fs from 'fs';
import crypto from 'crypto';

const SERVICE_ACCOUNT_FILE = 'service-account-key.json';
const ENV_FILE = '.env.local';

function main() {
  console.log('🔧 Firebase Service Account Extractor');
  console.log('=====================================');
  
  // Check if service account file exists
  if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.log('');
    console.log('❌ Service account file not found!');
    console.log('');
    console.log('Please follow these steps:');
    console.log('1. Go to: https://console.firebase.google.com/project/digitalmsa2-e71de/settings/serviceaccounts/adminsdk');
    console.log('2. Click "Generate new private key"');
    console.log('3. Save the downloaded JSON file as "service-account-key.json" in this directory');
    console.log('4. Run this script again: node scripts/extract-service-account.js');
    console.log('');
    process.exit(1);
  }

  try {
    // Read and parse service account JSON
    console.log('📖 Reading service account file...');
    const serviceAccountData = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));
    
    // Extract required fields
    const projectId = serviceAccountData.project_id;
    const clientEmail = serviceAccountData.client_email;
    const privateKey = serviceAccountData.private_key;
    
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Invalid service account file - missing required fields');
    }
    
    console.log('✅ Service account data extracted');
    console.log(`📋 Project ID: ${projectId}`);
    console.log(`📧 Client Email: ${clientEmail}`);
    
    // Generate random salt for tokens
    const tokenSalt = crypto.randomBytes(32).toString('base64');
    
    // Format environment variables
    const envVars = `
# Firebase Admin SDK Configuration (Auto-generated)
FIREBASE_PROJECT_ID=${projectId}
FIREBASE_CLIENT_EMAIL=${clientEmail}
FIREBASE_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"

# Project Configuration
DMSA_TOKEN_SALT=${tokenSalt}`;

    // Read existing .env.local or create new one
    let existingEnv = '';
    if (fs.existsSync(ENV_FILE)) {
      existingEnv = fs.readFileSync(ENV_FILE, 'utf8');
      
      // Create backup
      fs.writeFileSync(ENV_FILE + '.backup', existingEnv);
      console.log('✅ Backup created: .env.local.backup');
      
      // Remove existing admin config if present
      existingEnv = existingEnv.replace(/\n# Firebase Admin SDK Configuration.*?(?=\n#|\n[A-Z]|$)/s, '');
      existingEnv = existingEnv.replace(/\nFIREBASE_PROJECT_ID=.*/g, '');
      existingEnv = existingEnv.replace(/\nFIREBASE_CLIENT_EMAIL=.*/g, '');
      existingEnv = existingEnv.replace(/\nFIREBASE_PRIVATE_KEY=.*/g, '');
      existingEnv = existingEnv.replace(/\nDMSA_TOKEN_SALT=.*/g, '');
    }
    
    // Write updated .env.local
    const newEnvContent = existingEnv + envVars;
    fs.writeFileSync(ENV_FILE, newEnvContent);
    
    console.log('✅ Environment variables added to .env.local');
    
    // Clean up service account file for security
    console.log('🧹 Removing service account file for security...');
    fs.unlinkSync(SERVICE_ACCOUNT_FILE);
    
    console.log('');
    console.log('🎉 Setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the setup: node scripts/admin-examine-data.js');
    console.log('2. Never commit .env.local to version control');
    console.log('3. For production, add these variables to Vercel environment settings');
    console.log('');
    console.log('⚠️  Security Notes:');
    console.log('- The service account JSON file has been deleted');
    console.log('- Private key is now only in .env.local (should be in .gitignore)');
    console.log('- Keep these credentials secure and never share them');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();