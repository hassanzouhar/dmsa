'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAssessmentStore } from '@/store/assessment';
import { computeDimensionScores, computeOverallScore } from '@/lib/scoring';
import { RadarChart } from '@/components/charts/RadarChart';
import { DimensionGaugesGrid } from '@/components/charts/DimensionGaugesGrid';
import { HelpTooltip, MaturityLevelExplanation, InterpretationCard } from '@/components/ui/help-tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowLeft, BotOff, Download, BarChart3, TrendingUp, Mail, Users, FileText,
  Target, Lightbulb, Puzzle, Star, Copy, ExternalLink, AlertCircle, Trophy, Building
} from 'lucide-react';
import { classify } from '@/lib/maturity';
import { useTranslation } from 'react-i18next';
import { dmaNo_v1 } from '@/data/questions.no';
// New API imports
import { getSurveyResults, upgradeSurveyToT1, updateAnonymousFlag } from '@/lib/survey-api';
import { PublicResultsDocument, SurveyDocument } from '@/types/firestore-schema';
import { SurveySubmission } from '@/types/assessment';
import { toast } from 'sonner';
import { TrackedPDFDownloadButton } from '@/components/TrackedPDFDownloadButton';
import { trackEmailCapture, trackJSONExport } from '@/lib/analytics';
import BenchmarkSection from '@/components/benchmark/BenchmarkSection';
import ExtendedResultsModal from '@/components/modals/ExtendedResultsModal';
import { getCountyName, extractCountyCodeFromRegion } from '@/data/norwegian-counties';
import { getSectorDisplayName, getCompanySizeDisplayName } from '@/lib/benchmark-service';
import { getCountryDisplayName } from '@/data/countries';

