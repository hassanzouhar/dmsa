// Create a test survey for testing retrieval functionality
// Run with: node scripts/create-test-survey.js

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

// Create sample survey data
const testSurveyData = {
  id: "30117a12cc",
  version: "1.0.0",
  language: "no",
  timestamp: "2025-01-03T22:30:00.000Z",
  answers: {
    "q1": {
      "invested": ["digitalBusinessStrategy", "dataManagement"],
      "planning": ["humanCentricDigitalization", "automationAndAI"]
    },
    "q2": ["established", "optimized"],
    "q3": ["all_processes", "some_processes"],
    "q4": {
      "cloudComputing": 4,
      "bigDataAnalytics": 3,
      "artificialIntelligence": 2,
      "internetOfThings": 3,
      "blockchain": 1
    },
    "q5": {
      "invested": ["cybersecurity", "dataGovernance"],
      "planning": ["qualityManagement"]
    },
    "q6": ["moderate", "high"],
    "q7": ["basic", "intermediate"],
    "q8": ["some_functions", "most_functions"],
    "q9": {
      "renewableEnergy": 4,
      "energyEfficiency": 5,
      "wasteReduction": 3,
      "sustainableProcurement": 2
    },
    "q10": ["yes", "partial"],
    "q11": {
      "carbonFootprint": "yes",
      "energyManagement": "yes",
      "wasteManagement": "partial",
      "sustainableSupplyChain": "no"
    }
  },
  scores: {
    dimensions: {
      "digitalBusinessStrategy": {
        score: 75,
        target: 85,
        gap: 10
      },
      "digitalReadiness": {
        score: 68,
        target: 80,
        gap: 12
      },
      "humanCentricDigitalization": {
        score: 72,
        target: 85,
        gap: 13
      },
      "dataManagement": {
        score: 80,
        target: 90,
        gap: 10
      },
      "automationAndAI": {
        score: 65,
        target: 75,
        gap: 10
      },
      "greenDigitalization": {
        score: 78,
        target: 85,
        gap: 7
      }
    },
    overall: 73,
    maturityClassification: {
      level: 3,
      label: "Moderately Advanced",
      band: "moderately_advanced"
    }
  },
  userDetails: {
    email: "test@example.com",
    companyName: "Test Company AS",
    sector: "manufacturing",
    companySize: "medium",
    region: "Europe",
    country: "Norway"
  }
};

async function createTestSurvey() {
  console.log('🔥 Creating test survey...');
  
  try {
    // 1. Save to Firebase Storage
    const storageRef = ref(storage, `surveys/${testSurveyData.id}.json`);
    await uploadString(storageRef, JSON.stringify(testSurveyData, null, 2), 'raw', {
      contentType: 'application/json',
    });
    console.log('✅ Test survey saved to Firebase Storage');

    // 2. Save metadata to Firestore
    const firestoreRef = doc(db, 'surveys', testSurveyData.id);
    await setDoc(firestoreRef, {
      id: testSurveyData.id,
      timestamp: testSurveyData.timestamp,
      version: testSurveyData.version,
      language: testSurveyData.language,
      scores: testSurveyData.scores,
      userDetails: testSurveyData.userDetails,
      hasExpandedAccess: true,
    });
    console.log('✅ Test survey metadata saved to Firestore');

    console.log('\n🎉 Test survey created successfully!');
    console.log(`📋 Survey ID: ${testSurveyData.id}`);
    console.log(`🌐 Test the retrieval at: http://localhost:3000/retrieve?id=${testSurveyData.id}`);
    console.log(`📊 Overall Score: ${testSurveyData.scores.overall}/100`);
    console.log(`🏢 Company: ${testSurveyData.userDetails.companyName}`);
    console.log(`📧 Email: ${testSurveyData.userDetails.email}`);

    // Create another test survey without user details
    const basicSurveyData = {
      ...testSurveyData,
      id: "basic123456",
      userDetails: undefined,
      timestamp: "2025-01-03T23:15:00.000Z"
    };

    // Save basic survey
    const basicStorageRef = ref(storage, `surveys/${basicSurveyData.id}.json`);
    await uploadString(basicStorageRef, JSON.stringify(basicSurveyData, null, 2), 'raw', {
      contentType: 'application/json',
    });

    const basicFirestoreRef = doc(db, 'surveys', basicSurveyData.id);
    await setDoc(basicFirestoreRef, {
      id: basicSurveyData.id,
      timestamp: basicSurveyData.timestamp,
      version: basicSurveyData.version,
      language: basicSurveyData.language,
      scores: basicSurveyData.scores,
      userDetails: null,
      hasExpandedAccess: false,
    });

    console.log(`\n✅ Basic survey created: ${basicSurveyData.id}`);
    console.log(`🌐 Test basic retrieval at: http://localhost:3000/retrieve?id=${basicSurveyData.id}`);

  } catch (error) {
    console.error('❌ Failed to create test survey:', error);
    process.exit(1);
  }
}

createTestSurvey();