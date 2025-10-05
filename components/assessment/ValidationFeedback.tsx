'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Question } from '@/types/assessment';

interface ValidationFeedbackProps {
  question: Question;
  isRequired: boolean;
  hasAnswer: boolean;
  isComplete: boolean;
  completionPercentage?: number;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  question,
  isRequired,
  hasAnswer,
  isComplete,
  completionPercentage = 0
}) => {
  if (!isRequired) return null;
  if (!hasAnswer) return null;
  if (isComplete) return null;

  const getMessage = () => {
    switch (question.type) {
      case 'checkboxes':
      case 'dual-checkboxes':
        return 'Velg minst ett alternativ for å fullføre spørsmålet.';
      case 'scale-0-5':
      case 'tri-state':
        return 'Velg ett av alternativene før du går videre.';
      case 'table-dual-checkboxes':
        return 'Huk av minst ett område for å fullføre spørsmålet.';
      case 'scale-table':
      case 'tri-state-table':
        return 'Svar på alle underpunktene for å fullføre spørsmålet.';
      default:
        return 'Fullfør dette spørsmålet før du går videre.';
    }
  };

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 text-sm">
        {getMessage()}
        {completionPercentage > 0 && completionPercentage < 100 && (
          <span className="block mt-1 text-xs text-amber-700">
            Du har besvart omtrent {Math.round(completionPercentage)}% av spørsmålet.
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ValidationFeedback;
