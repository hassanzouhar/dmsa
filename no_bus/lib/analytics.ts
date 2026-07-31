// Client-side analytics disabled - all tracking is server-side only

// Types for analytics events
export type AnalyticsEvent = 
  | 'assessment_started'
  | 'assessment_completed'
  | 'email_captured'
  | 'results_retrieved'
  | 'pdf_downloaded'
  | 'json_exported'
  | 'expanded_access_unlocked'
  | 'assessment_abandoned';

export interface AnalyticsEventData {
  surveyId?: string;
  timestamp: string;
  userAgent?: string;
  language?: string;
  surveyVersion?: string;
  hasUserDetails?: boolean;
  completionTime?: number; // Time taken to complete assessment in seconds
  abandonedAt?: string; // Which question or step was abandoned
  emailDomain?: string; // Email domain for B2B analysis (without PII)
  companySize?: string;
  sector?: string;
  region?: string;
}

// Global metrics document structure
export interface GlobalMetrics {
  totalAssessments: number;
  completedAssessments: number;
  emailCaptures: number;
  retrievalAttempts: number;
  pdfDownloads: number;
  jsonExports: number;
  conversionRate: number; // Email captures / Completed assessments
  lastUpdated: Date;
}

/**
 * Track an analytics event (Client-side no-op - analytics now handled server-side)
 */
export const trackEvent = async (
  event: AnalyticsEvent, 
  data: Partial<AnalyticsEventData> = {}
): Promise<void> => {
  try {
    // Client-side analytics disabled in favor of server-side tracking
    // All analytics events are now tracked via API endpoints
    console.log(`Analytics event (client-side no-op): ${event}`, data);
  } catch (error) {
    console.error('Failed to track analytics event:', error);
    // Don't throw - analytics should never break the user experience
  }
};

// Global metrics updates are handled server-side only

/**
 * Get current global metrics (Client-side no-op - should use API endpoint)
 */
export const getGlobalMetrics = async (): Promise<GlobalMetrics | null> => {
  try {
    // No-op: Global metrics should be fetched via API endpoint if needed
    console.log('Global metrics fetch (client-side no-op) - use API endpoint instead');
    return null;
  } catch (error) {
    console.error('Failed to get global metrics:', error);
    return null;
  }
};

/**
 * Track assessment completion with timing data
 */
export const trackAssessmentCompletion = async (
  surveyId: string,
  startTime: Date,
  surveyVersion: string,
  language: string
): Promise<void> => {
  const completionTime = Math.floor((Date.now() - startTime.getTime()) / 1000);
  
  await trackEvent('assessment_completed', {
    surveyId,
    completionTime,
    surveyVersion,
    language,
  });
};

/**
 * Track email capture with company data
 */
export const trackEmailCapture = async (
  surveyId: string,
  email: string,
  companyDetails: {
    companySize?: string;
    sector?: string;
    region?: string;
    county?: string;
  }
): Promise<void> => {
  // Extract domain for B2B analysis without storing PII
  const emailDomain = email.split('@')[1]?.toLowerCase();
  
  await trackEvent('email_captured', {
    surveyId,
    emailDomain,
    hasUserDetails: true,
    ...companyDetails,
  });
};

/**
 * Track assessment abandonment
 */
export const trackAssessmentAbandonment = async (
  surveyId: string,
  abandonedAt: string,
  startTime: Date
): Promise<void> => {
  const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000);
  
  await trackEvent('assessment_abandoned', {
    surveyId,
    abandonedAt,
    completionTime: timeSpent,
  });
};

/**
 * Track PDF download
 */
export const trackPDFDownload = async (
  surveyId: string,
  hasUserDetails: boolean = false
): Promise<void> => {
  await trackEvent('pdf_downloaded', {
    surveyId,
    hasUserDetails,
  });
};

/**
 * Track JSON export
 */
export const trackJSONExport = async (
  surveyId: string,
  hasUserDetails: boolean = false
): Promise<void> => {
  await trackEvent('json_exported', {
    surveyId,
    hasUserDetails,
  });
};

/**
 * Track results retrieval
 */
export const trackResultsRetrieval = async (
  surveyId: string,
  success: boolean = true
): Promise<void> => {
  await trackEvent('results_retrieved', {
    surveyId,
    hasUserDetails: success, // Use this field to track success/failure
  });
};

/**
 * Get conversion funnel metrics for dashboard
 */
export const getFunnelMetrics = async (): Promise<{
  started: number;
  completed: number;
  emailCaptured: number;
  pdfDownloaded: number;
  completionRate: number;
  conversionRate: number;
  pdfConversionRate: number;
} | null> => {
  try {
    const metrics = await getGlobalMetrics();
    if (!metrics) return null;

    const completionRate = metrics.totalAssessments > 0 
      ? metrics.completedAssessments / metrics.totalAssessments 
      : 0;

    const conversionRate = metrics.completedAssessments > 0 
      ? metrics.emailCaptures / metrics.completedAssessments 
      : 0;

    const pdfConversionRate = metrics.emailCaptures > 0 
      ? metrics.pdfDownloads / metrics.emailCaptures 
      : 0;

    return {
      started: metrics.totalAssessments,
      completed: metrics.completedAssessments,
      emailCaptured: metrics.emailCaptures,
      pdfDownloaded: metrics.pdfDownloads,
      completionRate,
      conversionRate,
      pdfConversionRate,
    };
  } catch (error) {
    console.error('Failed to get funnel metrics:', error);
    return null;
  }
};

/**
 * Initialize analytics (call this when the app starts)
 */
export const initializeAnalytics = (): void => {
  // Track page views and basic engagement
  if (typeof window !== 'undefined') {
    // Track when someone visits the assessment
    if (window.location.pathname.includes('/assessment')) {
      // We'll track assessment_started when they actually start answering
    }
    
    // Track page unload to detect potential abandonment
    window.addEventListener('beforeunload', () => {
      // This could be used to track abandonment, but we'll implement it more specifically
    });
  }
};

const analytics = {
  trackEvent,
  trackAssessmentCompletion,
  trackEmailCapture,
  trackAssessmentAbandonment,
  trackPDFDownload,
  trackJSONExport,
  trackResultsRetrieval,
  getGlobalMetrics,
  getFunnelMetrics,
  initializeAnalytics,
};

export default analytics;
