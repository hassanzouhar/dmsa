'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchSurvey, StoredSurveyData } from '@/lib/surveyStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';

export default function RetrieveResultsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [surveyId, setSurveyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surveyData, setSurveyData] = useState<StoredSurveyData | null>(null);

  const handleRetrieve = async () => {
    if (!surveyId.trim()) {
      setError('Vennligst skriv inn din undersøkelses-ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchSurvey(surveyId.trim());
      setSurveyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved henting av resultater');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFullResults = () => {
    if (surveyData) {
      // Navigate to results page with the retrieved data
      // We'll store the data temporarily and redirect
      router.push(`/results?retrievedId=${surveyData.id}`);
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
                    onClick={handleRetrieve}
                    disabled={isLoading || !surveyId.trim()}
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
                        {Math.round(surveyData.scores.overall)}%
                      </div>
                      <Badge 
                        variant="outline"
                        className={`text-lg px-4 py-1 ${
                          surveyData.scores.classification.level >= 4 ? 'border-green-500 text-green-700 bg-green-50' :
                          surveyData.scores.classification.level >= 3 ? 'border-blue-500 text-blue-700 bg-blue-50' :
                          surveyData.scores.classification.level >= 2 ? 'border-amber-500 text-amber-700 bg-amber-50' :
                          'border-red-500 text-red-700 bg-red-50'
                        }`}
                      >
                        {t(surveyData.scores.classification.labelKey)}
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
                      {surveyData.scores.dimensions.map((dimension) => (
                        <div key={dimension.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{dimension.name}</span>
                            <span className="text-gray-600">{Math.round(dimension.score)}%</span>
                          </div>
                          <Progress value={dimension.score} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleViewFullResults} size="lg" className="bg-primary">
                  Se Fullstendige Resultater
                </Button>
                <Button variant="outline" onClick={() => setSurveyData(null)} size="lg">
                  Søk Igjen
                </Button>
              </div>

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