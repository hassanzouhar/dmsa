export function clamp100(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function applyNegativeIndicators(
  baseScore: number,
  negatives: boolean[] = [],
  penaltyPerNegative = 15
): number {
  const penalties = negatives.filter(Boolean).length * penaltyPerNegative;
  return clamp100(baseScore - penalties);
}
