import { expect, test } from '@jest/globals';
import { aggregateDimension } from '../../src/scoring/aggregate';

test('aggregate weights', () => {
  const score = aggregateDimension([
    { id: 'Q1', score: 80, weight: 2 },
    { id: 'Q2', score: 60, weight: 1 },
  ]);
  expect(Math.round(score)).toBe(73);
});
