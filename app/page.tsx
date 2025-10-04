'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  CheckCircle,
  Clock,
  Trophy,
  TrendingUp,
  ChevronRight,
  Award,
  Users,
  Target,
  Zap,
  Database,
  Cpu,
  Leaf
} from 'lucide-react';

interface IndustryBenchmark {
  sector: string;
  industryLabel: string;
  averageScore: number;
  count: number;
  trend: string;
  icon: string;
  description: string;
}

export default function HomePage() {
  const router = useRouter();
  const [topIndustries, setTopIndustries] = useState<IndustryBenchmark[]>([]);
  const [surveyCount, setSurveyCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch industry benchmarks
        const benchmarksResponse = await fetch('/api/leaderboard?benchmarks=true');
        const benchmarksData = await benchmarksResponse.json();

        if (benchmarksData.success) {
          // Get top 5 industries
          setTopIndustries(benchmarksData.data.benchmarks.slice(0, 5));
        }

        // Fetch survey count
        const countResponse = await fetch('/api/leaderboard?count=true');
        const countData = await countResponse.json();

        if (countData.success) {
          setSurveyCount(countData.data.count);
        }
      } catch (error) {
        console.error('Failed to fetch landing page data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const dimensions = [
    {
      number: "1",
      icon: <Target className="w-5 h-5" />,
      title: "Strategi",
      description: "Finnes det en plan? Hva investeres det i, og planlegges for?",
      color: "bg-blue-100 text-blue-600"
    },
    {
      number: "2",
      icon: <Zap className="w-5 h-5" />,
      title: "Evner og beredskap",
      description: "Grunnleggende og avanserte teknologier i bruk",
      color: "bg-green-100 text-green-600"
    },
    {
      number: "3",
      icon: <Users className="w-5 h-5" />,
      title: "Digitale evner",
      description: "Kompetanse innen digitale teknologier, og engasjement for endring",
      color: "bg-purple-100 text-purple-600"
    },
    {
      number: "4",
      icon: <Database className="w-5 h-5" />,
      title: "Databehandling og tilknytning",
      description: "Dataforvaltning og cybersikkerhet",
      color: "bg-orange-100 text-orange-600"
    },
    {
      number: "5",
      icon: <Cpu className="w-5 h-5" />,
      title: "Automatisering og kunstig intelligens",
      description: "AI og automatiseringsteknologier",
      color: "bg-red-100 text-red-600"
    },
    {
      number: "6",
      icon: <Leaf className="w-5 h-5" />,
      title: "Grønn digitalisering",
      description: "Bærekraftig digitalisering og miljøhensyn",
      color: "bg-teal-100 text-teal-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
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

            {/* Social Proof */}
            {surveyCount > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>
                  <strong className="text-primary">{surveyCount}</strong> bedrifter har fullført vurderingen
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/company-details">
                <Button size="lg" className="text-lg px-8 py-6">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Start vurdering
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => router.push('/leaderboard')}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Se resultattavle
              </Button>
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

          {/* Top Industries Section */}
          {!loading && topIndustries.length > 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Award className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-3xl font-bold">Bransjene som digitaliserer mest effektivt er:</h2>
                </div>
                <p className="text-muted-foreground text-lg">
                  Basert på gjennomsnittlig digital modenhetsscore per NACE-bransje
                </p>
              </div>

              <div className="grid gap-4 max-w-4xl mx-auto">
                {topIndustries.map((industry, index) => (
                  <Card
                    key={industry.sector}
                    className="p-6 hover:shadow-lg transition-all hover:border-blue-200 cursor-pointer"
                    onClick={() => router.push('/leaderboard')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">{industry.icon}</span>
                          </div>
                          <div className="text-2xl font-semibold text-gray-400">
                            #{index + 1}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-medium mb-1">{industry.industryLabel}</h3>
                          <p className="text-sm text-muted-foreground">{industry.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {industry.count} bedrifter vurdert
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-3xl font-bold text-blue-600">
                            {industry.averageScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            {industry.trend}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">gjennomsnitt</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 mx-auto"
                  onClick={() => router.push('/leaderboard')}
                >
                  <span>Se full resultattavle</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Assessment Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Digital Modenhet målt i 6 dimensjoner
              </CardTitle>
              <CardDescription className="text-center">
                Verktøyet viser deg digitale styrker og svakheter, og måler deg opp mot andre i din bransje.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dimensions.map((dimension) => (
                  <div key={dimension.number} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${dimension.color}`}>
                      {dimension.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-muted-foreground">
                          {dimension.icon}
                        </div>
                        <h3 className="font-semibold">{dimension.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {dimension.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-8 border-t space-y-2">
            <p>
              This tool is based on EU Joint Research Centre (JRC) Digital Maturity Assessment framework.
            </p>
            <p>
              Made with ❤️ by <strong><a href="https://rastla.us" className="underline hover:text-primary">Rastlaus</a></strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
