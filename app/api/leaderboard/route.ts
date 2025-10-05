/**
 * Leaderboard API - Public leaderboard data
 *
 * GET /api/leaderboard - Get leaderboard entries with optional filtering
 * GET /api/leaderboard?benchmarks=true - Get industry benchmarks
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getLeaderboardEntries,
  getIndustryBenchmarks,
  getSurveyStats,
} from '@/lib/leaderboard-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sector = searchParams.get('sector') || undefined;
    const size = searchParams.get('size') as 'micro' | 'small' | 'medium' | 'large' | undefined;
    const country = searchParams.get('country') || undefined;
    const county = searchParams.get('county') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const benchmarks = searchParams.get('benchmarks') === 'true';
    const count = searchParams.get('count') === 'true';

    // Return survey count only
    if (count) {
      const stats = await getSurveyStats();
      return NextResponse.json({
        success: true,
        data: stats
      });
    }

    // Return industry benchmarks
    if (benchmarks) {
      const industryBenchmarks = await getIndustryBenchmarks();
      return NextResponse.json({
        success: true,
        data: { benchmarks: industryBenchmarks }
      });
    }

    // Return leaderboard entries
    const entries = await getLeaderboardEntries({
      sector,
      size,
      country,
      county,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        entries,
        total: entries.length,
        filters: {
          sector,
          size,
          country,
          county,
          limit,
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
