/**
 * Survey Upgrade API - Upgrade T0 survey to T1 with user details
 * 
 * POST /api/surveys/{id}/upgrade - Upgrade survey with email capture
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSurvey, upgradeSurvey } from '@/lib/db';
import { verifyToken, checkRateLimit } from '@/lib/token-utils';
import { sendAssessmentCompleteEmail } from '@/lib/email-service';
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

    // E-posten lagres på selve raden. Den separate email_surveys-koblingen
    // er borte — «alle surveys for denne e-posten» er nå et indeksoppslag.
    const upgradedAt = await upgradeSurvey({
      id: surveyId,
      email: userDetails.email,
      contactName: userDetails.contactName,
      policyVersion: userDetails.policyVersion || 'v1.0',
    });

    if (!upgradedAt) {
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

    console.log(`✅ Survey upgraded to T1: ${surveyId}`);

    // Send assessment completion email with retrieval link
    try {
      // Get the original retrieval token from request (we need it for the email link)
      const emailResult = await sendAssessmentCompleteEmail({
        email: userDetails.email,
        surveyId,
        retrievalToken: token, // Use the token from the request
        overallScore: survey.overall_score ?? undefined,
      });

      if (emailResult.success) {
        console.log(`✅ Assessment completion email sent to ${userDetails.email}`);
      } else {
        console.warn(`⚠️  Failed to send completion email: ${emailResult.error}`);
        // Don't fail the upgrade if email fails
      }
    } catch (emailError) {
      console.error('Error sending completion email:', emailError);
      // Don't fail the upgrade if email fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          surveyId,
          upgradedAt: upgradedAt.toISOString(),
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