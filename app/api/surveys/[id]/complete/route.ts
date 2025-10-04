/**
 * Survey Completion API - Complete assessment with answers and results
 * 
 * POST /api/surveys/{id}/complete - Complete survey with assessment data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { verifyToken, checkRateLimit } from '@/lib/token-utils';
import { 
  SurveyDocument,
  PublicResultsDocument,
  AnswersDocument,
  ApiError,
} from '@/types/firestore-schema';

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

    const { answers, results } = body;

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

    // Initialize Admin SDK
    const db = getAdminFirestore();
    
    // Get survey document
    const surveyDoc = await db.collection('surveys').doc(surveyId).get();
    
    if (!surveyDoc.exists) {
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

    const survey = surveyDoc.data() as SurveyDocument;
    
    // Check if token is revoked
    if (survey.retrieval.revoked) {
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
    if (!verifyToken(token, survey.retrieval.tokenHash)) {
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

    // Check if survey is already completed
    if (survey.flags.isCompleted) {
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

    // Prepare completion data
    const completedAt = new Date().toISOString();
    const publicResults: PublicResultsDocument = {
      dimensions: results.dimensions,
      overall: results.overall,
      maturityClassification: results.maturityClassification,
    };

    const answersDoc: AnswersDocument = {
      answers: answers,
    };

    // Use a batch write for atomicity
    const batch = db.batch();

    // Update survey document
    const surveyRef = db.collection('surveys').doc(surveyId);
    batch.update(surveyRef, {
      completedAt,
      overallScore: results.overall,
      'flags.isCompleted': true,
      'flags.hasResults': true,
    });

    // Save public results
    const resultsRef = db.collection('surveys').doc(surveyId)
      .collection('results').doc('public');
    batch.set(resultsRef, publicResults);

    // Save answers
    const answersRef = db.collection('surveys').doc(surveyId)
      .collection('answers').doc('current');
    batch.set(answersRef, answersDoc);

    // Commit the batch
    await batch.commit();

    // Track completion event
    const analyticsEvent: Record<string, unknown> = {
      event: 'assessment_completed',
      timestamp: new Date().toISOString(),
      serverTimestamp: new Date(),
      surveyId,
      language: survey.language,
      surveyVersion: survey.surveyVersion,
      overallScore: results.overall,
      maturityLevel: results.maturityClassification.level,
      companySize: survey.companyDetails.companySize,
      sector: survey.companyDetails.sector,
      region: survey.companyDetails.region,
    };
    
    // Only add optional fields if they have values
    const userAgent = request.headers.get('user-agent');
    if (userAgent) {
      analyticsEvent.userAgent = userAgent;
    }
    
    await db.collection('analytics_events').add(analyticsEvent);

    console.log(`✅ Survey completed: ${surveyId} (Score: ${results.overall}/100)`);

    return NextResponse.json(
      {
        success: true,
        data: {
          surveyId,
          completedAt,
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

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}