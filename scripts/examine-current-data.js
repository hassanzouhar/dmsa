#!/usr/bin/env node

// Script to examine current Firebase data structure
// Run with: node scripts/examine-current-data.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
import { getStorage, ref, listAll } from 'firebase/storage';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export async function examineCurrentData() {
  console.log('🔍 Examining Current Firebase Data Structure...\n');

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // Check Firestore collections
    console.log('📊 FIRESTORE COLLECTIONS:');
    console.log('='.repeat(50));

    // Check surveys collection
    try {
      console.log('\n🗃️ SURVEYS Collection:');
      const surveysQuery = query(collection(db, 'surveys'), limit(3));
      const surveysSnapshot = await getDocs(surveysQuery);
      
      if (surveysSnapshot.empty) {
        console.log('   📝 No surveys found');
      } else {
        console.log(`   📝 Found ${surveysSnapshot.size} survey(s):`);
        surveysSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   ${index + 1}. ID: ${doc.id}`);
          console.log(`      Fields: ${Object.keys(data).join(', ')}`);
          
          // Show sample data structure (first survey)
          if (index === 0) {
            console.log('      Sample data structure:');
            console.log('      ' + JSON.stringify(data, null, 6).split('\n').join('\n      '));
          }
          console.log('');
        });
      }
    } catch (error) {
      console.log('   ❌ Error accessing surveys:', error.message);
    }

    // Check companies collection
    try {
      console.log('\n🏢 COMPANIES Collection:');
      const companiesQuery = query(collection(db, 'companies'), limit(3));
      const companiesSnapshot = await getDocs(companiesQuery);
      
      if (companiesSnapshot.empty) {
        console.log('   📝 No companies found');
      } else {
        console.log(`   📝 Found ${companiesSnapshot.size} company(ies):`);
        companiesSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   ${index + 1}. ID: ${doc.id}`);
          console.log(`      Fields: ${Object.keys(data).join(', ')}`);
          
          if (index === 0) {
            console.log('      Sample data structure:');
            console.log('      ' + JSON.stringify(data, null, 6).split('\n').join('\n      '));
          }
          console.log('');
        });
      }
    } catch (error) {
      console.log('   ❌ Error accessing companies:', error.message);
    }

    // Check other potential collections
    const potentialCollections = ['analytics', 'benchmarks', 'connection_tests'];
    for (const collectionName of potentialCollections) {
      try {
        console.log(`\n📊 ${collectionName.toUpperCase()} Collection:`);
        const collectionQuery = query(collection(db, collectionName), limit(2));
        const snapshot = await getDocs(collectionQuery);
        
        if (snapshot.empty) {
          console.log(`   📝 No ${collectionName} found`);
        } else {
          console.log(`   📝 Found ${snapshot.size} document(s):`);
          snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`   ${index + 1}. ID: ${doc.id}`);
            console.log(`      Fields: ${Object.keys(data).join(', ')}`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Error accessing ${collectionName}:`, error.message);
      }
    }

    // Check Firebase Storage structure
    console.log('\n💾 FIREBASE STORAGE:');
    console.log('='.repeat(50));

    try {
      console.log('\n📂 Storage Structure:');
      const storageRef = ref(storage, '/');
      const storageList = await listAll(storageRef);
      
      if (storageList.prefixes.length === 0 && storageList.items.length === 0) {
        console.log('   📝 No files or folders found in storage');
      } else {
        console.log(`   📁 Found ${storageList.prefixes.length} folder(s):`);
        storageList.prefixes.forEach(prefix => {
          console.log(`      - ${prefix.name}`);
        });
        
        console.log(`   📄 Found ${storageList.items.length} file(s) in root:`);
        storageList.items.forEach(item => {
          console.log(`      - ${item.name}`);
        });

        // Check surveys folder specifically
        if (storageList.prefixes.some(p => p.name === 'surveys')) {
          console.log('\n📂 /surveys folder contents:');
          const surveysRef = ref(storage, '/surveys');
          const surveysList = await listAll(surveysRef);
          console.log(`   📄 Found ${surveysList.items.length} survey file(s):`);
          surveysList.items.slice(0, 5).forEach(item => {
            console.log(`      - ${item.name}`);
          });
          if (surveysList.items.length > 5) {
            console.log(`      ... and ${surveysList.items.length - 5} more`);
          }
        }
      }
    } catch (error) {
      console.log('   ❌ Error accessing storage:', error.message);
    }

    console.log('\n✅ Data structure examination complete!');

  } catch (error) {
    console.log('❌ Error during examination:', error);
  }
}

examineCurrentData();