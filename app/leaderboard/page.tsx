'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Medal,
  Award,
  ArrowLeft,
  Search,
  Building2,
  TrendingUp,
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LeaderboardEntry {
  id: string;
  companyName: string;
  industry: string;
  industryLabel: string;
  sector: string;
  size: 'micro' | 'small' | 'medium' | 'large';
  region?: string;
  country: string;
  overallScore: number;
  dimensionScores: {
    digitalBusinessStrategy: number;
    digitalReadiness: number;
    humanCentricDigitalization: number;
    dataManagement: number;
    automationAndAI: number;
    greenDigitalization: number;
  };
  completedAt: string;
  isAnonymous: boolean;
  rank?: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
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
  }, [selectedSector, selectedSize]);

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
    { key: 'digitalBusinessStrategy', name: 'Strategi', icon: <Target className="w-4 h-4" />, color: 'text-blue-600' },
    { key: 'digitalReadiness', name: 'Evner', icon: <Zap className="w-4 h-4" />, color: 'text-green-600' },
    { key: 'humanCentricDigitalization', name: 'Digitale evner', icon: <Users className="w-4 h-4" />, color: 'text-purple-600' },
    { key: 'dataManagement', name: 'Data', icon: <Database className="w-4 h-4" />, color: 'text-orange-600' },
    { key: 'automationAndAI', name: 'AI', icon: <Cpu className="w-4 h-4" />, color: 'text-red-600' },
    { key: 'greenDigitalization', name: 'Grønn', icon: <Leaf className="w-4 h-4" />, color: 'text-emerald-600' }
  ];

  const filteredData = useMemo(() => {
    let filtered = leaderboardData;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.industryLabel.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by selected dimension or overall score
    if (selectedTab === 'overall') {
      return filtered.sort((a, b) => b.overallScore - a.overallScore);
    } else {
      return filtered.sort((a, b) =>
        b.dimensionScores[selectedTab as keyof typeof b.dimensionScores] -
        a.dimensionScores[selectedTab as keyof typeof a.dimensionScores]
      );
    }
  }, [leaderboardData, searchTerm, selectedTab]);

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <Star className="w-5 h-5 text-gray-300" />;
  };

  const getScoreLevel = (score: number) => {
    // Scores are 0-10 scale
    if (score >= 4.5) return { level: 'Ekspertise', color: 'bg-green-500' };
    if (score >= 3.5) return { level: 'Avansert', color: 'bg-blue-500' };
    if (score >= 2.5) return { level: 'Kompetent', color: 'bg-yellow-500' };
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
            <span>Tilbake til start</span>
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
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Bransje</label>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger>
                <SelectValue />
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
                <SelectValue />
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
            <label className="text-sm text-gray-600 mb-2 block">Søk bedrift</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Søk etter bedriftsnavn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Viser {filteredData.length} bedrifter
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Building2 className="w-4 h-4" />
            <span>Sist oppdatert: {new Date().toLocaleDateString('no-NO')}</span>
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
                Prøv å justere filtrene eller søkeordene for å se flere resultater.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredData.map((entry, index) => {
                const score = selectedTab === 'overall'
                  ? entry.overallScore
                  : entry.dimensionScores[selectedTab as keyof typeof entry.dimensionScores];
                const level = getScoreLevel(score);

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
                            <h3 className="text-lg font-medium">{entry.companyName}</h3>
                            {entry.isAnonymous && (
                              <Badge variant="outline" className="text-xs">Anonym</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{entry.industryLabel}</span>
                            <span>•</span>
                            <span>{getSizeLabel(entry.size)} bedrift</span>
                            <span>•</span>
                            <span>{entry.country}</span>
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
                                {entry.dimensionScores[dim.key as keyof typeof entry.dimensionScores].toFixed(1)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
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
          Ønsker du å delta anonymt i resultattavlen? Du kan velge dette i slutten av din vurdering.
        </p>
      </div>
    </div>
  );
}
