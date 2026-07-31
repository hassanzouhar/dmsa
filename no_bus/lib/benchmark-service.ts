/**
 * Benchmark Retrieval with Fallbacks
 *
 * Looks up the most specific benchmark first (segment: sector_size),
 * then falls back to sector, size, and finally national.
 * Returns the found benchmark with a provenance flag.
 */

type FirestoreLike = {
  collection: (name: string) => any;
};

export interface BenchmarkWithProvenance<T = any> {
  data: T | null;
  matchType: 'segment' | 'sector' | 'size' | 'national' | 'none';
  path?: string;
}

export async function getBenchmarkWithFallback(
  db: FirestoreLike,
  params: { sector: string; companySize: 'micro' | 'small' | 'medium' | 'large'; region?: string }
): Promise<BenchmarkWithProvenance> {
  const { sector, companySize, region } = params;

  // 1) Try segment
  const segmentId = `${sector}_${companySize}`;
  let snap = await db
    .collection('benchmarks')
    .doc('segments')
    .collection('data')
    .doc(segmentId)
    .get();
  if (snap?.exists && snap.data()?.hasSufficientData !== false) {
    return { data: snap.data(), matchType: 'segment', path: `benchmarks/segments/data/${segmentId}` };
  }

  // 2) Fallback to sector
  snap = await db
    .collection('benchmarks')
    .doc('by-sector')
    .collection('data')
    .doc(sector)
    .get();
  if (snap?.exists) {
    return { data: snap.data(), matchType: 'sector', path: `benchmarks/by-sector/data/${sector}` };
  }

  // 3) Fallback to size
  snap = await db
    .collection('benchmarks')
    .doc('by-size')
    .collection('data')
    .doc(companySize)
    .get();
  if (snap?.exists) {
    return { data: snap.data(), matchType: 'size', path: `benchmarks/by-size/data/${companySize}` };
  }

  // 4) Fallback to region (if provided)
  if (region) {
    snap = await db
      .collection('benchmarks')
      .doc('by-region')
      .collection('data')
      .doc(region)
      .get();
    if (snap?.exists) {
      return { data: snap.data(), matchType: 'region', path: `benchmarks/by-region/data/${region}` };
    }
  }

  // 5) National
  snap = await db
    .collection('benchmarks')
    .doc('national')
    .collection('data')
    .doc('all')
    .get();
  if (snap?.exists) {
    return { data: snap.data(), matchType: 'national', path: `benchmarks/national/data/all` };
  }

  return { data: null, matchType: 'none' };
}

/**
 * Ensure container documents exist so subcollections are addressable and visible in UI tools.
 * Safe to call at startup (idempotent via merge).
 */
export async function ensureBenchmarkCollections(db: FirestoreLike) {
  const containers = ['national', 'by-sector', 'by-size', 'segments'];
  const now = new Date().toISOString();
  for (const c of containers) {
    await db
      .collection('benchmarks')
      .doc(c)
      .set({ type: 'container', id: c, createdAt: now, updatedAt: now }, { merge: true });
  }
}
