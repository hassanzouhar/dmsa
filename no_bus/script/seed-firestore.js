/**
 * Seed Firestore with fresh dummy data
 *
 * Creates sample surveys, analytics events, and benchmark data
 * Run with: npx tsx --env-file=.env.local scripts/seed-firestore.js
 */

import { getAdminFirestore, initializeAdminSDK } from '../lib/firebase-admin.ts';
import { COLLECTIONS, DOCUMENT_IDS } from '../types/firestore-schema.ts';
import { Timestamp } from 'firebase-admin/firestore';
import { addSurveyToEmail } from '../lib/email-survey-mapping.ts';
import crypto from 'crypto';

// Helper to generate token hash
function hashToken(token, salt = process.env.DMSA_TOKEN_SALT || 'default-salt') {
  return crypto.createHash('sha256').update(token + salt).digest('hex');
}

// Helper to generate random survey ID
function generateSurveyId() {
  return crypto.randomBytes(5).toString('base64url').substring(0, 10);
}

// Sample company details variations
const sampleCompanies = [
  {
    companyName: 'Nordic Manufacturing AS',
    companySize: 'medium',
    nace: 'C25',
    sector: 'manufacturing',
    region: 'Oslo',
  },
  {
    companyName: 'Tech Solutions Norway',
    companySize: 'small',
    nace: 'J62',
    sector: 'services',
    region: 'Bergen',
  },
  {
    companyName: 'Retail Group Scandinavia',
    companySize: 'large',
    nace: 'G47',
    sector: 'retail',
    region: 'Trondheim',
  },
  {
    companyName: 'Healthcare Innovation',
    companySize: 'medium',
    nace: 'Q86',
    sector: 'healthcare',
    region: 'Stavanger',
  },
  {
    companyName: 'Education Platform AS',
    companySize: 'small',
    nace: 'P85',
    sector: 'education',
    region: 'Tromsø',
  },
  {
    companyName: 'Green Energy Solutions',
    companySize: 'medium',
    nace: 'D35',
    sector: 'services',
    region: 'Oslo',
  },
  {
    companyName: 'Financial Services Nordic',
    companySize: 'large',
    nace: 'K64',
    sector: 'finance',
    region: 'Oslo',
  },
  {
    companyName: 'Consulting Partners',
    companySize: 'micro',
    nace: 'M70',
    sector: 'services',
    region: 'Bergen',
  },
  {
    companyName: 'Food Production AS',
    companySize: 'small',
    nace: 'C10',
    sector: 'manufacturing',
    region: 'Trondheim',
  },
  {
    companyName: 'Digital Marketing Agency',
    companySize: 'micro',
    nace: 'M73',
    sector: 'services',
    region: 'Oslo',
  },
];

