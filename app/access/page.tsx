'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MagicLinkRequest } from '@/components/MagicLinkRequest';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface SurveyListItem {
  id: string;
  createdAt: string;
  completedAt?: string;
  overallScore?: number;
  state: string;
  companyName?: string;
  sector?: string;
  companySize?: string;
  language: string;
  surveyVersion: string;
}

function AccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [isVerifying, setIsVerifying] = useState(false);
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verify magic link token on mount
  useEffect(() => {
    if (token && email) {
      verifyMagicLink(token, email);
    }
  }, [token, email]);

  const verifyMagicLink = async (magicToken: string, magicEmail: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: magicToken,
          email: magicEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSurveys(data.data.surveys);
        setVerifiedEmail(data.data.email);
        setSessionToken(data.data.sessionToken);
        toast.success(`Velkommen tilbake!`, {
          description: `Du har tilgang til ${data.data.surveys.length} ${data.data.surveys.length === 1 ? 'vurdering' : 'vurderinger'}.`,
        });
      } else {
        setError(data.error?.error || 'Kunne ikke verifisere lenken');
        if (data.error?.code === 'INVALID_TOKEN') {
          toast.error('Ugyldig eller utløpt lenke', {
            description: 'Lenken kan ha utløpt eller allerede blitt brukt. Be om en ny lenke.',
          });
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Noe gikk galt. Vennligst prøv igjen.');
      toast.error('Kunne ikke verifisere lenken');
    } finally {
      setIsVerifying(false);
    }
  };

  const getMaturityBadge = (score?: number) => {
    if (!score) return null;
    const normalized = score / 10; // Convert from 0-100 to 0-10

    if (normalized >= 7.6) {
      return <Badge className="bg-green-600">Avansert</Badge>;
    } else if (normalized >= 5.1) {
      return <Badge className="bg-blue-600">Moderat Avansert</Badge>;
    } else if (normalized >= 2.6) {
      return <Badge className="bg-amber-600">Gjennomsnittlig</Badge>;
    } else {
      return <Badge className="bg-gray-600">Grunnleggende</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Show verification loading
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Verifiserer lenken...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Dette tar bare et øyeblikk
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Hjem
            </Button>

            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>

            <MagicLinkRequest
              title="Be om ny lenke"
              description="Lenken kan ha utløpt eller allerede blitt brukt. Be om en ny lenke nedenfor."
            />
          </div>
        </div>
      </div>
    );
  }

  // Show survey list if verified
  if (surveys.length > 0 && verifiedEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => router.push('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Hjem
              </Button>
            </div>

            {/* Welcome Card */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">
                      Tilgang bekreftet
                    </h3>
                    <p className="text-sm text-green-800">
                      Du er logget inn som <strong>{verifiedEmail}</strong> og har tilgang til {surveys.length} {surveys.length === 1 ? 'vurdering' : 'vurderinger'}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Surveys List */}
            <Card>
              <CardHeader>
                <CardTitle>Dine Vurderinger</CardTitle>
                <CardDescription>
                  Klikk på en vurdering for å se resultater og rapporter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {surveys.map((survey) => (
                    <Card
                      key={survey.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        // Store session token in localStorage for authenticated access
                        if (sessionToken) {
                          sessionStorage.setItem('dmsa-session', sessionToken);
                        }
                        // Navigate to results - the results page will need to handle session-based access
                        router.push(`/results?id=${survey.id}`);
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">
                                {survey.companyName || 'Digital Modenhet Vurdering'}
                              </h3>
                              {survey.overallScore && getMaturityBadge(survey.overallScore)}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(survey.completedAt || survey.createdAt)}</span>
                              </div>
                              {survey.overallScore && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="font-medium">{Math.round(survey.overallScore)}/100</span>
                                </div>
                              )}
                              {survey.sector && (
                                <Badge variant="outline">{survey.sector}</Badge>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground">
                              Rapport-ID: <code className="bg-gray-100 px-1 rounded">{survey.id}</code>
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <ExternalLink className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Default: Show magic link request form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Hjem
          </Button>

          <MagicLinkRequest />
          
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-1">
              <div className="space-y-3 text-sm">
                <h4 className="font-semibold text-blue-900">Hvordan funker dette?</h4>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex gap-2">
                    <span className="font-bold">1.</span>
                    <span>Skriv inn e-postadressen du brukte når du fullførte vurderingen</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">2.</span>
                    <span>Vi sender deg en sikker lenke via e-post (gyldig i 1 time)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">3.</span>
                    <span>Klikk på lenken for å se alle dine vurderinger</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">4.</span>
                    <span>Last ned rapporter, se resultater, og administrer innstillinger</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AccessPageContent />
    </Suspense>
  );
}
