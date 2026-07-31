import type { NaceLetter } from './types';

const VALID_NACE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTU';

export function toNaceLetter(naceCode: string): NaceLetter {
  const letter = (naceCode?.trim()?.toUpperCase() || 'U')[0];
  const valid = VALID_NACE_LETTERS.includes(letter) ? letter : 'U';
  return valid as NaceLetter;
}
