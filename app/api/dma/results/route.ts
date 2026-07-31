/**
 * Legacy API Bridge - Backward compatibility during transition
 *
 * GET /api/dma/results?respondentId={id}&token={retrievalToken}
 *
 * TODO: Remove this after frontend is migrated to /api/surveys/{id}/results?token={token}
 *
 * Firebase Storage-fallbacken er fjernet sammen med Firebase. Den leste
 * gamle /surveys/{id}.json-filer fra en enda eldre datamodell; de dataene
 * er ikke migrert til Postgres.
 *
 * Autorisering er påkrevd (innført i 936890f): uten den kunne hvem som helst
 * med en survey-ID lese resultatene. IDen alene er ikke en hemmelighet — den
 * står i URL-er og blir delt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSurvey } from '@/lib/db';
import { verifyToken } from '@/lib/token-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const respondentId = searchParams.get('respondentId');
  const token = searchParams.get('token');

  if (!respondentId) {
    return NextResponse.json(
      { success: false, error: 'Missing respondentId parameter' },
      { status: 400 }
    );
  }

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Missing token parameter' },
      { status: 401 }
    );
  }

  try {
    const survey = await getSurvey(respondentId);

    if (!survey || !survey.scores) {
      return NextResponse.json(
        { success: false, error: 'Survey not completed or results not available' },
        { status: 404 }
      );
    }

    // Authorize: verify retrieval token against stored hash. Reject revoked tokens.
    if (survey.token_revoked || !verifyToken(token, survey.token_hash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or revoked token' },
        { status: 403 }
      );
    }

    const hasExpandedAccess = survey.upgraded_at !== null;

    return NextResponse.json({
      success: true,
      data: {
        survey: {
          id: survey.id,
          version: survey.survey_version,
          language: survey.language,
          timestamp: survey.created_at.toISOString(),
          scores: {
            dimensions: survey.scores.dimensions,
            overall: survey.scores.overall,
            maturityClassification: survey.scores.maturityClassification,
          },
          userDetails: hasExpandedAccess
            ? {
                email: '[REDACTED]', // Don't expose email in legacy API
                companyName: survey.company_name,
                sector: survey.sector,
                companySize: survey.company_size,
                region: survey.region,
              }
            : null,
          hasExpandedAccess,
        },
      },
    });
  } catch (error) {
    console.error('Legacy API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
