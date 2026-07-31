#!/usr/bin/env node

// Firebase Connection Test Script
// Run with: node scripts/test-firebase-connection.js

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, listAll } from 'firebase/storage';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
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

console.log('🔍 Testing Firebase Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('Storage Bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log('Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Present' : 'Missing');
console.log();

try {
  // Initialize Firebase
  console.log('🚀 Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');

  // Test Firestore connection
  console.log('\n🗃️  Testing Firestore connection...');
  const db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');

  // Test Storage connection
  console.log('\n💾 Testing Storage connection...');
  const storage = getStorage(app);
  console.log('✅ Storage initialized successfully');
  console.log('Storage app:', storage.app.name);
  
  // Try to list files in storage (this will fail if bucket doesn't exist)
  console.log('\n📂 Testing Storage bucket access...');
  const storageRef = ref(storage, '/');
  
  listAll(storageRef)
    .then((result) => {
      console.log('✅ Storage bucket accessible');
      console.log(`Found ${result.items.length} items and ${result.prefixes.length} folders`);
      
      // Try to create a test file
      console.log('\n📝 Testing file upload...');
      const testRef = ref(storage, 'test/connection-test.txt');
      const testData = new Blob(['Firebase connection test successful!'], { type: 'text/plain' });
      
      return uploadBytes(testRef, testData);
    })
    .then(() => {
      console.log('✅ Test file uploaded successfully');
      console.log('\n🎉 All Firebase services are working correctly!');
    })
    .catch((error) => {
      console.log('\n❌ Storage Error Details:');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Full error:', error);
      
      if (error.code === 'storage/bucket-not-found') {
        console.log('\n💡 Solution: The storage bucket does not exist.');
        console.log('   1. Go to Firebase Console: https://console.firebase.google.com/');
        console.log(`   2. Select project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
        console.log('   3. Go to Storage in the left sidebar');
        console.log('   4. Click "Get started" to enable Cloud Storage');
        console.log('   5. Follow the setup wizard');
      } else if (error.code === 'storage/unauthorized') {
        console.log('\n💡 Solution: Storage access is unauthorized.');
        console.log('   1. Check Firebase Storage Rules');
        console.log('   2. Ensure rules allow read/write access');
        console.log('   3. For testing, you can use permissive rules');
      }
    });

  // Test a simple Firestore write to verify connectivity
  console.log('\n📝 Testing Firestore write...');
  const testDoc = {
    test: true,
    timestamp: new Date().toISOString(),
    message: 'Firebase connection test'
  };

  addDoc(collection(db, 'connection_tests'), testDoc)
    .then(() => {
      console.log('✅ Firestore write test successful');
    })
    .catch((error) => {
      console.log('❌ Firestore Error:', error.code, error.message);
    });

} catch (error) {
  console.log('\n❌ Firebase Initialization Error:');
  console.log('Error code:', error.code);
  console.log('Error message:', error.message);
  console.log('Full error:', error);
  
  if (error.message.includes('no-app')) {
    console.log('\n💡 Solution: Check your Firebase configuration object');
  }
}