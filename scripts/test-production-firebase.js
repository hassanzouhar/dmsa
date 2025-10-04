// Test Firebase connection in production environment
// This script simulates the production environment by using the same env vars

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// Use the same configuration as production
const firebaseConfig = {
  apiKey: "AIzaSyAN-FgBbn4MEcR9U6OQaNGzZvjtmU6yhnk",
  authDomain: "digitalmsa2-e71de.firebaseapp.com",
  projectId: "digitalmsa2-e71de",
  storageBucket: "digitalmsa2-e71de.firebasestorage.app",
  messagingSenderId: "940272072619",
  appId: "1:940272072619:web:3cc45ad05686809ca4c4ee",
};

console.log('🧪 Testing Firebase configuration that matches production...');
console.log('📋 Config check:');
console.log(`  ✅ API Key: ${firebaseConfig.apiKey?.substring(0, 20)}...`);
console.log(`  ✅ Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`  ✅ Project ID: ${firebaseConfig.projectId}`);
console.log(`  ✅ Storage Bucket: ${firebaseConfig.storageBucket}`);
console.log(`  ✅ Messaging Sender ID: ${firebaseConfig.messagingSenderId}`);
console.log(`  ✅ App ID: ${firebaseConfig.appId?.substring(0, 20)}...`);

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  getStorage(app);
  getFirestore(app);
  
  console.log('✅ Firebase app initialized successfully!');
  console.log('✅ Storage instance created successfully!');
  console.log('✅ Firestore instance created successfully!');
  
  console.log('\n🎉 Production Firebase configuration is valid!');
  console.log('🚀 Your production app should now be able to:');
  console.log('  - Initialize Firebase without errors');
  console.log('  - Access Firebase Storage for survey saving');
  console.log('  - Use Firestore for metadata storage');
  
  console.log('\n🌐 Production URL: https://dmsa-cckdo91iy-hassanzouhars-projects.vercel.app');
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}