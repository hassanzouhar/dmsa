#!/usr/bin/env tsx
/**
 * Sector/Size Sanity Test
 *
 * Compares SSB responses for two sectors and sizes on a priority table
 * to validate that filtering and JSON-stat indexing work as expected.
 */

import { ssbClient } from '../lib/ssb-api-client';

async function run() {
  const table = process.argv[2] || '10974'; // default: E-commerce adoption
  const sectorA = process.argv[3] || 'C';   // Manufacturing
  const sectorB = process.argv[4] || 'J';   // Tech/IT
  const size = process.argv[5] || 'small';  // 20-49

  console.log(`🧪 Sanity check table ${table} | size=${size} | sectors ${sectorA} vs ${sectorB}`);

  const a = await ssbClient.getTableDataBySegment(table, sectorA, size, { language: 'no' });
  const b = await ssbClient.getTableDataBySegment(table, sectorB, size, { language: 'no' });

  const summarize = (d: any) => ({ valueLen: d?.value?.length, ids: d?.id, sizes: d?.size });
  console.log('A structure:', summarize(a));
  console.log('B structure:', summarize(b));

  if (!a?.value || !b?.value) {
    throw new Error('Missing value arrays in one of the responses');
  }

  const aFirst = a.value.find((v: any) => v !== null);
  const bFirst = b.value.find((v: any) => v !== null);
  console.log('A first non-null value:', aFirst);
  console.log('B first non-null value:', bFirst);

  if (aFirst === bFirst) {
    console.warn('⚠️ Values appear identical. This may be valid, but investigate table/dimension filters.');
  } else {
    console.log('✅ Values differ across sectors as expected.');
  }
}

run().catch((e) => {
  console.error('❌ Sanity test failed:', e);
  process.exit(1);
});

