'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { 
  ArrowLeft, Download, BarChart3, TrendingUp, AlertCircle, CheckCircle2, 
  Copy, ExternalLink, Unlock, Mail, Building2, Users, MapPin, FileText,
  Zap, Target, Lightbulb, Star
} from 'lucide-react';
import { classify } from '@/lib/maturity';
import { useTranslation } from 'react-i18next';
import { saveSurvey, updateSurveyUserDetails, exportSurveyData } from '@/lib/survey-service';
import { SurveySubmission } from '@/types/assessment';
import { toast } from 'sonner';
import { TrackedPDFDownloadButton } from '@/components/TrackedPDFDownloadButton';
import { trackAssessmentCompletion, trackEmailCapture, trackJSONExport } from '@/lib/analytics';
import BenchmarkSection from '@/components/benchmark/BenchmarkSection';
import ExtendedResultsModal from '@/components/modals/ExtendedResultsModal';

export default function ResultsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  // State management
  const [isSaving, setIsSaving] = useState(false);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [hasExpandedAccess, setHasExpandedAccess] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
  const [assessmentStartTime] = useState(new Date()); // Track when results page loads
  
  // Form state for email capture
  const [userDetails, setUserDetails] = useState({
    email: '',
    companyName: '',
    sector: '',
    companySize: '',
    region: '',
    country: ''
  });
  
  // Extended modal state
  const [showExtendedModal, setShowExtendedModal] = useState(false);
  
  // Store state
  const { spec, answers, isCompleted } = useAssessmentStore();
  
  // Compute results
  const results = useMemo(() => {
    if (!spec) return null;
    
    const dimensionScores = computeDimensionScores(spec, answers);
    const overall = computeOverallScore(dimensionScores);
    const classification = classify(overall);
    
    return {
      dimensions: dimensionScores,
      overall,
      classification
    };
  }, [spec, answers]);

  // Auto-save survey to Firebase when results are available
  useEffect(() => {
    const saveToFirebase = async () => {
      if (!spec || !results || !isCompleted || surveyId || isSaving) {
        return;
      }
      
      setIsSaving(true);
      try {
        const surveyData: Omit<SurveySubmission, 'id'> = {
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
            }, {} as SurveySubmission['scores']['dimensions']),
            overall: Math.round(results.overall),
            maturityClassification: {
              level: results.classification?.level || 0,
              label: results.classification ? t(results.classification.labelKey) : 'Unknown',
              band: results.classification?.band || 'unknown'
            }
          }
        };
        
        const id = await saveSurvey(surveyData);
        setSurveyId(id);
        
        // Track assessment completion
        await trackAssessmentCompletion(
          id,
          assessmentStartTime,
          spec.version,
          spec.language
        );
        
        toast.success('Assessment saved successfully!', {
          description: `Your unique ID is: ${id}`
        });
      } catch (error) {
        console.error('Failed to save survey:', error);
        toast.error('Failed to save assessment. You can still view your results.');
      } finally {
        setIsSaving(false);
      }
    };
    
    saveToFirebase();
  }, [spec, results, isCompleted, answers, surveyId, isSaving, t]);
  
  // Redirect if assessment not completed
  useEffect(() => {
    if (!spec || !isCompleted) {
      router.push('/assessment');
    }
  }, [spec, isCompleted, router]);

  // Handle email capture and unlock expanded results
  const handleUnlockExpanded = async () => {
    if (!surveyId || !userDetails.email) return;
    
    setIsSubmittingDetails(true);
    try {
      const success = await updateSurveyUserDetails(surveyId, userDetails);
      if (success) {
        setHasExpandedAccess(true);
        setShowEmailCapture(false);
        
        // Track email capture with company details
        await trackEmailCapture(surveyId, userDetails.email, {
          companySize: userDetails.companySize,
          sector: userDetails.sector,
          region: userDetails.region,
        });
        
        toast.success('Expanded results unlocked!', {
          description: 'You now have access to detailed insights and benchmarks.'
        });
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

  // Handle export with Firebase integration
  const handleExport = async () => {
    if (!results || !spec || !surveyId) return;
    
    // Track JSON export
    await trackJSONExport(surveyId, hasExpandedAccess);
    
    const surveyData: SurveySubmission = {
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
        }, {} as SurveySubmission['scores']['dimensions']),
        overall: Math.round(results.overall),
        maturityClassification: {
          level: results.classification?.level || 0,
          label: results.classification ? t(results.classification.labelKey) : 'Unknown',
          band: results.classification?.band || 'unknown'
        }
      },
      userDetails: hasExpandedAccess ? userDetails : undefined
    };
    
    exportSurveyData(surveyData, 'json');
  };

  if (!spec || !results || !isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground">
                    {isSaving ? 'Saving your assessment...' : 'Loading results...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const overallPercentage = Math.round(results.overall);
  const classification = results.classification;

  // Create survey data for PDF export (only when expanded access is available)
  const surveyData: SurveySubmission | null = useMemo(() => {
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
        }, {} as SurveySubmission['scores']['dimensions']),
        overall: Math.round(results.overall),
        maturityClassification: {
          level: results.classification?.level || 0,
          label: results.classification ? t(results.classification.labelKey) : 'Unknown',
          band: results.classification?.band || 'unknown'
        }
      },
      userDetails: hasExpandedAccess ? userDetails : undefined
    };
  }, [results, spec, surveyId, hasExpandedAccess, answers, userDetails, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Survey ID Display - Always Visible */}
          {surveyId && (
            <Alert className="border-primary/20 bg-primary/5">
              <Star className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong>Your Assessment ID: </strong>
                  <code className="bg-white px-2 py-1 rounded text-sm font-mono">{surveyId}</code>
                  <span className="text-sm text-muted-foreground ml-2">
                    Save this ID to retrieve your results later
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={copySurveyId}>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Header with Immediate Value */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-purple-50">
            <CardHeader>
              <div className="text-center space-y-3">
                <CardTitle className="text-3xl font-bold text-primary">
                  🎉 Assessment Complete!
                </CardTitle>
                <CardDescription className="text-lg">
                  Here's your Digital Maturity Assessment results
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          {/* Immediate Value - Basic Results (Always Visible) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Your Overall Score
                  <HelpTooltip 
                    title="Understanding Your Overall Score"
                    content="This score represents your organization's overall digital maturity across all 6 dimensions, calculated using the EU/JRC framework. Scores are normalized to 0-100 for easy interpretation."
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
                      (classification?.level || 0) >= 4 ? 'border-green-500 text-green-700 bg-green-50' :
                      (classification?.level || 0) >= 3 ? 'border-blue-500 text-blue-700 bg-blue-50' :
                      (classification?.level || 0) >= 2 ? 'border-amber-500 text-amber-700 bg-amber-50' :
                      'border-red-500 text-red-700 bg-red-50'
                    }`}
                  >
                    {classification ? t(classification.labelKey) : 'Unknown'}
                  </Badge>
                  <Progress value={overallPercentage} className="w-full h-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Dimension Preview
                  <HelpTooltip 
                    title="The 6 Digital Maturity Dimensions"
                    content="Digital maturity is measured across 6 key areas: Digital Business Strategy, Digital Readiness, Human-Centric Digitalization, Data Management & Connectivity, Automation & AI, and Green Digitalization."
                    variant="help"
                    size="sm"
                  />
                </CardTitle>
                <CardDescription>
                  Your performance across the 6 digital maturity dimensions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DimensionGaugesGrid 
                  dimensions={results.dimensions.map(dimension => ({
                    id: dimension.id,
                    score: Math.round(dimension.score),
                    target: dimension.target ? Math.round(dimension.target) : Math.round(dimension.score * 1.2),
                    gap: dimension.gap ? Math.round(dimension.gap) : 0
                  }))}
                  dimensionSpecs={spec.dimensions}
                  showDetails={false}
                  compactMode={true}
                  className="max-h-80 overflow-hidden relative"
                />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                <div className="text-center mt-4 pt-2 border-t border-gray-100">
                  <p className="text-sm text-muted-foreground">
                    🔒 Unlock detailed insights and recommendations below
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maturity Level Explanation */}
          <MaturityLevelExplanation
            level={classification?.level || 0}
            label={classification ? t(classification.labelKey) : 'Unknown'}
            score={overallPercentage}
            className="shadow-lg"
          />

          {/* Value Gate - Unlock Expanded Results */}
          {!hasExpandedAccess && (
            <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mx-auto">
                    <Unlock className="w-8 h-8 text-amber-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-amber-800">
                      Unlock Your Complete Analysis
                    </h3>
                    <p className="text-amber-700 max-w-2xl mx-auto">
                      Get detailed insights, industry benchmarks, personalized recommendations, 
                      and a professional PDF report. Just provide your email for free access.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Target className="w-4 h-4" />
                      <span>Detailed radar chart</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-700">
                      <BarChart3 className="w-4 h-4" />
                      <span>Industry benchmarks</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-700">
                      <Lightbulb className="w-4 h-4" />
                      <span>Action recommendations</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-700">
                      <FileText className="w-4 h-4" />
                      <span>Professional PDF report</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-700">
                      <Zap className="w-4 h-4" />
                      <span>Progress tracking</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-700">
                      <Users className="w-4 h-4" />
                      <span>Peer comparisons</span>
                    </div>
                  </div>

                  <Dialog open={showEmailCapture} onOpenChange={setShowEmailCapture}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3">
                        <Mail className="w-4 h-4 mr-2" />
                        Unlock Complete Results (Free)
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Unlock Your Complete Analysis</DialogTitle>
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
                        <div>
                          <Label htmlFor="company">Company Name</Label>
                          <Input
                            id="company"
                            value={userDetails.companyName}
                            onChange={(e) => setUserDetails(prev => ({ ...prev, companyName: e.target.value }))}
                            placeholder="Your Company Ltd"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="sector">Sector</Label>
                            <Select value={userDetails.sector} onValueChange={(value) => setUserDetails(prev => ({ ...prev, sector: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="services">Services</SelectItem>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="government">Government</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="size">Company Size</Label>
                            <Select value={userDetails.companySize} onValueChange={(value) => setUserDetails(prev => ({ ...prev, companySize: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="micro">1-9 employees</SelectItem>
                                <SelectItem value="small">10-49 employees</SelectItem>
                                <SelectItem value="medium">50-249 employees</SelectItem>
                                <SelectItem value="large">250+ employees</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button 
                          onClick={handleUnlockExpanded}
                          disabled={!userDetails.email || isSubmittingDetails}
                          className="w-full"
                        >
                          {isSubmittingDetails ? 'Unlocking...' : 'Unlock Complete Results'}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          We'll use your email only to send you assessment insights and digital maturity resources.
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
                    data={results.dimensions.map(dimension => {
                      const dimensionSpec = spec.dimensions.find(d => d.id === dimension.id);
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
                    dimensions={results.dimensions.map(dimension => ({
                      id: dimension.id,
                      score: Math.round(dimension.score),
                      target: dimension.target ? Math.round(dimension.target) : Math.round(dimension.score * 1.2),
                      gap: dimension.gap ? Math.round(dimension.gap) : 0
                    }))}
                    dimensionSpecs={spec.dimensions}
                    showDetails={true}
                    compactMode={false}
                  />
                </CardContent>
              </Card>

              {/* Benchmark Comparison */}
              {surveyData && (
                <Card className="shadow-lg">
                  <CardContent className="p-8">
                    <BenchmarkSection surveyData={surveyData} />
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
              
              {hasExpandedAccess && surveyData ? (
                <div className="flex items-center gap-2">
                  <TrackedPDFDownloadButton 
                    surveyData={surveyData}
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
                  This assessment provides insights into your organization's digital maturity. 
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
      {surveyData && (
        <ExtendedResultsModal
          isOpen={showExtendedModal}
          onClose={() => setShowExtendedModal(false)}
          surveyData={surveyData}
          surveySpec={spec}
          onShare={(surveyId) => {
            navigator.share ? 
              navigator.share({
                title: 'My Digital Maturity Assessment Results',
                text: `Check out my digital maturity assessment results!`,
                url: `${window.location.origin}/retrieve?id=${surveyId}`
              }) :
              navigator.clipboard.writeText(`${window.location.origin}/retrieve?id=${surveyId}`);
          }}
          onEmailResults={() => setShowEmailCapture(true)}
        />
      )}
    </div>
  );
}