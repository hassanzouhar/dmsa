'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LikertScale05Props {
  value?: number;
  onChange: (value: number) => void;
  labels?: {
    min?: string;
    max?: string;
  };
  disabled?: boolean;
  className?: string;
}

const SCALE_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

export function LikertScale05({ 
  value, 
  onChange, 
  labels = {},
  disabled = false,
  className 
}: LikertScale05Props) {
  const { min = '0', max = '5' } = labels;

  return (
    <div className={cn("space-y-4", className)}>
      <RadioGroup 
        value={value?.toString()} 
        onValueChange={(v) => onChange(parseInt(v, 10))} 
        className="flex flex-col gap-3 sm:flex-row sm:gap-4"
        disabled={disabled}
      >
        {SCALE_OPTIONS.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem 
              value={option.toString()} 
              id={`scale-${option}`} 
              disabled={disabled}
              className={cn(
                "transition-colors",
                value === option && "border-primary text-primary"
              )}
            />
            <Label 
              htmlFor={`scale-${option}`}
              className={cn(
                "cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 min-w-[24px] text-center",
                value === option && "text-primary font-semibold"
              )}
            >
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      {(min || max) && (
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}