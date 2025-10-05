/**
 * POST /api/auth/verify-magic-link
 *
 * Verify a magic link token and return survey access details
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken } from '@/lib/magic-link';
import { getSurveysByEmail } from '@/lib/email-survey-mapping';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/types/firestore-schema';
import { z } from 'zod';

const verifySchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            error: 'Invalid request data',
            details: validation.error.issues[0]?.message,
          },
        },
        { status: 400 }
      );
    }

    const { email, token } = validation.data;

    // Verify magic link token
    const verification = await verifyMagicLinkToken(token, email);

    if (!verification.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            error: 'Invalid or expired magic link',
            details: verification.reason || 'The link may have expired or already been used.',
          },
        },
        { status: 401 }
      );
    }

    // Get all survey IDs for this email
    const surveyIds = await getSurveysByEmail(email);

    if (surveyIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SURVEYS_FOUND',
            error: 'No surveys found',
            details: 'No surveys associated with this email address.',
          },
        },
        { status: 404 }
      );
    }

    // Fetch survey metadata (without retrieval tokens - those stay private)
    const db = getAdminFirestore();
    const surveyPromises = surveyIds.map(async (surveyId) => {
      try {
        const surveyDoc = await db.collection(COLLECTIONS.SURVEYS).doc(surveyId).get();

        if (!surveyDoc.exists) {
          return null;
        }

        const data = surveyDoc.data();
        return {
          id: surveyId,
          createdAt: data?.createdAt,
          completedAt: data?.completedAt,
          overallScore: data?.overallScore,
          state: data?.state,
          companyName: data?.companyDetails?.companyName,
          sector: data?.companyDetails?.sector,
          companySize: data?.companyDetails?.companySize,
          language: data?.language,
          surveyVersion: data?.surveyVersion,
        };
      } catch (error) {
        console.error(`Failed to fetch survey ${surveyId}:`, error);
        return null;
      }
    });

    const surveys = (await Promise.all(surveyPromises)).filter(
      (s) => s !== null
    );

    // Generate a session token for subsequent authenticated requests
    // In production, store this in a secure session store (e.g., Redis)
    const sessionToken = Buffer.from(
      JSON.stringify({
        email: verification.emailHash,
        surveyIds,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      })
    ).toString('base64');

    return NextResponse.json({
      success: true,
      data: {
        surveys,
        sessionToken,
        email, // Return email for client-side display
      },
    });
  } catch (error) {
    console.error('Error in verify-magic-link:', error);
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
