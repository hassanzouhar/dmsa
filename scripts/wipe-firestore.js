/**
 * Wipe all Firestore data
 *
 * This script deletes all documents from all collections including subcollections.
 * Run with: npx tsx --env-file=.env.local scripts/wipe-firestore.js
 *
 * WARNING: This action is irreversible!
 */

import { getAdminFirestore, initializeAdminSDK } from '../lib/firebase-admin.ts';
import { COLLECTIONS } from '../types/firestore-schema.ts';

async function deleteCollection(db, collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject);
  });
}

async function deleteQueryBatch(db, query, resolve, reject) {
  try {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`  🗑️  Deleted ${snapshot.size} documents`);

    // Recurse on the next batch
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

async function deleteSubcollections(db, parentPath, subcollectionNames) {
  const parentRef = db.doc(parentPath);
  const parentDoc = await parentRef.get();

  if (!parentDoc.exists) {
    return;
  }

  for (const subcollectionName of subcollectionNames) {
    const subcollectionPath = `${parentPath}/${subcollectionName}`;
    console.log(`    Deleting subcollection: ${subcollectionPath}`);
    await deleteCollection(db, subcollectionPath);
  }
}

async function wipeFirestore() {
  console.log('🔥 FIRESTORE WIPE SCRIPT');
  console.log('========================\n');

  // Initialize Firebase Admin SDK
  initializeAdminSDK();
  const db = getAdminFirestore();

  console.log('⚠️  WARNING: This will delete ALL data in Firestore!');
  console.log('⚠️  This action is IRREVERSIBLE!\n');

  // Give user a chance to cancel (in production you'd want a prompt here)
  console.log('Starting deletion in 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Step 1: Delete all surveys with their subcollections
    console.log(`\n1️⃣  Deleting ${COLLECTIONS.SURVEYS} collection and subcollections...`);
    const surveysSnapshot = await db.collection(COLLECTIONS.SURVEYS).get();
    console.log(`  Found ${surveysSnapshot.size} surveys`);

    for (const surveyDoc of surveysSnapshot.docs) {
      console.log(`  Processing survey: ${surveyDoc.id}`);

      // Delete subcollections for this survey
      await deleteSubcollections(
        db,
        `${COLLECTIONS.SURVEYS}/${surveyDoc.id}`,
        [COLLECTIONS.RESULTS, COLLECTIONS.ANSWERS, COLLECTIONS.PRIVATE]
      );
    }

    // Delete the surveys collection itself
    await deleteCollection(db, COLLECTIONS.SURVEYS);
    console.log('  ✅ Surveys collection deleted\n');

    // Step 2: Delete analytics events
    console.log(`2️⃣  Deleting ${COLLECTIONS.ANALYTICS_EVENTS} collection...`);
    await deleteCollection(db, COLLECTIONS.ANALYTICS_EVENTS);
    console.log('  ✅ Analytics events deleted\n');

    // Step 3: Delete analytics documents (including global_metrics)
    console.log(`3️⃣  Deleting ${COLLECTIONS.ANALYTICS} collection...`);
    await deleteCollection(db, COLLECTIONS.ANALYTICS);
    console.log('  ✅ Analytics collection deleted\n');

    // Step 4: Delete benchmarks with their subcollections
    console.log(`4️⃣  Deleting ${COLLECTIONS.BENCHMARKS} collection...`);
    const benchmarksSnapshot = await db.collection(COLLECTIONS.BENCHMARKS).get();
    console.log(`  Found ${benchmarksSnapshot.size} benchmark documents`);

    for (const benchmarkDoc of benchmarksSnapshot.docs) {
      console.log(`  Processing benchmark: ${benchmarkDoc.id}`);

      // Delete 'sizes' subcollection if it exists
      await deleteSubcollections(
        db,
        `${COLLECTIONS.BENCHMARKS}/${benchmarkDoc.id}`,
        ['sizes']
      );
    }

    await deleteCollection(db, COLLECTIONS.BENCHMARKS);
    console.log('  ✅ Benchmarks collection deleted\n');

    console.log('\n🎉 SUCCESS: All Firestore data has been wiped!');
    console.log('📊 Collections deleted:');
    console.log(`   - ${COLLECTIONS.SURVEYS} (with subcollections)`);
    console.log(`   - ${COLLECTIONS.ANALYTICS_EVENTS}`);
    console.log(`   - ${COLLECTIONS.ANALYTICS}`);
    console.log(`   - ${COLLECTIONS.BENCHMARKS} (with subcollections)`);

  } catch (error) {
    console.error('\n❌ ERROR during wipe:', error);
    process.exit(1);
  }
}

// Run the wipe
wipeFirestore();
