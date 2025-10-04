/**
 * Leaderboard Service
 *
 * Provides functionality for fetching and aggregating leaderboard data
 * from completed surveys in Firestore.
 */

import { getAdminFirestore } from './firebase-admin';
import { SurveyDocument } from '@/types/firestore-schema';

export interface LeaderboardEntry {
  id: string;
  companyName: string;
  industry: string;
  industryLabel: string;
  sector: string;
  size: 'micro' | 'small' | 'medium' | 'large';
  region?: string;
  country: string;
  overallScore: number;
  dimensionScores: {
    digitalBusinessStrategy: number;
    digitalReadiness: number;
    humanCentricDigitalization: number;
    dataManagement: number;
    automationAndAI: number;
    greenDigitalization: number;
  };
  completedAt: string;
  isAnonymous: boolean;
  rank?: number;
}

export interface IndustryBenchmark {
  sector: string;
  industryLabel: string;
  averageScore: number;
  count: number;
  trend: string;
  icon: string;
  description: string;
  dimensionAverages: {
    digitalBusinessStrategy: number;
    digitalReadiness: number;
    humanCentricDigitalization: number;
    dataManagement: number;
    automationAndAI: number;
    greenDigitalization: number;
  };
}

const SECTOR_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  'manufacturing': {
    label: 'Industri',
    icon: '🏭',
    description: 'Produksjon og industribedrifter'
  },
  'services': {
    label: 'Faglig, vitenskapelig og teknisk tjenesteyting',
    icon: '🔬',
    description: 'Konsulentselskaper og forskningsinstitusjoner'
  },
  'retail': {
    label: 'Varehandel og reparasjon av motorvogner',
    icon: '🛒',
    description: 'Detaljhandel og varehandel'
  },
  'healthcare': {
    label: 'Helse- og sosialtjenester',
    icon: '🏥',
    description: 'Helsesektoren moderniserer sine tjenester'
  },
  'education': {
    label: 'Undervisning',
    icon: '📚',
    description: 'Utdanningssektoren'
  },
  'government': {
    label: 'Offentlig administrasjon og forsvar',
    icon: '🏛️',
    description: 'Offentlig sektor'
  },
  'other': {
    label: 'Annen tjenesteyting',
    icon: '💼',
    description: 'Andre næringer'
  }
};

/**
 * Fetch all completed surveys that are eligible for leaderboard
 */
