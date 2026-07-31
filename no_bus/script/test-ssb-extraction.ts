/**
 * Test SSB Data Extraction
 *
 * Quick test to verify JSON-stat2 parsing and filtering works correctly
 */

import { ssbClient } from '../lib/ssb-api-client';
import { SSBTransformer } from '../lib/ssb-transformer';

async function testExtraction() {
  console.log('🧪 Testing SSB Data Extraction\n');

  const transformer = new SSBTransformer();

  // Test 1: Fetch table with sector/size filters
  console.log('Test 1: Fetching table 10974 for sector C (Industry), size small (20-49)');
  try {
    const data = await ssbClient.getTableDataBySegment('10974', 'C', 'small', { language: 'no' });
    console.log('✅ Data fetched successfully');
    console.log('Response structure:', {
      hasValue: !!data.value,
      hasDimension: !!data.dimension,
      valueCount: data.value?.length,
      dimensions: data.id
    });
    console.log('Values:', data.value);
    console.log('');
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: Transform dimension score
  console.log('Test 2: Transform digitalStrategy dimension for sector C, size small');
  try {
    const score = await transformer.transformDimensionScore('digitalStrategy', {}, 'C', 'small');
    console.log('✅ Score calculated:', {
      score: score.score?.toFixed(1),
      indicatorMedian: score.indicatorMedian.toFixed(1),
      indicatorMax: score.indicatorMax.toFixed(1),
      indicatorCount: score.indicatorCount
    });
    console.log('');
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  // Test 3: Fetch without filters (national level)
  console.log('Test 3: Fetching table 10974 without filters (all sectors/sizes)');
  try {
    const data = await ssbClient.getTableData('10974', { language: 'no' });
    console.log('✅ Data fetched successfully');
    console.log('Response structure:', {
      hasValue: !!data.value,
      valueCount: data.value?.length,
      dimensions: data.id,
      sizes: data.size
    });
    console.log('');
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  console.log('✅ All tests complete!');
}

testExtraction().catch(console.error);
