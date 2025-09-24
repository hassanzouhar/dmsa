'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface TableRow {
  id: string;
  label: string;
  leftWeight?: number;
  rightWeight?: number;
}

interface TableDualCheckboxProps {
  rows: TableRow[];
  leftColumnLabel: string;
  rightColumnLabel: string;
  value: Record<string, { left: boolean; right: boolean }>;
  onChange: (value: Record<string, { left: boolean; right: boolean }>) => void;
  disabled?: boolean;
  className?: string;
}

export function TableDualCheckbox({
  rows,
  leftColumnLabel,
  rightColumnLabel,
  value,
  onChange,
  disabled = false,
  className
}: TableDualCheckboxProps) {
  const handleChange = (rowId: string, column: 'left' | 'right', checked: boolean) => {
    if (disabled) return;
    
    const currentRowValue = value[rowId] || { left: false, right: false };
    const newRowValue = { ...currentRowValue, [column]: checked };
    
    onChange({
      ...value,
      [rowId]: newRowValue
    });
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left p-3 font-medium text-sm text-gray-700 bg-gray-50">
              Forretningsområde
            </th>
            <th className="text-center p-3 font-medium text-sm text-gray-700 bg-gray-50 min-w-[140px]">
              {leftColumnLabel}
            </th>
            <th className="text-center p-3 font-medium text-sm text-gray-700 bg-gray-50 min-w-[140px]">
              {rightColumnLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowValue = value[row.id] || { left: false, right: false };
            
            return (
              <tr 
                key={row.id} 
                className="border-b border-gray-100 hover:bg-gray-25 transition-colors"
              >
                <td className="p-3 text-sm leading-relaxed">
                  {row.label}
                </td>
                <td className="p-3 text-center">
                  <Checkbox
                    id={`${row.id}-left`}
                    checked={rowValue.left}
                    onCheckedChange={(checked) => handleChange(row.id, 'left', !!checked)}
                    disabled={disabled}
                    className="mx-auto"
                  />
                </td>
                <td className="p-3 text-center">
                  <Checkbox
                    id={`${row.id}-right`}
                    checked={rowValue.right}
                    onCheckedChange={(checked) => handleChange(row.id, 'right', !!checked)}
                    disabled={disabled}
                    className="mx-auto"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Progress indicator */}
      <div className="mt-4 text-xs text-gray-600">
        {Object.values(value).filter(v => v.left || v.right).length} av {rows.length} områder har svar
      </div>
    </div>
  );
}