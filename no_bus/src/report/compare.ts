import type { Band } from '../util/types';
import type { DimensionScore } from '../benchmarks/types';

// Båndene måler brukeren mot spredningen i sektorens SSB-indikatorer: under den
// svakeste, under medianen, under den sterkeste, eller over alle. Det er ikke en
// persentilrangering blant foretak — derfor er `percentileHint` et grovt hint.
export function resolveBand(user: number, reference: DimensionScore): Band {
  if (user < reference.indicatorMin) return 'red';
  if (user < reference.indicatorMedian) return 'yellow';
  if (user < reference.indicatorMax) return 'lightgreen';
  return 'green';
}

export function compareToBenchmark(user: number, reference: DimensionScore) {
  const band = resolveBand(user, reference);
  const deltaToMedian = Math.round(user - reference.indicatorMedian);
  const percentileHint = user < reference.indicatorMin
    ? 20
    : user < reference.indicatorMedian
      ? 40
      : user < reference.indicatorMax
        ? 60
        : 80;
  return { band, deltaToMedian, percentileHint };
}
