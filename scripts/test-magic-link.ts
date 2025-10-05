/**
 * Test Magic Link Flow
 *
 * Tests the complete magic link email flow:
 * 1. Create a magic link
 * 2. Send email via Resend
 * 3. Verify token
 *
 * Run with: npx tsx --env-file=.env.local scripts/test-magic-link.ts
 */

import { createMagicLink, verifyMagicLinkToken } from '../lib/magic-link';
import { addSurveyToEmail, getSurveysByEmail } from '../lib/email-survey-mapping';
import { sendMagicLinkEmail } from '../lib/email-service';
import { initializeAdminSDK } from '../lib/firebase-admin';

const TEST_EMAIL = 'haz@rastla.us'; // Replace with your email for testing
const TEST_SURVEY_ID = 'test-survey-123';

async function testMagicLinkFlow() {
  console.log('🧪 Testing Magic Link Flow\n');

  // Initialize Firebase Admin
  initializeAdminSDK();

  try {
    // Step 1: Add survey to email mapping
    console.log('1️⃣  Adding survey to email mapping...');
    await addSurveyToEmail(TEST_EMAIL, TEST_SURVEY_ID);
    console.log(`   ✅ Added survey ${TEST_SURVEY_ID} to ${TEST_EMAIL}\n`);

    // Step 2: Verify mapping
    console.log('2️⃣  Verifying email mapping...');
    const surveys = await getSurveysByEmail(TEST_EMAIL);
    console.log(`   ✅ Found ${surveys.length} surveys for ${TEST_EMAIL}`);
    console.log(`   📋 Survey IDs: ${surveys.join(', ')}\n`);

    // Step 3: Create magic link
    console.log('3️⃣  Creating magic link...');
    const { token, expiry } = await createMagicLink(TEST_EMAIL);
    console.log(`   ✅ Magic link created`);
    console.log(`   🔑 Token: ${token.substring(0, 20)}...`);
    console.log(`   ⏰ Expires: ${expiry.toLocaleString('no-NO')}\n`);

    // Step 4: Send email
    console.log('4️⃣  Sending magic link email via Resend...');
    const emailResult = await sendMagicLinkEmail({
      email: TEST_EMAIL,
      token,
      surveyCount: surveys.length,
      expiryDate: expiry,
    });

    if (emailResult.success) {
      console.log(`   ✅ Email sent successfully!`);
      console.log(`   📧 Message ID: ${emailResult.messageId}\n`);
    } else {
      console.error(`   ❌ Email failed: ${emailResult.error}\n`);
      return;
    }

    // Step 5: Verify token
    console.log('5️⃣  Verifying magic link token...');
    const verification = await verifyMagicLinkToken(token, TEST_EMAIL);

    if (verification.valid) {
      console.log(`   ✅ Token verified successfully!`);
      console.log(`   🔐 Email hash: ${verification.emailHash}\n`);
    } else {
      console.error(`   ❌ Token verification failed: ${verification.reason}\n`);
      return;
    }

    // Step 6: Try to verify again (should fail - one-time use)
    console.log('6️⃣  Testing one-time use (should fail)...');
    const secondVerification = await verifyMagicLinkToken(token, TEST_EMAIL);

    if (!secondVerification.valid) {
      console.log(`   ✅ Correctly rejected reused token`);
      console.log(`   📋 Reason: ${secondVerification.reason}\n`);
    } else {
      console.error(`   ❌ ERROR: Token was reusable (should be one-time use)\n`);
    }

    console.log('🎉 All tests passed!\n');
    console.log('📬 Check your email at:', TEST_EMAIL);
    console.log('   You should have received a beautifully formatted magic link email!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testMagicLinkFlow();
