import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { ArrowLeft, ArrowRight, BarChart3 } from 'lucide-react';
import { CompanyInfo, AssessmentAnswer } from '../App';

interface Question {
  id: string;
  dimension: string;
  dimensionName: string;
  text: string;
  options: Array<{
    value: number;
    label: string;
    description: string;
  }>;
}

interface AssessmentQuestionnaireProps {
  companyInfo: CompanyInfo;
  onComplete: (answers: AssessmentAnswer[]) => void;
  onBack: () => void;
}

const questions: Question[] = [
  {
    id: 'strategy-1',
    dimension: 'strategy',
    dimensionName: 'Strategi',
    text: 'I hvilken grad har din organisasjon en klar digital strategi?',
    options: [
      { value: 1, label: 'Ingen strategi', description: 'Vi har ingen formell digital strategi' },
      { value: 2, label: 'Grunnleggende planer', description: 'Vi har noen uformelle digitale initiativ' },
      { value: 3, label: 'Delvis strategi', description: 'Vi har en digital strategi for enkelte områder' },
      { value: 4, label: 'Omfattende strategi', description: 'Vi har en helhetlig digital strategi' },
      { value: 5, label: 'Fullstendig integrert', description: 'Digital strategi er fullt integrert i forretningsstrategien' }
    ]
  },
  {
    id: 'strategy-2',
    dimension: 'strategy',
    dimensionName: 'Strategi',
    text: 'Hvor mye investerer organisasjonen i digitale teknologier og innovasjon?',
    options: [
      { value: 1, label: 'Minimalt', description: 'Under 1% av omsetningen' },
      { value: 2, label: 'Begrenset', description: '1-3% av omsetningen' },
      { value: 3, label: 'Moderat', description: '3-7% av omsetningen' },
      { value: 4, label: 'Betydelig', description: '7-15% av omsetningen' },
      { value: 5, label: 'Høyt prioritert', description: 'Over 15% av omsetningen' }
    ]
  },
  {
    id: 'capabilities-1',
    dimension: 'capabilities',
    dimensionName: 'Evner og beredskap',
    text: 'Hvor godt er din IT-infrastruktur og tekniske kapasitet?',
    options: [
      { value: 1, label: 'Grunnleggende', description: 'Kun essensielle systemer på plass' },
      { value: 2, label: 'Standard', description: 'Standard forretningssystemer implementert' },
      { value: 3, label: 'God', description: 'Integrerte systemer med god stabilitet' },
      { value: 4, label: 'Avansert', description: 'Moderne, skalerbar infrastruktur' },
      { value: 5, label: 'Ledende', description: 'Banebrytende teknologiløsninger' }
    ]
  },
  {
    id: 'capabilities-2',
    dimension: 'capabilities',
    dimensionName: 'Evner og beredskap',
    text: 'I hvilken grad bruker dere skybaserte tjenester og løsninger?',
    options: [
      { value: 1, label: 'Ikke i bruk', description: 'Alle systemer er on-premise' },
      { value: 2, label: 'Minimal bruk', description: 'Bruker kun grunnleggende skytjenester' },
      { value: 3, label: 'Delvis hybrid', description: 'Kombinasjon av sky og on-premise' },
      { value: 4, label: 'Hovedsakelig sky', description: 'Mesteparten av systemene er skybasert' },
      { value: 5, label: 'Sky-først', description: 'All ny utvikling skjer i skyen' }
    ]
  },
  {
    id: 'skills-1',
    dimension: 'skills',
    dimensionName: 'Digitale evner',
    text: 'Hvor høyt er det digitale kompetansenivået blant de ansatte?',
    options: [
      { value: 1, label: 'Grunnleggende', description: 'Kun basis digitale ferdigheter' },
      { value: 2, label: 'Funksjonelt', description: 'Kan bruke standard forretningsverktøy' },
      { value: 3, label: 'Kompetent', description: 'God beherskelse av relevante digitale verktøy' },
      { value: 4, label: 'Avansert', description: 'Høy digital kompetanse på tvers av organisasjonen' },
      { value: 5, label: 'Ekspert', description: 'Organisasjonen er en digital kompetansehub' }
    ]
  },
  {
    id: 'skills-2',
    dimension: 'skills',
    dimensionName: 'Digitale evner',
    text: 'Hvor aktivt jobber dere med kompetanseutvikling innen digitale teknologier?',
    options: [
      { value: 1, label: 'Passivt', description: 'Ingen formell kompetanseutvikling' },
      { value: 2, label: 'Ad-hoc', description: 'Sporadisk opplæring ved behov' },
      { value: 3, label: 'Planlagt', description: 'Årlig opplæringsplan for digital kompetanse' },
      { value: 4, label: 'Systematisk', description: 'Kontinuerlig og målrettet kompetanseutvikling' },
      { value: 5, label: 'Innovativ', description: 'Leder an i digital kompetanseutvikling' }
    ]
  },
  {
    id: 'data-1',
    dimension: 'data',
    dimensionName: 'Databehandling og tilknytning',
    text: 'Hvor godt strukturert og tilgjengelig er organisasjonens data?',
    options: [
      { value: 1, label: 'Fragmentert', description: 'Data spredt i separate systemer' },
      { value: 2, label: 'Delvis integrert', description: 'Noe datadeling mellom systemer' },
      { value: 3, label: 'Strukturert', description: 'God dataorganisering og -tilgang' },
      { value: 4, label: 'Integrert', description: 'Sentralisert dataplattform med god kvalitet' },
      { value: 5, label: 'Avansert analyse', description: 'Sanntids dataanalyse og -innsikt' }
    ]
  },
  {
    id: 'data-2',
    dimension: 'data',
    dimensionName: 'Databehandling og tilknytning',
    text: 'Hvor robust er cybersikkerheten og datavernrutinene?',
    options: [
      { value: 1, label: 'Grunnleggende', description: 'Minimale sikkerhetstiltak' },
      { value: 2, label: 'Standard', description: 'Grunnleggende sikkerhetsprotokoll' },
      { value: 3, label: 'God', description: 'Omfattende sikkerhetstiltak implementert' },
      { value: 4, label: 'Avansert', description: 'Proaktiv sikkerhet med kontinuerlig overvåking' },
      { value: 5, label: 'Ledende', description: 'Beste praksis innen cybersikkerhet' }
    ]
  },
  {
    id: 'automation-1',
    dimension: 'automation',
    dimensionName: 'Automatisering og kunstig intelligens',
    text: 'I hvilken grad har dere implementert automatisering i forretningsprosessene?',
    options: [
      { value: 1, label: 'Ingen', description: 'Alle prosesser er manuelle' },
      { value: 2, label: 'Minimal', description: 'Noen få prosesser er automatisert' },
      { value: 3, label: 'Delvis', description: 'Flere nøkkelprosesser er automatisert' },
      { value: 4, label: 'Omfattende', description: 'Mesteparten av rutineprosessene er automatisert' },
      { value: 5, label: 'Fullstendig', description: 'End-to-end automatisering av forretningsprosesser' }
    ]
  },
  {
    id: 'automation-2',
    dimension: 'automation',
    dimensionName: 'Automatisering og kunstig intelligens',
    text: 'Bruker organisasjonen kunstig intelligens eller maskinlæring?',
    options: [
      { value: 1, label: 'Ikke i bruk', description: 'Ingen AI/ML-implementering' },
      { value: 2, label: 'Utforsker', description: 'Vurderer eller tester AI-løsninger' },
      { value: 3, label: 'Pilotprosjekter', description: 'Har noen AI-pilotprosjekter' },
      { value: 4, label: 'Implementert', description: 'AI integrert i flere forretningsområder' },
      { value: 5, label: 'AI-drevet', description: 'AI er kjerneteknologi i forretningsmodellen' }
    ]
  },
  {
    id: 'green-1',
    dimension: 'green',
    dimensionName: 'Grønn digitalisering',
    text: 'Hvor fokusert er organisasjonen på bærekraftig digitalisering?',
    options: [
      { value: 1, label: 'Ikke prioritert', description: 'Miljøhensyn spiller liten rolle' },
      { value: 2, label: 'Bevisst', description: 'Noe oppmerksomhet på miljøpåvirkning' },
      { value: 3, label: 'Målrettet', description: 'Konkrete mål for grønn digitalisering' },
      { value: 4, label: 'Integrert', description: 'Bærekraft integrert i digitaliseringsarbeid' },
      { value: 5, label: 'Ledende', description: 'Pionerer innen grønn digital transformasjon' }
    ]
  }
];

