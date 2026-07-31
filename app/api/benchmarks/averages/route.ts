/**
 * GET /api/benchmarks/averages
 *
 * Calculate average scores for benchmarking comparisons
 */

import { NextRequest, NextResponse } from 'next/server';
import { averageScoreBy } from '@/lib/db';

/**
 * NB: Firestore-versjonen filtrerte på `state == 'completed'`, men `state`
 * har alltid bare vært 'T0' eller 'T1' — så alle tre spørringene traff null
 * dokumenter og ruten returnerte alltid et tomt objekt. Her filtreres det
 * på at survey-et faktisk er fullført, slik det var ment.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sector = searchParams.get('sector');
  const companySize = searchParams.get('companySize');
  const region = searchParams.get('region');

  try {
    const [sectorAvg, sizeAvg, countyAvg] = await Promise.all([
      sector ? averageScoreBy('sector', sector) : null,
      companySize ? averageScoreBy('company_size', companySize) : null,
      region ? averageScoreBy('region', region) : null,
    ]);

    const averages: { sector?: number; companySize?: number; county?: number } = {};
    if (sectorAvg !== null) averages.sector = sectorAvg;
    if (sizeAvg !== null) averages.companySize = sizeAvg;
    if (countyAvg !== null) averages.county = countyAvg;

    return NextResponse.json(averages);
  } catch (error) {
    console.error('❌ Failed to calculate benchmark averages:', error);
    return NextResponse.json(
      { error: 'Failed to calculate averages' },
      { status: 500 }
    );
  }
}
