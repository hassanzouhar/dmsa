import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Zap, 
  Users, 
  Database, 
  Cpu, 
  Leaf,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import { CompanyInfo, AssessmentResults } from '../App';

interface ResultsPageProps {
  results: AssessmentResults;
  companyInfo: CompanyInfo;
  onBackToStart: () => void;
}

export function ResultsPage({ results, companyInfo, onBackToStart }: ResultsPageProps) {
  const dimensionDetails = [
    {
      key: 'strategy',
      name: 'Strategi',
      icon: <Target className="w-5 h-5" />,
      description: 'Digital strategi og planlegging',
      color: 'text-blue-600'
    },
    {
      key: 'capabilities',
      name: 'Evner og beredskap',
      icon: <Zap className="w-5 h-5" />,
      description: 'Teknisk infrastruktur og kapasitet',
      color: 'text-green-600'
    },
    {
      key: 'skills',
      name: 'Digitale evner',
      icon: <Users className="w-5 h-5" />,
      description: 'Kompetanse og engasjement',
      color: 'text-purple-600'
    },
    {
      key: 'data',
      name: 'Databehandling',
      icon: <Database className="w-5 h-5" />,
      description: 'Dataforvaltning og sikkerhet',
      color: 'text-orange-600'
    },
    {
      key: 'automation',
      name: 'Automatisering & AI',
      icon: <Cpu className="w-5 h-5" />,
      description: 'Automatisering og kunstig intelligens',
      color: 'text-red-600'
    },
    {
      key: 'green',
      name: 'Grønn digitalisering',
      icon: <Leaf className="w-5 h-5" />,
      description: 'Bærekraftig digitalisering',
      color: 'text-emerald-600'
    }
  ];

  const radarData = dimensionDetails.map(dim => ({
    dimension: dim.name,
    score: results.dimensionScores[dim.key] || 0,
    fullMark: 5
  }));

  const barData = dimensionDetails.map(dim => ({
    name: dim.name,
    score: results.dimensionScores[dim.key] || 0,
    benchmark: 3.2 // Mock benchmark data
  }));

  const getScoreLevel = (score: number) => {
    if (score >= 4.5) return { level: 'Ekspertise', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score >= 3.5) return { level: 'Avansert', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (score >= 2.5) return { level: 'Kompetent', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (score >= 1.5) return { level: 'Grunnleggende', color: 'bg-orange-500', textColor: 'text-orange-700' };
    return { level: 'Begynnernivå', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const overallLevel = getScoreLevel(results.overallScore);

  const getRecommendations = (dimension: string, score: number) => {
    const recommendations: Record<string, string[]> = {
      strategy: [
        'Utvikle en helhetlig digital strategi',
        'Definer klare KPIer for digitale initiativ',
        'Opprett en digital transformasjonsplan'
      ],
      capabilities: [
        'Oppgrader IT-infrastrukturen',
        'Implementer skybaserte løsninger',
        'Styrk teknisk kompetanse i IT-avdelingen'
      ],
      skills: [
        'Start et digitalt kompetanseutviklingsprogram',
        'Rekrutter ansatte med digital ekspertise',
        'Implementer læringsteknologi'
      ],
      data: [
        'Implementer en datagovernance-strategi',
        'Forbedre datasikkerhet og personvern',
        'Opprett en sentralisert dataplattform'
      ],
      automation: [
        'Identifiser prosesser som kan automatiseres',
        'Utforsk RPA (Robotic Process Automation)',
        'Vurder AI-løsninger for forretningsoptimalisering'
      ],
      green: [
        'Definer bærekraftsmål for digitalisering',
        'Velg miljøvennlige teknologiløsninger',
        'Mål og reduser digital miljøpåvirkning'
      ]
    };
    
    return recommendations[dimension] || [];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl">Digital Modenhetsrapport</h1>
        </div>
        <p className="text-gray-600 text-lg mb-2">{companyInfo.name}</p>
        <p className="text-gray-500">
          Fullført {results.completedAt.toLocaleDateString('no-NO', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Overall Score */}
      <Card className="p-8 mb-8 text-center bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="mb-4">
          <div className="text-6xl mb-2">{results.overallScore.toFixed(1)}</div>
          <div className="text-gray-600">av 5.0</div>
        </div>
        <Badge variant="secondary" className={`${overallLevel.color} text-white text-lg px-4 py-2`}>
          {overallLevel.level}
        </Badge>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Din organisasjon viser {overallLevel.level.toLowerCase()} innen digital modenhet. 
          Se detaljerte resultater og anbefalinger nedenfor.
        </p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Radar Chart */}
        <Card className="p-6">
          <h3 className="text-xl mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Digital modenhetsprofil</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis 
                angle={45} 
                domain={[0, 5]} 
                tick={{ fontSize: 10 }}
                tickCount={6}
              />
              <Radar
                name="Din score"
                dataKey="score"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart Comparison */}
        <Card className="p-6">
          <h3 className="text-xl mb-4">Sammenligning med bransje</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
              />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="score" fill="#3B82F6" name="Din score" />
              <Bar dataKey="benchmark" fill="#E5E7EB" name="Bransje snitt" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Scores */}
      <Card className="p-6 mb-8">
        <h3 className="text-xl mb-6">Detaljerte resultater</h3>
        <div className="space-y-6">
          {dimensionDetails.map((dim) => {
            const score = results.dimensionScores[dim.key] || 0;
            const level = getScoreLevel(score);
            const recommendations = getRecommendations(dim.key, score);
            
            return (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={dim.color}>{dim.icon}</div>
                    <div>
                      <h4 className="font-medium">{dim.name}</h4>
                      <p className="text-sm text-gray-600">{dim.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold">{score.toFixed(1)}</div>
                    <Badge variant="outline" className={level.textColor}>
                      {level.level}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(score / 5) * 100}%` }}
                  ></div>
                </div>

                {score < 4 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">
                      Anbefalinger for forbedring:
                    </h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {dim.key !== 'green' && <Separator className="mt-6" />}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button variant="outline" className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Last ned rapport</span>
        </Button>
        <Button variant="outline" className="flex items-center space-x-2">
          <Share2 className="w-4 h-4" />
          <span>Del resultater</span>
        </Button>
        <Button onClick={onBackToStart} className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4" />
          <span>Start ny vurdering</span>
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-12 pt-8 border-t">
        <p className="mb-2">
          Basert på EU Joint Research Centre (JRC) Digital Maturity Assessment framework
        </p>
        <p>
          For mer informasjon om hvordan du kan forbedre din digitale modenhet, 
          kontakt våre eksperter eller besøk vår ressursside.
        </p>
      </div>
    </div>
  );
}