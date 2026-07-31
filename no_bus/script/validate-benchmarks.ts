#!/usr/bin/env tsx
/**
 * Validate Benchmark JSON Output
 *
 * Usage:
 *   npx tsx script/validate-benchmarks.ts ./all-benchmarks-test.json
 */

import fs from 'fs';

interface BenchDoc {
  type: string;
  id: string;
  sector?: string;
  companySize?: string;
  dimensions: Record<string, {
    score: number;
    average: number;
    indicatorMin: number;
    indicatorMedian: number;
    indicatorMax: number;
    indicatorCount: number;
  }>;
  overall: { average: number; top25?: number; sampleSize?: number };
  dataSource?: string;
  hasSufficientData?: boolean;
  lastUpdated?: string;
}

function inRange(n: number, min: number, max: number) {
  return typeof n === 'number' && n >= min && n <= max;
}

function validate(doc: BenchDoc, idx: number) {
  const errors: string[] = [];
  const dims = Object.keys(doc.dimensions || {});
  if (dims.length !== 6) {
    errors.push(`expected 6 dimensions, got ${dims.length}`);
  }
  for (const [k, v] of Object.entries(doc.dimensions || {})) {
    if (!inRange(v.score, 0, 100)) errors.push(`${k}.score out of range`);
    if (!inRange(v.indicatorMin, 0, 100)) errors.push(`${k}.indicatorMin out of range`);
    if (!inRange(v.indicatorMedian, 0, 100)) errors.push(`${k}.indicatorMedian out of range`);
    if (!inRange(v.indicatorMax, 0, 100)) errors.push(`${k}.indicatorMax out of range`);
    if (!(v.indicatorMin <= v.indicatorMedian && v.indicatorMedian <= v.indicatorMax)) {
      errors.push(`${k} indicator spread not monotonic`);
    }
    if (!inRange(v.indicatorCount, 0, 10)) errors.push(`${k}.indicatorCount invalid`);
  }
  if (!inRange(doc.overall.average, 0, 100)) errors.push(`overall.average out of range`);
  if (!doc.lastUpdated) errors.push(`missing lastUpdated`);
  if (!doc.dataSource) errors.push(`missing dataSource`);
  return errors.map(e => `doc#${idx}(${doc.id}): ${e}`);
}

function main() {
  const file = process.argv[2] || 'all-benchmarks-test.json';
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const docs: BenchDoc[] = (raw.benchmarks || raw) as any;
  if (!Array.isArray(docs)) {
    console.error('Input does not look like a benchmark export array');
    process.exit(2);
  }

  const errors = docs.flatMap(validate);
  if (errors.length) {
    console.error('Validation failed:\n' + errors.join('\n'));
    process.exit(1);
  }
  console.log(`✅ ${docs.length} benchmark docs validated successfully.`);
}

main();