// Sample answers variations
const sampleAnswers = [
  {
    q1: { invested: ['digitalStrategy', 'dataManagement'], planning: ['humanCentric', 'automation'] },
    q2: ['established', 'optimized'],
    q3: ['all_processes', 'some_processes'],
    q4: { cloudComputing: 4, bigDataAnalytics: 3, artificialIntelligence: 2, internetOfThings: 3, blockchain: 1 },
    q5: { invested: ['cybersecurity', 'dataGovernance'], planning: ['qualityManagement'] },
    q6: ['moderate', 'high'],
    q7: ['basic', 'intermediate'],
    q8: ['some_functions', 'most_functions'],
    q9: { renewableEnergy: 4, energyEfficiency: 5, wasteReduction: 3, sustainableProcurement: 2 },
    q10: ['yes', 'partial'],
    q11: { carbonFootprint: 'yes', energyManagement: 'yes', wasteManagement: 'partial', sustainableSupplyChain: 'no' },
  },
  {
    q1: { invested: ['digitalStrategy'], planning: [] },
    q2: ['planning'],
    q3: ['some_processes'],
    q4: { cloudComputing: 2, bigDataAnalytics: 1, artificialIntelligence: 0, internetOfThings: 1, blockchain: 0 },
    q5: { invested: [], planning: ['cybersecurity'] },
    q6: ['low'],
    q7: ['basic'],
    q8: ['few_functions'],
    q9: { renewableEnergy: 1, energyEfficiency: 2, wasteReduction: 1, sustainableProcurement: 0 },
    q10: ['no'],
    q11: { carbonFootprint: 'no', energyManagement: 'partial', wasteManagement: 'no', sustainableSupplyChain: 'no' },
  },
  {
    q1: { invested: ['digitalStrategy', 'digitalReadiness', 'humanCentric', 'dataManagement', 'automation'], planning: ['greenDigitalization'] },
    q2: ['established', 'optimized', 'integrated'],
    q3: ['all_processes'],
    q4: { cloudComputing: 5, bigDataAnalytics: 5, artificialIntelligence: 4, internetOfThings: 4, blockchain: 3 },
    q5: { invested: ['cybersecurity', 'dataGovernance', 'qualityManagement'], planning: [] },
    q6: ['high', 'very_high'],
    q7: ['advanced', 'expert'],
    q8: ['all_functions'],
    q9: { renewableEnergy: 5, energyEfficiency: 5, wasteReduction: 5, sustainableProcurement: 4 },
    q10: ['yes'],
    q11: { carbonFootprint: 'yes', energyManagement: 'yes', wasteManagement: 'yes', sustainableSupplyChain: 'yes' },
  },
];

// Generate dimension scores based on complexity
function generateDimensionScores(complexity = 'medium') {
  const baseScores = {
    low: { min: 20, max: 40 },
    medium: { min: 50, max: 70 },
    high: { min: 75, max: 95 },
  };

  const range = baseScores[complexity] || baseScores.medium;
  const dimensions = ['digitalStrategy', 'digitalReadiness', 'humanCentric', 'dataManagement', 'automation', 'greenDigitalization'];

  const dimensionScores = {};
  for (const dim of dimensions) {
    const score = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const target = Math.min(100, score + Math.floor(Math.random() * 20) + 10);
    dimensionScores[dim] = {
      score,
      target,
      gap: target - score,
    };
  }

  return dimensionScores;
}

function getMaturityClassification(overallScore) {
  if (overallScore >= 76) {
    return { level: 4, label: 'Advanced', band: 'advanced' };
  } else if (overallScore >= 51) {
    return { level: 3, label: 'Moderately Advanced', band: 'moderately_advanced' };
  } else if (overallScore >= 26) {
    return { level: 2, label: 'Average', band: 'average' };
  } else {
    return { level: 1, label: 'Basic', band: 'basic' };
  }
}

