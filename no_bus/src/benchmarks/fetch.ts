import type { BenchmarkDoc, DimensionScore } from './types';
import type { CompanySize, FirestoreLike, NaceLetter } from '../util/types';

const CACHE_TTL_MS = 10 * 60 * 1000;
const benchmarkCache = new Map<string, { expires: number; doc: BenchmarkDoc }>();

async function loadDocument(db: FirestoreLike, path: string): Promise<BenchmarkDoc | null> {
  const cached = benchmarkCache.get(path);
  if (cached && cached.expires > Date.now()) {
    return cached.doc;
  }

  const snap = await db.doc(path).get();
  if (!snap?.exists) {
    benchmarkCache.delete(path);
    return null;
  }

  const doc = snap.data() as BenchmarkDoc;
  benchmarkCache.set(path, { doc, expires: Date.now() + CACHE_TTL_MS });
  return doc;
}

// SSB oppgir ikke utvalgsstørrelse, så dekningen måles i antall indikatorer
// som faktisk ga en verdi for dimensjonen.
function hasSufficientSample(doc: BenchmarkDoc, minIndicators = 2): boolean {
  const dims = Object.values(doc.dimensions ?? {}) as DimensionScore[];
  if (!dims.length) return false;
  return dims.every(dim => (dim?.indicatorCount ?? 0) >= minIndicators);
}

export async function fetchBenchmarkDoc(
  db: FirestoreLike,
  nace: NaceLetter,
  size: CompanySize
): Promise<{ doc: BenchmarkDoc; source: 'segment' | 'sector' | 'national'; path: string }> {
  const segmentId = `${nace}_${size}`;
  const segmentPath = `/benchmarks/segments/data/${segmentId}`;
  const segmentDoc = await loadDocument(db, segmentPath);
  if (segmentDoc && hasSufficientSample(segmentDoc)) {
    return { doc: segmentDoc, source: 'segment', path: segmentPath };
  }

  const sectorPath = `/benchmarks/by-sector/data/${nace}`;
  const sectorDoc = await loadDocument(db, sectorPath);
  if (sectorDoc) {
    return { doc: sectorDoc, source: 'sector', path: sectorPath };
  }

  const nationalPath = `/benchmarks/national/data/all`;
  const nationalDoc = await loadDocument(db, nationalPath);
  if (nationalDoc) {
    return { doc: nationalDoc, source: 'national', path: nationalPath };
  }

  throw new Error(`Benchmark not found for ${segmentId} and no fallback available`);
}

export function clearBenchmarkCache() {
  benchmarkCache.clear();
}
