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
  if (score >= 85) return {
    level: 'excellent',
    label: 'Excellent',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle2,
    interpretation: 'Outstanding performance in this area. You\'re setting the standard for digital maturity.'
  };
  if (score >= 70) return {
    level: 'good',
    label: 'Good',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: TrendingUp,
    interpretation: 'Strong performance with room for strategic improvements to reach excellence.'
  };
  if (score >= 50) return {
    level: 'developing',
    label: 'Developing',
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Target,
    interpretation: 'Moderate progress with significant opportunities for improvement and growth.'
  };
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
};

// Get specific recommendations based on dimension and score
const getDimensionRecommendations = (dimensionId: string, score: number): string[] => {
  const recommendations: Record<string, Record<string, string[]>> = {
    digitalStrategy: {
      low: [
        'Develop a comprehensive digital transformation roadmap',
        'Establish digital governance and leadership structures',
        'Align digital initiatives with business objectives'
      ],
      medium: [
        'Integrate digital metrics into performance management',
        'Expand digital capabilities across business units',
        'Enhance stakeholder engagement in digital initiatives'
      ],
      high: [
        'Lead industry digital transformation initiatives',
        'Share best practices with peers and partners',
        'Explore emerging technologies for competitive advantage'
      ]
    },
    digitalReadiness: {
      low: [
        'Assess current digital infrastructure and capabilities',
        'Develop digital skills training programs',
        'Establish change management processes'
      ],
      medium: [
        'Enhance digital collaboration tools and processes',
        'Implement advanced analytics capabilities',
        'Strengthen cybersecurity measures'
      ],
      high: [
        'Optimize digital processes for maximum efficiency',
        'Implement predictive and prescriptive analytics',
        'Drive innovation through emerging technologies'
      ]
    },
    humanCentric: {
      low: [
        'Prioritize employee digital literacy programs',
        'Implement user-friendly digital interfaces',
        'Focus on inclusive digital design principles'
      ],
      medium: [
        'Enhance digital employee experience',
        'Implement personalized digital services',
        'Strengthen digital accessibility measures'
      ],
      high: [
        'Pioneer human-centered AI implementations',
        'Lead industry standards for digital inclusion',
        'Create seamless omnichannel experiences'
      ]
    },
    dataManagement: {
      low: [
        'Establish data governance framework',
        'Implement data quality management processes',
        'Develop data literacy across organization'
      ],
      medium: [
        'Enhance data integration and interoperability',
        'Implement advanced data analytics capabilities',
        'Strengthen data privacy and security measures'
      ],
      high: [
        'Leverage real-time data for decision making',
        'Implement AI-driven data insights',
        'Establish data monetization strategies'
      ]
    },
    automation: {
      low: [
        'Identify automation opportunities in key processes',
        'Develop AI readiness and capability assessment',
        'Establish ethical AI governance framework'
      ],
      medium: [
        'Scale automation across business processes',
        'Implement machine learning for decision support',
        'Enhance human-AI collaboration models'
      ],
      high: [
        'Deploy advanced AI for strategic advantage',
        'Lead responsible AI implementation practices',
        'Create AI-powered innovation ecosystems'
      ]
    },
    greenDigitalization: {
      low: [
        'Assess environmental impact of digital operations',
        'Implement energy-efficient digital technologies',
        'Develop sustainability metrics and reporting'
      ],
      medium: [
        'Optimize digital infrastructure for sustainability',
        'Implement circular economy principles',
        'Enhance sustainable supply chain practices'
      ],
      high: [
        'Lead industry sustainability initiatives',
        'Implement carbon-neutral digital operations',
        'Drive ecosystem-wide sustainability transformation'
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