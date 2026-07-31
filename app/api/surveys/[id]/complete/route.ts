/**
 * Survey Completion API - Complete assessment with answers and results
 * 
 * POST /api/surveys/{id}/complete - Complete survey with assessment data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSurvey, completeSurvey, setAnonymous, type Scores } from '@/lib/db';
import { verifyToken, checkRateLimit } from '@/lib/token-utils';
import type { ApiError } from '@/types/survey';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const surveyId = resolvedParams.id;
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Invalid JSON payload',
            code: 'INVALID_JSON'
          }
        } as { success: false; error: ApiError },
        { status: 400 }
      );
    }

    const { answers, results, isAnonymous } = body;

    if (!answers || !results) {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Missing answers or results data',
            code: 'MISSING_DATA'
          }
        } as { success: false; error: ApiError },
        { status: 400 }
      );
    }

    // Get authentication token from Authorization header or query param
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || new URL(request.url).searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Missing authentication token',
            code: 'MISSING_TOKEN'
          }
        } as { success: false; error: ApiError },
        { status: 401 }
      );
    }

    // Rate limiting by IP + survey ID
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkRateLimit(`complete_${clientIP}_${surveyId}`, 3, 10 * 60 * 1000)) { // 3 completions per 10 minutes per survey
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT',
            details: 'Too many completion requests for this survey. Please wait before trying again.'
          }
        } as { success: false; error: ApiError },
        { status: 429 }
      );
    }

    const survey = await getSurvey(surveyId);

    if (!survey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Survey not found',
            code: 'SURVEY_NOT_FOUND'
          }
        } as { success: false; error: ApiError },
        { status: 404 }
      );
    }

    // Check if token is revoked
    if (survey.token_revoked) {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Access token has been revoked',
            code: 'TOKEN_REVOKED'
          }
        } as { success: false; error: ApiError },
        { status: 403 }
      );
    }
    
    // Verify token
    if (!verifyToken(token, survey.token_hash)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Invalid access token',
            code: 'INVALID_TOKEN'
          }
        } as { success: false; error: ApiError },
        { status: 403 }
      );
    }

    const scores: Scores = {
      dimensions: results.dimensions,
      overall: results.overall,
      maturityClassification: results.maturityClassification,
    };

    // Betingelsen `completed_at is null` ligger i UPDATE-en, så to samtidige
    // kall kan ikke begge lykkes. null her betyr allerede fullført.
    const completedAt = await completeSurvey({
      id: surveyId,
      answers,
      scores,
      isAnonymous: isAnonymous || false,
    });

    if (!completedAt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Survey already completed',
            code: 'ALREADY_COMPLETED'
          }
        } as { success: false; error: ApiError },
        { status: 409 }
      );
    }

    console.log(`✅ Survey completed: ${surveyId} (Score: ${results.overall}/100)`);

    return NextResponse.json(
      {
        success: true,
        data: {
          surveyId,
          completedAt: completedAt.toISOString(),
          overallScore: results.overall,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Survey completion error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }
      } as { success: false; error: ApiError },
      { status: 500 }
    );
  }
}

// PATCH handler for updating anonymous flag
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const surveyId = resolvedParams.id;

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Invalid JSON payload',
            code: 'INVALID_JSON'
          }
        } as { success: false; error: ApiError },
        { status: 400 }
      );
    }

    const { isAnonymous } = body;

    if (typeof isAnonymous !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'isAnonymous must be a boolean',
            code: 'INVALID_DATA'
          }
        } as { success: false; error: ApiError },
        { status: 400 }
      );
    }

    // Get authentication token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || new URL(request.url).searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Missing authentication token',
            code: 'MISSING_TOKEN'
          }
        } as { success: false; error: ApiError },
        { status: 401 }
      );
    }

    const survey = await getSurvey(surveyId);

    if (!survey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Survey not found',
            code: 'SURVEY_NOT_FOUND'
          }
        } as { success: false; error: ApiError },
        { status: 404 }
      );
    }

    // Verify token
    if (!verifyToken(token, survey.token_hash)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Invalid access token',
            code: 'INVALID_TOKEN'
          }
        } as { success: false; error: ApiError },
        { status: 403 }
      );
    }

    await setAnonymous(surveyId, isAnonymous);

    console.log(`✅ Survey anonymous flag updated: ${surveyId} (isAnonymous: ${isAnonymous})`);

    return NextResponse.json(
      {
        success: true,
        data: {
          surveyId,
          isAnonymous,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update anonymous flag error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }
      } as { success: false; error: ApiError },
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
      'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}