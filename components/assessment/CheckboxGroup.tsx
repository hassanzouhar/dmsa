'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CheckboxOption {
  id: string;
  label: string;
  weight?: number;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  minSelect?: number;
  maxSelect?: number;
  disabled?: boolean;
  className?: string;
}

export function CheckboxGroup({ 
  options, 
  selected, 
  onChange, 
  minSelect,
  maxSelect,
  disabled = false,
  className 
}: CheckboxGroupProps) {
  const handleChange = (optionId: string, checked: boolean) => {
    if (disabled) return;
    
    let newSelected: string[];
    
    if (checked) {
      // Adding option
      if (maxSelect && selected.length >= maxSelect) {
        return; // Cannot add more
      }
      newSelected = [...selected, optionId];
    } else {
      // Removing option
      newSelected = selected.filter(id => id !== optionId);
    }
    
    onChange(newSelected);
  };

  const isMinimumMet = !minSelect || selected.length >= minSelect;
  const isMaximumReached = maxSelect && selected.length >= maxSelect;

  return (
    <div className={cn("space-y-3", className)}>
      {options.map((option) => {
        const isChecked = selected.includes(option.id);
        const cannotAdd = !isChecked && isMaximumReached;
        const isDisabled = disabled || cannotAdd;
        
        return (
          <div key={option.id} className="flex items-start space-x-3">
            <Checkbox 
              id={option.id}
              checked={isChecked}
              onCheckedChange={(checked) => handleChange(option.id, !!checked)}
              disabled={isDisabled}
              className="mt-0.5"
            />
            <Label 
              htmlFor={option.id}
              className={cn(
                "cursor-pointer text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                isChecked && "text-primary font-semibold",
                isDisabled && !isChecked && "opacity-50"
              )}
            >
              {option.label}
            </Label>
          </div>
        );
      })}
      
      {/* Validation hints */}
      <div className="text-xs text-muted-foreground space-y-1">
        {minSelect && !isMinimumMet && (
          <p className="text-amber-600">
            Minimum {minSelect} alternativ{minSelect !== 1 ? 'er' : ''} må velges
          </p>
        )}
        
        {maxSelect && (
          <p>
            Maksimum {maxSelect} alternativ{maxSelect !== 1 ? 'er' : ''} kan velges
            {isMaximumReached && " (maksimum nådd)"}
          </p>
        )}
      </div>
    </div>
  );
}