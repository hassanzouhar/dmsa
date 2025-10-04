'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchSurvey, exportSurveyData } from '@/lib/survey-service';
import { SurveySubmission } from '@/types/assessment';
import { TrackedPDFDownloadButton } from '@/components/TrackedPDFDownloadButton';
import { trackResultsRetrieval, trackJSONExport } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Search, AlertCircle, CheckCircle2, Download, Clock, Building2, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import BenchmarkSection from '@/components/benchmark/BenchmarkSection';

export default function RetrieveResultsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [surveyId, setSurveyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surveyData, setSurveyData] = useState<SurveySubmission | null>(null);

  const handleRetrieve = useCallback(async (id?: string) => {
    const searchId = id || surveyId;
    if (!searchId || typeof searchId !== 'string' || !searchId.trim()) {
      setError('Vennligst skriv inn din undersøkelses-ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSurveyData(null);

    try {
      const data = await fetchSurvey(searchId.trim());
      if (data) {
        setSurveyData(data);
        toast.success('Survey found!');
        
        // Track successful retrieval
        await trackResultsRetrieval(data.id, true);
      } else {
        setError('Survey not found. Please check your ID and try again.');
        
        // Track failed retrieval
        await trackResultsRetrieval(searchId.trim(), false);
      }
    } catch (err) {
      console.error('Error fetching survey:', err);
      setError('Failed to retrieve survey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [surveyId]);

  // Pre-fill ID from URL params if present
  useEffect(() => {
    const id = searchParams?.get('id');
    if (id && typeof id === 'string' && id.trim()) {
      setSurveyId(id.trim());
      handleRetrieve(id.trim());
    }
  }, [searchParams, handleRetrieve]);

  const handleExport = async (format: 'json' | 'text' = 'json') => {
    if (surveyData) {
      // Track export
      if (format === 'json') {
        await trackJSONExport(surveyData.id, !!surveyData.userDetails);
      }
      
      exportSurveyData(surveyData, format);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-primary">
                    Hent Tidligere Resultater
                  </CardTitle>
                  <CardDescription>
                    Skriv inn din unike undersøkelses-ID for å se resultatene dine
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => router.push('/')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tilbake
                </Button>
              </div>
            </CardHeader>
          </Card>

          {!surveyData ? (
            // Search Form
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Søk etter dine resultater
                </CardTitle>
                <CardDescription>
                  Din undersøkelses-ID er en 10-tegn kode du mottok etter å ha fullført vurderingen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="f.eks. abc123def4"
                    value={surveyId}
                    onChange={(e) => setSurveyId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRetrieve()}
                    disabled={isLoading}
                    className="font-mono"
                  />
                  <Button 
                    onClick={() => handleRetrieve()}
                    disabled={isLoading || !surveyId || !surveyId.trim()}
                  >
                    {isLoading ? 'Søker...' : 'Hent Resultater'}
                  </Button>
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Tips:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• ID-en består av 10 tegn (bokstaver og tall)</li>
                    <li>• Sjekk e-posten din hvis du oppga e-postadresse</li>
                    <li>• ID-en ble vist på resultat-siden etter fullført vurdering</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Survey Results Preview
            <div className="space-y-6">
              {/* Survey Info */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Resultater Funnet
                      </CardTitle>
                      <CardDescription>
                        Undersøkelses-ID: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{surveyData.id}</code>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                      Fullført
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Dato:</span>
                      <p className="text-gray-600">{formatDate(surveyData.timestamp)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Versjon:</span>
                      <p className="text-gray-600">{surveyData.version}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Språk:</span>
                      <p className="text-gray-600">{surveyData.language === 'no' ? 'Norsk' : surveyData.language}</p>
                    </div>
                    {surveyData.userDetails?.companyName && (
                      <>
                        <div>
                          <span className="font-medium text-gray-700">Bedrift:</span>
                          <p className="text-gray-600">{surveyData.userDetails.companyName}</p>
                        </div>
                        {surveyData.userDetails.email && (
                          <div>
                            <span className="font-medium text-gray-700">E-post:</span>
                            <p className="text-gray-600">{surveyData.userDetails.email}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Score Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-4xl font-bold text-primary">
                        {surveyData.scores.overall}/100
                      </div>
                      <Badge 
                        variant="outline"
                        className={`text-lg px-4 py-1 ${
                          surveyData.scores.maturityClassification.level >= 4 ? 'border-green-500 text-green-700 bg-green-50' :
                          surveyData.scores.maturityClassification.level >= 3 ? 'border-blue-500 text-blue-700 bg-blue-50' :
                          surveyData.scores.maturityClassification.level >= 2 ? 'border-amber-500 text-amber-700 bg-amber-50' :
                          'border-red-500 text-red-700 bg-red-50'
                        }`}
                      >
                        {surveyData.scores.maturityClassification.label}
                      </Badge>
                      <Progress value={surveyData.scores.overall} className="w-full" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dimensjoner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(surveyData.scores.dimensions).map(([dimensionId, dimension]) => (
                        <div key={dimensionId} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium capitalize">
                              {dimensionId.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-gray-600">{dimension.score}/100</span>
                          </div>
                          <Progress value={dimension.score} className="h-2" />
                          {dimension.gap > 0 && (
                            <div className="text-xs text-amber-600 flex items-center gap-1">
                              <span>Gap to target: {dimension.gap}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Export your results</h4>
                      <p className="text-sm text-muted-foreground">
                        Download your assessment data in different formats
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleExport('json')} className="gap-2">
                        <Download className="w-4 h-4" />
                        JSON
                      </Button>
                      <Button variant="outline" onClick={() => handleExport('text')} className="gap-2">
                        <Download className="w-4 h-4" />
                        Summary
                      </Button>
                      {surveyData.userDetails ? (
                        <TrackedPDFDownloadButton 
                          surveyData={surveyData}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 gap-2 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          PDF Report
                        </TrackedPDFDownloadButton>
                      ) : (
                        <Button variant="outline" disabled className="gap-2" title="PDF report requires expanded access">
                          <FileText className="w-4 h-4" />
                          PDF Report
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setSurveyData(null)}>
                        Søk Igjen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benchmark Comparison - Show if user details available */}
              {surveyData.userDetails?.email && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Industry Benchmark Comparison</CardTitle>
                    <CardDescription>
                      See how your performance compares to similar organizations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BenchmarkSection surveyData={surveyData} />
                  </CardContent>
                </Card>
              )}

              {!surveyData.userDetails?.email && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="pt-6">
                    <p className="text-sm text-amber-800">
                      <strong>Tips:</strong> For å se utvidede resultater med benchmarking og detaljerte anbefalinger, 
                      kan du oppgi bedriftsinformasjon på resultat-siden.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}