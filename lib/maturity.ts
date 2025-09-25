import { MaturityBand, DimensionScore } from '@/types/assessment';

/**
 * Default maturity classification bands
 * Based on EU/JRC Digital Maturity Assessment levels (0-100 scale)
 */
export const defaultMaturityBands: MaturityBand[] = [
  { min: 0, max: 25, labelKey: 'maturity.level1', level: 1 },   // Basic
  { min: 26, max: 50, labelKey: 'maturity.level2', level: 2 },  // Average
  { min: 51, max: 75, labelKey: 'maturity.level3', level: 3 },  // Moderately Advanced
  { min: 76, max: 100, labelKey: 'maturity.level4', level: 4 }, // Advanced
];

/**
 * Classify a score into a maturity band
 * @param score - Score (0-100)
 * @param bands - Custom maturity bands (optional)
 * @returns Matching maturity band
 */
export function classify(score: number, bands: MaturityBand[] = defaultMaturityBands): MaturityBand {
  // Ensure score is in valid range
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  const matchingBand = bands.find(band => normalizedScore >= band.min && normalizedScore <= band.max);
  return matchingBand ?? bands[bands.length - 1]; // Fallback to highest band
}

/**
 * Analyze gaps between current scores and target levels
 * @param dimensionScores - Array of dimension scores with targets
 * @returns Gap analysis with prioritized recommendations
 */
export function analyzeGaps(dimensionScores: DimensionScore[]): {
  criticalGaps: DimensionScore[];
  moderateGaps: DimensionScore[];
  minorGaps: DimensionScore[];
  strengths: DimensionScore[];
} {
  // Updated thresholds for 0-100 scale
  const criticalGaps = dimensionScores.filter(dim => dim.gap > 40);
  const moderateGaps = dimensionScores.filter(dim => dim.gap > 20 && dim.gap <= 40);
  const minorGaps = dimensionScores.filter(dim => dim.gap > 10 && dim.gap <= 20);
  const strengths = dimensionScores.filter(dim => dim.gap <= 10);

  return {
    criticalGaps: criticalGaps.sort((a, b) => b.gap - a.gap),
    moderateGaps: moderateGaps.sort((a, b) => b.gap - a.gap),
    minorGaps: minorGaps.sort((a, b) => b.gap - a.gap),
    strengths: strengths.sort((a, b) => b.score - a.score),
  };
}

/**
 * Generate improvement priority suggestions
 * @param dimensionScores - Array of dimension scores
 * @returns Ordered list of improvement priorities
 */
export function generateImprovementPriorities(dimensionScores: DimensionScore[]): {
  priority: 'critical' | 'moderate' | 'minor';
  dimensionId: string;
  gap: number;
  score: number;
  target: number;
}[] {
  return dimensionScores
    .filter(dim => dim.gap > 5) // Only include meaningful gaps (5+ points on 0-100 scale)
    .map(dim => ({
      priority: dim.gap > 40 ? 'critical' as const : 
                dim.gap > 20 ? 'moderate' as const : 'minor' as const,
      dimensionId: dim.id,
      gap: dim.gap,
      score: dim.score,
      target: dim.target,
    }))
    .sort((a, b) => {
      // Sort by priority first, then by gap size
      const priorityOrder = { critical: 3, moderate: 2, minor: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.gap - a.gap;
    });
}

/**
 * Calculate maturity progression
 * Useful for showing advancement from one level to another
 * @param currentScore - Current score (0-100)
 * @param targetScore - Target score (0-100)
 * @param bands - Maturity bands to use
 * @returns Progression analysis
 */
export function calculateMaturityProgression(
  currentScore: number,
  targetScore: number,
  bands: MaturityBand[] = defaultMaturityBands
): {
  currentLevel: MaturityBand;
  targetLevel: MaturityBand;
  levelsToAdvance: number;
  progressInCurrentLevel: number;
  remainingInCurrentLevel: number;
} {
  const currentLevel = classify(currentScore, bands);
  const targetLevel = classify(targetScore, bands);
  
  const levelsToAdvance = targetLevel.level - currentLevel.level;
  
  // Calculate progress within current level
  const currentLevelRange = currentLevel.max - currentLevel.min;
  const progressInLevel = currentScore - currentLevel.min;
  const progressInCurrentLevel = currentLevelRange > 0 ? progressInLevel / currentLevelRange : 0;
  const remainingInCurrentLevel = 1 - progressInCurrentLevel;

  return {
    currentLevel,
    targetLevel,
    levelsToAdvance,
    progressInCurrentLevel,
    remainingInCurrentLevel,
  };
}

/**
 * Get benchmark comparison data
 * Useful for comparing against industry averages or best practices
 * @param score - Current score to compare
 * @param benchmarkScore - Benchmark score to compare against
 * @returns Comparison analysis
 */
export function compareToBenchmark(
  score: number,
  benchmarkScore: number,
  bands: MaturityBand[] = defaultMaturityBands
): {
  difference: number;
  performanceLead: boolean;
  currentLevel: MaturityBand;
  benchmarkLevel: MaturityBand;
  levelDifference: number;
} {
  const difference = score - benchmarkScore;
  const performanceLead = difference > 0;
  const currentLevel = classify(score, bands);
  const benchmarkLevel = classify(benchmarkScore, bands);
  const levelDifference = currentLevel.level - benchmarkLevel.level;

  return {
    difference,
    performanceLead,
    currentLevel,
    benchmarkLevel,
    levelDifference,
  };
}