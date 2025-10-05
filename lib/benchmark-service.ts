import { SurveySubmission } from '@/types/assessment';

// Benchmark data structure
export interface BenchmarkData {
  sector: string;
  companySize: string;
  region: string;
  sampleSize: number;
  dataSource?: 'exact' | 'sector' | 'global';
  hasSufficientData?: boolean;
  dimensions: {
    [dimensionId: string]: {
      average: number;
      median: number;
      top25: number; // 75th percentile
      top10: number; // 90th percentile
    };
  };
  overall: {
    average: number;
    median: number;
    top25: number;
    top10: number;
  };
  lastUpdated: string;
}

// Industry benchmark data (this would normally come from a database)
// For demo purposes, we'll use realistic benchmark data
const BENCHMARK_DATABASE: Record<string, BenchmarkData> = {
  // Manufacturing sector benchmarks
  'manufacturing-medium': {
    sector: 'manufacturing',
    companySize: 'medium',
    region: 'europe',
    sampleSize: 145,
    dimensions: {
      digitalStrategy: { average: 65, median: 68, top25: 78, top10: 85 },
      digitalReadiness: { average: 58, median: 62, top25: 74, top10: 82 },
      humanCentric: { average: 62, median: 64, top25: 76, top10: 84 },
      dataManagement: { average: 71, median: 73, top25: 81, top10: 88 },
      automation: { average: 54, median: 56, top25: 69, top10: 79 },
      greenDigitalization: { average: 69, median: 72, top25: 80, top10: 86 }
    },
    overall: { average: 63, median: 66, top25: 76, top10: 84 },
    lastUpdated: '2024-12-01'
  },
  'manufacturing-large': {
    sector: 'manufacturing',
    companySize: 'large',
    region: 'europe',
    sampleSize: 89,
    dimensions: {
      digitalStrategy: { average: 72, median: 75, top25: 83, top10: 89 },
      digitalReadiness: { average: 68, median: 71, top25: 81, top10: 87 },
      humanCentric: { average: 70, median: 73, top25: 82, top10: 88 },
      dataManagement: { average: 78, median: 80, top25: 87, top10: 92 },
      automation: { average: 64, median: 67, top25: 78, top10: 85 },
      greenDigitalization: { average: 75, median: 77, top25: 85, top10: 90 }
    },
    overall: { average: 71, median: 74, top25: 83, top10: 88 },
    lastUpdated: '2024-12-01'
  },
  // Services sector benchmarks
  'services-medium': {
    sector: 'services',
    companySize: 'medium',
    region: 'europe',
    sampleSize: 203,
    dimensions: {
      digitalStrategy: { average: 69, median: 72, top25: 81, top10: 87 },
      digitalReadiness: { average: 66, median: 69, top25: 79, top10: 85 },
      humanCentric: { average: 74, median: 76, top25: 84, top10: 89 },
      dataManagement: { average: 68, median: 71, top25: 80, top10: 86 },
      automation: { average: 59, median: 62, top25: 73, top10: 81 },
      greenDigitalization: { average: 72, median: 74, top25: 82, top10: 87 }
    },
    overall: { average: 68, median: 71, top25: 80, top10: 86 },
    lastUpdated: '2024-12-01'
  },
  // Default fallback benchmarks (industry average)
  'default': {
    sector: 'all_sectors',
    companySize: 'all_sizes',
    region: 'europe',
    sampleSize: 850,
    dimensions: {
      digitalStrategy: { average: 66, median: 69, top25: 78, top10: 85 },
      digitalReadiness: { average: 62, median: 65, top25: 76, top10: 83 },
      humanCentric: { average: 68, median: 71, top25: 80, top10: 86 },
      dataManagement: { average: 70, median: 73, top25: 82, top10: 88 },
      automation: { average: 57, median: 60, top25: 72, top10: 81 },
      greenDigitalization: { average: 71, median: 74, top25: 82, top10: 87 }
    },
    overall: { average: 66, median: 69, top25: 78, top10: 85 },
    lastUpdated: '2024-12-01'
  }
};

// Performance comparison result
export interface ComparisonResult {
  userScore: number;
  benchmark: BenchmarkData;
  percentile: number; // User's percentile rank (0-100)
  performanceLevel: 'below_average' | 'average' | 'above_average' | 'top_quartile' | 'top_decile';
  gap: number; // Gap to average (positive = above, negative = below)
  gapToTop25: number; // Gap to top 25%
  message: string;
}

/**
 * Get benchmark data for a specific company profile
 */
export const getBenchmarkData = (
  sector?: string,
  companySize?: string
): BenchmarkData => {
  const MIN_SAMPLE_SIZE = 15;

  const withMetadata = (data: BenchmarkData, source: 'exact' | 'sector' | 'global'): BenchmarkData => ({
    ...data,
    dataSource: source,
    hasSufficientData: source === 'exact' && data.sampleSize >= MIN_SAMPLE_SIZE,
  });

  // Try to find specific benchmark data
  const key = `${sector}-${companySize}`;
  
  if (sector && companySize && BENCHMARK_DATABASE[key]) {
    return withMetadata(BENCHMARK_DATABASE[key], 'exact');
  }
  
  // Fall back to sector-specific data if available
  const sectorKeys = Object.keys(BENCHMARK_DATABASE).filter(k => 
    k.startsWith(sector || '') && k !== 'default'
  );
  
  if (sectorKeys.length > 0) {
    return withMetadata(BENCHMARK_DATABASE[sectorKeys[0]], 'sector');
  }
  
  // Fall back to default benchmarks
  return withMetadata(BENCHMARK_DATABASE['default'], 'global');
};

/**
 * Map survey dimension IDs to benchmark dimension keys
 * All dimension IDs are now harmonized to use spec IDs
 */
