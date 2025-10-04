'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, TrendingUp, Users, Mail, FileText, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getFunnelMetrics, getGlobalMetrics, GlobalMetrics } from '@/lib/analytics';

interface FunnelMetrics {
  started: number;
  completed: number;
  emailCaptured: number;
  pdfDownloaded: number;
  completionRate: number;
  conversionRate: number;
  pdfConversionRate: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const [globalMetrics, funnel] = await Promise.all([
        getGlobalMetrics(),
        getFunnelMetrics()
      ]);
      
      setMetrics(globalMetrics);
      setFunnelMetrics(funnel);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => router.push('/')} className="p-2">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-2xl font-bold text-primary">
                      Analytics Dashboard
                    </CardTitle>
                    <CardDescription>
                      Digital Maturity Assessment conversion metrics
                      {metrics && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          Last updated: {formatDate(metrics.lastUpdated)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={loadMetrics} disabled={isLoading} variant="outline">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
          </Card>

          {isLoading && !metrics ? (
            <Card>
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground">Loading analytics...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-800">
                      <Users className="w-4 h-4" />
                      Assessments Started
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                      {funnelMetrics?.started || 0}
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Total assessment attempts
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-800">
                      <TrendingUp className="w-4 h-4" />
                      Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      {funnelMetrics?.completed || 0}
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {formatPercentage(funnelMetrics?.completionRate || 0)} completion rate
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-800">
                      <Mail className="w-4 h-4" />
                      Email Captures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-900">
                      {funnelMetrics?.emailCaptured || 0}
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      {formatPercentage(funnelMetrics?.conversionRate || 0)} conversion rate
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-800">
                      <FileText className="w-4 h-4" />
                      PDF Downloads
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">
                      {funnelMetrics?.pdfDownloaded || 0}
                    </div>
                    <p className="text-xs text-purple-700 mt-1">
                      {formatPercentage(funnelMetrics?.pdfConversionRate || 0)} of email captures
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Conversion Funnel */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Conversion Funnel
                  </CardTitle>
                  <CardDescription>
                    Track user progression through the assessment and lead capture flow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Started to Completed */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Assessment Completion</span>
                      <Badge variant="outline">
                        {formatPercentage(funnelMetrics?.completionRate || 0)}
                      </Badge>
                    </div>
                    <Progress value={(funnelMetrics?.completionRate || 0) * 100} className="h-3" />
                    <div className="text-xs text-muted-foreground">
                      {funnelMetrics?.completed || 0} completed out of {funnelMetrics?.started || 0} started
                    </div>
                  </div>

                  {/* Completed to Email Capture */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Email Conversion</span>
                      <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-800">
                        {formatPercentage(funnelMetrics?.conversionRate || 0)}
                      </Badge>
                    </div>
                    <Progress value={(funnelMetrics?.conversionRate || 0) * 100} className="h-3" />
                    <div className="text-xs text-muted-foreground">
                      {funnelMetrics?.emailCaptured || 0} email captures out of {funnelMetrics?.completed || 0} completed
                    </div>
                  </div>

                  {/* Email to PDF Download */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">PDF Engagement</span>
                      <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-800">
                        {formatPercentage(funnelMetrics?.pdfConversionRate || 0)}
                      </Badge>
                    </div>
                    <Progress value={(funnelMetrics?.pdfConversionRate || 0) * 100} className="h-3" />
                    <div className="text-xs text-muted-foreground">
                      {funnelMetrics?.pdfDownloaded || 0} PDF downloads out of {funnelMetrics?.emailCaptured || 0} email captures
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Engagement Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Results Retrieved</span>
                      <span className="font-bold">{metrics?.retrievalAttempts || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">JSON Exports</span>
                      <span className="font-bold">{metrics?.jsonExports || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">PDF Reports</span>
                      <span className="font-bold">{metrics?.pdfDownloads || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Overall Lead Conversion</span>
                        <Badge className={
                          (funnelMetrics?.conversionRate || 0) > 0.3 ? 'bg-green-100 text-green-800' :
                          (funnelMetrics?.conversionRate || 0) > 0.15 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {formatPercentage(funnelMetrics?.conversionRate || 0)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(funnelMetrics?.conversionRate || 0) > 0.3 ? 'Excellent conversion rate!' :
                         (funnelMetrics?.conversionRate || 0) > 0.15 ? 'Good conversion rate' :
                         'Opportunity for improvement'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Assessment Quality</span>
                        <Badge className={
                          (funnelMetrics?.completionRate || 0) > 0.7 ? 'bg-green-100 text-green-800' :
                          (funnelMetrics?.completionRate || 0) > 0.5 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {formatPercentage(funnelMetrics?.completionRate || 0)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(funnelMetrics?.completionRate || 0) > 0.7 ? 'High completion rate' :
                         (funnelMetrics?.completionRate || 0) > 0.5 ? 'Moderate completion rate' :
                         'Consider reducing assessment length'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Footer */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-blue-800">
                  <strong>Analytics Dashboard</strong> • Digital Maturity Assessment
                </p>
                <p className="text-xs text-blue-700">
                  Real-time tracking of user engagement and lead generation performance.
                  Data is automatically updated with each user interaction.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}