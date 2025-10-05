'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Medal,
  Award,
  ArrowLeft,
  Building2,
  Target,
  Zap,
  Users,
  Database,
  Cpu,
  Leaf,
  Crown,
  Star,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NORWEGIAN_COUNTIES } from '@/data/norwegian-counties';
import { COUNTRY_LABELS } from '@/data/countries';

interface LeaderboardEntry {
  id: string;
  displayName: string;
  industry: string;
  industryLabel: string;
  sector: string;
  size: 'micro' | 'small' | 'medium' | 'large';
  region?: string;
  countryCode?: string;
  countryName?: string;
  countyCode?: string;
  countyName?: string;
  overallScore: number;
  dimensionScores: {
    digitalStrategy: number;
    digitalReadiness: number;
    humanCentric: number;
    dataManagement: number;
    automation: number;
    greenDigitalization: number;
  };
  completedAt: string;
  rank?: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCounty, setSelectedCounty] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState('overall');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedSector !== 'all') params.append('sector', selectedSector);
        if (selectedSize !== 'all') params.append('size', selectedSize);
        if (selectedCountry !== 'all') params.append('country', selectedCountry);
        if (selectedCounty !== 'all' && selectedCountry === 'NO') params.append('county', selectedCounty);

        const response = await fetch(`/api/leaderboard?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setLeaderboardData(data.data.entries);
        } else {
          setError('Failed to load leaderboard');
        }
      } catch (err) {
        setError('Error loading leaderboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [selectedSector, selectedSize, selectedCountry, selectedCounty]);

  const sectors = [
    { value: 'all', label: 'Alle bransjer' },
    { value: 'manufacturing', label: 'Industri' },
    { value: 'services', label: 'Faglig, vitenskapelig og teknisk tjenesteyting' },
    { value: 'retail', label: 'Varehandel og reparasjon av motorvogner' },
    { value: 'healthcare', label: 'Helse- og sosialtjenester' },
    { value: 'education', label: 'Undervisning' },
    { value: 'government', label: 'Offentlig administrasjon' },
    { value: 'other', label: 'Annen tjenesteyting' }
  ];

  const companySizes = [
    { value: 'all', label: 'Alle størrelser' },
    { value: 'micro', label: 'Mikrobedrift (1-9 ansatte)' },
    { value: 'small', label: 'Liten bedrift (10-49 ansatte)' },
    { value: 'medium', label: 'Mellomstørrelse (50-249 ansatte)' },
    { value: 'large', label: 'Stor bedrift (250+ ansatte)' }
  ];

  const dimensionDetails = [
    { key: 'digitalStrategy', name: 'Strategi', icon: <Target className="w-4 h-4" />, color: 'text-blue-600' },
    { key: 'digitalReadiness', name: 'Evner', icon: <Zap className="w-4 h-4" />, color: 'text-green-600' },
    { key: 'humanCentric', name: 'Digitale evner', icon: <Users className="w-4 h-4" />, color: 'text-purple-600' },
    { key: 'dataManagement', name: 'Data', icon: <Database className="w-4 h-4" />, color: 'text-orange-600' },
    { key: 'automation', name: 'AI', icon: <Cpu className="w-4 h-4" />, color: 'text-red-600' },
    { key: 'greenDigitalization', name: 'Grønn', icon: <Leaf className="w-4 h-4" />, color: 'text-emerald-600' }
  ];

  const filteredData = useMemo(() => {
    const data = [...leaderboardData];

    if (selectedTab === 'overall') {
      return data.sort((a, b) => b.overallScore - a.overallScore);
    }
    return data.sort(
      (a, b) =>
        b.dimensionScores[selectedTab as keyof typeof b.dimensionScores] -
        a.dimensionScores[selectedTab as keyof typeof a.dimensionScores]
    );
  }, [leaderboardData, selectedTab]);

  const countryOptions = useMemo(() => {
    const options = Object.entries(COUNTRY_LABELS).map(([code, label]) => ({
      value: code,
      label,
    }));
    return [{ value: 'all', label: 'Alle land' }, ...options];
  }, []);

  const countyOptions = useMemo(() => {
    if (selectedCountry !== 'NO') {
      return [{ value: 'all', label: 'Alle fylker' }];
    }
    const mapped = NORWEGIAN_COUNTIES.filter((county) => county.code !== '99').map((county) => ({
      value: county.code,
      label: county.name,
    }));
    return [{ value: 'all', label: 'Alle fylker' }, ...mapped];
  }, [selectedCountry]);

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <Star className="w-5 h-5 text-gray-300" />;
  };

  const getScoreLevel = (score: number) => {
    // Scores are 0-10 scale
    if (score >= 6.5) return { level: 'Future Proofing', color: 'bg-green-500' };
    if (score >= 4.5) return { level: 'Strategisk', color: 'bg-blue-500' };
    if (score >= 2.5) return { level: 'Utforskende', color: 'bg-yellow-500' };
    if (score >= 1.5) return { level: 'Grunnleggende', color: 'bg-orange-500' };
    return { level: 'Begynnernivå', color: 'bg-red-500' };
  };

  const getSizeLabel = (size: string) => {
    const sizeLabels = {
      micro: 'Mikro',
      small: 'Liten',
      medium: 'Mellom',
      large: 'Stor'
    };
    return sizeLabels[size as keyof typeof sizeLabels] || size;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push('/')} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Hjem</span>
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Digital Modenhet Resultattavle</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Se hvordan bedrifter presterer innen digital modenhet, sortert etter bransje og størrelse
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Bransje</label>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger>
                <SelectValue placeholder="Alle bransjer" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector.value} value={sector.value}>
                    {sector.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Bedriftsstørrelse</label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger>
                <SelectValue placeholder="Alle størrelser" />
              </SelectTrigger>
              <SelectContent>
                {companySizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Land</label>
            <Select
              value={selectedCountry}
              onValueChange={(value) => {
                setSelectedCountry(value);
                setSelectedCounty('all');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle land" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Fylke</label>
            <Select
              value={selectedCounty}
              onValueChange={setSelectedCounty}
              disabled={selectedCountry !== 'NO'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle fylker" />
              </SelectTrigger>
              <SelectContent>
                {countyOptions.map((county) => (
                  <SelectItem key={county.value} value={county.value}>
                    {county.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Viser {filteredData.length} bedrifter. Alle vises anonymt med genererte alias.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Sist oppdatert: {new Date().toLocaleDateString('no-NO')}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSector('all');
                setSelectedSize('all');
                setSelectedCountry('all');
                setSelectedCounty('all');
              }}
            >
              Nullstill filtre
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs for different rankings */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overall" className="flex items-center space-x-1">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Samlet</span>
          </TabsTrigger>
          {dimensionDetails.map((dim) => (
            <TabsTrigger key={dim.key} value={dim.key} className="flex items-center space-x-1">
              {dim.icon}
              <span className="hidden sm:inline">{dim.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <Card className="p-12 text-center">
              <p className="text-red-600">{error}</p>
            </Card>
          ) : filteredData.length === 0 ? (
            <Card className="p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-600 mb-2">Ingen bedrifter funnet</h3>
              <p className="text-gray-500">
                Prøv å justere filtrene for å se flere resultater.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredData.map((entry, index) => {
                const score = selectedTab === 'overall'
                  ? entry.overallScore
                  : (entry.dimensionScores?.[selectedTab as keyof typeof entry.dimensionScores] ?? 0);
                const level = getScoreLevel(score);
                const countryDisplay = entry.countryName || 'Uoppgitt';
                const countyName = entry.countyName;

                return (
                  <Card key={entry.id} className={`p-6 transition-shadow hover:shadow-md ${index < 3 ? 'ring-2 ring-yellow-200' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(index + 1)}
                          <span className="text-2xl font-semibold text-gray-400">#{index + 1}</span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-medium">{entry.displayName}</h3>
                            <Badge variant="outline" className="text-xs">Alias</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <span>{entry.industryLabel}</span>
                            <span className="text-gray-300">•</span>
                            <span>{getSizeLabel(entry.size)} bedrift</span>
                            <span className="text-gray-300">•</span>
                            <span>{countryDisplay}</span>
                            {countyName && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span>Fylke: {countyName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-bold mb-1">{score.toFixed(1)}</div>
                        <Badge variant="secondary" className={`${level.color} text-white`}>
                          {level.level}
                        </Badge>
                      </div>
                    </div>

                    {/* Show all dimension scores for overall ranking */}
                    {selectedTab === 'overall' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          {dimensionDetails.map((dim) => (
                            <div key={dim.key} className="text-center">
                              <div className={`flex items-center justify-center space-x-1 mb-1 ${dim.color}`}>
                                {dim.icon}
                                <span className="text-xs font-medium">{dim.name}</span>
                              </div>
                              <div className="text-sm font-semibold">
                                {(entry.dimensionScores?.[dim.key as keyof typeof entry.dimensionScores] ?? 0).toFixed(1)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}

              <Card className="bg-slate-50 border-dashed border-slate-200 p-6 text-sm text-slate-600">
                <h3 className="font-semibold text-slate-900 mb-2">Aggregert innsikt er på vei</h3>
                <p>
                  Når vi har nok svar per land, fylke, bransje og størrelse viser vi sammendragsstatistikk og toppscorere for ettersyn. Følg med!
                </p>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-12 pt-8 border-t">
        <p className="mb-2">
          Resultattavlen oppdateres automatisk når nye vurderinger fullføres.
        </p>
        <p>
          Du kan når som helst slå av deling av resultatene i rapporten din – aliaset forsvinner da fra tavlen.
        </p>
      </div>
    </div>
  );
}
