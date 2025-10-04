/**
 * Surveys API - Main endpoint for survey lifecycle management
 * 
 * POST /api/surveys - Create a new T0 survey with company details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { createRetrievalToken, checkRateLimit } from '@/lib/token-utils';
import { 
  SurveyDocument, 
  CompanyDetails, 
  CreateSurveyResponse, 
  ApiError,
  SurveyState,
  SurveyVersion,
  Language,
} from '@/types/firestore-schema';
import { v4 as uuidv4 } from 'uuid';

// Map NACE codes to simplified sectors
function mapNACEToSector(nace: string): 'manufacturing' | 'services' | 'retail' | 'healthcare' | 'education' | 'government' | 'other' {
  const sectorMap: Record<string, 'manufacturing' | 'services' | 'retail' | 'healthcare' | 'education' | 'government' | 'other'> = {
    'A': 'other',        // Agriculture, forestry and fishing
    'B': 'other',        // Mining and quarrying
    'C': 'manufacturing', // Manufacturing
    'D': 'other',        // Electricity, gas, steam and air conditioning supply
    'E': 'other',        // Water supply; sewerage, waste management
    'F': 'other',        // Construction
    'G': 'retail',       // Wholesale and retail trade
    'H': 'other',        // Transportation and storage
    'I': 'services',     // Accommodation and food service activities
    'J': 'services',     // Information and communication
    'K': 'services',     // Financial and insurance activities
    'L': 'services',     // Real estate activities
    'M': 'services',     // Professional, scientific and technical activities
    'N': 'services',     // Administrative and support service activities
    'O': 'government',   // Public administration and defence
    'P': 'education',    // Education
    'Q': 'healthcare',   // Human health and social work activities
    'R': 'services',     // Arts, entertainment and recreation
    'S': 'services',     // Other service activities
    'T': 'other',        // Household activities as employers
    'U': 'government'    // Extraterritorial organisations and bodies
  };
  
  return sectorMap[nace.charAt(0)?.toUpperCase()] || 'other';
}

// Input validation for company details
function validateCompanyDetails(details: unknown): details is CompanyDetails {
  if (!details || typeof details !== 'object') {
    return false;
  }
  
  const obj = details as Record<string, unknown>;
  const { companyName, companySize, nace, region } = obj;
  
  // Validate required fields
  if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
    return false;
  }
  
  if (!companySize || typeof companySize !== 'string' || !['micro', 'small', 'medium', 'large'].includes(companySize)) {
    return false;
  }
  
  if (!nace || typeof nace !== 'string' || nace.trim().length === 0) {
    return false;
  }
  
  if (!region || typeof region !== 'string' || region.trim().length === 0) {
    return false;
  }
  
  // Check for forbidden fields (PII should not be in company details)
  const forbiddenFields = ['email', 'contactEmail', 'emailAddress'];
  for (const field of forbiddenFields) {
    if (field in obj) {
      return false;
    }
  }
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkRateLimit(`create_survey_${clientIP}`, 5, 10 * 60 * 1000)) { // 5 requests per 10 minutes
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            error: 'Rate limit exceeded', 
            code: 'RATE_LIMIT',
            details: 'Too many survey creation requests. Please wait before trying again.'
          } 
        } as { success: false; error: ApiError },
        { status: 429 }
      );
    }
    
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
    
    // Validate required fields
    const { companyDetails, language = 'no', surveyVersion = 'v1.0' } = body;
    
    if (!validateCompanyDetails(companyDetails)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            error: 'Invalid company details', 
            code: 'INVALID_COMPANY_DETAILS',
            details: 'Company details must include companyName, companySize, nace, and region'
          } 
        } as { success: false; error: ApiError },
        { status: 400 }
      );
    }
    
    // Validate language and version
    if (!['no', 'en'].includes(language)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            error: 'Invalid language', 
            code: 'INVALID_LANGUAGE',
            details: 'Language must be "no" or "en"'
          } 
        } as { success: false; error: ApiError },
        { status: 400 }
      );
    }
    
    if (!['v1.0', 'v1.1'].includes(surveyVersion)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            error: 'Invalid survey version', 
            code: 'INVALID_VERSION',
            details: 'Survey version must be "v1.0" or "v1.1"'
          } 
        } as { success: false; error: ApiError },
        { status: 400 }
      );
    }
    
    // Generate unique survey ID
    const surveyId = uuidv4().replace(/-/g, '').substring(0, 10);
    
    // Create retrieval token
    const { token, tokenHash, createdAt, revoked } = createRetrievalToken();
    
    // Derive sector from NACE code
    const sector = mapNACEToSector(companyDetails.nace);
    
    // Create survey document
    const surveyDoc: SurveyDocument = {
      id: surveyId,
      state: 'T0' as SurveyState,
      surveyVersion: surveyVersion as SurveyVersion,
      language: language as Language,
      createdAt: new Date().toISOString(),
      companyDetails: {
        companyName: companyDetails.companyName.trim(),
        companySize: companyDetails.companySize,
        nace: companyDetails.nace.trim().toUpperCase(),
        sector: sector,
        region: companyDetails.region.trim(),
      },
      flags: {
        isCompleted: false,
        hasResults: false,
        hasExpandedAccess: false,
      },
      retrieval: {
        tokenHash,
        createdAt,
        revoked,
      },
    };
    
    // Initialize Admin SDK
    const db = getAdminFirestore();
    
    // Save survey to Firestore
    await db.collection('surveys').doc(surveyId).set(surveyDoc);
    
    // Track survey creation event
    await db.collection('analytics_events').add({
      event: 'survey_created',
      timestamp: new Date().toISOString(),
      serverTimestamp: new Date(),
      surveyId,
      language,
      surveyVersion,
      companySize: companyDetails.companySize,
      sector,
      region: companyDetails.region,
      userAgent: request.headers.get('user-agent') || undefined,
    });
    
    console.log(`✅ Survey created: ${surveyId} (${sector}, ${companyDetails.companySize})`);
    
    // Return success response with token (only returned once)
    const response: CreateSurveyResponse = {
      surveyId,
      retrievalToken: token, // Only returned once!
    };
    
    return NextResponse.json(
      { 
        success: true, 
        data: response 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Survey creation error:', error);
    
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}