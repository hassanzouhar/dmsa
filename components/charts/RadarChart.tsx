'use client';

import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RadarDataPoint {
  dimension: string;
  score: number;
  target?: number;
  fullMark: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  className?: string;
  showTarget?: boolean;
  title?: string;
  description?: string;
}

export function RadarChart({ 
  data, 
  className,
  showTarget = false,
  title = "Digital Modenhet Vurdering",
  description = "Din bedrifts digitale modenhet på tvers av 6 dimensjoner"
}: RadarChartProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RechartsRadarChart data={data} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
            <PolarGrid />
            <PolarAngleAxis 
              dataKey="dimension" 
              className="text-sm"
              tick={{ fontSize: 12, fill: '#374151' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              tickCount={6}
            />
            <Radar
              name="Din Score"
              dataKey="score"
              stroke="#2563eb"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            />
            {showTarget && (
              <Radar
                name="Målsetting"
                dataKey="target"
                stroke="#10b981"
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              formatter={(value: number, name: string) => [
                `${Math.round(value)}%`,
                name
              ]}
              labelFormatter={(label) => `${label}`}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                fontSize: '14px'
              }}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
        
        {/* Legend explanation */}
        <div className="mt-4 text-xs text-gray-600 space-y-1">
          <p><span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2 opacity-30"></span>
             Din nåværende digitale modenhet</p>
          {showTarget && (
            <p><span className="inline-block w-3 h-0.5 bg-green-500 mr-2"></span>
               Målsetting for digital modenhet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}