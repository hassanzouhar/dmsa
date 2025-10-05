export type SimplifiedSector =
  | 'manufacturing'
  | 'services'
  | 'retail'
  | 'healthcare'
  | 'education'
  | 'government'
  | 'finance'
  | 'other';

const NACE_TO_SECTOR: Record<string, SimplifiedSector> = {
  A: 'other',
  B: 'other',
  C: 'manufacturing',
  D: 'other',
  E: 'other',
  F: 'other',
  G: 'retail',
  H: 'other',
  I: 'services',
  J: 'services',
  K: 'finance',
  L: 'services',
  M: 'services',
  N: 'services',
  O: 'government',
  P: 'education',
  Q: 'healthcare',
  R: 'services',
  S: 'services',
  T: 'other',
  U: 'government',
};

export const mapNaceToSector = (nace?: string): SimplifiedSector => {
  if (!nace) return 'other';
  const key = nace.charAt(0).toUpperCase();
  return NACE_TO_SECTOR[key] || 'other';
};
