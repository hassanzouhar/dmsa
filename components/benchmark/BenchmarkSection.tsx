'use client';

import React, { useState } from 'react';
import { CompanyDetails, DimensionScore } from '@/types/firestore-schema';
import { 
  generateBenchmarkComparison, 
  getSectorDisplayName, 
  getCompanySizeDisplayName 
} from '@/lib/benchmark-service';
import BenchmarkChart from './BenchmarkChart';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface BenchmarkSectionProps {
  company: CompanyDetails;
  dimensions: Record<string, DimensionScore>;
  overallScore: number;
}

const BenchmarkSection: React.FC<BenchmarkSectionProps> = ({ company, dimensions, overallScore }) => {
  const [showDimensionDetails, setShowDimensionDetails] = useState(false);
  
  // Create surveyData-like object for compatibility with existing benchmark service
  const surveyDataCompat = {
    id: 'temp',
    version: 'v1.0',
    language: 'no',
    timestamp: new Date().toISOString(),
    answers: {},
    scores: {
      dimensions,
      overall: overallScore,
      maturityClassification: {
        level: 1,
        label: 'Basic',
        band: 'basic'
      }
    },
    userDetails: {
      companySize: company.companySize,
      sector: company.sector
    }
  };
  
  // Generate benchmark comparison
  const benchmarkComparison = generateBenchmarkComparison(surveyDataCompat);
  const { overall, dimensions: dimensionComparisons, benchmarkData, insights, summary } = benchmarkComparison;

  // Dimension names mapping
  const dimensionNames: Record<string, string> = {
    digitalStrategy: 'Digital Business Strategy',
    digitalReadiness: 'Digital Readiness',
    humanCentric: 'Human-Centric Digitalization',
    dataManagement: 'Data Management',
    automation: 'Automation and AI',
    greenDigitalization: 'Green Digitalization'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          Benchmark Comparison
          <HelpTooltip content="See how your digital maturity scores compare against similar organizations in your sector and size category." />
        </h2>
        <p className="text-gray-600">
          Compared against {getSectorDisplayName(benchmarkData.sector)} sector, {getCompanySizeDisplayName(benchmarkData.companySize)} companies
        </p>
        <p className="text-sm text-gray-500">
          Based on {benchmarkData.sampleSize} organizations • Updated {new Date(benchmarkData.lastUpdated).toLocaleDateString()}
        </p>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Performance Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-blue-700">Above Average:</span>
              <span className="font-semibold text-blue-900">{summary.aboveAverageCount}/6 dimensions</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Top Quartile:</span>
              <span className="font-semibold text-blue-900">{summary.topQuartileCount}/6 dimensions</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Strongest Area</h3>
          <div className="space-y-1">
            <div className="font-semibold text-green-900">
              {dimensionNames[insights.strongest.dimension]}
            </div>
            <div className="text-green-700 text-sm">
              {insights.strongest.comparison.gap > 0 ? '+' : ''}{insights.strongest.comparison.gap} points vs average
            </div>
            <div className="text-green-600 text-xs">
              {insights.strongest.comparison.message}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-2">Growth Opportunity</h3>
          <div className="space-y-1">
            <div className="font-semibold text-orange-900">
              {dimensionNames[insights.weakest.dimension]}
            </div>
            <div className="text-orange-700 text-sm">
              {insights.weakest.comparison.gap > 0 ? '+' : ''}{insights.weakest.comparison.gap} points vs average
            </div>
            {insights.weakest.comparison.gapToTop25 > 0 && (
              <div className="text-orange-600 text-xs">
                {insights.weakest.comparison.gapToTop25} points to top 25%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overall Performance Chart */}
      <div>
        <BenchmarkChart 
          title="Overall Digital Maturity" 
          comparison={overall}
          showDetails={true}
        />
      </div>

      {/* Dimension Breakdown Toggle */}
      <div className="border-t border-gray-200 pt-6">
        <button
          onClick={() => setShowDimensionDetails(!showDimensionDetails)}
          className="flex items-center justify-center w-full gap-2 p-4 text-lg font-semibold text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span>Dimension Breakdown</span>
          {showDimensionDetails ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {showDimensionDetails && (
          <div className="mt-6 space-y-6">
            {Object.entries(dimensionComparisons).map(([dimensionId, comparison]) => (
              <BenchmarkChart
                key={dimensionId}
                title={dimensionNames[dimensionId]}
                comparison={comparison}
                showDetails={false}
              />
            ))}
            
            {/* Action-Prioritized Insights */}
            <div className="space-y-6">
              {/* High-Impact Improvements */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                  🎯 Priority Actions (High Impact)
                </h3>
                <div className="space-y-3">
                  {Object.entries(dimensionComparisons)
                    .filter(([, comp]) => comp.gap < -15) // Large gaps
                    .sort(([, a], [, b]) => a.gap - b.gap)
                    .slice(0, 2)
                    .map(([dimensionId, comp]) => (
                      <div key={dimensionId} className="bg-white rounded-lg p-4 border border-red-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-red-800">{dimensionNames[dimensionId]}</h4>
                          <Badge className="bg-red-100 text-red-800">
                            {Math.abs(comp.gap)} points below average
                          </Badge>
                        </div>
                        <p className="text-sm text-red-700 mb-2">
                          This dimension is significantly underperforming compared to peers in your sector.
                        </p>
                        <div className="text-xs text-red-600">
                          <strong>Potential ROI:</strong> High - Closing this gap could improve overall score by {Math.round(Math.abs(comp.gap) / 6)} points
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Quick Wins */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                  ⚡ Quick Wins (Medium Impact, Low Effort)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(dimensionComparisons)
                    .filter(([, comp]) => comp.gap >= -15 && comp.gap < 0) // Moderate gaps
                    .sort(([, a], [, b]) => b.gap - a.gap) // Easiest first
                    .map(([dimensionId, comp]) => (
                      <div key={dimensionId} className="bg-white rounded-lg p-3 border border-amber-100">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-amber-800">{dimensionNames[dimensionId]}</h4>
                          <Badge variant="outline" className="text-xs text-amber-700">
                            {Math.abs(comp.gap)} points gap
                          </Badge>
                        </div>
                        <p className="text-xs text-amber-700">
                          {comp.gapToTop25 < 10 ? 'Close to top 25% - achievable target' : 'Moderate improvement needed'}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Strengths to Leverage */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                  🏆 Leverage Your Strengths
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(dimensionComparisons)
                    .filter(([, comp]) => comp.gap > 0)
                    .sort(([, a], [, b]) => b.gap - a.gap)
                    .map(([dimensionId, comp]) => (
                      <div key={dimensionId} className="bg-white rounded-lg p-3 border border-green-100">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-green-800">{dimensionNames[dimensionId]}</h4>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            +{comp.gap} points ahead
                          </Badge>
                        </div>
                        <p className="text-xs text-green-700">
                          Use this strength to support improvements in other dimensions
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Strategic Roadmap */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  🗺️ 90-Day Action Roadmap
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-2">Days 1-30: Assessment & Planning</h4>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Conduct detailed audit of priority dimensions</li>
                      <li>• Identify specific improvement initiatives</li>
                      <li>• Secure stakeholder buy-in and resources</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-2">Days 31-60: Quick Wins</h4>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Implement low-effort, high-impact changes</li>
                      <li>• Begin training and capability building</li>
                      <li>• Establish measurement and tracking systems</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-2">Days 61-90: Scale & Measure</h4>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Scale successful initiatives</li>
                      <li>• Begin complex transformation projects</li>
                      <li>• Plan next assessment cycle (T1)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Call-to-Action */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-center text-white">
        <h3 className="text-xl font-bold mb-2">Want Detailed Improvement Strategies?</h3>
        <p className="mb-4 opacity-90">
          Get a comprehensive report with specific recommendations to close your performance gaps 
          and advance to the top quartile in your industry.
        </p>
        <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
          Request Professional Assessment
        </button>
      </div>
    </div>
  );
};

export default BenchmarkSection;