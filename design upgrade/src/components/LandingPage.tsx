import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { BarChart3, Clock, TrendingUp, CheckCircle2, Zap, Cpu, Leaf, Database, Users, Target, Award, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onStartAssessment: () => void;
  onViewLeaderboard: () => void;
}

export function LandingPage({ onStartAssessment, onViewLeaderboard }: LandingPageProps) {
  // Mock data for top performing industries based on average scores
  const topIndustries = [
    {
      name: 'Informasjon og kommunikasjon',
      averageScore: 4.6,
      trend: '+0.3',
      icon: '💻',
      description: 'Teknologibedrifter leder digitaliseringen'
    },
    {
      name: 'Faglig, vitenskapelig og teknisk tjenesteyting',
      averageScore: 4.4,
      trend: '+0.2',
      icon: '🔬',
      description: 'Konsulentselskaper og forskningsinstitusjoner'
    },
    {
      name: 'Finansiering og forsikring',
      averageScore: 4.2,
      trend: '+0.4',
      icon: '🏦',
      description: 'Finanssektoren digitaliserer raskt'
    },
    {
      name: 'Elektrisitet, gass, damp og varmtvann',
      averageScore: 4.1,
      trend: '+0.5',
      icon: '⚡',
      description: 'Energisektoren investerer i grønn digitalisering'
    },
    {
      name: 'Helse- og sosialtjenester',
      averageScore: 3.9,
      trend: '+0.3',
      icon: '🏥',
      description: 'Helsesektoren moderniserer sine tjenester'
    }
  ];

  const features = [
    {
      icon: <CheckCircle2 className="w-12 h-12 text-green-600 mb-4" />,
      title: "Komplett vurdering",
      description: "11 detaljerte spørsmål fordelt på 6 nøkkeldimensjoner for digital modenhet"
    },
    {
      icon: <Clock className="w-12 h-12 text-blue-600 mb-4" />,
      title: "15-20 minutter",
      description: "Rask og effektiv vurdering med automatisk lagring av fremgang"
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />,
      title: "Detaljerte resultater",
      description: "Visualisering med radar-diagram og gap-analyse for forbedring"
    }
  ];

  const dimensions = [
    {
      number: "1",
      icon: <Target className="w-6 h-6" />,
      title: "Strategi",
      description: "Finnes det en plan? Hva investeres det i, og planlegges for?"
    },
    {
      number: "2",
      icon: <Zap className="w-6 h-6" />,
      title: "Evner og beredskap",
      description: "Grunnleggende og avanserte teknologier i bruk"
    },
    {
      number: "3",
      icon: <Users className="w-6 h-6" />,
      title: "Digitale evner",
      description: "Kompetanse innen digitale teknologier, og engasjement for endring"
    },
    {
      number: "4",
      icon: <Database className="w-6 h-6" />,
      title: "Databehandling og tilknytning",
      description: "Dataforvaltning og cybersikkerhet"
    },
    {
      number: "5",
      icon: <Cpu className="w-6 h-6" />,
      title: "Automatisering og kunstig intelligens",
      description: "AI og automatiseringsteknologier"
    },
    {
      number: "6",
      icon: <Leaf className="w-6 h-6" />,
      title: "Grønn digitalisering",
      description: "Bærekraftig digitalisering og miljøhensyn"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-gray-600 mb-2">EU/JRC Official Framework</p>
        <h1 className="text-4xl md:text-5xl text-blue-600 mb-4">
          Digital Maturity Assessment
        </h1>
        <p className="text-gray-700 text-lg mb-8 max-w-2xl mx-auto">
          Vurder din bedrifts digitale modenhet basert på det offisielle rammeverket fra EU Joint Research Centre (JRC)
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={onStartAssessment}
            size="lg"
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Start vurdering
          </Button>
          <Button 
            onClick={onViewLeaderboard}
            variant="outline"
            size="lg"
            className="px-8 py-3 rounded-lg"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Se resultattavle
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {features.map((feature, index) => (
          <Card key={index} className="text-center p-8 bg-white border border-gray-200">
            <div className="flex justify-center">
              {feature.icon}
            </div>
            <h3 className="text-xl mb-3">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
          </Card>
        ))}
      </div>

      {/* Top Industries Section */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Award className="w-6 h-6 text-yellow-500" />
            <h2 className="text-3xl">Bransjene som digitaliserer mest effektivt er:</h2>
          </div>
          <p className="text-gray-600 text-lg">
            Basert på gjennomsnittlig digital modenhetsscore per NACE-bransje
          </p>
        </div>

        <div className="grid gap-4 max-w-4xl mx-auto">
          {topIndustries.map((industry, index) => (
            <Card key={index} className="p-6 bg-white border border-gray-200 hover:shadow-md transition-all hover:border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{industry.icon}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-2xl font-semibold text-gray-400">
                      <span>#{index + 1}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-medium mb-1">{industry.name}</h3>
                    <p className="text-sm text-gray-600">{industry.description}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="text-3xl font-bold text-blue-600">{industry.averageScore.toFixed(1)}</div>
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {industry.trend}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">gjennomsnitt</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button 
            onClick={onViewLeaderboard}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <span>Se full resultattavle</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Dimensions Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl mb-4">Digital Modenhet målt i 6 dimensjoner</h2>
          <p className="text-gray-600 text-lg">
            Verktøyet viser deg digitale styrker og svakheter, og måler deg opp mot andre i din bransje.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {dimensions.map((dimension, index) => (
            <Card key={index} className="p-6 bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-semibold">
                    {dimension.number}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="text-blue-600">
                      {dimension.icon}
                    </div>
                    <h3 className="text-lg">{dimension.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {dimension.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm">
        <p className="mb-2">
          This tool is based on EU Joint Research Centre (JRC) Digital Maturity Assessment framework.
        </p>
        <p>
          Made with ❤️ by <span className="text-blue-600">Rastlaus</span>
        </p>
      </div>
    </div>
  );
}