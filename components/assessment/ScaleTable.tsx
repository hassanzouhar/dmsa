'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TableRow {
  id: string;
  label: string;
  description?: string;
}

interface ScaleTableProps {
  rows: TableRow[];
  scaleLabels: string[]; // Should be 6 items: [0, 1, 2, 3, 4, 5]
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
  disabled?: boolean;
  className?: string;
}

export function ScaleTable({
  rows,
  scaleLabels,
  value = {},
  onChange,
  disabled = false,
  className
}: ScaleTableProps) {
  const handleChange = (rowId: string, scaleValue: number) => {
    if (disabled) return;
    
    onChange({
      ...(value || {}),
      [rowId]: scaleValue
    });
  };

  // Ensure we have exactly 6 scale labels (0-5)
  const scales = scaleLabels.slice(0, 6);
  while (scales.length < 6) {
    scales.push(`${scales.length}`);
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left p-3 font-medium text-sm text-gray-700 bg-gray-50 min-w-[200px]">
              Teknologi
            </th>
            {scales.map((label, index) => (
              <th 
                key={index}
                className="text-center p-2 font-medium text-xs text-gray-700 bg-gray-50 min-w-[80px]"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold">{index}</span>
                  <span className="font-normal leading-tight">{label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const rowValue = value[row.id];

            return (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-gray-100 transition-colors",
                  rowIndex % 2 === 0 && "bg-gray-50/50"
                )}
              >
                <td className="p-3 text-left">
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
                {scales.map((_, index) => {
                  const isSelected = rowValue === index;
                  return (
                    <td
                      key={index}
                      className={cn(
                        "p-2 text-center cursor-pointer transition-all relative",
                        "hover:bg-gray-100",
                        isSelected && "bg-primary/20",
                        !isSelected && "bg-transparent"
                      )}
                      onClick={() => !disabled && handleChange(row.id, index)}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 border-2 border-primary rounded pointer-events-none" />
                      )}
                      <RadioGroup
                        value={rowValue?.toString() || ''}
                        onValueChange={(val) => handleChange(row.id, parseInt(val, 10))}
                        disabled={disabled}
                        className="flex justify-center pointer-events-none"
                      >
                        <div className="flex items-center">
                          <RadioGroupItem
                            value={index.toString()}
                            id={`${row.id}-${index}`}
                            className="w-4 h-4"
                            disabled={disabled}
                          />
                          <Label
                            htmlFor={`${row.id}-${index}`}
                            className="sr-only"
                          >
                            {row.label} - {scales[index]}
                          </Label>
                        </div>
                      </RadioGroup>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Progress and legend */}
      <div className="mt-4 space-y-2">
        <div className="text-xs text-gray-600">
          {Object.keys(value || {}).filter(k => value && value[k] !== undefined).length} av {rows.length} teknologier har vurdering
        </div>
        <div className="text-xs text-gray-500 leading-relaxed">
          <strong>Skala:</strong> 0 = {scales[0]}, 1 = {scales[1]}, 2 = {scales[2]}, 
          3 = {scales[3]}, 4 = {scales[4]}, 5 = {scales[5]}
        </div>
      </div>
    </div>
  );
}