async function createSurvey(db, companyDetails, answers, hasEmail = false, complexity = 'medium') {
  const surveyId = generateSurveyId();
  const now = new Date().toISOString();
  const retrievalToken = crypto.randomBytes(16).toString('base64url');
  const tokenHash = hashToken(retrievalToken);

  // Generate scores
  const dimensionScores = generateDimensionScores(complexity);
  const overall = Math.round(
    Object.values(dimensionScores).reduce((sum, d) => sum + d.score, 0) / 6
  );
  const maturityClassification = getMaturityClassification(overall);

  const publicResults = {
    dimensions: dimensionScores,
    overall,
    maturityClassification,
  };

  // Create survey document
  const surveyDoc = {
    id: surveyId,
    state: hasEmail ? 'T1' : 'T0',
    surveyVersion: 'v1.1',
    language: 'no',
    createdAt: now,
    completedAt: now,
    companyDetails,
    flags: {
      isCompleted: true,
      hasResults: true,
      hasExpandedAccess: hasEmail,
      includeInLeaderboard: true, // All surveys included by default
    },
    overallScore: overall,
    retrieval: {
      tokenHash,
      createdAt: now,
      revoked: false,
    },
    scores: publicResults,
  };

  if (hasEmail) {
    surveyDoc.upgradedAt = now;
  }

  // Save survey document
  await db.collection(COLLECTIONS.SURVEYS).doc(surveyId).set(surveyDoc);

  // Create subcollections
  // 1. Public results
  await db
    .collection(COLLECTIONS.SURVEYS)
    .doc(surveyId)
    .collection(COLLECTIONS.RESULTS)
    .doc(DOCUMENT_IDS.PUBLIC_RESULTS)
    .set(publicResults);

  // 2. Answers
  await db
    .collection(COLLECTIONS.SURVEYS)
    .doc(surveyId)
    .collection(COLLECTIONS.ANSWERS)
    .doc(DOCUMENT_IDS.CURRENT_ANSWERS)
    .set({ answers });

  // 3. Private user details (only if email provided)
  if (hasEmail) {
    const email = `contact@${companyDetails.companyName.toLowerCase().replace(/\s+/g, '')}.no`;
    const userDetails = {
      email,
      emailDomain: `${companyDetails.companyName.toLowerCase().replace(/\s+/g, '')}.no`,
      contactName: 'Test User',
      createdAt: now,
      consentAcceptedAt: now,
      policyVersion: '1.0',
    };

    await db
      .collection(COLLECTIONS.SURVEYS)
      .doc(surveyId)
      .collection(COLLECTIONS.PRIVATE)
      .doc(DOCUMENT_IDS.USER_DETAILS)
      .set(userDetails);

    // Add email-to-survey mapping for magic link retrieval
    try {
      await addSurveyToEmail(email, surveyId);
    } catch (error) {
      console.warn(`  ⚠️  Failed to add email mapping for ${surveyId}:`, error.message);
    }
  }

  console.log(`  ✅ Created survey: ${surveyId} (${hasEmail ? 'T1 with email' : 'T0 anonymous'}) - Score: ${overall}/100`);

  return { surveyId, retrievalToken, overall };
}

async function createAnalyticsEvents(db, surveyIds) {
  console.log('\n2️⃣  Creating analytics events...');

  const eventTypes = [
    'survey_created',
    'assessment_started',
    'assessment_completed',
    'email_captured',
    'results_retrieved',
    'pdf_downloaded',
  ];

  let count = 0;
  for (const surveyId of surveyIds) {
    // Create 2-4 events per survey
    const numEvents = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < numEvents; i++) {
      const event = eventTypes[Math.min(i, eventTypes.length - 1)];
      const eventDoc = {
        event,
        timestamp: new Date().toISOString(),
        serverTimestamp: Timestamp.now(),
        surveyId,
        language: 'no',
        surveyVersion: 'v1.1',
      };

      await db.collection(COLLECTIONS.ANALYTICS_EVENTS).add(eventDoc);
      count++;
    }
  }

  console.log(`  ✅ Created ${count} analytics events`);
}

async function createGlobalMetrics(db, totalSurveys, completedSurveys, emailCaptures) {
  console.log('\n3️⃣  Creating global metrics...');

  const metrics = {
    totalSurveys,
    completedSurveys,
    emailCaptures,
    retrievalAttempts: Math.floor(completedSurveys * 1.5),
    pdfDownloads: Math.floor(emailCaptures * 0.8),
    jsonExports: Math.floor(emailCaptures * 0.3),
    conversionRate: emailCaptures / completedSurveys,
    lastUpdated: Timestamp.now(),
  };

  await db.collection(COLLECTIONS.ANALYTICS).doc(DOCUMENT_IDS.GLOBAL_METRICS).set(metrics);

  console.log('  ✅ Global metrics created');
  console.log(`     Total Surveys: ${totalSurveys}`);
  console.log(`     Completed: ${completedSurveys}`);
  console.log(`     Email Captures: ${emailCaptures}`);
  console.log(`     Conversion Rate: ${(metrics.conversionRate * 100).toFixed(1)}%`);
}

