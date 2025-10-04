/**
 * Survey Results API - Token-protected results retrieval
 * 
 * GET /api/surveys/{id}/results?token=... - Retrieve survey results with token authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { verifyToken, checkRateLimit } from '@/lib/token-utils';
import { 
  SurveyResultsResponse, 
  ApiError,
  SurveyDocument,
  PublicResultsDocument,
  AnswersDocument,
  PrivateUserDetailsDocument,
} from '@/types/firestore-schema';

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
    
    // Get public results (always available if survey is completed)
    let publicResults: PublicResultsDocument | null = null;
    if (survey.flags.hasResults) {
      const resultsDoc = await db.collection('surveys').doc(surveyId)
        .collection('results').doc('public').get();
      
      if (resultsDoc.exists) {
        publicResults = resultsDoc.data() as PublicResultsDocument;
      }
    }
    
    // Get answers if available (for authorized users)
    let answers: AnswersDocument | undefined;
    if (survey.flags.hasResults) {
      const answersDoc = await db.collection('surveys').doc(surveyId)
        .collection('answers').doc('current').get();
      
      if (answersDoc.exists) {
        answers = answersDoc.data() as AnswersDocument;
      }
    }
    
    // Get user details if available (T1 surveys only, non-sensitive fields)
    let userDetails: Partial<PrivateUserDetailsDocument> | undefined;
    if (survey.flags.hasExpandedAccess) {
      const userDetailsDoc = await db.collection('surveys').doc(surveyId)
        .collection('private').doc('userDetails').get();
      
      if (userDetailsDoc.exists) {
        const fullUserDetails = userDetailsDoc.data() as PrivateUserDetailsDocument;
        // Only return non-sensitive fields
        userDetails = {
          emailDomain: fullUserDetails.emailDomain,
          createdAt: fullUserDetails.createdAt,
          consentAcceptedAt: fullUserDetails.consentAcceptedAt,
          policyVersion: fullUserDetails.policyVersion,
        };
      }
    }
    
    // Track retrieval event
    const analyticsEvent: Record<string, unknown> = {
      event: 'results_retrieved',
      timestamp: new Date().toISOString(),
      serverTimestamp: new Date(),
      surveyId,
      language: survey.language,
      surveyVersion: survey.surveyVersion,
      hasUserDetails: survey.flags.hasExpandedAccess,
      companySize: survey.companyDetails.companySize,
      sector: survey.companyDetails.sector,
      region: survey.companyDetails.region,
    };
    
    // Only add optional fields if they have values
    if (userDetails?.emailDomain) {
      analyticsEvent.emailDomain = userDetails.emailDomain;
    }
    
    const userAgent = request.headers.get('user-agent');
    if (userAgent) {
      analyticsEvent.userAgent = userAgent;
    }
    
    await db.collection('analytics_events').add(analyticsEvent);
    
    // Build response
    const response: SurveyResultsResponse = {
      survey,
      results: publicResults!,
      answers: answers,
      userDetails: userDetails,
      hasExpandedAccess: survey.flags.hasExpandedAccess,
    };
    
    // If survey doesn't have results yet, return limited data
    if (!survey.flags.hasResults || !publicResults) {
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