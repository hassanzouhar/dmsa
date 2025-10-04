/**
 * Legacy API Bridge - Backward compatibility during transition
 * 
 * GET /api/dma/results?respondentId={id}
 * 
 * TODO: Remove this after frontend is migrated to /api/surveys/{id}/results?token={token}
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const respondentId = searchParams.get('respondentId');
  
  if (!respondentId) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Missing respondentId parameter' 
      }, 
      { status: 400 }
    );
  }
  
  console.log(`🔄 Legacy API called for survey: ${respondentId}`);
  
  try {
    // Try the new Firestore schema first
    const db = getAdminFirestore();
    const surveyDoc = await db.collection('surveys').doc(respondentId).get();
    
    if (surveyDoc.exists) {
      const survey = surveyDoc.data();
      
      // Check if survey has results in new schema
      if (survey?.flags?.hasResults) {
        const resultsDoc = await db.collection('surveys').doc(respondentId)
          .collection('results').doc('public').get();
          
        if (resultsDoc.exists) {
          const results = resultsDoc.data();
          
          if (!results) {
            console.log(`⚠️ Results document empty: ${respondentId}`);
            return NextResponse.json(
              { success: false, error: 'Results not available' }, 
              { status: 404 }
            );
          }
          
          // Convert new schema to legacy format
          const legacyResponse = {
            success: true,
            data: {
              survey: {
                id: survey.id,
                version: survey.surveyVersion,
                language: survey.language,
                timestamp: survey.createdAt,
                scores: {
                  dimensions: results.dimensions,
                  overall: results.overall,
                  maturityClassification: results.maturityClassification,
                },
                userDetails: survey.flags.hasExpandedAccess ? {
                  email: '[REDACTED]', // Don't expose email in legacy API
                  companyName: survey.companyDetails?.companyName,
                  sector: survey.companyDetails?.sector,
                  companySize: survey.companyDetails?.companySize,
                  region: survey.companyDetails?.region,
                } : null,
                hasExpandedAccess: survey.flags.hasExpandedAccess,
              }
            }
          };
          
          console.log(`✅ Served survey from new schema: ${respondentId}`);
          return NextResponse.json(legacyResponse);
        }
      }
      
      // Survey exists but no results yet
      console.log(`⏳ Survey found but no results yet: ${respondentId}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Survey not completed or results not available' 
        }, 
        { status: 404 }
      );
    }
    
    // Fallback to legacy Firebase Storage (read-only during migration)
    console.log(`🔄 Attempting legacy Storage lookup for: ${respondentId}`);
    
    try {
      const storage = getAdminStorage();
      const bucket = storage.bucket();
      const file = bucket.file(`surveys/${respondentId}.json`);
      const [exists] = await file.exists();
      
      if (!exists) {
        console.log(`❌ Survey not found in Storage: ${respondentId}`);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Survey not found' 
          }, 
          { status: 404 }
        );
      }
      
      const [fileContent] = await file.download();
      const surveyData = JSON.parse(fileContent.toString());
      
      console.log(`✅ Served survey from legacy Storage: ${respondentId}`);
      
      return NextResponse.json({
        success: true,
        data: {
          survey: surveyData
        }
      });
      
    } catch (storageError) {
      console.error('Legacy Storage access failed:', storageError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Survey not found' 
        }, 
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Legacy API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }, 
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
