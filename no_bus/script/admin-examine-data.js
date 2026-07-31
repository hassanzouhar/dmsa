#!/usr/bin/env node

/**
 * Firebase Admin Data Examination Script
 *
 * Uses Firebase Admin SDK to examine all Firebase data structures,
 * bypassing security rules for full administrative access.
 *
 * Run with: node scripts/admin-examine-data.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Since we're using .js file, we need to use dynamic imports for ES modules
async function main() {
  try {
    // Import Admin SDK modules
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const { getStorage } = await import('firebase-admin/storage');

    console.log('🔍 Examining Firebase Data with Admin SDK...\\n');

    // Initialize Admin SDK
    const adminConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
    };

    // Validate configuration
    if (!adminConfig.projectId) {
      throw new Error('FIREBASE_PROJECT_ID is required');
    }
    if (!adminConfig.clientEmail) {
      console.log('⚠️  FIREBASE_CLIENT_EMAIL not set - Admin features limited');
    }
    if (!adminConfig.privateKey) {
      console.log('⚠️  FIREBASE_PRIVATE_KEY not set - Admin features limited');
    }

    let adminApp;
    if (adminConfig.clientEmail && adminConfig.privateKey) {
      // Full Admin SDK initialization
      if (getApps().length === 0) {
        adminApp = initializeApp({
          credential: cert(adminConfig),
          projectId: adminConfig.projectId,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      } else {
        adminApp = getApps()[0];
      }
      console.log('✅ Firebase Admin SDK initialized with full privileges');
    } else {
      // Fallback to application default credentials
      if (getApps().length === 0) {
        adminApp = initializeApp({
          projectId: adminConfig.projectId,
        });
      } else {
        adminApp = getApps()[0];
      }
      console.log('✅ Firebase Admin SDK initialized with default credentials');
    }

    const db = getFirestore(adminApp);
    const storage = getStorage(adminApp);

    // Examine Firestore Collections
    console.log('📊 FIRESTORE COLLECTIONS:');
    console.log('='.repeat(50));

    const collectionsToCheck = [
      'surveys',
      'companies', 
      'analytics',
      'analytics_events',
      'benchmarks',
      'connection_tests'
    ];

    for (const collectionName of collectionsToCheck) {
      try {
        console.log(`\\n🗃️ ${collectionName.toUpperCase()} Collection:`);
        
        const snapshot = await db.collection(collectionName).limit(3).get();
        
        if (snapshot.empty) {
          console.log(`   📝 No ${collectionName} found`);
        } else {
          console.log(`   📝 Found ${snapshot.size} document(s):`);
          
          snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`   ${index + 1}. ID: ${doc.id}`);
            console.log(`      Fields: ${Object.keys(data).join(', ')}`);
            
            // Show detailed structure for first document
            if (index === 0) {
              console.log('      Sample structure:');
              console.log('      ' + JSON.stringify(data, null, 6).split('\\n').join('\\n      '));
            }
            console.log('');
          });
        }
      } catch (error) {
        console.log(`   ❌ Error accessing ${collectionName}:`, error.message);
      }
    }

    // Check for subcollections in surveys
    if (db) {
      try {
        console.log('\\n🔍 Checking for Survey Subcollections...');
        const surveysSnapshot = await db.collection('surveys').limit(1).get();
        
        if (!surveysSnapshot.empty) {
          const firstSurvey = surveysSnapshot.docs[0];
          console.log(`\\n📋 Examining subcollections for survey: ${firstSurvey.id}`);
          
          const subcollections = ['results', 'answers', 'private'];
          for (const subcol of subcollections) {
            try {
              const subSnapshot = await firstSurvey.ref.collection(subcol).get();
              console.log(`   📁 /${subcol}: ${subSnapshot.size} document(s)`);
              
              subSnapshot.docs.forEach(doc => {
                console.log(`      - ${doc.id}: ${Object.keys(doc.data()).join(', ')}`);
              });
            } catch (error) {
              console.log(`   📁 /${subcol}: Error - ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Error checking subcollections:`, error.message);
      }
    }

    // Examine Firebase Storage
    console.log('\\n💾 FIREBASE STORAGE:');
    console.log('='.repeat(50));

    try {
      console.log('\\n📂 Storage Structure:');
      const bucket = storage.bucket();
      const [files] = await bucket.getFiles({ prefix: '', delimiter: '/' });
      const [, prefixes] = await bucket.getFiles({ prefix: '', delimiter: '/' });

      if (files.length === 0 && (!prefixes || prefixes.length === 0)) {
        console.log('   📝 No files or folders found in storage');
      } else {
        console.log(`   📄 Found ${files.length} file(s) in root:`);
        files.slice(0, 5).forEach(file => {
          console.log(`      - ${file.name}`);
        });
        
        // Check surveys folder specifically
        const [surveyFiles] = await bucket.getFiles({ prefix: 'surveys/' });
        console.log(`\\n📂 /surveys folder: ${surveyFiles.length} file(s)`);
        surveyFiles.slice(0, 5).forEach(file => {
          console.log(`      - ${file.name}`);
        });
        
        if (surveyFiles.length > 5) {
          console.log(`      ... and ${surveyFiles.length - 5} more`);
        }
      }
    } catch (error) {
      console.log('   ❌ Error accessing storage:', error.message);
      if (error.message.includes('Could not load the default credentials')) {
        console.log('   💡 Ensure FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL are set');
      }
    }

    // Summary
    console.log('\\n📊 DATA SUMMARY:');
    console.log('='.repeat(50));
    
    try {
      const totalSurveys = await db.collection('surveys').get();
      const totalEvents = await db.collection('analytics_events').get();
      
      console.log(`📋 Total Surveys: ${totalSurveys.size}`);
      console.log(`📈 Total Analytics Events: ${totalEvents.size}`);
      
      if (totalSurveys.size > 0) {
        const completedSurveys = totalSurveys.docs.filter(doc => 
          doc.data().flags?.isCompleted === true || doc.data().isCompleted === true
        );
        const t1Surveys = totalSurveys.docs.filter(doc => 
          doc.data().state === 'T1' || doc.data().hasExpandedAccess === true
        );
        
        console.log(`✅ Completed Surveys: ${completedSurveys.length}`);
        console.log(`🔓 T1 Surveys (with email): ${t1Surveys.length}`);
      }
    } catch (error) {
      console.log('❌ Error generating summary:', error.message);
    }

    console.log('\\n✅ Admin data examination complete!');

  } catch (error) {
    console.error('❌ Fatal error during examination:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);