async function createBenchmarks(db, surveys) {
  console.log('\n4️⃣  Creating benchmark data...');

  // Group surveys by sector and size
  const groups = {};
  for (const survey of surveys) {
    const key = `${survey.companyDetails.sector}_${survey.companyDetails.companySize}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(survey);
  }

  let count = 0;
  for (const [key, groupSurveys] of Object.entries(groups)) {
    const [sector, size] = key.split('_');

    // Calculate benchmarks for each dimension
    const dimensions = {};
    const dimensionIds = ['digitalStrategy', 'digitalReadiness', 'humanCentric', 'dataManagement', 'automation', 'greenDigitalization'];

    for (const dimId of dimensionIds) {
      const scores = groupSurveys
        .map((s) => s.scores.dimensions[dimId]?.score || 0)
        .sort((a, b) => a - b);

      const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const p25 = scores[Math.floor(scores.length * 0.25)];
      const p50 = scores[Math.floor(scores.length * 0.5)];
      const p75 = scores[Math.floor(scores.length * 0.75)];

      dimensions[dimId] = { mean: Math.round(mean), p25, p50, p75 };
    }

    const benchmarkDoc = {
      dimensions,
      updatedAt: Timestamp.now(),
    };

    await db
      .collection(COLLECTIONS.BENCHMARKS)
      .doc(sector)
      .collection('sizes')
      .doc(size)
      .set(benchmarkDoc);

    count++;
  }

  console.log(`  ✅ Created ${count} benchmark documents`);
}

async function seedFirestore() {
  console.log('🌱 FIRESTORE SEED SCRIPT');
  console.log('========================\n');

  // Initialize Firebase Admin SDK
  initializeAdminSDK();
  const db = getAdminFirestore();

  try {
    console.log('1️⃣  Creating surveys...\n');

    const createdSurveys = [];
    const surveyIds = [];

    // Create 10 surveys with varying characteristics
    for (let i = 0; i < 10; i++) {
      const company = sampleCompanies[i];
      const answerSet = sampleAnswers[i % 3];
      const hasEmail = i % 3 === 0; // Every 3rd survey has email
      const complexity = i < 3 ? 'high' : i < 7 ? 'medium' : 'low';

      const survey = await createSurvey(db, company, answerSet, hasEmail, complexity);
      createdSurveys.push({ ...survey, companyDetails: company, scores: { dimensions: generateDimensionScores(complexity) } });
      surveyIds.push(survey.surveyId);
    }

    console.log(`\n  📊 Created ${createdSurveys.length} surveys total`);

    // Create analytics events
    await createAnalyticsEvents(db, surveyIds);

    // Create global metrics
    const emailCaptures = createdSurveys.filter((s, i) => i % 3 === 0).length;
    await createGlobalMetrics(db, surveyIds.length, surveyIds.length, emailCaptures);

    // Create benchmarks
    await createBenchmarks(db, createdSurveys);

    console.log('\n\n🎉 SUCCESS: Firestore seeded with fresh dummy data!');
    console.log('\n📋 Sample Survey IDs and Retrieval Tokens:');
    console.log('============================================');
    for (let i = 0; i < Math.min(5, createdSurveys.length); i++) {
      const survey = createdSurveys[i];
      console.log(`\nSurvey ${i + 1}: ${survey.surveyId}`);
      console.log(`  Company: ${survey.companyDetails.companyName}`);
      console.log(`  Score: ${survey.overall}/100`);
      console.log(`  Token: ${survey.retrievalToken}`);
      console.log(`  URL: http://localhost:3000/retrieve?id=${survey.surveyId}`);
    }

    console.log('\n\n✨ You can now test the application with this fresh data!');

  } catch (error) {
    console.error('\n❌ ERROR during seeding:', error);
    process.exit(1);
  }
}

// Run the seed
seedFirestore();
