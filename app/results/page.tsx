'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/store/assessment';
import { computeDimensionScores, computeOverallScore } from '@/lib/scoring';
import { RadarChart } from '@/components/charts/RadarChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Download, BarChart3, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { classify } from '@/lib/maturity';

export default function ResultsPage() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  
  // Store state
  const { spec, answers, isCompleted } = useAssessmentStore();
  
  // Compute results directly with memoization
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

  // Redirect if assessment not completed
  useEffect(() => {
    if (!spec || !isCompleted) {
      router.push('/assessment');
    }
  }, [spec, isCompleted, router]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!results || !spec) return [];

    return results.dimensions.map(dimension => {
      const dimensionSpec = spec.dimensions.find(d => d.id === dimension.id);
      return {
        dimension: dimensionSpec?.name || dimension.id,
        score: Math.round(dimension.score),
        target: dimensionSpec?.targetLevel ? Math.round(dimensionSpec.targetLevel * 100) : undefined,
        fullMark: 100
      };
    });
  }, [results, spec]);

  // Export functionality
  const handleExport = async () => {
    if (!results || !spec) return;
    
    setIsExporting(true);
    try {
      const exportData = {
        version: spec.version,
        language: spec.language,
        timestamp: new Date().toISOString(),
        answers,
        scores: {
          dimensions: (results.dimensions || []).map(d => ({
            id: d.id,
            name: spec.dimensions.find(dim => dim.id === d.id)?.name || d.id,
            score: Math.round(d.score * 100) / 100,
            target: d.targetLevel,
            gap: d.gap ? Math.round(d.gap * 100) / 100 : undefined
          })),
          overall: Math.round(results.overall * 100) / 100,
          classification: results.classification
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dma-results-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
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
                  <p className="text-muted-foreground">Laster resultater...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const overallPercentage = Math.round(results?.overall || 0);
  const classification = results?.classification;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-primary">
                    Dine Resultater
                  </CardTitle>
                  <CardDescription>
                    Digital Modenhetsvurdering (DMA) - Komplett analyse
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-sm bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Fullført
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Overall Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Total Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {overallPercentage}%
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-lg px-4 py-1 ${
                        (classification?.level || 0) >= 4 ? 'border-green-500 text-green-700 bg-green-50' :
                        (classification?.level || 0) >= 3 ? 'border-blue-500 text-blue-700 bg-blue-50' :
                        (classification?.level || 0) >= 2 ? 'border-amber-500 text-amber-700 bg-amber-50' :
                        'border-red-500 text-red-700 bg-red-50'
                      }`}
                    >
                      {classification?.label || 'Ukjent'}
                    </Badge>
                  </div>
                  <Progress value={overallPercentage} className="w-full h-3" />
                  <p className="text-sm text-gray-600 text-center">
                    Din bedrift viser {classification?.label?.toLowerCase() || 'ukjent'} digital modenhet
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Dimensjonsfordeling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(results?.dimensions || []).map((dimension) => {
                    const dimensionSpec = spec.dimensions.find(d => d.id === dimension.id);
                    const score = Math.round(dimension.score);
                    
                    return (
                      <div key={dimension.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{dimensionSpec?.name || dimension.id}</span>
                          <span className="text-gray-600">{score}%</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Radar Chart */}
          <RadarChart 
            data={radarData}
            showTarget={radarData.some(d => d.target !== undefined)}
            className="shadow-md"
          />

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detaljerte Resultater</CardTitle>
              <CardDescription>
                Breakdown av hver dimensjon med anbefalinger
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {(results?.dimensions || []).map((dimension) => {
                  const dimensionSpec = spec.dimensions.find(d => d.id === dimension.id);
                  const score = Math.round(dimension.score);
                  const gap = dimension.gap ? Math.round(dimension.gap * 100) : 0;
                  
                  return (
                    <div key={dimension.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">
                          {dimensionSpec?.name || dimension.id}
                        </h4>
                        <Badge variant="outline">
                          {score}%
                        </Badge>
                      </div>
                      
                      {dimensionSpec?.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {dimensionSpec.description}
                        </p>
                      )}
                      
                      <Progress value={score} className="mb-3" />
                      
                      {gap > 0 && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            Gap til målsetting: {gap} poeng. Fokus på utbedring anbefales.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button variant="outline" onClick={() => router.push('/assessment')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake til Vurdering
            </Button>
            
            <div className="flex gap-2">
              <Button onClick={() => router.push('/')} variant="outline">
                Ny Vurdering
              </Button>
              <Button 
                onClick={handleExport}
                disabled={isExporting}
                className="bg-primary"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Eksporterer...' : 'Eksporter Resultater'}
              </Button>
            </div>
          </div>
          
          {/* Footer Note */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800">
                <strong>Merk:</strong> Disse resultatene er basert på EU/JRC Digital Maturity Assessment 
                rammeverket og gir en indikasjon på din bedrifts digitale modenhet. 
                Bruk resultatene som utgangspunkt for videre digital utvikling.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}