export default function ResultsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract survey params from URL
  const urlSurveyId = searchParams.get('id');
  const urlToken = searchParams.get('token');
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [surveyId, setSurveyId] = useState<string | null>(urlSurveyId);
  const [retrievalToken, setRetrievalToken] = useState<string | null>(urlToken);
  const [surveyData, setSurveyData] = useState<SurveyDocument | null>(null);
  const [resultsData, setResultsData] = useState<PublicResultsDocument | null>(null);
  const [hasExpandedAccess, setHasExpandedAccess] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
  
  // Form state for email capture
  const [userDetails, setUserDetails] = useState({
    email: '',
    companyName: '',
    sector: '',
    companySize: '',
    region: '',
    country: '',
    countyCode: ''
  });
  
  // Extended modal state
  const [showExtendedModal, setShowExtendedModal] = useState(false);

  // Anonymous participation state
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isUpdatingAnonymous, setIsUpdatingAnonymous] = useState(false);

  // Store state
  const { spec, answers, surveySession} = useAssessmentStore();
  
  // Load survey data - prioritize new API if token available
  useEffect(() => {
    const loadSurveyData = async () => {
      setIsLoading(true);
      
      // If we have URL params (new API), try to fetch from new API first
      if (urlSurveyId && urlToken) {
        try {
          console.log(`🔄 Loading survey from new API: ${urlSurveyId}`);
          const results = await getSurveyResults(urlSurveyId, urlToken);
          
          if (results) {
            setSurveyData(results.survey);
            setResultsData(results.results);
            setSurveyId(urlSurveyId);
            setRetrievalToken(urlToken);
            setHasExpandedAccess(results.hasExpandedAccess);
            const serverAnonymous = results.survey.flags.isAnonymous;
            const defaultAnonymous = serverAnonymous !== false;
            setIsAnonymous(defaultAnonymous);
            if ((serverAnonymous === undefined || serverAnonymous === null) && defaultAnonymous) {
              try {
                await updateAnonymousFlag(urlSurveyId, true, urlToken);
              } catch (error) {
                console.error('Failed to set default anonymous flag:', error);
              }
            }
            setIsLoading(false);
            console.log(`✅ Loaded survey from new API`);
            return;
          }
        } catch (error) {
          console.error('Failed to load from new API:', error);
        }
      }
      
      // Check survey session from store
      if (surveySession && !urlSurveyId) {
        setSurveyId(surveySession.surveyId);
        setRetrievalToken(surveySession.retrievalToken);
        // Try to load from new API using session data
        try {
          const results = await getSurveyResults(surveySession.surveyId, surveySession.retrievalToken);
          if (results) {
            setSurveyData(results.survey);
            setResultsData(results.results);
            setHasExpandedAccess(results.hasExpandedAccess);
            const serverAnonymous = results.survey.flags.isAnonymous;
            const defaultAnonymous = serverAnonymous !== false;
            setIsAnonymous(defaultAnonymous);
            if ((serverAnonymous === undefined || serverAnonymous === null) && defaultAnonymous) {
              try {
                await updateAnonymousFlag(surveySession.surveyId, true, surveySession.retrievalToken);
              } catch (error) {
                console.error('Failed to set default anonymous flag:', error);
              }
            }
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Failed to load from survey session:', error);
        }
      }
      
      // If no URL params or new API failed, fall back to legacy behavior
      console.log('📦 Falling back to legacy assessment store data');
      setIsLoading(false);
    };
    
    loadSurveyData();
  }, [urlSurveyId, urlToken, surveySession]);
  
  // Load company details from localStorage if available (legacy support)
  useEffect(() => {
    const storedCompanyDetails = localStorage.getItem('dma-company-details');
    if (storedCompanyDetails) {
      try {
        const companyDetails = JSON.parse(storedCompanyDetails);
        const countyCode = companyDetails.county || '';
        const regionValue = countyCode
          ? `${companyDetails.country || 'NO'}-${countyCode}`
          : companyDetails.country || '';

        setUserDetails(prev => ({
          ...prev,
          companyName: companyDetails.companyName || '',
          sector: mapNACEToSector(companyDetails.naceSector) || '',
          companySize: companyDetails.companySize || '',
          region: regionValue,
          country: companyDetails.country || '',
          countyCode
        }));
      } catch (error) {
        console.error('Failed to parse stored company details:', error);
      }
    }
  }, []);
  
  // Compute results - use new API data if available, otherwise compute from store
  const results = useMemo(() => {
    // If we have results data from new API, use it directly
    if (resultsData) {
      const dimensionScores = Object.entries(resultsData.dimensions).map(([id, score]) => ({
        id,
        score: score.score,
        target: score.target,
        gap: score.gap
      }));
      
      return {
        dimensions: dimensionScores,
        overall: resultsData.overall,
        classification: {
          level: resultsData.maturityClassification.level,
          labelKey: resultsData.maturityClassification.label,
          label: resultsData.maturityClassification.label,
        }
      };
    }
    
    // Legacy computation from assessment store
    if (!spec) return null;
    
    const dimensionScores = computeDimensionScores(spec, answers);
    const overall = computeOverallScore(dimensionScores);
    const classification = classify(overall);
    
    return {
      dimensions: dimensionScores,
      overall,
      classification
    };
  }, [spec, answers, resultsData]);
  
  // Helper function to map NACE sector codes to simple sector names
  const mapNACEToSector = (naceCode: string): string => {
    const sectorMap: Record<string, string> = {
      'A': 'other',     // Agriculture
      'B': 'other',     // Mining
      'C': 'manufacturing', // Manufacturing
      'D': 'other',     // Electricity/gas
      'E': 'other',     // Water/waste
      'F': 'other',     // Construction
      'G': 'retail',    // Wholesale/retail
      'H': 'other',     // Transportation
      'I': 'services',  // Accommodation/food
      'J': 'services',  // Information/communication
      'K': 'services',  // Financial
      'L': 'services',  // Real estate
      'M': 'services',  // Professional/scientific
      'N': 'services',  // Administrative
      'O': 'government', // Public administration
      'P': 'education', // Education
      'Q': 'healthcare', // Health/social work
      'R': 'services',  // Arts/entertainment
      'S': 'services',  // Other services
      'T': 'other',     // Households
      'U': 'government' // Extraterritorial
    };
    return sectorMap[naceCode] || 'other';
  };

  // Redirect if no survey data is available after loading
  useEffect(() => {
    if (!isLoading && !surveyData && !spec) {
      console.log('No survey data available, redirecting to assessment');
      router.push('/assessment');
    }
  }, [surveyData, spec, isLoading, router]);

  // Handle email capture and unlock expanded results
  const handleUnlockExpanded = async () => {
    if (!surveyId || !userDetails.email) return;
    
    setIsSubmittingDetails(true);
    try {
      let success = false;
      
      // Use new API if available
      if (retrievalToken) {
        success = await upgradeSurveyToT1(
          surveyId,
          {
            email: userDetails.email,
            contactName: userDetails.companyName,
          },
          retrievalToken
        );
      } else {
        console.error('No retrieval token available');
        toast.error('Cannot upgrade survey without retrieval token');
        success = false;
      }
      
      if (success) {
        setHasExpandedAccess(true);
        setShowEmailCapture(false);
        
        // Track email capture with company details
        await trackEmailCapture(surveyId, userDetails.email, {
          companySize: userDetails.companySize,
          sector: userDetails.sector,
          region: userDetails.region,
          county: userDetails.countyCode,
        });
        
        toast.success('Expanded results unlocked!', {
          description: 'You now have access to detailed insights and benchmarks.'
        });
        
        // Reload data to get updated access
        if (retrievalToken) {
          try {
            const results = await getSurveyResults(surveyId, retrievalToken);
            if (results) {
              setSurveyData(results.survey);
              setResultsData(results.results);
              setHasExpandedAccess(results.hasExpandedAccess);
            }
          } catch (error) {
            console.error('Failed to reload survey data:', error);
          }
        }
      } else {
        toast.error('Failed to unlock expanded results. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update user details:', error);
      toast.error('Failed to unlock expanded results. Please try again.');
    } finally {
      setIsSubmittingDetails(false);
    }
  };

  // Copy survey ID to clipboard
  const copySurveyId = () => {
    if (surveyId) {
      navigator.clipboard.writeText(surveyId);
      toast.success('Survey ID copied to clipboard!');
    }
  };

  // Handle anonymous participation toggle
  const handleAnonymousToggle = async (checked: boolean) => {
    if (checked === isAnonymous) {
      return;
    }
    if (!surveyId || !retrievalToken) {
      toast.error('Cannot update anonymous setting');
      return;
    }

    setIsUpdatingAnonymous(true);
    const previousValue = isAnonymous;
    setIsAnonymous(checked);
    try {
      const success = await updateAnonymousFlag(surveyId, checked, retrievalToken);

      if (success) {
        toast.success(
          checked
            ? 'Your results will appear anonymously on the leaderboard'
            : 'Your company name will be visible on the leaderboard'
        );
      } else {
        setIsAnonymous(previousValue);
        toast.error('Failed to update anonymous setting');
      }
    } catch (error) {
      console.error('Failed to update anonymous flag:', error);
      setIsAnonymous(previousValue);
      toast.error('Failed to update anonymous setting');
    } finally {
      setIsUpdatingAnonymous(false);
    }
  };

  // Handle export with inline functionality
  const handleExport = async () => {
    if (!results || !spec || !surveyId) return;
    
    // Track JSON export
    await trackJSONExport(surveyId, hasExpandedAccess);
    
    const surveyData = {
      id: surveyId,
      version: spec.version,
      language: spec.language,
      timestamp: new Date().toISOString(),
      answers,
      scores: {
        dimensions: results.dimensions.reduce((acc, dim) => {
          const dimensionSpec = spec.dimensions.find(d => d.id === dim.id);
          acc[dim.id] = {
            score: Math.round(dim.score),
            target: dimensionSpec?.targetLevel ? Math.round(dimensionSpec.targetLevel * 100) : 0,
            gap: dim.gap ? Math.round(dim.gap) : 0
          };
          return acc;
        }, {} as Record<string, { score: number; target: number; gap: number }>),
        overall: Math.round(results.overall),
        maturityClassification: {
          level: results.classification?.level || 0,
          label: results.classification ? t(results.classification.labelKey) : 'Unknown',
          band: `level-${results.classification?.level || 0}`
        }
      },
      userDetails: hasExpandedAccess ? userDetails : undefined
    };
    
    // Inline export functionality (replacing legacy exportSurveyData)
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `dma-survey-${surveyData.id}-${timestamp}.json`;
    const dataStr = JSON.stringify(surveyData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.style.display = 'none';
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
    toast.success('Survey data exported successfully!');
  };

  // Create survey data for PDF export (only when expanded access is available)  
  const pdfSurveyData = useMemo(() => {
    // If using new schema, convert the existing surveyData and resultsData
    if (surveyData && resultsData && hasExpandedAccess) {
      return {
        id: surveyData.id,
        version: surveyData.surveyVersion,
        language: surveyData.language,
        timestamp: surveyData.createdAt,
        answers: {}, // Answers not available in this format
        scores: {
          dimensions: resultsData.dimensions,
          overall: resultsData.overall,
          maturityClassification: resultsData.maturityClassification
        },
        userDetails: {
          companyName: surveyData.companyDetails.companyName,
          companySize: surveyData.companyDetails.companySize,
          sector: surveyData.companyDetails.sector
        }
      };
    }
    
    // Legacy mode - compute from store data
    if (!results || !spec || !surveyId || !hasExpandedAccess) return null;
    
    return {
      id: surveyId,
      version: spec.version,
      language: spec.language,
      timestamp: new Date().toISOString(),
      answers,
      scores: {
        dimensions: results.dimensions.reduce((acc, dim) => {
          const dimensionSpec = spec.dimensions.find(d => d.id === dim.id);
          acc[dim.id] = {
            score: Math.round(dim.score),
            target: dimensionSpec?.targetLevel ? Math.round(dimensionSpec.targetLevel * 100) : 0,
            gap: dim.gap ? Math.round(dim.gap) : 0
          };
          return acc;
        }, {} as Record<string, { score: number; target: number; gap: number }>),
        overall: Math.round(results.overall),
        maturityClassification: {
          level: results.classification?.level || 0,
          label: results.classification ? t(results.classification.labelKey) : 'Unknown',
          band: `level-${results.classification?.level || 0}`
        }
      },
      userDetails: hasExpandedAccess ? userDetails : undefined
    };
  }, [results, spec, surveyId, hasExpandedAccess, answers, userDetails, t, surveyData, resultsData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground">
                    Loading your assessment results...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error if no results available  
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                No results available for this survey. The assessment may not be completed yet.
                <div className="mt-2">
                  <Button onClick={() => router.push('/assessment')} variant="outline" size="sm">
                    Go to Assessment
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  const overallPercentage = Math.round(results?.overall || 0);
  const classification = results?.classification;

  const companyProfile = surveyData?.companyDetails;
  const countyFromSurvey = extractCountyCodeFromRegion(companyProfile?.region);
  const fallbackCounty = userDetails.countyCode || extractCountyCodeFromRegion(userDetails.region);
  const resolvedCountyCode = countyFromSurvey || fallbackCounty;
  const resolvedCountyName = resolvedCountyCode ? getCountyName(resolvedCountyCode) : undefined;

  const resolvedCountryCode = (() => {
    if (companyProfile?.region?.includes('-')) {
      return companyProfile.region.split('-')[0];
    }
    if (userDetails.country) return userDetails.country;
    if (companyProfile?.region) return companyProfile.region;
    return '';
  })();

  const resolvedCountryName = getCountryDisplayName(resolvedCountryCode);

  const displayCompanyName = companyProfile?.companyName || userDetails.companyName || 'Ikke oppgitt';
  const hasSector = Boolean(companyProfile?.sector || userDetails.sector);
  const displaySector = hasSector
    ? getSectorDisplayName(companyProfile?.sector || userDetails.sector || 'other')
    : 'Ikke oppgitt';
  const hasCompanySize = Boolean(companyProfile?.companySize || userDetails.companySize);
  const displayCompanySize = getCompanySizeDisplayName(companyProfile?.companySize || userDetails.companySize || '');
  const countyBadge = resolvedCountyCode && resolvedCountryCode === 'NO' ? `NO-${resolvedCountyCode}` : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          

          {/* Header with Immediate Value */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-purple-50">
            <CardHeader>
              <div className="text-center space-y-3">
                <CardTitle className="text-3xl font-bold text-primary">
                   Digital Modenhets Rapport
                </CardTitle>
                <CardDescription className="text-lg">
                  Her er de, bedriftens (digitale) styrker, svakheter og muligheter. <br/>
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Bedriftsprofil
              </CardTitle>
              <CardDescription>
                Informasjon om bedriften som har gjennomført vurderingen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Navn</p>
                  <p className="text-base font-medium text-gray-900">{displayCompanyName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Bransje</p>
                  <p className="text-base font-medium text-gray-900">
                    {hasSector ? displaySector : 'Ikke oppgitt'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Størrelse</p>
                  <p className="text-base font-medium text-gray-900">
                    {hasCompanySize
                      ? displayCompanySize
                      : 'Ikke oppgitt'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Land</p>
                  <p className="text-base font-medium text-gray-900">
                    {resolvedCountryName || 'Ikke oppgitt'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Fylke</p>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-medium text-gray-900">
                      {resolvedCountyName || 'Ikke oppgitt'}
                    </p>
                    {countyBadge && (
                      <Badge variant="outline" className="text-xs">
                        {countyBadge}
                      </Badge>
                    )}
                  </div>
                  {!resolvedCountyName && resolvedCountryCode === 'NO' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Oppgi fylke i bedriftsskjemaet for mer presise sammenligninger.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Survey ID Display - Always Visible */}
          {surveyId && (
            <Alert className="border-primary/20 bg-primary/5">
              <Star className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong>RapportID: </strong>
                  <code className="bg-white px-2 py-1 rounded text-sm font-mono">{surveyId}</code>
                  <span className="text-sm text-muted-foreground ml-2">
                    <i>Du kan kopiere denne for å hente opp rapporten igjen senere.</i>
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={copySurveyId}>
                  <Copy className="w-3 h-3 mr-1" />
                  Kopiér
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Immediate Value - Basic Results (Always Visible) */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Total Poengsum
                  <HelpTooltip 
                    title="Slik tolker du din totale poengsum"
                    content="Den totale poengsummen representerer din samlede digitale modenhet på en skala fra 0 til 100. Den beregnes ved å veie og aggregere poengsummene fra hver av de 6 dimensjonene basert på deres betydning for helheten."
                    variant="info"
                    size="sm"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-center">
                  <div className="text-5xl font-bold text-primary">
                    {overallPercentage}/100
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-lg px-4 py-2 ${
                      (classification?.level || 0) >= 1 ? 'border-green-500 text-green-700 bg-green-50' :
                      (classification?.level || 0) >= 3 ? 'border-blue-500 text-blue-700 bg-blue-50' :
                      (classification?.level || 0) >= 2 ? 'border-amber-500 text-amber-700 bg-amber-50' :
                      'border-red-500 text-red-700 bg-red-50'
                    }`}
                  >
                    {classification ? t(classification.labelKey) : 'Unknown'}
                  </Badge>
                  <Progress value={overallPercentage} className="w-full h-8" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                De seks dimensjonene
                <HelpTooltip 
                  title="De 6 digitale modenhetsområdene"
                  content="Hver av de 6 dimensjonene representerer et kritisk aspekt av digital modenhet. Ved å analysere poengsummene for hver dimensjon kan du identifisere styrker og forbedringsområder i din digitale strategi."
                  variant="help"
                  size="sm"
                />
              </CardTitle>
              <CardDescription>
                Detaljert analyse alle dimensjonene.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <DimensionGaugesGrid 
                  dimensions={(results?.dimensions || []).map(dimension => ({
                    id: dimension.id,
                    score: Math.round(dimension.score),
                    target: dimension.target ? Math.round(dimension.target) : Math.round(dimension.score * 1.2),
                    gap: dimension.gap ? Math.round(dimension.gap) : 0
                  }))}
                  dimensionSpecs={(spec || dmaNo_v1).dimensions}
                  showDetails={true}
                  compactMode={true}
                  className="max-h-80 overflow-hidden"
                />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              </div>
              <div className="text-center mt-4 pt-2 border-t border-gray-100">
                <p className="text-sm text-muted-foreground">
                  🔒 Lagre rapporten for å få tilgang.
                </p>
              </div>
            </CardContent>
          </Card>

          
           {/* Anonymous Participation Option */}
          {surveyId && retrievalToken && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-purple-900 mb-1">
                        Bli en del av &quot;NM i Digitalisering&quot;! 
                      </h3>
                      <p className="text-sm text-purple-800">
                        Vi trenger mer fokus på praktisk bruk av teknologi for å øke digitaliseringsgraden i næringslivet! Ved å bli en del av statistikken så hjelper du også andre bedrifter ved å dele bedriftens poengsum. Dere kan velge å være med anonymt eller med bedriftens navn.
                        Dine resultater vil bidra til bransjebenchmarks uten å avsløre bedriftens identitet.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-purple-800">
                        Velg hvordan resultatene deres skal vises på tavlen.
                      </p>
                      <RadioGroup
                        value={isAnonymous ? 'anonymous' : 'public'}
                        onValueChange={(value) => handleAnonymousToggle(value === 'anonymous')}
                        disabled={isUpdatingAnonymous}
                        className="grid gap-3 sm:grid-cols-2"
                      >
                        <div className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${isAnonymous ? 'border-purple-400 bg-white' : 'border-transparent bg-purple-100/40'}`}>
                          <RadioGroupItem value="anonymous" id="participation-anonymous" />
                          <div>
                            <Label htmlFor="participation-anonymous" className="text-sm font-medium text-purple-900">
                              Delta anonymt (anbefalt)
                            </Label>
                            <p className="text-xs text-purple-700 mt-1">
                              Resultatene vises uten firmanavn, men bidrar til bransjestatistikken.
                            </p>
                          </div>
                        </div>
                        <div className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${!isAnonymous ? 'border-purple-400 bg-white' : 'border-transparent bg-purple-100/40'}`}>
                          <RadioGroupItem value="public" id="participation-public" />
                          <div>
                            <Label htmlFor="participation-public" className="text-sm font-medium text-purple-900">
                              Vis bedriftens navn
                            </Label>
                            <p className="text-xs text-purple-700 mt-1">
                              Resultatene publiseres med bedriftens navn på resultattavlen.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                      {isUpdatingAnonymous && (
                        <p className="text-xs text-purple-700">Oppdaterer visningsinnstilling…</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-purple-700 border-purple-300 hover:bg-purple-100"
                      onClick={() => router.push('/leaderboard')}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Se resultattavle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maturity Level Explanation */}
          <MaturityLevelExplanation
            level={classification?.level || 0}
            className="shadow-lg"
          />

          {/* Value Gate - Unlock Expanded Results */}
          {!hasExpandedAccess && (
            <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mx-auto">
                    <Puzzle className="w-8 h-8 text-amber-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-amber-800">
                      Få full tilgang til dine resultater
                    </h3>
                    <p className="text-amber-700 max-w-2xl mx-auto">
                      Alt du trenger å gjøre er å legge til din e-post, da får du en mer detaljerte innsikt, bransjebenchmarks og konkrete
                      anbefalinger, helt gratis.
                    </p>
                  </div>

                  <Dialog open={showEmailCapture} onOpenChange={setShowEmailCapture}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3">
                        <Mail className="w-4 h-4 mr-2" />
                        Legg til e-post
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Vil du vite mer? Your Complete Analysis</DialogTitle>
                        <DialogDescription>
                          Provide your details to access detailed insights and benchmarks
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={userDetails.email}
                            onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="your.email@company.com"
                            required
                          />
                        </div>
                        <Button 
                          onClick={handleUnlockExpanded}
                          disabled={!userDetails.email || isSubmittingDetails}
                          className="w-full"
                        >
                          {isSubmittingDetails ? 'Unlocking...' : 'Unlock Complete Results'}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                    We&apos;ll use your email only to send you assessment insights and digital maturity resources.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expanded Results - Only Show After Email Capture */}
          {hasExpandedAccess && (
            <>
              {/* Full Radar Chart */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Complete Digital Maturity Profile
                    <HelpTooltip 
                      title="How to Read the Radar Chart"
                      content="The radar chart shows your scores (blue line) across all 6 dimensions. The further from the center, the higher your maturity. Gray dots indicate target levels where available."
                      variant="info"
                      size="sm"
                    />
                  </CardTitle>
                  <CardDescription>
                    Your detailed assessment across all 6 dimensions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadarChart 
                    data={(results?.dimensions || []).map(dimension => {
                      const dimensionSpec = (spec || dmaNo_v1).dimensions.find(d => d.id === dimension.id);
                      return {
                        dimension: dimensionSpec?.name || dimension.id,
                        score: Math.round(dimension.score),
                        target: dimensionSpec?.targetLevel ? Math.round(dimensionSpec.targetLevel * 100) : undefined,
                        fullMark: 100
                      };
                    })}
                    showTarget={true}
                    className="shadow-md"
                  />
                </CardContent>
              </Card>

              {/* Detailed Dimension Analysis with Gauges */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Detailed Analysis & Recommendations</CardTitle>
                  <CardDescription>
                    Interactive dimension gauges with performance insights and improvement recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DimensionGaugesGrid 
                    dimensions={(results?.dimensions || []).map(dimension => ({
                      id: dimension.id,
                      score: Math.round(dimension.score),
                      target: dimension.target ? Math.round(dimension.target) : Math.round(dimension.score * 1.2),
                      gap: dimension.gap ? Math.round(dimension.gap) : 0
                    }))}
                    dimensionSpecs={(spec || dmaNo_v1).dimensions}
                    showDetails={true}
                    compactMode={false}
                  />
                </CardContent>
              </Card>

              {/* Benchmark Comparison */}
              {surveyData && results && (
                <Card className="shadow-lg">
                  <CardContent className="p-8">
                    <BenchmarkSection 
                      company={surveyData.companyDetails}
                      dimensions={resultsData?.dimensions || {}}
                      overallScore={results.overall}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Interpretation and Next Steps */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InterpretationCard
                  title="Understanding Your Results"
                  type="explanation"
                  level="intermediate"
                  content={
                    <div className="space-y-3">
                      <p>
                        Your assessment results are based on the EU/JRC Digital Maturity Assessment framework, 
                        which evaluates organizations across 6 critical dimensions of digital transformation.
                      </p>
                      <p>
                        Each dimension score reflects your current capabilities and identifies gaps 
                        to target maturity levels, providing a roadmap for digital improvement.
                      </p>
                      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">
                          💡 Pro Tip: Focus on dimensions with the largest gaps for maximum impact on your overall digital maturity.
                        </p>
                      </div>
                    </div>
                  }
                />

                <InterpretationCard
                  title="Recommended Next Steps"
                  type="next-steps"
                  level="basic"
                  content={
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <h5 className="font-semibold text-sm">Immediate Actions:</h5>
                        <ul className="text-sm space-y-1 ml-4">
                          <li>• Review dimension-specific recommendations in the gauges above</li>
                          <li>• Prioritize 2-3 dimensions with the largest improvement opportunities</li>
                          <li>• Share these results with your digital transformation team</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-semibold text-sm">Long-term Strategy:</h5>
                        <ul className="text-sm space-y-1 ml-4">
                          <li>• Develop a comprehensive digital transformation roadmap</li>
                          <li>• Establish regular assessment cycles to track progress</li>
                          <li>• Benchmark against industry peers and best practices</li>
                        </ul>
                      </div>
                    </div>
                  }
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push('/assessment')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assessment
                </Button>
                <Button onClick={() => router.push('/')} variant="outline">
                  New Assessment
                </Button>
                <Button onClick={() => setShowExtendedModal(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Complete Analysis
                </Button>
              </div>
            
            <div className="flex gap-2">
              {surveyId && (
                <Button onClick={() => router.push(`/retrieve?id=${surveyId}`)} variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Share Results
                </Button>
              )}
              
              {hasExpandedAccess && pdfSurveyData ? (
                <div className="flex items-center gap-2">
                  <TrackedPDFDownloadButton 
                    surveyData={pdfSurveyData}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Download PDF Report
                  </TrackedPDFDownloadButton>
                  <HelpTooltip 
                    title="Professional PDF Report"
                    content="The PDF report includes your complete assessment results, company information, dimension analysis, and strategic recommendations - perfect for sharing with stakeholders or keeping for your records."
                    variant="success"
                    size="sm"
                    type="popover"
                  />
                </div>
              ) : null}
              
              <Button onClick={handleExport} disabled={!surveyId} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Footer */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <p className="text-sm text-blue-800">
                  <strong>Based on EU/JRC Digital Maturity Assessment Framework</strong>
                </p>
                <p className="text-xs text-blue-700">
                  This assessment provides insights into your organization&apos;s digital maturity. 
                  Results should be used as a starting point for digital transformation planning.
                </p>
                {surveyId && (
                  <p className="text-xs text-blue-600">
                    Assessment ID: <code className="bg-white px-2 py-1 rounded">{surveyId}</code> 
                    • Saved automatically to cloud storage
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      
      {/* Extended Results Modal */}
      {(pdfSurveyData || surveyData) && results && (
        <ExtendedResultsModal
          isOpen={showExtendedModal}
          onClose={() => setShowExtendedModal(false)}
          surveyData={{
            id: surveyId || '',
            version: surveyData?.surveyVersion || spec?.version || 'v1.0',
            language: surveyData?.language || spec?.language || 'no',
            timestamp: surveyData?.createdAt || new Date().toISOString(),
            answers: answers || {},
            scores: {
              dimensions: resultsData?.dimensions || {},
              overall: results.overall,
              maturityClassification: resultsData?.maturityClassification || {
                level: 1,
                label: 'Basic',
                band: 'basic'
              }
            },
            userDetails: surveyData ? {
              companyName: surveyData.companyDetails.companyName,
              companySize: surveyData.companyDetails.companySize,
              sector: surveyData.companyDetails.sector
            } : undefined
          } as SurveySubmission}
          surveySpec={spec || dmaNo_v1}
          onShare={(surveyId) => {
            if (navigator.share) {
              navigator.share({
                title: 'My Digital Maturity Assessment Results',
                text: 'Check out my digital maturity assessment results!',
                url: `${window.location.origin}/retrieve?id=${surveyId}`
              });
            } else {
              navigator.clipboard.writeText(`${window.location.origin}/retrieve?id=${surveyId}`);
            }
          }}
          onEmailResults={() => setShowEmailCapture(true)}
        />
      )}
    </div>
  );
}
