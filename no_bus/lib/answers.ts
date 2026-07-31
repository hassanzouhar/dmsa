import { Answer } from '@/types/assessment';

type TableDualRows = Record<string, { left: boolean; right: boolean }>;
type ScaleTableRows = Record<string, number>;
type TriStateTableRows = Record<string, 'yes' | 'partial' | 'no'>;

const tableDualHasValue = (rows: TableDualRows = {}): boolean =>
  Object.values(rows).some(({ left, right }) => left || right);

const scaleTableHasValue = (rows: ScaleTableRows = {}): boolean =>
  Object.values(rows).some((value) => value !== undefined && value !== null);

const triStateTableHasValue = (rows: TriStateTableRows = {}): boolean =>
  Object.values(rows).some((value) => value === 'yes' || value === 'partial' || value === 'no');

export const answerHasValue = (answer?: Answer): boolean => {
  if (!answer) return false;

  switch (answer.type) {
    case 'checkboxes':
      return Array.isArray(answer.selected) && answer.selected.length > 0;
    case 'dual-checkboxes':
      return Boolean(answer.left || answer.right);
    case 'scale-0-5':
      return typeof answer.value === 'number';
    case 'tri-state':
      return ['yes', 'partial', 'no'].includes(answer.value);
    case 'table-dual-checkboxes':
      return tableDualHasValue(answer.rows);
    case 'scale-table':
      return scaleTableHasValue(answer.rows);
    case 'tri-state-table':
      return triStateTableHasValue(answer.rows);
    default:
      return false;
  }
};

export const normalizeAnswer = (answer?: Answer): Answer | undefined =>
  answerHasValue(answer) ? answer : undefined;
