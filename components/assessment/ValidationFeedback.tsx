'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, Target } from 'lucide-react';
import { Question } from '@/types/assessment';

interface ValidationFeedbackProps {
  question: Question;
  answer: unknown;
  isValid: boolean;
  completionPercentage?: number;
  showTips?: boolean;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  question,
  answer,
  isValid,
  completionPercentage = 0,
  showTips = true
}) => {
  // Determine answer status
  const getAnswerStatus = () => {
    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      return { status: 'unanswered', icon: Clock, color: 'gray', message: 'Not answered yet' };
    }
    
    if (isValid) {
      return { 
        status: 'complete', 
        icon: CheckCircle2, 
        color: 'green', 
        message: 'Question completed' 
      };
    }
    
    if (Array.isArray(answer) && answer.length > 0) {
      return { 
        status: 'partial', 
        icon: AlertCircle, 
        color: 'amber', 
        message: 'Partially answered' 
      };
    }
    
    return { 
      status: 'incomplete', 
      icon: AlertCircle, 
      color: 'red', 
      message: 'Answer required' 
    };
  };

  const { status, icon: StatusIcon, color, message } = getAnswerStatus();

  // Question-type specific tips
  const getQuestionTips = () => {
    switch (question.type) {
      case 'checkboxes':
        return {
          title: 'Selection Tips',
          tips: [
            'Select all options that apply to your organization',
            'Consider both current and planned implementations',
            'Be honest about your current capabilities'
          ]
        };
      case 'dual-checkboxes':
        return {
          title: 'Investment Planning',
          tips: [
            'Left column: What you have already invested in',
            'Right column: What you plan to invest in',
            'You can select both for the same area'
          ]
        };
      case 'scale-0-5':
        return {
          title: 'Technology Maturity Scale',
          tips: [
            '0: Not considered or used',
            '1-2: Basic exploration or pilot phase', 
            '3-4: Active implementation or scaling',
            '5: Fully integrated and optimized'
          ]
        };
      case 'tri-state':
        return {
          title: 'Implementation Status',
          tips: [
            'Yes: Fully implemented',
            'Partial: In progress or limited scope',
            'No: Not implemented or considered'
          ]
        };
      default:
        return null;
    }
  };

  const questionTips = getQuestionTips();

  return (
    <div className="space-y-3">
      {/* Answer Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 text-${color}-600`} />
          <span className={`text-sm font-medium text-${color}-800`}>{message}</span>
          {completionPercentage > 0 && (
            <Badge variant="outline" className={`text-xs text-${color}-700`}>
              {Math.round(completionPercentage)}% complete
            </Badge>
          )}
        </div>
        
        {/* Quality indicator based on answer comprehensiveness */}
        {status === 'complete' && Array.isArray(answer) && (
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3 text-blue-600" />
            <span className="text-xs text-blue-600">
              {answer.length > 3 ? 'Comprehensive' : answer.length > 1 ? 'Good coverage' : 'Basic'}
            </span>
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {status === 'incomplete' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm">
            This question requires an answer to continue. Please make at least one selection.
          </AlertDescription>
        </Alert>
      )}

      {status === 'partial' && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            Consider if there are additional options that apply to your organization.
          </AlertDescription>
        </Alert>
      )}

      {/* Question Tips */}
      {showTips && questionTips && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-1">
            <Target className="w-4 h-4" />
            {questionTips.title}
          </h5>
          <ul className="text-xs text-blue-800 space-y-1">
            {questionTips.tips.map((tip, index) => (
              <li key={index}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress encouragement */}
      {status === 'complete' && completionPercentage === 100 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              Great work! This question is fully completed.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationFeedback;