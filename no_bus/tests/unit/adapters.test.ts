import { expect, test } from '@jest/globals';
import {
  scoreCheckboxes,
  scoreScaleTable,
  scoreTriStateTable,
  scoreTableDualCheckboxes,
} from '../../src/mapping/questionAdapters';

test('checkboxes basic', () => {
  const score = scoreCheckboxes(['a', 'c'], [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  expect(Math.round(score)).toBe(67);
});

test('scale-table', () => {
  const score = scoreScaleTable([0, 3, 5]);
  expect(Math.round(score)).toBe(53);
});

test('tri-state', () => {
  const score = scoreTriStateTable(['no', 'partial', 'yes']);
  expect(score).toBe(50);
});

test('dual-table', () => {
  const rows = [{ id: 'r1' }, { id: 'r2' }];
  const score = scoreTableDualCheckboxes(rows, ['r1'], ['r1', 'r2'], 1, 0.5);
  expect(Math.round(score)).toBe(67);
});
