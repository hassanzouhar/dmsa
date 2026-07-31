/**
 * GET /api/my-surveys/[id]
 *
 * Get full survey details including retrieval token for authenticated user
 * Requires session token from magic link verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSurvey, toSurveyDocument } from '@/lib/db';
import { verifySessionToken, type SessionPayload } from '@/lib/session-token';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const surveyId = params.id;

    // Get session token from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            error: 'Missing or invalid authorization',
            details: 'Session token required',
          },
        },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.substring(7);

    // Verify HMAC-signed session token. Forged or tampered tokens return null.
    const session: SessionPayload | null = verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SESSION',
            error: 'Invalid session token',
            details: 'Please request a new magic link',
          },
        },
        { status: 401 }
      );
    }

    // Check if session expired
    if (session.expiresAt < Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SESSION_EXPIRED',
            error: 'Session expired',
            details: 'Please request a new magic link',
          },
        },
        { status: 401 }
      );
    }

    // Check if survey belongs to this user
    if (!session.surveyIds.includes(surveyId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            error: 'Access denied',
            details: 'This survey does not belong to you',
          },
        },
        { status: 403 }
      );
    }

    const row = await getSurvey(surveyId);

    if (!row) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            error: 'Survey not found',
          },
        },
        { status: 404 }
      );
    }

    const survey = toSurveyDocument(row);

    return NextResponse.json({
      success: true,
      data: {
        survey: {
          ...survey,
          retrieval: { ...survey.retrieval, tokenHash: '[REDACTED]' },
        },
        // Kun hashen av uthentingstokenet lagres, så det kan ikke gjenskapes
        // her. Feltet returneres fortsatt for API-kompatibilitet, men var
        // også tidligere alltid undefined: upgrade-ruten skrev aldri noen
        // `retrievalToken` inn i private/userDetails.
        retrievalToken: undefined,
        results: row.scores,
        hasExpandedAccess: survey.flags.hasExpandedAccess,
      },
    });
  } catch (error) {
    console.error('Error in my-surveys/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
