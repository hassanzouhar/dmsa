'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, Maximize2, Minimize2, Download, Share2, FileText, Mail,
  TrendingUp, Target, BarChart3, Zap, Lightbulb, ArrowRight,
  Trophy, Star, AlertCircle, CheckCircle2
} from 'lucide-react';

import { SurveySubmission } from '@/types/assessment';
import { RadarChart } from '@/components/charts/RadarChart';
import { DimensionGaugesGrid } from '@/components/charts/DimensionGaugesGrid';
import BenchmarkSection from '@/components/benchmark/BenchmarkSection';
import { HelpTooltip, InterpretationCard } from '@/components/ui/help-tooltip';
import { TrackedPDFDownloadButton } from '@/components/TrackedPDFDownloadButton';

interface ExtendedResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyData: SurveySubmission;
  surveySpec?: {
    dimensions: Array<{ id: string; name: string; description?: string }>;
    questions: Array<{ id: string; dimensionId: string }>;
    version: string;
    language: string;
  }; // Assessment specification
  onShare?: (surveyId: string) => void;
  onEmailResults?: () => void;
}

const ExtendedResultsModal: React.FC<ExtendedResultsModalProps> = ({
  isOpen,
  onClose,
  surveyData,
  surveySpec,
  onShare,
  onEmailResults
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate key metrics
  const overallScore = surveyData.scores.overall;
  const maturityLevel = surveyData.scores.maturityClassification;
  const hasUserDetails = !!surveyData.userDetails?.email;
  const dimensionCount = Object.keys(surveyData.scores.dimensions).length;

  // Get top and bottom performing dimensions
  const dimensionEntries = Object.entries(surveyData.scores.dimensions);
  const topDimension = dimensionEntries.reduce((prev, curr) => 
    curr[1].score > prev[1].score ? curr : prev
  );
  const bottomDimension = dimensionEntries.reduce((prev, curr) => 
    curr[1].score < prev[1].score ? curr : prev
  );

  // Comprehensive dimension name mapping for both legacy and new API formats
  const dimensionNames: Record<string, string> = {
    // Survey dimension IDs (from questions.no.ts)
    digitalStrategy: 'Digital Business Strategy',
    digitalReadiness: 'Digital Readiness',
    humanCentric: 'Human-Centric Digitalization',
    dataManagement: 'Data Management',
    automation: 'Automation and AI',
    greenDigitalization: 'Green Digitalization',
    // Legacy benchmark dimension keys (if they appear)
    digitalBusinessStrategy: 'Digital Business Strategy',
    humanCentricDigitalization: 'Human-Centric Digitalization',
    automationAndAI: 'Automation and AI',
    // Snake_case format (if used in API)
    digital_business_strategy: 'Digital Business Strategy',
    digital_readiness: 'Digital Readiness',
    human_centric: 'Human-Centric Digitalization',
    data_management: 'Data Management',
    automation_ai: 'Automation and AI',
    green_digitalization: 'Green Digitalization'
  };
  
  // Helper function to safely get dimension name
  const getDimensionName = (dimensionId: string): string => {
    return dimensionNames[dimensionId] || 
           dimensionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ||
           'Unknown Dimension';
  };
  
  // Helper function to get dimension short name safely
  const getDimensionShortName = (dimensionId: string): string => {
    const fullName = getDimensionName(dimensionId);
    return fullName.split(' ')[0] || 'Unknown';
  };

  const getMaturityColor = (level: number) => {
    if (level >= 4) return 'text-green-600 bg-green-50 border-green-200';
    if (level >= 3) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (level >= 2) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPerformanceInsights = () => {
    const insights = [];
    
    if (overallScore >= 80) {
      insights.push({
        type: 'strength',
        icon: Trophy,
        title: 'High Digital Maturity',
        message: 'Excellent overall performance across digital maturity dimensions.'
      });
    } else if (overallScore >= 60) {
      insights.push({
        type: 'opportunity',
        icon: Target,
        title: 'Good Foundation',
        message: 'Solid digital foundation with opportunities for advancement.'
      });
    } else {
      insights.push({
        type: 'action',
        icon: Zap,
        title: 'Transformation Opportunity',
        message: 'Significant potential for digital transformation improvement.'
      });
    }

    // Dimension-specific insights
    const lowScoreDimensions = dimensionEntries.filter(([, dim]) => dim.score < 50);
    if (lowScoreDimensions.length > 0) {
      insights.push({
        type: 'alert',
        icon: AlertCircle,
        title: 'Priority Areas',
        message: `${lowScoreDimensions.length} dimension${lowScoreDimensions.length > 1 ? 's' : ''} need immediate attention.`
      });
    }

    const highScoreDimensions = dimensionEntries.filter(([, dim]) => dim.score >= 80);
    if (highScoreDimensions.length > 0) {
      insights.push({
        type: 'success',
        icon: CheckCircle2,
        title: 'Strong Performance',
        message: `Excelling in ${highScoreDimensions.length} dimension${highScoreDimensions.length > 1 ? 's' : ''}.`
      });
    }

    return insights;
  };

  const insights = getPerformanceInsights();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={modalRef}
        className={`${isFullscreen ? 'max-w-none w-screen h-screen' : 'max-w-7xl max-h-[90vh]'} overflow-hidden`}
      >
        {/* Modal Header */}
        <DialogHeader className="flex-row items-center justify-between space-y-0 pb-6 border-b">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 text-primary" />
              Digital Maturity Assessment Results
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4">
              <span>Survey ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{surveyData.id}</code></span>
              <span>•</span>
              <span>Completed: {new Date(surveyData.timestamp).toLocaleDateString()}</span>
              {hasUserDetails && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Expanded Access
                  </span>
                </>
              )}
            </DialogDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="dimensions" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Dimensions
              </TabsTrigger>
              <TabsTrigger value="benchmarks" className="flex items-center gap-2" disabled={!hasUserDetails}>
                <BarChart3 className="w-4 h-4" />
                Benchmarks
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Next Steps
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Score Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        Overall Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div className="text-6xl font-bold text-primary">
                        {overallScore}
                      </div>
                      <Badge className={`text-lg px-4 py-2 ${getMaturityColor(maturityLevel.level)}`}>
                        {maturityLevel.label}
                      </Badge>
                      <Progress value={overallScore} className="w-full h-4" />
                      <p className="text-sm text-muted-foreground">
                        Out of 100 possible points
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Performance Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.slice(0, 4).map((insight, index) => {
                          const Icon = insight.icon;
                          return (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                              <Icon className={`w-5 h-5 mt-0.5 ${
                                insight.type === 'success' ? 'text-green-600' :
                                insight.type === 'alert' ? 'text-red-600' :
                                insight.type === 'opportunity' ? 'text-blue-600' :
                                'text-amber-600'
                              }`} />
                              <div>
                                <h4 className="font-semibold text-sm">{insight.title}</h4>
                                <p className="text-xs text-muted-foreground">{insight.message}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Radar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Digital Maturity Profile
                      <HelpTooltip content="This radar chart shows your performance across all 6 digital maturity dimensions. The larger the area, the higher your overall digital maturity." />
                    </CardTitle>
                    <CardDescription>
                      Your assessment across all {dimensionCount} digital maturity dimensions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadarChart
                      data={dimensionEntries.map(([dimensionId, dimension]) => ({
                        dimension: getDimensionName(dimensionId),
                        score: dimension.score,
                        target: dimension.target || dimension.score * 1.2,
                        fullMark: 100
                      }))}
                      showTarget={true}
                      className="w-full h-96"
                    />
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-primary">
                        {getDimensionShortName(topDimension[0])}
                      </div>
                      <p className="text-xs text-muted-foreground">Strongest Area</p>
                      <p className="text-sm font-medium">{topDimension[1].score}/100</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-amber-600">
                        {getDimensionShortName(bottomDimension[0])}
                      </div>
                      <p className="text-xs text-muted-foreground">Growth Area</p>
                      <p className="text-sm font-medium">{bottomDimension[1].score}/100</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">
                        {dimensionEntries.filter(([, dim]) => dim.score >= 70).length}
                      </div>
                      <p className="text-xs text-muted-foreground">High Performing</p>
                      <p className="text-sm font-medium">Dimensions ≥70</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((overallScore / 100) * 100)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Maturity Level</p>
                      <p className="text-sm font-medium">Complete</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Dimensions Tab */}
              <TabsContent value="dimensions" className="space-y-6">
                <DimensionGaugesGrid
                  dimensions={dimensionEntries.map(([dimensionId, dimension]) => ({
                    id: dimensionId,
                    score: dimension.score,
                    target: dimension.target || Math.min(100, dimension.score + 20),
                    gap: dimension.gap || 0
                  }))}
                  dimensionSpecs={surveySpec?.dimensions || []}
                  showDetails={true}
                  compactMode={false}
                />
              </TabsContent>

              {/* Benchmarks Tab */}
              <TabsContent value="benchmarks" className="space-y-6">
                {hasUserDetails ? (
                  <BenchmarkSection 
                    company={{
                      companyName: surveyData.userDetails?.companyName || 'Unknown',
                      companySize: (surveyData.userDetails?.companySize as 'micro' | 'small' | 'medium' | 'large') || 'small',
                      nace: 'C',
                      sector: (surveyData.userDetails?.sector as 'manufacturing' | 'services' | 'retail' | 'healthcare' | 'education' | 'government' | 'other') || 'manufacturing',
                      region: surveyData.userDetails?.region || 'Unknown'
                    }}
                    dimensions={surveyData.scores.dimensions}
                    overallScore={surveyData.scores.overall}
                  />
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Unlock Benchmark Comparison</h3>
                      <p className="text-muted-foreground mb-4">
                        Provide your company details to see how you compare against industry peers
                      </p>
                      <Button onClick={onEmailResults}>
                        <Mail className="w-4 h-4 mr-2" />
                        Add Company Details
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InterpretationCard
                    title="Understanding Your Assessment"
                    type="explanation"
                    content={
                      <div className="space-y-3">
                        <p>
                          Your digital maturity assessment evaluates your organization across 6 critical dimensions
                          of digital transformation, providing a comprehensive view of your digital capabilities.
                        </p>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">
                          💡 Your overall score of {overallScore}/100 places you in the &quot;{maturityLevel.label}&quot; category,
                            indicating {maturityLevel.level >= 3 ? 'strong' : maturityLevel.level >= 2 ? 'moderate' : 'developing'} digital capabilities.
                          </p>
                        </div>
                      </div>
                    }
                  />

                  <InterpretationCard
                    title="Performance Highlights"
                    type="insight"
                    content={
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-semibold text-sm text-green-800">🏆 Top Performing Area</h5>
                          <p className="text-sm">
                            <strong>{getDimensionName(topDimension[0])}</strong> - {topDimension[1].score}/100
                          </p>
                          <p className="text-xs text-muted-foreground">
                            This dimension shows your organization&apos;s strongest digital capabilities.
                          </p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold text-sm text-amber-800">🎯 Priority for Improvement</h5>
                          <p className="text-sm">
                            <strong>{getDimensionName(bottomDimension[0])}</strong> - {bottomDimension[1].score}/100
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Focus improvements here for maximum impact on overall digital maturity.
                          </p>
                        </div>
                      </div>
                    }
                  />
                </div>

                {/* Detailed insights for each dimension */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dimension-Specific Insights</CardTitle>
                    <CardDescription>
                      Detailed analysis and recommendations for each digital maturity dimension
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dimensionEntries.map(([dimensionId, dimension]) => (
                        <div key={dimensionId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{getDimensionName(dimensionId)}</h4>
                            <Badge variant="outline">{dimension.score}/100</Badge>
                          </div>
                          <Progress value={dimension.score} className="mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {dimension.score >= 80 ? 'Excellent performance - maintain and build on current strengths.' :
                             dimension.score >= 60 ? 'Good foundation - opportunity for strategic enhancement.' :
                             dimension.score >= 40 ? 'Moderate capabilities - focus area for improvement.' :
                             'Significant improvement opportunity - prioritize for transformation initiatives.'}
                          </p>
                          {dimension.gap > 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                              Gap to target: {dimension.gap} points
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Next Steps Tab */}
              <TabsContent value="actions" className="space-y-6">
                <InterpretationCard
                  title="Immediate Action Plan"
                  type="next-steps"
                  content={
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-semibold text-sm mb-2">🎯 Priority Focus Areas (Next 3 months)</h5>
                        <ul className="text-sm space-y-1 ml-4">
                          <li>• Address {getDimensionName(bottomDimension[0])} - your lowest scoring dimension</li>
                          <li>• Leverage strength in {getDimensionName(topDimension[0])} to drive broader improvements</li>
                          <li>• Establish regular assessment cycles for progress tracking</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold text-sm mb-2">🚀 Strategic Initiatives (3-12 months)</h5>
                        <ul className="text-sm space-y-1 ml-4">
                          <li>• Develop comprehensive digital transformation roadmap</li>
                          <li>• Invest in training and capability building for low-scoring areas</li>
                          <li>• Implement measurement systems for ongoing maturity tracking</li>
                          <li>• Benchmark against industry peers and best practices</li>
                        </ul>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h5 className="font-semibold text-sm text-green-800 mb-2">💡 Quick Wins</h5>
                        <p className="text-sm text-green-700">
                          Based on your assessment, focus on process digitization and data management 
                          improvements - these typically show rapid ROI and build momentum for larger initiatives.
                        </p>
                      </div>
                    </div>
                  }
                />

                {/* Professional Services CTA */}
                <Card className="bg-gradient-to-r from-primary/5 to-purple-50 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <h3 className="text-xl font-bold">Need Expert Guidance?</h3>
                      <p className="text-muted-foreground">
                        Get personalized recommendations and a detailed transformation roadmap 
                        from our digital maturity experts.
                      </p>
                      <div className="flex justify-center gap-4">
                        <Button>
                          Request Consultation
                        </Button>
                        <Button variant="outline">
                          Download Detailed Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Modal Footer */}
        <div className="border-t pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Assessment Framework: EU/JRC Digital Maturity Model</span>
          </div>
          
          <div className="flex items-center gap-2">
            {onShare && (
              <Button variant="outline" size="sm" onClick={() => onShare(surveyData.id)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </Button>
            )}
            
            {hasUserDetails && (
              <TrackedPDFDownloadButton
                surveyData={surveyData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 gap-2"
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </TrackedPDFDownloadButton>
            )}
            
            <Button onClick={() => {
              // Export functionality
              const dataStr = JSON.stringify(surveyData, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const exportFileDefaultName = `dma-results-${surveyData.id}.json`;
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtendedResultsModal;