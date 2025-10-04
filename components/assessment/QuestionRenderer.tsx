'use client';

import { Question, Answer } from '@/types/assessment';
import { useAssessmentStore } from '@/store/assessment';
import { TriState } from './TriState';
import { LikertScale05 } from './LikertScale05';
import { CheckboxGroup } from './CheckboxGroup';
import { DualCheckbox } from './DualCheckbox';
import { TableDualCheckbox } from './TableDualCheckbox';
import { ScaleTable } from './ScaleTable';
import { TriStateTable } from './TriStateTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ValidationFeedback } from './ValidationFeedback';

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
  
  // Calculate answer validation and completion
  const isAnswerValid = () => {
    if (!answer) return false;
    if ('selected' in answer) return answer.selected && answer.selected.length > 0;
    if ('value' in answer) return answer.value !== undefined && answer.value !== null;
    if ('left' in answer || 'right' in answer) return answer.left || answer.right;
    if ('rows' in answer) {
      const rows = answer.rows as Record<string, any>;
      return Object.keys(rows).length > 0;
    }
    return true;
  };
  
  const getCompletionPercentage = () => {
    if (!answer) return 0;
    if ('selected' in answer) {
      const totalOptions = question.type === 'checkboxes' && 'options' in question ? question.options.length : 1;
      const selected = answer.selected as string[];
      return Math.min(100, (selected.length / Math.max(1, totalOptions * 0.3)) * 100);
    }
    return isAnswerValid() ? 100 : 0;
  };

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

  const handleTableDualCheckboxChange = (rows: Record<string, { left: boolean; right: boolean }>) => {
    setAnswer(question.id, { type: 'table-dual-checkboxes', rows });
  };

  const handleScaleTableChange = (rows: Record<string, number>) => {
    setAnswer(question.id, { type: 'scale-table', rows });
  };

  const handleTriStateTableChange = (rows: Record<string, 'yes' | 'partial' | 'no'>) => {
    setAnswer(question.id, { type: 'tri-state-table', rows });
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

      case 'table-dual-checkboxes': {
        const tableAnswer = answer as Extract<Answer, { type: 'table-dual-checkboxes' }> | undefined;
        const tableQuestion = question as Extract<Question, { type: 'table-dual-checkboxes' }>;
        
        return (
          <TableDualCheckbox
            rows={tableQuestion.rows.map(row => ({
              id: row.id,
              label: t(row.label, row.label)
            }))}
            leftColumnLabel={t(tableQuestion.columns.left.label, tableQuestion.columns.left.label)}
            rightColumnLabel={t(tableQuestion.columns.right.label, tableQuestion.columns.right.label)}
            value={tableAnswer?.rows || {}}
            onChange={handleTableDualCheckboxChange}
            disabled={disabled}
          />
        );
      }

      case 'scale-table': {
        const scaleTableAnswer = answer as Extract<Answer, { type: 'scale-table' }> | undefined;
        const scaleTableQuestion = question as Extract<Question, { type: 'scale-table' }>;
        
        return (
          <ScaleTable
            rows={scaleTableQuestion.rows.map(row => ({
              id: row.id,
              label: t(row.label, row.label)
            }))}
            scaleLabels={scaleTableQuestion.scaleLabels.map(label => t(label, label))}
            value={scaleTableAnswer?.rows || {}}
            onChange={handleScaleTableChange}
            disabled={disabled}
          />
        );
      }

      case 'tri-state-table': {
        const triStateTableAnswer = answer as Extract<Answer, { type: 'tri-state-table' }> | undefined;
        const triStateTableQuestion = question as Extract<Question, { type: 'tri-state-table' }>;
        
        return (
          <TriStateTable
            rows={triStateTableQuestion.rows.map(row => ({
              id: row.id,
              label: t(row.label, row.label)
            }))}
            labels={{
              yes: t(triStateTableQuestion.triLabels.yes, 'Ja'),
              partial: t(triStateTableQuestion.triLabels.partial, 'Delvis'),
              no: t(triStateTableQuestion.triLabels.no, 'Nei')
            }}
            value={triStateTableAnswer?.rows || {}}
            onChange={handleTriStateTableChange}
            disabled={disabled}
          />
        );
      }

      default:
        return (
          <div className="text-muted-foreground italic">
            Ukjent spørsmålstype: {(question as { type: string }).type}
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
        
        {/* Validation Feedback */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <ValidationFeedback
            question={question}
            answer={answer}
            isValid={isAnswerValid()}
            completionPercentage={getCompletionPercentage()}
            showTips={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}