const DIMENSION_MAPPING: Record<string, string> = {
  // Spec dimension IDs (no mapping needed, pass through)
  'digitalStrategy': 'digitalStrategy',
  'digitalReadiness': 'digitalReadiness',
  'humanCentric': 'humanCentric',
  'dataManagement': 'dataManagement',
  'automation': 'automation',
  'greenDigitalization': 'greenDigitalization',
};

/**
 * Compare user score against benchmark data
 */
export const compareScore = (
  userScore: number,
  benchmarkData: BenchmarkData,
  dimension?: string
): ComparisonResult => {
  let benchmarkKey = dimension;
  
  // Map dimension ID to benchmark key if needed
  if (dimension && DIMENSION_MAPPING[dimension]) {
    benchmarkKey = DIMENSION_MAPPING[dimension];
  }
  
  const benchmark = benchmarkKey 
    ? benchmarkData.dimensions[benchmarkKey] 
    : benchmarkData.overall;
  
  if (!benchmark) {
    console.warn(`Benchmark data not found for dimension: ${dimension} (mapped to: ${benchmarkKey})`);
    console.warn(`Available dimensions:`, Object.keys(benchmarkData.dimensions));
    throw new Error(`Benchmark data not found for dimension: ${dimension}`);
  }
  
  // Calculate percentile rank (approximate)
  let percentile: number;
  let performanceLevel: ComparisonResult['performanceLevel'];
  
  if (userScore >= benchmark.top10) {
    percentile = 95;
    performanceLevel = 'top_decile';
  } else if (userScore >= benchmark.top25) {
    percentile = 87;
    performanceLevel = 'top_quartile';
  } else if (userScore >= benchmark.median) {
    percentile = 65;
    performanceLevel = 'above_average';
  } else if (userScore >= benchmark.average - 10) {
    percentile = 45;
    performanceLevel = 'average';
  } else {
    percentile = 25;
    performanceLevel = 'below_average';
  }
  
  const gap = userScore - benchmark.average;
  const gapToTop25 = benchmark.top25 - userScore;
  
  // Generate contextual message
  let message: string;
  switch (performanceLevel) {
    case 'top_decile':
      message = `Outstanding performance! You're in the top 10% of organizations.`;
      break;
    case 'top_quartile':
      message = `Excellent performance! You're in the top 25% of organizations.`;
      break;
    case 'above_average':
      message = `Above average performance. You're ahead of most organizations.`;
      break;
    case 'average':
      message = `Average performance. There's room for improvement.`;
      break;
    case 'below_average':
      message = `Below average performance. Consider focusing on this area.`;
      break;
  }
  
  return {
    userScore,
    benchmark: benchmarkData,
    percentile,
    performanceLevel,
    gap: Math.round(gap),
    gapToTop25: Math.max(0, Math.round(gapToTop25)),
    message
  };
};

/**
 * Generate comprehensive benchmark comparison for a survey
 */
export const generateBenchmarkComparison = (surveyData: SurveySubmission) => {
  const benchmarkData = getBenchmarkData(
    surveyData.userDetails?.sector,
    surveyData.userDetails?.companySize
  );
  
  // Overall comparison
  const overallComparison = compareScore(
    surveyData.scores.overall,
    benchmarkData
  );
  
  // Dimension comparisons
  const dimensionComparisons: Record<string, ComparisonResult> = {};
  Object.entries(surveyData.scores.dimensions).forEach(([dimensionId, dimension]) => {
    dimensionComparisons[dimensionId] = compareScore(
      dimension.score,
      benchmarkData,
      dimensionId
    );
  });
  
  // Find strongest and weakest dimensions relative to benchmark
  const dimensionEntries = Object.entries(dimensionComparisons);
  const strongestDimension = dimensionEntries.reduce((prev, curr) => 
    curr[1].gap > prev[1].gap ? curr : prev
  );
  const weakestDimension = dimensionEntries.reduce((prev, curr) => 
    curr[1].gap < prev[1].gap ? curr : prev
  );
  
  return {
    overall: overallComparison,
    dimensions: dimensionComparisons,
    benchmarkData,
    insights: {
      strongest: {
        dimension: strongestDimension[0],
        comparison: strongestDimension[1]
      },
      weakest: {
        dimension: weakestDimension[0],
        comparison: weakestDimension[1]
      }
    },
    summary: {
      aboveAverageCount: dimensionEntries.filter(([, comp]) => comp.gap > 0).length,
      belowAverageCount: dimensionEntries.filter(([, comp]) => comp.gap < 0).length,
      topQuartileCount: dimensionEntries.filter(([, comp]) => comp.performanceLevel === 'top_quartile' || comp.performanceLevel === 'top_decile').length
    }
  };
};

/**
 * Get sector display name
 */
export const getSectorDisplayName = (sector: string): string => {
  const sectorNames: Record<string, string> = {
    manufacturing: 'Manufacturing',
    services: 'Services',
    retail: 'Retail',
    healthcare: 'Healthcare',
    education: 'Education',
    government: 'Government',
    other: 'Other Industries'
  };
  
  return sectorNames[sector] || 'All Sectors';
};

/**
 * Get company size display name
 */
export const getCompanySizeDisplayName = (size: string): string => {
  const sizeNames: Record<string, string> = {
    micro: 'Micro (1-9 employees)',
    small: 'Small (10-49 employees)',
    medium: 'Medium (50-249 employees)',
    large: 'Large (250+ employees)'
  };
  
  return sizeNames[size] || 'All Company Sizes';
};

const benchmarkService = {
  getBenchmarkData,
  compareScore,
  generateBenchmarkComparison,
  getSectorDisplayName,
  getCompanySizeDisplayName
};

export default benchmarkService;
