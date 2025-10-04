import { NextRequest, NextResponse } from 'next/server';
import { fetchSurveyFromStorage } from '@/lib/survey-service';
import { generateBenchmarkComparison } from '@/lib/benchmark-service';
import { SurveySubmission } from '@/types/assessment';

// API Response interfaces
interface DmaApiError {
  error: string;
  code: number;
  message: string;
}

interface DmaApiResponse {
  success: boolean;
  data?: {
    survey: SurveySubmission;
    benchmark?: ReturnType<typeof generateBenchmarkComparison>;
    meta: {
      respondentId: string;
      snapshot?: string;
      retrievalTime: string;
      version: string;
    };
  };
  error?: DmaApiError;
}


/**
 * GET /api/dma/results
 * 
 * Query Parameters:
 * - respondentId: Survey ID (required)
 * - snapshot: Time series snapshot (T0/T1/T2) - optional
 * - includeBenchmark: Include benchmark comparison (default: true)
 * - format: Response format (json/summary, default: json)
 * 
 * Examples:
 * - GET /api/dma/results?respondentId=abc123def4
 * - GET /api/dma/results?respondentId=abc123def4&snapshot=T1&includeBenchmark=true
 * - GET /api/dma/results?respondentId=abc123def4&format=summary
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const respondentId = searchParams.get('respondentId');
    const snapshot = searchParams.get('snapshot') as 'T0' | 'T1' | 'T2' | null;
    const includeBenchmark = searchParams.get('includeBenchmark') !== 'false';
    const format = searchParams.get('format') || 'json';

    // Validate required parameters
    if (!respondentId) {
      return NextResponse.json({
        success: false,
        error: {
          error: 'MISSING_RESPONDENT_ID',
          code: 400,
          message: 'respondentId query parameter is required'
        }
      } as DmaApiResponse, { status: 400 });
    }

    // Validate respondent ID format (10 character alphanumeric)
    if (!/^[a-zA-Z0-9]{10}$/.test(respondentId)) {
      return NextResponse.json({
        success: false,
        error: {
          error: 'INVALID_RESPONDENT_ID',
          code: 400,
          message: 'respondentId must be a 10-character alphanumeric string'
        }
      } as DmaApiResponse, { status: 400 });
    }

    // Validate snapshot parameter
    if (snapshot && !['T0', 'T1', 'T2'].includes(snapshot)) {
      return NextResponse.json({
        success: false,
        error: {
          error: 'INVALID_SNAPSHOT',
          code: 400,
          message: 'snapshot must be one of: T0, T1, T2'
        }
      } as DmaApiResponse, { status: 400 });
    }

    // Validate format parameter
    if (!['json', 'summary'].includes(format)) {
      return NextResponse.json({
        success: false,
        error: {
          error: 'INVALID_FORMAT',
          code: 400,
          message: 'format must be one of: json, summary'
        }
      } as DmaApiResponse, { status: 400 });
    }

    // Construct survey ID based on snapshot
    const surveyId = snapshot ? `${respondentId}_${snapshot}` : respondentId;

    // Fetch survey data from Firebase
    const surveyData = await fetchSurveyFromStorage(surveyId);

    if (!surveyData) {
      return NextResponse.json({
        success: false,
        error: {
          error: 'SURVEY_NOT_FOUND',
          code: 404,
          message: `No survey found with ID: ${surveyId}`
        }
      } as DmaApiResponse, { status: 404 });
    }

    // Generate benchmark comparison if requested and user details available
    let benchmarkComparison = null;
    if (includeBenchmark && surveyData.userDetails?.email) {
      try {
        benchmarkComparison = generateBenchmarkComparison(surveyData);
      } catch (error) {
        console.warn('Failed to generate benchmark comparison:', error);
        // Continue without benchmark data rather than failing the entire request
      }
    }

    // Format response based on requested format
    if (format === 'summary') {
      return NextResponse.json({
        success: true,
        data: {
          survey: {
            id: surveyData.id,
            timestamp: surveyData.timestamp,
            scores: surveyData.scores,
            version: surveyData.version,
            language: surveyData.language,
            userDetails: surveyData.userDetails ? {
              email: surveyData.userDetails.email,
              companyName: surveyData.userDetails.companyName,
              sector: surveyData.userDetails.sector,
              companySize: surveyData.userDetails.companySize,
              region: surveyData.userDetails.region,
            } : undefined
          } as Partial<SurveySubmission>,
          benchmark: benchmarkComparison ? {
            overall: benchmarkComparison.overall,
            summary: benchmarkComparison.summary,
            insights: benchmarkComparison.insights
          } : undefined,
          meta: {
            respondentId,
            snapshot: snapshot || undefined,
            retrievalTime: new Date().toISOString(),
            version: surveyData.version
          }
        }
      } as DmaApiResponse);
    }

    // Full JSON response (default)
    return NextResponse.json({
      success: true,
      data: {
        survey: surveyData,
        benchmark: benchmarkComparison || undefined,
        meta: {
          respondentId,
          snapshot: snapshot || undefined,
          retrievalTime: new Date().toISOString(),
          version: surveyData.version
        }
      }
    } as DmaApiResponse);

  } catch (error) {
    console.error('API Error in /api/dma/results:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        error: 'INTERNAL_SERVER_ERROR',
        code: 500,
        message: 'An unexpected error occurred while processing your request'
      }
    } as DmaApiResponse, { status: 500 });
  }
}

/**
 * POST /api/dma/results
 * 
 * Batch retrieval of multiple survey results
 * 
 * Request Body:
 * {
 *   "respondentIds": ["abc123def4", "xyz789ghi0"],
 *   "snapshot": "T1", // optional
 *   "includeBenchmark": true, // optional
 *   "format": "json" // optional
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.respondentIds || !Array.isArray(body.respondentIds)) {
      return NextResponse.json({
        success: false,
        error: {
          error: 'INVALID_REQUEST_BODY',
          code: 400,
          message: 'Request body must contain respondentIds array'
        }
      } as DmaApiResponse, { status: 400 });
    }

    // Limit batch size to prevent abuse
    if (body.respondentIds.length > 50) {
      return NextResponse.json({
        success: false,
        error: {
          error: 'BATCH_SIZE_EXCEEDED',
          code: 400,
          message: 'Maximum batch size is 50 respondent IDs'
        }
      } as DmaApiResponse, { status: 400 });
    }

    const { respondentIds, snapshot, includeBenchmark = true, format = 'json' } = body;

    // Process each respondent ID
    const results = await Promise.allSettled(
      respondentIds.map(async (respondentId: string) => {
        const surveyId = snapshot ? `${respondentId}_${snapshot}` : respondentId;
        const surveyData = await fetchSurveyFromStorage(surveyId);
        
        if (!surveyData) {
          throw new Error(`Survey not found: ${surveyId}`);
        }

        let benchmarkComparison = null;
        if (includeBenchmark && surveyData.userDetails?.email) {
          try {
            benchmarkComparison = generateBenchmarkComparison(surveyData);
          } catch (error) {
            console.warn('Failed to generate benchmark for', surveyId, error);
          }
        }

        return {
          respondentId,
          survey: format === 'summary' ? {
            id: surveyData.id,
            timestamp: surveyData.timestamp,
            scores: surveyData.scores,
            userDetails: surveyData.userDetails ? {
              email: surveyData.userDetails.email,
              companyName: surveyData.userDetails.companyName,
              sector: surveyData.userDetails.sector,
              companySize: surveyData.userDetails.companySize,
            } : undefined
          } : surveyData,
          benchmark: benchmarkComparison || undefined
        };
      })
    );

    // Separate successful and failed results
    const successful: Array<{
      respondentId: string;
      survey: SurveySubmission | Partial<SurveySubmission>;
      benchmark?: ReturnType<typeof generateBenchmarkComparison>;
    }> = [];
    const failed: Array<{
      respondentId: string;
      error: string;
    }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          respondentId: respondentIds[index],
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        results: successful,
        errors: failed,
        meta: {
          totalRequested: respondentIds.length,
          successful: successful.length,
          failed: failed.length,
          snapshot: snapshot || undefined,
          retrievalTime: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('API Error in POST /api/dma/results:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        error: 'INTERNAL_SERVER_ERROR',
        code: 500,
        message: 'An unexpected error occurred while processing batch request'
      }
    } as DmaApiResponse, { status: 500 });
  }
}