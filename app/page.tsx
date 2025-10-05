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
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Factory,
  Gauge,
  Globe2,
  Leaf,
  Target,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface IndustryBenchmark {
  sector: string;
  industryLabel: string;
  averageScore: number;
  count: number;
  trend: string;
  icon: string;
  description: string;
}

interface SurveyStats {
  count: number;
  regionCount: number;
  sectorCount: number;
  averageScore: number;
}

export default function HomePage() {
  const router = useRouter();
  const [topIndustries, setTopIndustries] = useState<IndustryBenchmark[]>([]);
  const [surveyStats, setSurveyStats] = useState<SurveyStats>({
    count: 0,
    regionCount: 0,
    sectorCount: 0,
    averageScore: 0
  });
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

        if (countData.success && countData.data) {
          setSurveyStats({
            count: countData.data.count || 0,
            regionCount: countData.data.regionCount || 0,
            sectorCount: countData.data.sectorCount || 0,
            averageScore: countData.data.averageScore || 0
          });
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
      icon: <Target className="w-5 h-5" />,
      title: "Strategi",
      description: "Finnes det en plan? Hva investeres det i, og planlegges for?",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Evner og beredskap",
      description: "Grunnleggende og avanserte teknologier i bruk",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Digitale evner",
      description: "Kompetanse innen digitale teknologier, og engasjement for endring",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: "Databehandling og tilknytning",
      description: "Dataforvaltning og cybersikkerhet",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: <Cpu className="w-5 h-5" />,
      title: "Automatisering og kunstig intelligens",
      description: "AI og automatiseringsteknologier",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: <Leaf className="w-5 h-5" />,
      title: "Grønn digitalisering",
      description: "Bærekraftig digitalisering og miljøhensyn",
      color: "bg-teal-100 text-teal-600"
    }
  ];

  const heroHighlights: Array<{
    label: string;
    value: string;
    description: string;
    icon: LucideIcon;
  }> = [
    {
      label: 'Bedrifter',
      value: surveyStats.count.toLocaleString('no-NO'),
      description: 'har allerede tatt vurderingen',
      icon: Users
    },
    {
      label: 'Regioner',
      value: surveyStats.regionCount > 0 ? surveyStats.regionCount.toLocaleString('no-NO') : '—',
      description: 'fylker og regioner representert i dataene',
      icon: Globe2
    },
    {
      label: 'Bransjer',
      value: surveyStats.sectorCount > 0 ? surveyStats.sectorCount.toLocaleString('no-NO') : '—',
      description: 'EU/JRC-sektorer representert i dataene',
      icon: Factory
    },
    {
      label: 'Snittscore',
      value: surveyStats.averageScore > 0 ? `${Math.round(surveyStats.averageScore)}/100` : '—',
      description: 'gjennomsnittlig modenhetspoeng i Norge',
      icon: Gauge
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-3xl border border-blue-100/60 bg-white/85 shadow-2xl backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
            <div className="absolute -top-32 -right-24 h-56 w-56 rounded-full bg-purple-400/30 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-blue-400/30 blur-3xl" />
            <div className="relative z-10 px-6 py-10 md:px-16 md:py-16 space-y-10">
              <div className="flex flex-wrap items-center justify-center gap-3 text-center">
                <Badge variant="secondary" className="text-sm bg-white/80 text-primary shadow-sm">
                  <Link
                    href="https://rastlaus.us"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline"
                  >
                    Rastlaus
                  </Link>{' '}
                  presenterer
                </Badge>
                <Badge variant="secondary" className="text-sm bg-white/60 text-muted-foreground shadow-sm">
                  EU/JRC Digital Maturity Framework
                </Badge>
              </div>

              <div className="space-y-6 max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    NM i Digitalisering
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-700 leading-relaxed">
                  Gjør bedriftens digitale modenhet til en konkurransefordel. Benchmark mot norske virksomheter, oppdag mulighetsrommet og få konkrete anbefalinger basert på EU/JRC sitt rammeverk.
                </p>
                <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                  Vurderingen er gratis, tar under 20 minutter og fokuserer på håndfast digital praksis fremfor buzz-ord. Ingen hype – bare innsikt du kan ta med til neste styremøte.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-center sm:justify-center">
                <Link href="/company-details" className="w-full">
                  <Button size="lg" className="w-full text-base md:text-lg px-6 md:px-8 py-5 md:py-6">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Start vurdering
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-base md:text-lg px-6 md:px-8 py-5 md:py-6 sm:w-auto"
                  onClick={() => router.push('/leaderboard')}
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Se resultattavle
                </Button>
              </div>

              {surveyStats.count > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4 max-w-4xl mx-auto">
                  {heroHighlights.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="flex items-center gap-4 rounded-2xl bg-white/90 p-4 text-left shadow-sm border border-white/60 transition-colors hover:border-blue-200"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
                          <p className="text-sm text-muted-foreground">{stat.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

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
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                Hva måler vi?
              </CardTitle>
              <CardDescription>
                Verktøyet viser deg digitale styrker og svakheter, og måler deg opp mot andre i din bransje.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {dimensions.map((dimension) => (
                  <div key={dimension.title} className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${dimension.color}`}>
                      {dimension.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{dimension.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {dimension.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Industries Section */}
          {!loading && topIndustries.length > 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-3xl font-bold">Disse bransjene leder an i digitaliseringen av Norge</h2>
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
