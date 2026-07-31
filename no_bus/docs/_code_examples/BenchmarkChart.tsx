'use client';

import React from 'react';
import { ComparisonResult } from '@/lib/benchmark-service';
import { HelpTooltip } from '@/components/ui/help-tooltip';

interface BenchmarkChartProps {
  title: string;
  comparison: ComparisonResult;
  showDetails?: boolean;
}

const BenchmarkChart: React.FC<BenchmarkChartProps> = ({ 
  title, 
  comparison, 
  showDetails = true 
}) => {
  const { userScore, benchmark, performanceLevel, gap, percentile } = comparison;
  const dataSource = benchmark.dataSource || 'exact';
  const hasSufficientData = benchmark.hasSufficientData ?? (benchmark.sampleSize ?? 0) >= 15;
  const isFallback = dataSource !== 'exact';
  const showProvisionalNotice = isFallback || !hasSufficientData;

  // Color scheme based on performance level
  const getPerformanceColor = (level: ComparisonResult['performanceLevel']) => {
    switch (level) {
      case 'top_decile':
        return 'bg-emerald-500';
      case 'top_quartile':
        return 'bg-green-500';
      case 'above_average':
        return 'bg-blue-500';
      case 'average':
        return 'bg-yellow-500';
      case 'below_average':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  };
  
  const getPerformanceLabel = (level: ComparisonResult['performanceLevel']) => {
    switch (level) {
      case 'top_decile':
        return 'Top 10%';
      case 'top_quartile':
        return 'Top 25%';
      case 'above_average':
        return 'Above Average';
      case 'average':
        return 'Average';
      case 'below_average':
        return 'Below Average';
      default:
        return 'Unknown';
    }
  };

  // Calculate bar positions (percentage of 100)
  const userPosition = Math.min(100, Math.max(0, userScore));
  const averagePosition = Math.min(100, Math.max(0, benchmark.overall.average));
  const top25Position = Math.min(100, Math.max(0, benchmark.overall.top25));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {title}
          <HelpTooltip content="Compare your performance against industry benchmarks based on your sector and company size." />
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getPerformanceColor(performanceLevel)}`}>
            {getPerformanceLabel(performanceLevel)}
          </span>
          <span className="text-sm text-gray-600">
            {percentile}th percentile
          </span>
          {showProvisionalNotice && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              Foreløpige tall – vi trenger flere datapunkter i din kategori
            </span>
          )}
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="relative">
        {/* Background bar */}
        <div className="w-full h-8 bg-gray-100 rounded-lg relative overflow-hidden">
          
          {/* Benchmark markers */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
            style={{ left: `${averagePosition}%` }}
            title={`Industry Average: ${benchmark.overall.average}`}
          />
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-600 z-10"
            style={{ left: `${top25Position}%` }}
            title={`Top 25%: ${benchmark.overall.top25}`}
          />
          
          {/* User score bar */}
          <div 
            className={`absolute top-0 bottom-0 ${getPerformanceColor(performanceLevel)} rounded-lg transition-all duration-500 ease-out`}
            style={{ width: `${userPosition}%` }}
          />
          
          {/* User score indicator */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-gray-900 z-20 rounded-full"
            style={{ left: `${userPosition}%`, transform: 'translateX(-50%)' }}
          />
        </div>

        {/* Score labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
            <span>Your Score: {userScore}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-gray-400"></div>
            <span>Average: {benchmark.overall.average}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-gray-600"></div>
            <span>Top 25%: {benchmark.overall.top25}</span>
          </div>
        </div>
      </div>

      {/* Performance message and details */}
      {showDetails && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-2">
            {comparison.message}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900">Gap to Average:</span>
              <span className={`ml-2 ${gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {gap > 0 ? '+' : ''}{gap} points
              </span>
            </div>
            
            {comparison.gapToTop25 > 0 && (
              <div>
                <span className="font-medium text-gray-900">To Top 25%:</span>
                <span className="ml-2 text-blue-600">
                  {comparison.gapToTop25} points
                </span>
              </div>
            )}
            
            <div>
              <span className="font-medium text-gray-900">Datagrunnlag:</span>
              {showProvisionalNotice ? (
                <span className="ml-2 text-amber-600">
                  Ikke nok svar for ditt segment ennå – viser midlertidige referansetall
                </span>
              ) : (
                <span className="ml-2 text-gray-600">
                  Basert på {benchmark.sampleSize?.toLocaleString('no-NO') ?? '—'} organisasjoner
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchmarkChart;