export function AssessmentQuestionnaire({ companyInfo, onComplete, onBack }: AssessmentQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnswer = answers[currentQuestion.id] !== undefined;

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Convert answers to AssessmentAnswer format
      const assessmentAnswers: AssessmentAnswer[] = questions.map(q => ({
        questionId: q.id,
        dimension: q.dimension,
        score: answers[q.id] || 1
      }));
      onComplete(assessmentAnswers);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getDimensionColor = (dimension: string) => {
    const colors = {
      strategy: 'bg-blue-100 text-blue-800',
      capabilities: 'bg-green-100 text-green-800',
      skills: 'bg-purple-100 text-purple-800',
      data: 'bg-orange-100 text-orange-800',
      automation: 'bg-red-100 text-red-800',
      green: 'bg-emerald-100 text-emerald-800'
    };
    return colors[dimension as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Tilbake</span>
          </Button>
          <div className="text-sm text-gray-500">
            Spørsmål {currentQuestionIndex + 1} av {questions.length}
          </div>
        </div>
        
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>{Math.round(progress)}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-8 bg-white mb-8">
        <div className="mb-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs mb-4 ${getDimensionColor(currentQuestion.dimension)}`}>
            {currentQuestion.dimensionName}
          </div>
          <h2 className="text-2xl mb-2">{currentQuestion.text}</h2>
          <p className="text-gray-600">Velg det alternativet som best beskriver din organisasjon:</p>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <Card 
              key={option.value}
              className={`p-4 cursor-pointer border-2 transition-all hover:shadow-md ${
                answers[currentQuestion.id] === option.value
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleAnswer(option.value)}
            >
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    answers[currentQuestion.id] === option.value 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQuestion.id] === option.value && (
                      <div className="w-3 h-3 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">{option.label}</h4>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                <div className="text-sm text-gray-400">
                  {option.value}/5
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Forrige</span>
        </Button>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {Object.keys(answers).length} av {questions.length} besvart
          </div>
          <Button 
            onClick={handleNext}
            disabled={!hasAnswer}
            className="flex items-center space-x-2"
          >
            {isLastQuestion ? (
              <>
                <BarChart3 className="w-4 h-4" />
                <span>Se resultater</span>
              </>
            ) : (
              <>
                <span>Neste</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}