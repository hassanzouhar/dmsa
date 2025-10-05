/**
 * Reset Firestore - Wipe and Seed
 *
 * This script wipes all Firestore data and seeds fresh dummy data.
 * Run with: npx tsx --env-file=.env.local scripts/reset-firestore.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(80)}\n`);

    const child = spawn('npx', ['tsx', '--env-file=.env.local', scriptPath], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Script ${scriptPath} failed with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function resetFirestore() {
  console.log('🔄 FIRESTORE RESET');
  console.log('==================\n');
  console.log('This will:');
  console.log('  1. Wipe ALL existing Firestore data');
  console.log('  2. Seed fresh dummy data\n');
  console.log('⚠️  WARNING: This action is IRREVERSIBLE!\n');

  try {
    // Step 1: Wipe
    console.log('Step 1: Wiping Firestore...');
    await runScript('scripts/wipe-firestore.js');

    // Step 2: Seed
    console.log('\nStep 2: Seeding Firestore...');
    await runScript('scripts/seed-firestore.js');

    console.log('\n\n' + '='.repeat(80));
    console.log('🎉 FIRESTORE RESET COMPLETE!');
    console.log('='.repeat(80));
    console.log('\nYour Firestore database has been wiped and seeded with fresh data.');
    console.log('You can now test the application with the sample surveys listed above.\n');

  } catch (error) {
    console.error('\n❌ ERROR during reset:', error.message);
    process.exit(1);
  }
}

resetFirestore();