export async function getLeaderboardEntries(options: {
  sector?: string;
  size?: 'micro' | 'small' | 'medium' | 'large';
  limit?: number;
} = {}): Promise<LeaderboardEntry[]> {
  const db = getAdminFirestore();
  let query = db.collection('surveys')
    .where('flags.isCompleted', '==', true)
    .where('flags.hasResults', '==', true);

  // Filter by sector if specified
  if (options.sector && options.sector !== 'all') {
    query = query.where('companyDetails.sector', '==', options.sector);
  }

  // Filter by size if specified
  if (options.size && options.size !== 'all') {
    query = query.where('companyDetails.companySize', '==', options.size);
  }

  // Limit results
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const snapshot = await query.get();

  const entries: LeaderboardEntry[] = [];

  snapshot.forEach(doc => {
    const survey = doc.data() as SurveyDocument;

    // Skip surveys without scores
    if (!survey.scores) return;

    const entry: LeaderboardEntry = {
      id: survey.id,
      companyName: survey.flags.isAnonymous
        ? `Bedrift ${survey.id.substring(0, 4)} (Anonym)`
        : survey.companyDetails.companyName,
      industry: survey.companyDetails.nace,
      industryLabel: SECTOR_LABELS[survey.companyDetails.sector]?.label || survey.companyDetails.sector,
      sector: survey.companyDetails.sector,
      size: survey.companyDetails.companySize,
      region: survey.companyDetails.region,
      country: 'Norge', // Default for now
      overallScore: survey.scores.overall / 10, // Convert 0-100 to 0-10 scale
      dimensionScores: {
        digitalBusinessStrategy: (survey.scores.dimensions.digitalBusinessStrategy?.score || 0) / 10,
        digitalReadiness: (survey.scores.dimensions.digitalReadiness?.score || 0) / 10,
        humanCentricDigitalization: (survey.scores.dimensions.humanCentricDigitalization?.score || 0) / 10,
        dataManagement: (survey.scores.dimensions.dataManagement?.score || 0) / 10,
        automationAndAI: (survey.scores.dimensions.automationAndAI?.score || 0) / 10,
        greenDigitalization: (survey.scores.dimensions.greenDigitalization?.score || 0) / 10,
      },
      completedAt: survey.completedAt || survey.createdAt,
      isAnonymous: survey.flags.isAnonymous || false,
    };

    entries.push(entry);
  });

  // Sort by overall score descending
  entries.sort((a, b) => b.overallScore - a.overallScore);

  // Add rank
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

/**
 * Calculate industry benchmarks from all completed surveys
 */
export async function getIndustryBenchmarks(minSampleSize: number = 3): Promise<IndustryBenchmark[]> {
  const db = getAdminFirestore();

  const snapshot = await db.collection('surveys')
    .where('flags.isCompleted', '==', true)
    .where('flags.hasResults', '==', true)
    .get();

  // Group by sector
  const sectorGroups: Record<string, SurveyDocument[]> = {};

  snapshot.forEach(doc => {
    const survey = doc.data() as SurveyDocument;
    if (!survey.scores) return;

    const sector = survey.companyDetails.sector;
    if (!sectorGroups[sector]) {
      sectorGroups[sector] = [];
    }
    sectorGroups[sector].push(survey);
  });

  // Calculate averages for each sector
  const benchmarks: IndustryBenchmark[] = [];

  Object.entries(sectorGroups).forEach(([sector, surveys]) => {
    // Skip if not enough samples
    if (surveys.length < minSampleSize) return;

    const sectorInfo = SECTOR_LABELS[sector] || { label: sector, icon: '💼', description: sector };

    // Calculate overall average
    const totalScore = surveys.reduce((sum, s) => sum + (s.scores?.overall || 0), 0);
    const averageScore = totalScore / surveys.length / 10; // Convert to 0-10 scale

    // Calculate dimension averages
    const dimensionTotals = {
      digitalBusinessStrategy: 0,
      digitalReadiness: 0,
      humanCentricDigitalization: 0,
      dataManagement: 0,
      automationAndAI: 0,
      greenDigitalization: 0,
    };

    surveys.forEach(survey => {
      if (!survey.scores) return;
      Object.keys(dimensionTotals).forEach(dim => {
        const dimensionScore = survey.scores!.dimensions[dim as keyof typeof survey.scores.dimensions];
        dimensionTotals[dim as keyof typeof dimensionTotals] +=
          (dimensionScore?.score || 0);
      });
    });

    const dimensionAverages = Object.fromEntries(
      Object.entries(dimensionTotals).map(([dim, total]) => [
        dim,
        total / surveys.length / 10 // Convert to 0-10 scale
      ])
    ) as IndustryBenchmark['dimensionAverages'];

    benchmarks.push({
      sector,
      industryLabel: sectorInfo.label,
      averageScore: Math.round(averageScore * 10) / 10,
      count: surveys.length,
      trend: '+0.0', // TODO: Calculate from historical data
      icon: sectorInfo.icon,
      description: sectorInfo.description,
      dimensionAverages,
    });
  });

  // Sort by average score descending
  benchmarks.sort((a, b) => b.averageScore - a.averageScore);

  return benchmarks;
}

/**
 * Get survey count for social proof
 */
export async function getSurveyCount(): Promise<number> {
  const db = getAdminFirestore();

  const snapshot = await db.collection('surveys')
    .where('flags.isCompleted', '==', true)
    .count()
    .get();

  return snapshot.data().count;
}

/**
 * Get percentile ranking for a specific score in a sector
 */
export async function getPercentileRank(
  score: number,
  sector: string
): Promise<{ percentile: number; total: number }> {
  const entries = await getLeaderboardEntries({ sector });

  if (entries.length === 0) {
    return { percentile: 0, total: 0 };
  }

  // Count how many scores are below this score
  const scoresBelow = entries.filter(e => e.overallScore < score).length;
  const percentile = Math.round((scoresBelow / entries.length) * 100);

  return {
    percentile,
    total: entries.length
  };
}
