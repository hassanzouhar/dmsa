/**
 * POST /api/auth/request-magic-link
 *
 * Request a magic link to access all surveys for an email address
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/magic-link';
import { getSurveyCountForEmail } from '@/lib/email-survey-mapping';
import { sendMagicLinkEmail } from '@/lib/email-service';
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Rate limiting storage (in production, use Redis or Vercel KV)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3;

function checkRateLimit(email: string): { allowed: boolean; resetAt?: Date } {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = rateLimitMap.get(key);

  if (!record || record.resetAt < now) {
    // New window or expired window
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, resetAt: new Date(record.resetAt) };
  }

  record.count++;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

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

    const { email } = validation.data;

    // Check rate limit
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            error: 'Too many requests',
            details: `Please wait until ${rateLimit.resetAt?.toLocaleTimeString()} before requesting another magic link.`,
          },
        },
        { status: 429 }
      );
    }

    // Check if email has any surveys
    const surveyCount = await getSurveyCountForEmail(email);

    if (surveyCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SURVEYS_FOUND',
            error: 'No surveys found for this email address',
            details:
              'Make sure you have completed at least one assessment and provided this email address.',
          },
        },
        { status: 404 }
      );
    }

    // Create magic link
    const { token, expiry } = await createMagicLink(email);

    // Send email
    const emailResult = await sendMagicLinkEmail({
      email,
      token,
      surveyCount,
      expiryDate: expiry,
    });

    if (!emailResult.success) {
      console.error('Failed to send magic link email:', emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_SEND_FAILED',
            error: 'Failed to send email',
            details: 'Please try again later or contact support.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Magic link sent to your email',
        email,
        surveyCount,
        expiresAt: expiry.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in request-magic-link:', error);
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
