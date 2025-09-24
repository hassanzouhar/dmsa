'use client';

import { Question, Answer } from '@/src/types/assessment';
import { useAssessmentStore } from '@/src/store/assessment';
import { TriState } from './TriState';
import { LikertScale05 } from './LikertScale05';
import { CheckboxGroup } from './CheckboxGroup';
import { DualCheckbox } from './DualCheckbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface QuestionRendererProps {
  question: Question;
  className?: string;
  showRequired?: boolean;
  disabled?: boolean;
}

export function QuestionRenderer({ 
  question, 
  className,
  showRequired = true,
  disabled = false
}: QuestionRendererProps) {
  const { t } = useTranslation();
  const answer = useAssessmentStore(s => s.answers[question.id]);
  const setAnswer = useAssessmentStore(s => s.setAnswer);
  
  const isRequired = question.required !== false;
  const hasAnswer = !!answer;

  const handleTriStateChange = (value: 'yes' | 'partial' | 'no') => {
    setAnswer(question.id, { type: 'tri-state', value });
  };

  const handleScaleChange = (value: number) => {
    setAnswer(question.id, { type: 'scale-0-5', value });
  };

  const handleCheckboxChange = (selected: string[]) => {
    setAnswer(question.id, { type: 'checkboxes', selected });
  };

  const handleDualCheckboxChange = (value: { left: boolean; right: boolean }) => {
    setAnswer(question.id, { type: 'dual-checkboxes', left: value.left, right: value.right });
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'tri-state': {
        const triStateAnswer = answer as Extract<Answer, { type: 'tri-state' }> | undefined;
        return (
          <TriState
            value={triStateAnswer?.value}
            onChange={handleTriStateChange}
            labels={{
              yes: t('ui.yes', 'Ja'),
              partial: t('ui.partial', 'Delvis'),
              no: t('ui.no', 'Nei')
            }}
            disabled={disabled}
          />
        );
      }

      case 'scale-0-5': {
        const scaleAnswer = answer as Extract<Answer, { type: 'scale-0-5' }> | undefined;
        return (
          <LikertScale05
            value={scaleAnswer?.value}
            onChange={handleScaleChange}
            labels={{
              min: t('ui.scale.min', 'Ikke i det hele tatt'),
              max: t('ui.scale.max', 'I meget stor grad')
            }}
            disabled={disabled}
          />
        );
      }

      case 'checkboxes': {
        const checkboxAnswer = answer as Extract<Answer, { type: 'checkboxes' }> | undefined;
        const checkboxQuestion = question as Extract<Question, { type: 'checkboxes' }>;
        
        return (
          <CheckboxGroup
            options={checkboxQuestion.options.map(opt => ({
              id: opt.id,
              label: t(opt.label, opt.label),
              weight: opt.weight
            }))}
            selected={checkboxAnswer?.selected || []}
            onChange={handleCheckboxChange}
            minSelect={checkboxQuestion.minSelect}
            maxSelect={checkboxQuestion.maxSelect}
            disabled={disabled}
          />
        );
      }

      case 'dual-checkboxes': {
        const dualAnswer = answer as Extract<Answer, { type: 'dual-checkboxes' }> | undefined;
        const dualQuestion = question as Extract<Question, { type: 'dual-checkboxes' }>;
        
        return (
          <DualCheckbox
            leftOption={{
              id: dualQuestion.options.left.id,
              label: t(dualQuestion.options.left.label, dualQuestion.options.left.label),
              weight: dualQuestion.options.left.weight
            }}
            rightOption={{
              id: dualQuestion.options.right.id,
              label: t(dualQuestion.options.right.label, dualQuestion.options.right.label),
              weight: dualQuestion.options.right.weight
            }}
            value={{
              left: dualAnswer?.left || false,
              right: dualAnswer?.right || false
            }}
            onChange={handleDualCheckboxChange}
            disabled={disabled}
          />
        );
      }

      default:
        return (
          <div className="text-muted-foreground italic">
            Ukjent spørsmålstype: {(question as any).type}
          </div>
        );
    }
  };

  return (
    <Card className={cn("transition-colors", hasAnswer && "border-primary/20", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-lg leading-relaxed">
              {t(question.title, question.title)}
            </CardTitle>
            {question.description && (
              <CardDescription className="text-sm leading-relaxed">
                {t(question.description, question.description)}
              </CardDescription>
            )}
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            {showRequired && isRequired && (
              <Badge variant={hasAnswer ? "default" : "secondary"} className="text-xs">
                {hasAnswer ? t('ui.answered', 'Besvart') : t('ui.required', 'Påkrevd')}
              </Badge>
            )}
            {hasAnswer && (
              <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                ✓
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {renderQuestionInput()}
      </CardContent>
    </Card>
  );
}