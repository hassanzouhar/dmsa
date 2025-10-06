/**
 * GET /api/benchmarks/averages
 *
 * Calculate average scores for benchmarking comparisons
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/types/firestore-schema';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sector = searchParams.get('sector');
  const companySize = searchParams.get('companySize');
  const region = searchParams.get('region');

  console.log('📊 Benchmark request:', { sector, companySize, region });

  try {
    const db = getAdminFirestore();
    const surveysRef = db.collection(COLLECTIONS.SURVEYS);

    const averages: {
      sector?: number;
      companySize?: number;
      county?: number;
    } = {};

    // Fetch sector average (limit to 100 for performance)
    if (sector) {
      console.log(`🔍 Querying sector: ${sector}`);
      const sectorQuery = surveysRef
        .where('companyDetails.sector', '==', sector)
        .where('state', '==', 'completed')
        .where('flags.includeInLeaderboard', '==', true)
        .limit(100);

      const sectorSnapshot = await sectorQuery.get();
      console.log(`📈 Sector query found ${sectorSnapshot.size} documents`);

      if (!sectorSnapshot.empty) {
        const scores = sectorSnapshot.docs
          .map(doc => doc.data().overallScore)
          .filter(score => typeof score === 'number');

        console.log(`📊 Valid scores for sector: ${scores.length}`, scores.slice(0, 5));

        if (scores.length > 0) {
          averages.sector = Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
          );
          console.log(`✅ Sector average: ${averages.sector}`);
        }
      }
    }

    // Fetch company size average
    if (companySize) {
      const sizeQuery = surveysRef
        .where('companyDetails.companySize', '==', companySize)
        .where('state', '==', 'completed')
        .where('flags.includeInLeaderboard', '==', true)
        .limit(100);

      const sizeSnapshot = await sizeQuery.get();
      if (!sizeSnapshot.empty) {
        const scores = sizeSnapshot.docs
          .map(doc => doc.data().overallScore)
          .filter(score => typeof score === 'number');

        if (scores.length > 0) {
          averages.companySize = Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
          );
        }
      }
    }

    // Fetch county average (from region)
    if (region) {
      const countyQuery = surveysRef
        .where('companyDetails.region', '==', region)
        .where('state', '==', 'completed')
        .where('flags.includeInLeaderboard', '==', true)
        .limit(100);

      const countySnapshot = await countyQuery.get();
      if (!countySnapshot.empty) {
        const scores = countySnapshot.docs
          .map(doc => doc.data().overallScore)
          .filter(score => typeof score === 'number');

        if (scores.length > 0) {
          averages.county = Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
          );
        }
      }
    }

    console.log('📤 Returning averages:', averages);
    return NextResponse.json(averages);
  } catch (error) {
    console.error('❌ Failed to calculate benchmark averages:', error);
    return NextResponse.json(
      { error: 'Failed to calculate averages' },
      { status: 500 }
    );
  }
}
