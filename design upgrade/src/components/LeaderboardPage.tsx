import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
  Star
} from 'lucide-react';

interface LeaderboardPageProps {
  onBack: () => void;
}

interface LeaderboardEntry {
  id: string;
  companyName: string;
  industry: string;
  industryLabel: string;
  size: 'micro' | 'small' | 'medium' | 'large';
  country: string;
  overallScore: number;
  dimensionScores: {
    strategy: number;
    capabilities: number;
    skills: number;
    data: number;
    automation: number;
    green: number;
  };
  completedDate: Date;
  isAnonymous?: boolean;
}

export function LeaderboardPage({ onBack }: LeaderboardPageProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overall');

  // Mock data for leaderboard
  const mockLeaderboardData: LeaderboardEntry[] = [
    {
      id: '1',
      companyName: 'TechFlow Solutions AS',
      industry: 'information',
      industryLabel: 'Informasjon og kommunikasjon',
      size: 'medium',
      country: 'Norge',
      overallScore: 4.7,
      dimensionScores: { strategy: 4.8, capabilities: 4.9, skills: 4.6, data: 4.5, automation: 4.8, green: 4.5 },
      completedDate: new Date('2024-09-15')
    },
    {
      id: '2',
      companyName: 'Digital Innovation Group',
      industry: 'professional',
      industryLabel: 'Faglig, vitenskapelig og teknisk tjenesteyting',
      size: 'large',
      country: 'Norge',
      overallScore: 4.6,
      dimensionScores: { strategy: 4.7, capabilities: 4.8, skills: 4.5, data: 4.6, automation: 4.4, green: 4.6 },
      completedDate: new Date('2024-09-12')
    },
    {
      id: '3',
      companyName: 'GreenTech Innovators',
      industry: 'energy',
      industryLabel: 'Elektrisitet, gass, damp og varmtvann',
      size: 'medium',
      country: 'Norge',
      overallScore: 4.5,
      dimensionScores: { strategy: 4.3, capabilities: 4.4, skills: 4.2, data: 4.5, automation: 4.2, green: 4.9 },
      completedDate: new Date('2024-09-10')
    },
    {
      id: '4',
      companyName: 'SmartManufacturing Pro',
      industry: 'manufacturing',
      industryLabel: 'Industri',
      size: 'large',
      country: 'Norge',
      overallScore: 4.4,
      dimensionScores: { strategy: 4.5, capabilities: 4.6, skills: 4.1, data: 4.3, automation: 4.7, green: 4.2 },
      completedDate: new Date('2024-09-08')
    },
    {
      id: '5',
      companyName: 'FinanceForward AS',
      industry: 'finance',
      industryLabel: 'Finansiering og forsikring',
      size: 'medium',
      country: 'Norge',
      overallScore: 4.3,
      dimensionScores: { strategy: 4.4, capabilities: 4.5, skills: 4.3, data: 4.6, automation: 4.1, green: 3.9 },
      completedDate: new Date('2024-09-05')
    },
    {
      id: '6',
      companyName: 'HealthTech Solutions',
      industry: 'health',
      industryLabel: 'Helse- og sosialtjenester',
      size: 'small',
      country: 'Norge',
      overallScore: 4.2,
      dimensionScores: { strategy: 4.0, capabilities: 4.3, skills: 4.4, data: 4.5, automation: 3.8, green: 4.2 },
      completedDate: new Date('2024-09-03')
    },
    {
      id: '7',
      companyName: 'Bedrift A (Anonym)',
      industry: 'trade',
      industryLabel: 'Varehandel og reparasjon av motorvogner',
      size: 'small',
      country: 'Norge',
      overallScore: 4.1,
      dimensionScores: { strategy: 4.2, capabilities: 4.0, skills: 4.3, data: 4.0, automation: 3.9, green: 4.2 },
      completedDate: new Date('2024-09-01'),
      isAnonymous: true
    },
    {
      id: '8',
      companyName: 'Construction Digital',
      industry: 'construction',
      industryLabel: 'Bygge- og anleggsvirksomhet',
      size: 'medium',
      country: 'Norge',
      overallScore: 4.0,
      dimensionScores: { strategy: 3.8, capabilities: 4.1, skills: 3.9, data: 4.0, automation: 4.2, green: 4.0 },
      completedDate: new Date('2024-08-28')
    },
    {
      id: '9',
      companyName: 'TransportTech Hub',
      industry: 'transport',
      industryLabel: 'Transport og lagring',
      size: 'small',
      country: 'Norge',
      overallScore: 3.9,
      dimensionScores: { strategy: 3.7, capabilities: 4.0, skills: 3.8, data: 3.9, automation: 4.1, green: 3.9 },
      completedDate: new Date('2024-08-25')
    },
    {
      id: '10',
      companyName: 'EduDigital AS',
      industry: 'education',
      industryLabel: 'Undervisning',
      size: 'small',
      country: 'Norge',
      overallScore: 3.8,
      dimensionScores: { strategy: 3.9, capabilities: 3.7, skills: 4.2, data: 3.6, automation: 3.5, green: 3.9 },
      completedDate: new Date('2024-08-22')
    }
  ];

  const industries = [
    { value: 'all', label: 'Alle bransjer' },
    { value: 'information', label: 'Informasjon og kommunikasjon' },
    { value: 'professional', label: 'Faglig, vitenskapelig og teknisk tjenesteyting' },
    { value: 'manufacturing', label: 'Industri' },
    { value: 'finance', label: 'Finansiering og forsikring' },
    { value: 'health', label: 'Helse- og sosialtjenester' },
    { value: 'energy', label: 'Elektrisitet, gass, damp og varmtvann' },
    { value: 'construction', label: 'Bygge- og anleggsvirksomhet' },
    { value: 'transport', label: 'Transport og lagring' },
    { value: 'trade', label: 'Varehandel og reparasjon av motorvogner' },
    { value: 'education', label: 'Undervisning' }
  ];

  const companySizes = [
    { value: 'all', label: 'Alle størrelser' },
    { value: 'micro', label: 'Mikrobedrift (1-9 ansatte)' },
    { value: 'small', label: 'Liten bedrift (10-49 ansatte)' },
    { value: 'medium', label: 'Mellomstørrelse (50-249 ansatte)' },
    { value: 'large', label: 'Stor bedrift (250+ ansatte)' }
  ];

  const dimensionDetails = [
    { key: 'strategy', name: 'Strategi', icon: <Target className="w-4 h-4" />, color: 'text-blue-600' },
    { key: 'capabilities', name: 'Evner og beredskap', icon: <Zap className="w-4 h-4" />, color: 'text-green-600' },
    { key: 'skills', name: 'Digitale evner', icon: <Users className="w-4 h-4" />, color: 'text-purple-600' },
    { key: 'data', name: 'Databehandling', icon: <Database className="w-4 h-4" />, color: 'text-orange-600' },
    { key: 'automation', name: 'Automatisering & AI', icon: <Cpu className="w-4 h-4" />, color: 'text-red-600' },
    { key: 'green', name: 'Grønn digitalisering', icon: <Leaf className="w-4 h-4" />, color: 'text-emerald-600' }
  ];

  const filteredData = useMemo(() => {
    let filtered = mockLeaderboardData;

    // Filter by industry
    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(entry => entry.industry === selectedIndustry);
    }

    // Filter by company size
    if (selectedSize !== 'all') {
      filtered = filtered.filter(entry => entry.size === selectedSize);
    }

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
  }, [selectedIndustry, selectedSize, searchTerm, selectedTab]);

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <Star className="w-5 h-5 text-gray-300" />;
  };

  const getScoreLevel = (score: number) => {
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
          <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Tilbake til start</span>
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl">Digital Modenhet Resultattavle</h1>
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
            <label className="text-sm text-gray-600 mb-2 block">Bransje (NACE)</label>
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    {industry.label}
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
              <span className="hidden sm:inline">{dim.name.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <div className="space-y-4">
            {filteredData.map((entry, index) => {
              const score = selectedTab === 'overall' 
                ? entry.overallScore 
                : entry.dimensionScores[selectedTab as keyof typeof entry.dimensionScores];
              const level = getScoreLevel(score);
              
              return (
                <Card key={entry.id} className={`p-6 transition-shadow hover:shadow-md ${index < 3 ? 'ring-2 ring-yellow-200' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
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
                              <span className="text-xs font-medium">{dim.name.split(' ')[0]}</span>
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
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg text-gray-600 mb-2">Ingen bedrifter funnet</h3>
          <p className="text-gray-500">
            Prøv å justere filtrene eller søkeordene for å se flere resultater.
          </p>
        </Card>
      )}

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