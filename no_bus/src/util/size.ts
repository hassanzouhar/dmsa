import type { CompanySize } from './types';

export function normalizeSize(size: string): CompanySize {
  const normalized = size?.toLowerCase() ?? '';
  if (normalized.startsWith('micro')) return 'micro';
  if (normalized.startsWith('small')) return 'small';
  if (normalized.startsWith('medium')) return 'medium';
  return 'large';
}
