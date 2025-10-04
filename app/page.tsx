'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, CheckCircle, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <Badge variant="secondary" className="text-sm">
                EU/JRC Official Framework
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Digital Maturity Assessment
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Vurder din bedrifts digitale modenhet basert på det offisielle rammeverket fra EU Joint Research Centre (JRC)
              </p>
            </div>
            
            <div className="flex justify-center">
              <Link href="/company-details">
                <Button size="lg" className="text-lg px-8 py-6">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Start vurdering
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Komplett vurdering</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  11 detaljerte spørsmål fordelt på 6 nøkkeldimensjoner for digital modenhet
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-lg">15-20 minutter</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Rask og effektiv vurdering med automatisk lagring av fremgang
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Detaljerte resultater</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Visualisering med radar-diagram og gap-analyse for forbedring
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Digital Modenhet målt i 6 dimensjoner </CardTitle>
              <CardDescription className="text-center">
                Verktøyet viser deg digitale styrker og svakheter, og måler deg opp mot andre i din bransje.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold">Strategi</h3>
                      <p className="text-sm text-muted-foreground">
                        Finnes det en plan? Hva investeres det i, og planlegges for?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold">Evner og beredskap</h3>
                      <p className="text-sm text-muted-foreground">
                        Grunnleggende og avanserte teknologier i bruk
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold">Digitale evner</h3>
                      <p className="text-sm text-muted-foreground">
                        Kompetanse innen digitale teknologier, og engasjement for endring
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold text-sm">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold">Databehandling og tilknytning</h3>
                      <p className="text-sm text-muted-foreground">
                        Dataforvaltning og cybersikkerhet
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm">
                      5
                    </div>
                    <div>
                      <h3 className="font-semibold">Automatisering og kunstig intelligens</h3>
                      <p className="text-sm text-muted-foreground">
                        AI og automatiseringsteknologier
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-semibold text-sm">
                      6
                    </div>
                    <div>
                      <h3 className="font-semibold">Grønn digitalisering</h3>
                      <p className="text-sm text-muted-foreground">
                        Bærekraftig digitalisering og miljøhensyn
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>
              This tool is based on EU Joint Research Centre (JRC) Digital Maturity Assessment framework.
            </p>
            <p className="mt-2">
              Made with ❤️ by <strong> <a href="https://rastla.us" className="underline hover:text-primary">Rastlaus</a> </strong> </p>
          </div>
        </div>
      </div>
    </div>
  );
}
