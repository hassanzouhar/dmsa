'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface DualCheckboxProps {
  leftOption: {
    id: string;
    label: string;
    weight?: number;
  };
  rightOption: {
    id: string;
    label: string;
    weight?: number;
  };
  value: {
    left: boolean;
    right: boolean;
  };
  onChange: (value: { left: boolean; right: boolean }) => void;
  disabled?: boolean;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

export function DualCheckbox({ 
  leftOption, 
  rightOption,
  value, 
  onChange, 
  disabled = false,
  className,
  layout = 'vertical'
}: DualCheckboxProps) {
  const handleLeftChange = (checked: boolean) => {
    onChange({ ...value, left: checked });
  };

  const handleRightChange = (checked: boolean) => {
    onChange({ ...value, right: checked });
  };

  const containerClass = layout === 'horizontal' 
    ? "flex flex-col gap-4 sm:flex-row sm:gap-8"
    : "space-y-4";

  return (
    <div className={cn(containerClass, className)}>
      {/* Left checkbox */}
      <div className="flex items-start space-x-3">
        <Checkbox 
          id={leftOption.id}
          checked={value.left}
          onCheckedChange={handleLeftChange}
          disabled={disabled}
          className="mt-0.5"
        />
        <Label 
          htmlFor={leftOption.id}
          className={cn(
            "cursor-pointer text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            value.left && "text-primary font-semibold"
          )}
        >
          {leftOption.label}
        </Label>
      </div>
      
      {/* Right checkbox */}
      <div className="flex items-start space-x-3">
        <Checkbox 
          id={rightOption.id}
          checked={value.right}
          onCheckedChange={handleRightChange}
          disabled={disabled}
          className="mt-0.5"
        />
        <Label 
          htmlFor={rightOption.id}
          className={cn(
            "cursor-pointer text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            value.right && "text-primary font-semibold"
          )}
        >
          {rightOption.label}
        </Label>
      </div>
    </div>
  );
}