'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, AlertTriangle, CheckCircle2, 
  Target, Lightbulb, ArrowRight, Info 
} from 'lucide-react';

interface DimensionGaugeProps {
  dimensionId: string;
  name: string;
  description?: string;
  score: number; // 0-100
  target?: number; // 0-100
  gap?: number;
  className?: string;
  showDetails?: boolean;
}

// Performance level configurations
const getPerformanceLevel = (score: number) => {
  if (score >= 85) {
    return {
      level: 'excellent',
      label: 'Fremragende',
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle2,
      interpretation: 'Enestående ytelse på dette området. Du setter standarden for digital modenhet.'
    };
  } else if (score >= 70) {
    return {
      level: 'good',
      label: 'Good',
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: TrendingUp,
      interpretation: 'Strong performance with room for strategic improvements to reach excellence.'
    };
  } else if (score >= 50) {
    return {
      level: 'developing',
      label: 'Developing',
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: Target,
      interpretation: 'Moderate progress with significant opportunities for improvement and growth.'
    };
  } else {
    return {
      level: 'basic',
      label: 'Basic',
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: AlertTriangle,
      interpretation: 'Foundational level requiring immediate attention and strategic investment.'
    };
  }
};

// Get specific recommendations based on dimension and score
const getDimensionRecommendations = (dimensionId: string, score: number): string[] => {
  const recommendations: Record<string, Record<string, string[]>> = {
    digitalStrategy: {
      low: [
        'Utvikle en omfattende veikart for digital transformasjon',
        'Etabler digitale styrings- og lederstrukturer',
        'Sørg for at digitale initiativer er i tråd med forretningsmålene'
      ],
      medium: [
        'Integrer digitale måleparametere i resultatstyringen',
        'Utvid digitale kapabiliteter på tvers av forretningsenheter',
        'Styrk interessentengasjementet i digitale initiativer'
      ],
      high: [
        'Led bransjens digitale transformasjonsinitiativer',
        'Del beste praksis med kolleger og partnere',
        'Utforsk nye teknologier for konkurransefortrinn'
      ]
    },
    digitalReadiness: {
      low: [
        'Vurder dagens digitale infrastruktur og kapabiliteter',
        'Utvikle opplæringsprogrammer for digitale ferdigheter',
        'Etabler endringsledelsesprosesser'
      ],
      medium: [
        'Forbedre digitale samarbeidsverktøy og prosesser',
        'Implementer avanserte analysekapabiliteter',
        'Styrk cybersikkerhetstiltak'
      ],
      high: [
        'Optimaliser digitale prosesser for maksimal effektivitet',
        'Implementer prediktiv og preskriptiv analyse',
        'Frem innovasjon gjennom nye teknologier'
      ]
    },
    humanCentric: {
      low: [
        'Prioriter opplæring i digital kompetanse for ansatte',
        'Implementer brukervennlige digitale grensesnitt',
        'Fokuser på inkluderende prinsipper for digital design'
      ],
      medium: [
        'Forbedre den digitale medarbeideropplevelsen',
        'Implementer personlige digitale tjenester',
        'Styrk tiltak for digital tilgjengelighet'
      ],
      high: [
        'Vær pioner innen menneskesentrert AI-implementering',
        'Led bransjestandarder for digital inkludering',
        'Skap sømløse opplevelser på tvers av kanaler'
      ]
    },
    dataManagement: {
      low: [
        'Etabler rammeverk for datastyring',
        'Implementer prosesser for datakvalitetsstyring',
        'Utvikle datakompetanse i hele organisasjonen'
      ],
      medium: [
        'Forbedre dataintegrasjon og interoperabilitet',
        'Implementer avanserte analysekapabiliteter',
        'Styrk personvern og sikkerhet rundt data'
      ],
      high: [
        'Utnytt sanntidsdata for beslutningsstøtte',
        'Implementer AI-drevne datainnsikter',
        'Etabler strategier for datamonetisering'
      ]
    },
    automation: {
      low: [
        'Identifiser automatiseringsmuligheter i nøkkelprosesser',
        'Gjennomfør vurdering av AI-beredskap og kapabilitet',
        'Etabler etisk rammeverk for AI-styring'
      ],
      medium: [
        'Skaler automatisering på tvers av forretningsprosesser',
        'Implementer maskinlæring for beslutningsstøtte',
        'Forbedre modeller for samarbeid mellom mennesker og AI'
      ],
      high: [
        'Ta i bruk avansert AI for strategisk fordel',
        'Led ansvarlig implementering av AI',
        'Skap innovasjonsøkosystemer drevet av AI'
      ]
    },
    greenDigitalization: {
      low: [
        'Vurder miljøpåvirkningen av digitale operasjoner',
        'Implementer energieffektive digitale teknologier',
        'Utvikle bærekraftige måleparametere og rapportering'
      ],
      medium: [
        'Optimaliser digital infrastruktur for bærekraft',
        'Implementer prinsipper for sirkulær økonomi',
        'Forbedre bærekraft i leverandørkjeden'
      ],
      high: [
        'Led bransjeinitiativ for bærekraft',
        'Implementer karbonnøytrale digitale operasjoner',
        'Frem bærekraftig transformasjon i hele økosystemet'
      ]
    }
  };

  const level = score < 50 ? 'low' : score < 75 ? 'medium' : 'high';
  return recommendations[dimensionId]?.[level] || [
    'Continue monitoring and improving performance',
    'Benchmark against industry best practices',
    'Seek expert guidance for optimization'
  ];
};

