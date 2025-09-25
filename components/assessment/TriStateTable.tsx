'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TableRow {
  id: string;
  label: string;
  description?: string;
}

interface TriStateTableProps {
  rows: TableRow[];
  labels: {
    yes: string;
    partial: string;
    no: string;
  };
  value: Record<string, 'yes' | 'partial' | 'no'>;
  onChange: (value: Record<string, 'yes' | 'partial' | 'no'>) => void;
  disabled?: boolean;
  className?: string;
}

export function TriStateTable({
  rows,
  labels,
  value = {},
  onChange,
  disabled = false,
  className
}: TriStateTableProps) {
  const handleChange = (rowId: string, triValue: 'yes' | 'partial' | 'no') => {
    if (disabled) return;
    
    onChange({
      ...(value || {}),
      [rowId]: triValue
    });
  };

  const stateOptions: Array<{ value: 'yes' | 'partial' | 'no'; label: string; colorClass: string }> = [
    { value: 'no', label: labels.no, colorClass: 'text-red-600' },
    { value: 'partial', label: labels.partial, colorClass: 'text-amber-600' },
    { value: 'yes', label: labels.yes, colorClass: 'text-green-600' },
  ];

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left p-3 font-medium text-sm text-gray-700 bg-gray-50 min-w-[250px]">
              Miljøpraksis
            </th>
            {stateOptions.map((option) => (
              <th 
                key={option.value}
                className={cn(
                  "text-center p-3 font-medium text-sm bg-gray-50 min-w-[100px]",
                  option.colorClass
                )}
              >
                {option.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowValue = value[row.id];
            
            return (
              <tr 
                key={row.id} 
                className="border-b border-gray-100 hover:bg-gray-25 transition-colors"
              >
                <td className="p-3">
                  <div>
                    <div className="text-sm font-medium leading-relaxed">
                      {row.label}
                    </div>
                    {row.description && (
                      <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {row.description}
                      </div>
                    )}
                  </div>
                </td>
                {stateOptions.map((option) => (
                  <td key={option.value} className="p-3 text-center">
                    <RadioGroup
                      value={rowValue}
                      onValueChange={(val) => handleChange(row.id, val as 'yes' | 'partial' | 'no')}
                      disabled={disabled}
                      className="flex justify-center"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem
                          value={option.value}
                          id={`${row.id}-${option.value}`}
                          className={cn(
                            "w-4 h-4",
                            rowValue === option.value && option.colorClass,
                            rowValue === option.value && "border-current"
                          )}
                          disabled={disabled}
                        />
                        <Label 
                          htmlFor={`${row.id}-${option.value}`}
                          className="sr-only"
                        >
                          {row.label} - {option.label}
                        </Label>
                      </div>
                    </RadioGroup>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Progress indicator */}
      <div className="mt-4 space-y-2">
        <div className="text-xs text-gray-600">
          {Object.keys(value || {}).filter(k => value && value[k] !== undefined).length} av {rows.length} praksiser har vurdering
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-green-700">{labels.yes}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-amber-700">{labels.partial}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-red-700">{labels.no}</span>
          </span>
        </div>
      </div>
    </div>
  );
}