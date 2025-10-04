'use client';

import React from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { 
  HelpCircle, Info, Lightbulb, BookOpen, ArrowRight, 
  CheckCircle, AlertCircle, Target, TrendingUp 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  title?: string;
  type?: 'tooltip' | 'popover';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'info' | 'success' | 'warning' | 'help';
  children?: React.ReactNode;
  className?: string;
}

const getVariantConfig = (variant: string) => {
  switch (variant) {
    case 'info':
      return {
        icon: Info,
        className: 'text-blue-600 hover:text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800'
      };
    case 'success':
      return {
        icon: CheckCircle,
        className: 'text-green-600 hover:text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800'
      };
    case 'warning':
      return {
        icon: AlertCircle,
        className: 'text-amber-600 hover:text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800'
      };
    case 'help':
      return {
        icon: Lightbulb,
        className: 'text-purple-600 hover:text-purple-700',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-800'
      };
    default:
      return {
        icon: HelpCircle,
        className: 'text-gray-600 hover:text-gray-700',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-800'
      };
  }
};

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  type = 'tooltip',
  size = 'md',
  variant = 'default',
  children,
  className = ''
}) => {
  const config = getVariantConfig(variant);
  const Icon = config.icon;
  
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const trigger = children || <Icon className={`${iconSize} ${config.className} cursor-help ${className}`} />;

  if (type === 'popover') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-transparent">
            {trigger}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`w-80 ${config.bgColor} ${config.borderColor}`}>
          <div className="space-y-3">
            {title && (
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${config.className}`} />
                <h4 className={`font-semibold ${config.textColor}`}>
                  {title}
                </h4>
              </div>
            )}
            <div className={`text-sm ${config.textColor} leading-relaxed`}>
              {content}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-transparent">
            {trigger}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            {title && (
              <p className="font-semibold">{title}</p>
            )}
            <p className="text-sm">{content}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface InterpretationCardProps {
  title: string;
  content: string | React.ReactNode;
  type: 'explanation' | 'recommendation' | 'insight' | 'next-steps';
  level?: 'basic' | 'intermediate' | 'advanced';
  className?: string;
}

export const InterpretationCard: React.FC<InterpretationCardProps> = ({
  title,
  content,
  type,
  level = 'basic',
  className = ''
}) => {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'explanation':
        return {
          icon: BookOpen,
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
      case 'recommendation':
        return {
          icon: Target,
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        };
      case 'insight':
        return {
          icon: Lightbulb,
          color: 'amber',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          iconColor: 'text-amber-600'
        };
      case 'next-steps':
        return {
          icon: ArrowRight,
          color: 'purple',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800',
          iconColor: 'text-purple-600'
        };
      default:
        return {
          icon: Info,
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600'
        };
    }
  };

  const config = getTypeConfig(type);
  const Icon = config.icon;

  const getLevelBadge = (level: string) => {
    const badges = {
      basic: { label: 'Basic', variant: 'secondary' as const },
      intermediate: { label: 'Intermediate', variant: 'default' as const },
      advanced: { label: 'Advanced', variant: 'destructive' as const }
    };
    return badges[level as keyof typeof badges] || badges.basic;
  };

  const levelBadge = getLevelBadge(level);

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 text-base ${config.textColor}`}>
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
            {title}
          </CardTitle>
          <Badge variant={levelBadge.variant} className="text-xs">
            {levelBadge.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-sm ${config.textColor} leading-relaxed`}>
          {content}
        </div>
      </CardContent>
    </Card>
  );
};

interface MaturityLevelExplanationProps {
  level: number;
  label: string;
  score: number;
  className?: string;
}

export const MaturityLevelExplanation: React.FC<MaturityLevelExplanationProps> = ({
  level,
  label,
  score,
  className = ''
}) => {
  const getLevelExplanation = (level: number) => {
    switch (level) {
      case 4:
        return {
          title: 'Advanced Digital Maturity',
          description: 'Your organization demonstrates advanced digital capabilities with systematic, optimized processes and strong innovation capacity.',
          characteristics: [
            'Systematic digital transformation approach',
            'Optimized digital processes and governance',
            'Strong innovation and experimentation culture',
            'Advanced data-driven decision making'
          ],
          nextSteps: [
            'Lead industry digital transformation initiatives',
            'Share best practices with industry peers',
            'Explore emerging technologies for competitive advantage'
          ],
          color: 'green'
        };
      case 3:
        return {
          title: 'Moderately Advanced',
          description: 'Good digital foundation with structured processes and growing digital capabilities across the organization.',
          characteristics: [
            'Structured approach to digital initiatives',
            'Good digital governance and processes',
            'Expanding digital capabilities',
            'Increasing data utilization'
          ],
          nextSteps: [
            'Enhance integration between digital initiatives',
            'Strengthen analytics and data-driven insights',
            'Scale successful digital practices organization-wide'
          ],
          color: 'blue'
        };
      case 2:
        return {
          title: 'Average Digital Maturity',
          description: 'Basic digital capabilities are in place with some structured approaches, but significant opportunities for improvement exist.',
          characteristics: [
            'Basic digital processes established',
            'Some governance structures in place',
            'Limited but growing digital capabilities',
            'Inconsistent digital adoption'
          ],
          nextSteps: [
            'Develop comprehensive digital strategy',
            'Strengthen digital governance and leadership',
            'Invest in employee digital skills training'
          ],
          color: 'amber'
        };
      default:
        return {
          title: 'Basic Digital Maturity',
          description: 'Early stage of digital development with ad-hoc approaches and limited digital integration.',
          characteristics: [
            'Ad-hoc digital initiatives',
            'Limited digital governance',
            'Basic digital tools and processes',
            'Minimal data utilization'
          ],
          nextSteps: [
            'Establish digital transformation vision and strategy',
            'Build foundational digital capabilities',
            'Create digital governance framework'
          ],
          color: 'red'
        };
    }
  };

  const explanation = getLevelExplanation(level);

  return (
    <InterpretationCard
      title={`Understanding Your ${explanation.title}`}
      type="explanation"
      level="intermediate"
      className={className}
      content={
        <div className="space-y-4">
          <p>{explanation.description}</p>
          
          <div className="space-y-3">
            <h5 className="font-semibold text-sm">Key Characteristics:</h5>
            <ul className="space-y-1 text-sm">
              {explanation.characteristics.map((char, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                  {char}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold text-sm">Recommended Next Steps:</h5>
            <ul className="space-y-1 text-sm">
              {explanation.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-blue-600 mt-0.5 shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      }
    />
  );
};

export default HelpTooltip;