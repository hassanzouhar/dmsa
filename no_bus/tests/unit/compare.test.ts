import { expect, test } from '@jest/globals';
import { compareToBenchmark } from '../../src/report/compare';

const ref = {
  indicatorMin: 40,
  indicatorMedian: 60,
  indicatorMax: 80,
  average: 65,
  indicatorCount: 3,
} as const;

test('band and delta', () => {
  const comparison = compareToBenchmark(72, ref);
  expect(comparison.band).toBe('lightgreen');
  expect(comparison.deltaToMedian).toBe(12);
  expect(comparison.percentileHint).toBe(60);
});
