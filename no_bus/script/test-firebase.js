// Test Firebase connection and services
// Run with: node scripts/test-firebase.js

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAN-FgBbn4MEcR9U6OQaNGzZvjtmU6yhnk",
  authDomain: "digitalmsa2-e71de.firebaseapp.com",
  projectId: "digitalmsa2-e71de",
  storageBucket: "digitalmsa2-e71de.firebasestorage.app",
  messagingSenderId: "940272072619",
  appId: "1:940272072619:web:3cc45ad05686809ca4c4ee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase connection...');
  
  try {
    console.log('✅ Firebase app initialized successfully');
    console.log(`📊 Project ID: ${firebaseConfig.projectId}`);
    console.log(`🗄️  Storage bucket: ${firebaseConfig.storageBucket}`);
    
    // Test Firestore
    console.log('\n📝 Testing Firestore...');
    const testDoc = doc(db, 'test', 'connection');
    await setDoc(testDoc, {
      message: 'Firebase connection test',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Firestore write successful');
    
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists()) {
      console.log('✅ Firestore read successful');
    }
    
    // Test Storage
    console.log('\n📦 Testing Firebase Storage...');
    const testRef = ref(storage, 'test/connection.json');
    const testData = JSON.stringify({
      message: 'Storage connection test',
      timestamp: new Date().toISOString()
    });
    
    await uploadString(testRef, testData, 'raw', {
      contentType: 'application/json'
    });
    console.log('✅ Storage upload successful');
    
    const downloadURL = await getDownloadURL(testRef);
    console.log('✅ Storage download URL generated:', downloadURL);
    
    console.log('\n🎉 All Firebase services are working correctly!');
    console.log('\n📋 Services configured:');
    console.log('  - ✅ Firestore Database');
    console.log('  - ✅ Firebase Storage');
    console.log('  - ⏳ Authentication (not yet configured)');
    console.log('  - ⏳ Hosting (using Vercel instead)');
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    
    if (error.code === 'storage/unauthorized') {
      console.log('\n💡 Storage rules may need to be configured. Run:');
      console.log('   firebase deploy --only storage');
    }
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Firestore rules may need to be configured. Run:');
      console.log('   firebase deploy --only firestore:rules');
    }
    
    process.exit(1);
  }
}

testFirebaseConnection();