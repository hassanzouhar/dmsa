#!/usr/bin/env node

/**
 * DMA Results API Test Script
 * Tests the /api/dma/results endpoint functionality
 */

const BASE_URL = 'http://localhost:3000';

// Test survey IDs
const TEST_SURVEYS = {
  premium: '30117a12cc',  // Has user details and benchmark data
  basic: 'basic123456',   // Basic survey without user details
  invalid: 'invalid123'   // Should return 404
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${colors.bold}🧪 ${testName}${colors.reset}`);
  console.log('─'.repeat(50));
}

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      success: response.ok,
      data: data
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

async function testGetSingleSurvey() {
  logTest('GET Single Survey - Premium');
  
  const result = await makeRequest(`/api/dma/results?respondentId=${TEST_SURVEYS.premium}`);
  
  if (result.success && result.data.success) {
    log('✅ Successfully retrieved premium survey', 'green');
    log(`📊 Overall Score: ${result.data.data.survey.scores.overall}`, 'blue');
    log(`🏢 Company: ${result.data.data.survey.userDetails?.companyName || 'N/A'}`, 'blue');
    
    if (result.data.data.benchmark) {
      log(`📈 Benchmark: ${result.data.data.benchmark.overall.performanceLevel} (${result.data.data.benchmark.overall.percentile}th percentile)`, 'blue');
    } else {
      log('⚠️  No benchmark data included', 'yellow');
    }
  } else {
    log(`❌ Failed to retrieve survey: ${result.data?.error?.message || result.error}`, 'red');
  }
}

async function testGetBasicSurvey() {
  logTest('GET Single Survey - Basic');
  
  const result = await makeRequest(`/api/dma/results?respondentId=${TEST_SURVEYS.basic}`);
  
  if (result.success && result.data.success) {
    log('✅ Successfully retrieved basic survey', 'green');
    log(`📊 Overall Score: ${result.data.data.survey.scores.overall}`, 'blue');
    
    if (!result.data.data.survey.userDetails) {
      log('ℹ️  No user details (expected for basic survey)', 'blue');
    }
    
    if (!result.data.data.benchmark) {
      log('ℹ️  No benchmark data (expected without user details)', 'blue');
    }
  } else {
    log(`❌ Failed to retrieve basic survey: ${result.data?.error?.message || result.error}`, 'red');
  }
}

async function testGetSurveyNotFound() {
  logTest('GET Survey - Not Found');
  
  const result = await makeRequest(`/api/dma/results?respondentId=${TEST_SURVEYS.invalid}`);
  
  if (!result.success && result.data.error?.error === 'SURVEY_NOT_FOUND') {
    log('✅ Correctly returned 404 for invalid survey ID', 'green');
    log(`📝 Error message: ${result.data.error.message}`, 'blue');
  } else {
    log('❌ Expected 404 error for invalid survey ID', 'red');
  }
}

async function testGetWithSnapshot() {
  logTest('GET Survey - With Time Series Snapshot');
  
  const result = await makeRequest(`/api/dma/results?respondentId=${TEST_SURVEYS.premium}&snapshot=T1`);
  
  if (result.success && result.data.success) {
    log('✅ Successfully handled time series request', 'green');
    log(`📋 Survey ID used: ${result.data.data.survey.id}`, 'blue');
  } else if (result.data?.error?.error === 'SURVEY_NOT_FOUND') {
    log('⚠️  Time series snapshot not found (expected if not created)', 'yellow');
    log(`📝 Attempted ID: ${TEST_SURVEYS.premium}_T1`, 'blue');
  } else {
    log(`❌ Unexpected error: ${result.data?.error?.message || result.error}`, 'red');
  }
}

async function testGetSummaryFormat() {
  logTest('GET Survey - Summary Format');
  
  const result = await makeRequest(`/api/dma/results?respondentId=${TEST_SURVEYS.premium}&format=summary`);
  
  if (result.success && result.data.success) {
    log('✅ Successfully retrieved summary format', 'green');
    
    // Check that answers are not included in summary
    if (!result.data.data.survey.answers) {
      log('ℹ️  Answers excluded in summary format (correct)', 'blue');
    } else {
      log('⚠️  Answers included in summary format (unexpected)', 'yellow');
    }
    
    log(`📊 Scores included: ${JSON.stringify(result.data.data.survey.scores.overall)}`, 'blue');
  } else {
    log(`❌ Failed to retrieve summary: ${result.data?.error?.message || result.error}`, 'red');
  }
}

async function testPostBatchRetrieval() {
  logTest('POST Batch Retrieval');
  
  const requestBody = {
    respondentIds: [TEST_SURVEYS.premium, TEST_SURVEYS.basic, TEST_SURVEYS.invalid],
    includeBenchmark: true,
    format: 'summary'
  };
  
  const result = await makeRequest('/api/dma/results', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (result.success && result.data.success) {
    log('✅ Successfully processed batch request', 'green');
    log(`📊 Total requested: ${result.data.data.meta.totalRequested}`, 'blue');
    log(`✅ Successful: ${result.data.data.meta.successful}`, 'green');
    log(`❌ Failed: ${result.data.data.meta.failed}`, 'red');
    
    if (result.data.data.results.length > 0) {
      log(`📋 First result ID: ${result.data.data.results[0].respondentId}`, 'blue');
    }
    
    if (result.data.data.errors.length > 0) {
      log(`⚠️  First error: ${result.data.data.errors[0].error}`, 'yellow');
    }
  } else {
    log(`❌ Batch request failed: ${result.data?.error?.message || result.error}`, 'red');
  }
}

async function testValidationErrors() {
  logTest('Validation Errors');
  
  // Test missing respondentId
  const noId = await makeRequest('/api/dma/results');
  if (noId.data?.error?.error === 'MISSING_RESPONDENT_ID') {
    log('✅ Correctly validated missing respondentId', 'green');
  } else {
    log('❌ Failed to validate missing respondentId', 'red');
  }
  
  // Test invalid snapshot
  const invalidSnapshot = await makeRequest(`/api/dma/results?respondentId=${TEST_SURVEYS.premium}&snapshot=T5`);
  if (invalidSnapshot.data?.error?.error === 'INVALID_SNAPSHOT') {
    log('✅ Correctly validated invalid snapshot', 'green');
  } else {
    log('❌ Failed to validate invalid snapshot', 'red');
  }
  
  // Test invalid format
  const invalidFormat = await makeRequest(`/api/dma/results?respondentId=${TEST_SURVEYS.premium}&format=xml`);
  if (invalidFormat.data?.error?.error === 'INVALID_FORMAT') {
    log('✅ Correctly validated invalid format', 'green');
  } else {
    log('❌ Failed to validate invalid format', 'red');
  }
}

async function runAllTests() {
  log('🚀 Starting DMA Results API Tests\n', 'bold');
  
  try {
    await testGetSingleSurvey();
    await testGetBasicSurvey();
    await testGetSurveyNotFound();
    await testGetWithSnapshot();
    await testGetSummaryFormat();
    await testPostBatchRetrieval();
    await testValidationErrors();
    
    log('\n🎉 All tests completed!', 'bold');
    
  } catch (error) {
    log(`\n💥 Test suite failed with error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Check if we can reach the server
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    return response.ok || response.status === 404; // 404 is fine, means server is running
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  log('🔍 Checking server availability...', 'blue');
  
  const serverAvailable = await checkServer();
  if (!serverAvailable) {
    log(`❌ Server not available at ${BASE_URL}`, 'red');
    log('💡 Please start the development server with: npm run dev', 'yellow');
    process.exit(1);
  }
  
  log('✅ Server is available', 'green');
  await runAllTests();
})();