export const DimensionGauge: React.FC<DimensionGaugeProps> = ({
  dimensionId,
  name,
  description,
  score,
  target,
  gap,
  className = '',
  showDetails = true
}) => {
  const performance = getPerformanceLevel(score);
  const recommendations = getDimensionRecommendations(dimensionId, score);
  const Icon = performance.icon;

  return (
    <Card className={`${performance.borderColor} ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
              {name}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm text-gray-600 mt-1">
                {description}
              </CardDescription>
            )}
          </div>
          <Badge 
            variant="outline" 
            className={`${performance.textColor} ${performance.bgColor} ${performance.borderColor} shrink-0`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {performance.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Gauge Visualization */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-32 h-16 overflow-hidden">
            {/* Background arc */}
            <svg className="w-full h-full" viewBox="0 0 200 100">
              <path
                d="M 20 80 A 80 80 0 0 1 180 80"
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Score arc */}
              <path
                d="M 20 80 A 80 80 0 0 1 180 80"
                stroke={performance.color.replace('bg-', '#')}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={`${(score / 100) * 251.2} 251.2`}
                className="transition-all duration-1000 ease-out"
                style={{
                  stroke: score >= 85 ? '#10b981' : 
                          score >= 70 ? '#3b82f6' : 
                          score >= 50 ? '#f59e0b' : '#ef4444'
                }}
              />
              {/* Target indicator */}
              {target && target !== score && (
                <circle
                  cx={100 + 80 * Math.cos(Math.PI - (target / 100) * Math.PI)}
                  cy={80 - 80 * Math.sin(Math.PI - (target / 100) * Math.PI)}
                  r="4"
                  fill="#6b7280"
                  className="animate-pulse"
                />
              )}
            </svg>
            
            {/* Center score display */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <div className="text-2xl font-bold text-gray-900">
                {score}
              </div>
              <div className="text-xs text-gray-500 -mt-1">
                / 100
              </div>
            </div>
          </div>
        </div>

        {/* Performance Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Performance</span>
            <span className={performance.textColor}>
              {score}% • {performance.label}
            </span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        {/* Target Gap Alert */}
        {gap !== undefined && gap > 0 && (
          <Alert className={`${performance.bgColor} ${performance.borderColor}`}>
            <Target className="h-4 w-4" />
            <AlertDescription className={`text-sm ${performance.textColor}`}>
              <strong>Gap to target:</strong> {gap} points
              {target && (
                <span> (Target: {target}%)</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Performance Interpretation */}
        {showDetails && (
          <div className={`p-3 rounded-lg ${performance.bgColor} ${performance.borderColor} border`}>
            <div className="flex items-start gap-2">
              <Info className={`w-4 h-4 mt-0.5 ${performance.textColor} shrink-0`} />
              <p className={`text-sm ${performance.textColor}`}>
                {performance.interpretation}
              </p>
            </div>
          </div>
        )}

        {/* Top Recommendations */}
        {showDetails && recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Key Recommendations</span>
            </div>
            <div className="space-y-2">
              {recommendations.slice(0, 2).map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <ArrowRight className="w-3 h-3 mt-0.5 text-gray-400 shrink-0" />
                  <span>{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DimensionGauge;