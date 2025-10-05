/**
 * GET /api/my-surveys/[id]
 *
 * Get full survey details including retrieval token for authenticated user
 * Requires session token from magic link verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS, DOCUMENT_IDS } from '@/types/firestore-schema';
import { hashEmail } from '@/lib/email-survey-mapping';

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

    // Verify session token
    let session: { email: string; surveyIds: string[]; expiresAt: number };
    try {
      session = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    } catch {
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

    // Fetch survey with retrieval token
    const db = getAdminFirestore();
    const surveyDoc = await db.collection(COLLECTIONS.SURVEYS).doc(surveyId).get();

    if (!surveyDoc.exists) {
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

    const surveyData = surveyDoc.data();

    // Get retrieval token (this is the key to accessing survey details)
    const retrievalTokenData = surveyData?.retrieval;

    // Fetch full results
    const resultsDoc = await db
      .collection(COLLECTIONS.SURVEYS)
      .doc(surveyId)
      .collection(COLLECTIONS.RESULTS)
      .doc(DOCUMENT_IDS.PUBLIC_RESULTS)
      .get();

    return NextResponse.json({
      success: true,
      data: {
        survey: surveyData,
        retrievalToken: retrievalTokenData?.tokenHash, // Return hash, frontend will use original token from local storage if available
        results: resultsDoc.exists ? resultsDoc.data() : null,
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
