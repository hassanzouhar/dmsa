/**
 * POST /api/auth/verify-magic-link
 *
 * Verify a magic link token and return survey access details
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken } from '@/lib/magic-link';
import { hashEmail, sql } from '@/lib/db';
import { signSessionToken } from '@/lib/session-token';
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

    console.log(`🔐 Verifying magic link for email: ${email}`);
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);

    // Verify magic link token
    const verification = await verifyMagicLinkToken(token, email);

    console.log(`📋 Verification result:`, verification);

    if (!verification.valid) {
      console.warn(`❌ Magic link verification failed: ${verification.reason}`);
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

    // Hent oversikten i én spørring. Tidligere ble survey-IDene slått opp i
    // email_surveys og deretter hentet ett dokument om gangen.
    const surveys = await sql<{
      id: string;
      createdAt: Date;
      completedAt: Date | null;
      overallScore: number | null;
      state: string;
      companyName: string;
      sector: string;
      companySize: string;
      language: string;
      surveyVersion: string;
    }[]>`
      select
        id,
        created_at                                    as "createdAt",
        completed_at                                  as "completedAt",
        overall_score                                 as "overallScore",
        case when upgraded_at is null then 'T0' else 'T1' end as state,
        company_name                                  as "companyName",
        sector,
        company_size                                  as "companySize",
        language,
        survey_version                                as "surveyVersion"
      from surveys
      where email_hash = ${hashEmail(email)}
      order by created_at desc
    `;

    const surveyIds = surveys.map((s) => s.id);

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

    // Generate an HMAC-signed session token for subsequent authenticated requests.
    // Et usignert token her ville latt hvem som helst lage en sesjon med
    // vilkårlige surveyIds og lese andres resultater via /api/my-surveys.
    const sessionToken = signSessionToken({
      email: verification.emailHash ?? '',
      surveyIds,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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
