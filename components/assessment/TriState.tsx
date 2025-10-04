'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TriStateProps {
  value?: 'yes' | 'partial' | 'no';
  onChange: (value: 'yes' | 'partial' | 'no') => void;
  labels: {
    yes: string;
    partial: string;
    no: string;
  };
  disabled?: boolean;
  className?: string;
}

export function TriState({ 
  value, 
  onChange, 
  labels, 
  disabled = false,
  className 
}: TriStateProps) {
  return (
    <RadioGroup 
      value={value || ''} 
      onValueChange={(v) => onChange(v as 'yes' | 'partial' | 'no')} 
      className={cn("flex flex-col gap-3 sm:flex-row sm:gap-6", className)}
      disabled={disabled}
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem 
          value="yes" 
          id="yes" 
          disabled={disabled}
          className="text-green-600 focus-visible:ring-green-600" 
        />
        <Label 
          htmlFor="yes"
          className={cn(
            "cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            value === 'yes' && "text-green-700 font-semibold"
          )}
        >
          {labels.yes}
        </Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <RadioGroupItem 
          value="partial" 
          id="partial" 
          disabled={disabled}
          className="text-amber-600 focus-visible:ring-amber-600" 
        />
        <Label 
          htmlFor="partial"
          className={cn(
            "cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            value === 'partial' && "text-amber-700 font-semibold"
          )}
        >
          {labels.partial}
        </Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <RadioGroupItem 
          value="no" 
          id="no" 
          disabled={disabled}
          className="text-red-600 focus-visible:ring-red-600" 
        />
        <Label 
          htmlFor="no"
          className={cn(
            "cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            value === 'no' && "text-red-700 font-semibold"
          )}
        >
          {labels.no}
        </Label>
      </div>
    </RadioGroup>
  );
}