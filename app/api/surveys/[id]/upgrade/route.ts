/**
 * Survey Upgrade API - Upgrade T0 survey to T1 with user details
 * 
 * POST /api/surveys/{id}/upgrade - Upgrade survey with email capture
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { verifyToken, checkRateLimit } from '@/lib/token-utils';
import { 
  SurveyDocument,
  PrivateUserDetailsDocument,
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

    const { userDetails } = body;

    if (!userDetails || !userDetails.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Missing user details or email',
            code: 'MISSING_USER_DETAILS'
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
    
    if (!checkRateLimit(`upgrade_${clientIP}_${surveyId}`, 3, 10 * 60 * 1000)) { // 3 upgrades per 10 minutes per survey
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT',
            details: 'Too many upgrade requests for this survey. Please wait before trying again.'
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

    // Check if survey is already upgraded
    if (survey.flags.hasExpandedAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            error: 'Survey already has expanded access',
            code: 'ALREADY_UPGRADED'
          }
        } as { success: false; error: ApiError },
        { status: 409 }
      );
    }

    // Prepare upgrade data
    const upgradedAt = new Date().toISOString();
    const privateUserDetails: PrivateUserDetailsDocument = {
      email: userDetails.email,
      emailDomain: userDetails.email.split('@')[1]?.toLowerCase() || '',
      contactName: userDetails.contactName,
      createdAt: upgradedAt,
      consentAcceptedAt: upgradedAt,
      policyVersion: userDetails.policyVersion || 'v1.0',
    };

    // Use a batch write for atomicity
    const batch = db.batch();

    // Update survey document
    const surveyRef = db.collection('surveys').doc(surveyId);
    batch.update(surveyRef, {
      upgradedAt,
      state: 'T1',
      'flags.hasExpandedAccess': true,
    });

    // Save private user details
    const userDetailsRef = db.collection('surveys').doc(surveyId)
      .collection('private').doc('userDetails');
    batch.set(userDetailsRef, privateUserDetails);

    // Commit the batch
    await batch.commit();

    // Track upgrade event
    const analyticsEvent: Record<string, unknown> = {
      event: 'survey_upgraded',
      timestamp: new Date().toISOString(),
      serverTimestamp: new Date(),
      surveyId,
      language: survey.language,
      surveyVersion: survey.surveyVersion,
      emailDomain: privateUserDetails.emailDomain,
      companySize: survey.companyDetails.companySize,
      sector: survey.companyDetails.sector,
      region: survey.companyDetails.region,
    };
    
    const userAgent = request.headers.get('user-agent');
    if (userAgent) {
      analyticsEvent.userAgent = userAgent;
    }
    
    await db.collection('analytics_events').add(analyticsEvent);

    console.log(`✅ Survey upgraded to T1: ${surveyId}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          surveyId,
          upgradedAt,
          hasExpandedAccess: true,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Survey upgrade error:', error);
    
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