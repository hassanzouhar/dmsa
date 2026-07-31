/**
 * Survey Results API - Token-protected results retrieval
 * 
 * GET /api/surveys/{id}/results?token=... - Retrieve survey results with token authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSurvey, toSurveyDocument } from '@/lib/db';
import { verifyToken, checkRateLimit } from '@/lib/token-utils';
import type { ApiError, PublicUserDetails } from '@/types/survey';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const surveyId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // Basic validation
    if (!surveyId || !token) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            error: 'Missing survey ID or token', 
            code: 'MISSING_PARAMS' 
          } 
        } as { success: false; error: ApiError },
        { status: 400 }
      );
    }
    
    // Rate limiting by IP + survey ID
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkRateLimit(`retrieve_${clientIP}_${surveyId}`, 20, 5 * 60 * 1000)) { // 20 requests per 5 minutes per survey
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            error: 'Rate limit exceeded', 
            code: 'RATE_LIMIT',
            details: 'Too many retrieval requests for this survey. Please wait before trying again.'
          } 
        } as { success: false; error: ApiError },
        { status: 429 }
      );
    }
    
    // Én rad dekker det som tidligere var survey + 3 subcollection-oppslag.
    const row = await getSurvey(surveyId);

    if (!row) {
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

    const survey = toSurveyDocument(row);

    // Check if token is revoked
    if (row.token_revoked) {
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
    if (!verifyToken(token, row.token_hash)) {
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

    const publicResults = row.scores;
    const answers = row.answers ? { answers: row.answers } : undefined;

    // Kun ikke-sensitive kontaktfelter returneres — aldri e-post eller navn.
    const userDetails: PublicUserDetails | undefined = row.upgraded_at
      ? {
          emailDomain: row.email_domain ?? '',
          createdAt: row.upgraded_at.toISOString(),
          ...(row.consent_accepted_at
            ? { consentAcceptedAt: row.consent_accepted_at.toISOString() }
            : {}),
          ...(row.policy_version ? { policyVersion: row.policy_version } : {}),
        }
      : undefined;

    const response = {
      survey,
      results: publicResults,
      answers,
      userDetails,
      hasExpandedAccess: survey.flags.hasExpandedAccess,
    };

    // If survey doesn't have results yet, return limited data
    if (!publicResults) {
      return NextResponse.json(
        { 
          success: true, 
          data: {
            survey: {
              ...survey,
              // Hide retrieval token hash in response
              retrieval: {
                ...survey.retrieval,
                tokenHash: '[REDACTED]',
              },
            },
            results: null,
            answers: undefined,
            userDetails: undefined,
            hasExpandedAccess: survey.flags.hasExpandedAccess,
          }
        }
      );
    }
    
    console.log(`📊 Survey retrieved: ${surveyId} (${survey.flags.hasExpandedAccess ? 'T1' : 'T0'})`);
    
    return NextResponse.json(
      { 
        success: true, 
        data: {
          ...response,
          survey: {
            ...response.survey,
            // Hide retrieval token hash in response
            retrieval: {
              ...response.survey.retrieval,
              tokenHash: '[REDACTED]',
            },
          },
        }
      }
    );
    
  } catch (error) {
    console.error('Survey retrieval error:', error);
    
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}