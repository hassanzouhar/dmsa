'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Info } from 'lucide-react';

function RetrieveResultsContent() {
  const router = useRouter();

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
                    Tilgang til tidligere vurderinger
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => router.push('/')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tilbake
                </Button>
              </div>
            </CardHeader>
          </Card>
          
          {/* Deprecation Notice */}
          <Alert className="border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Oppdatert tilgang:</strong> Fra nå av kan du få tilgang til resultatene dine via den unike lenken som ble sendt til deg etter fullført vurdering.
            </AlertDescription>
          </Alert>
          
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Slik får du tilgang til resultatene dine:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3">Nylige vurderinger:</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Etter fullført vurdering får du en unik lenke med tilgang til resultatene</li>
                  <li>• Denne lenken kan du bokmerke eller dele med andre</li>
                  <li>• Lenken inkluderer alle nødvendige tilgangsopplysninger</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Eldre vurderinger:</h3>
                <p className="text-sm text-gray-700">
                  Kontakt oss hvis du trenger tilgang til vurderinger som ble fullført før denne oppdateringen.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

export default function RetrieveResultsPage() {
  return (
    <Suspense>
      <RetrieveResultsContent />
    </Suspense>
  );
}
