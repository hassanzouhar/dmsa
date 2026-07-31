/**
 * Leaderboard Service
 *
 * Provides functionality for fetching and aggregating leaderboard data
 * from completed surveys in Firestore.
 */

import { listCompletedSurveys, sql, type SurveyRow } from './db';
import { getCountyName } from '@/data/norwegian-counties';
import { getCountryDisplayName } from '@/data/countries';

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  industry: string;
  industryLabel: string;
  sector: string;
  size: 'micro' | 'small' | 'medium' | 'large';
  region?: string;
  countryCode?: string;
  countryName?: string;
  countyCode?: string;
  countyName?: string;
  overallScore: number;
  dimensionScores: {
    digitalStrategy: number;
    digitalReadiness: number;
    humanCentric: number;
    dataManagement: number;
    automation: number;
    greenDigitalization: number;
  };
  completedAt: string;
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
    digitalStrategy: number;
    digitalReadiness: number;
    humanCentric: number;
    dataManagement: number;
    automation: number;
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
  'finance': {
    label: 'Finansiering og forsikring',
    icon: '🏦',
    description: 'Finanssektoren digitaliserer raskt'
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
  size?: 'micro' | 'small' | 'medium' | 'large' | 'all';
  country?: string;
  county?: string;
  limit?: number;
} = {}): Promise<LeaderboardEntry[]> {
  const rows = await listCompletedSurveys({
    sector: options.sector && options.sector !== 'all' ? options.sector : undefined,
    companySize: options.size && options.size !== 'all' ? options.size : undefined,
    limit: options.limit,
  });

  const entries: LeaderboardEntry[] = [];

  for (const survey of rows) {
    if (!survey.scores) continue;

    // `region` er sammensatt ('NO-03'), så land/fylke må filtreres etter
    // parsing — det lar seg ikke uttrykke som en enkel WHERE-klausul.
    const { countryCode, countyCode } = parseRegion(survey.region);

    if (options.country && options.country !== 'all' && countryCode !== options.country) {
      continue;
    }
    if (options.county && options.county !== 'all' && countyCode !== options.county) {
      continue;
    }

    const dims = survey.scores.dimensions;

    entries.push({
      id: survey.id,
      displayName: generateAnonymousAlias(survey.id),
      industry: survey.nace,
      industryLabel: SECTOR_LABELS[survey.sector]?.label || survey.sector,
      sector: survey.sector,
      size: survey.company_size,
      region: survey.region,
      countryCode,
      countryName: getCountryDisplayName(countryCode) || countryCode,
      countyCode,
      countyName: getCountyName(countyCode),
      overallScore: survey.scores.overall / 10, // Convert 0-100 to 0-10 scale
      dimensionScores: {
        digitalStrategy: (dims.digitalStrategy?.score || 0) / 10,
        digitalReadiness: (dims.digitalReadiness?.score || 0) / 10,
        humanCentric: (dims.humanCentric?.score || 0) / 10,
        dataManagement: (dims.dataManagement?.score || 0) / 10,
        automation: (dims.automation?.score || 0) / 10,
        greenDigitalization: (dims.greenDigitalization?.score || 0) / 10,
      },
      completedAt: (survey.completed_at ?? survey.created_at).toISOString(),
    });
  }

  // Sort by overall score descending
  entries.sort((a, b) => b.overallScore - a.overallScore);

  // Add rank
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

const ADJECTIVES = [
  'Modig',
  'Smidig',
  'Digital',
  'Grønn',
  'Fleksibel',
  'Smart',
  'Framtidsrettet',
  'Innovativ',
  'Fokusert',
  'Effektiv',
  'Handlekraftig',
  'Visjonær',
  'Drivende',
  'Dynamisk',
  'Utforskende'
];

const NOUNS = [
  'Reinsdyr',
  'Tømrer',
  'Koder',
  'Analytiker',
  'Navigator',
  'Spark',
  'Kompass',
  'Fyrlykt',
  'Inkubator',
  'Raket',
  'Motor',
  'Lyn',
  'Bølge',
  'Taktiker',
  'Generator'
];

const hashStringToNumber = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const generateAnonymousAlias = (surveyId: string): string => {
  const hash = hashStringToNumber(surveyId);
  const adjective = ADJECTIVES[hash % ADJECTIVES.length];
  const noun = NOUNS[(Math.floor(hash / ADJECTIVES.length)) % NOUNS.length];
  const suffix = (hash % 90) + 10; // 10-99
  return `${adjective} ${noun} ${suffix}`;
};

const parseRegion = (region?: string): { countryCode?: string; countyCode?: string } => {
  if (!region) return {};
  if (region.includes('-')) {
    const [countryCode, rest] = region.split('-');
    if (countryCode === 'NO') {
      return { countryCode, countyCode: rest };
    }
    return { countryCode };
  }
  return { countryCode: region };
};

/**
 * Calculate industry benchmarks from all completed surveys
 */
export async function getIndustryBenchmarks(minSampleSize: number = 3): Promise<IndustryBenchmark[]> {
  const rows = await listCompletedSurveys();

  // Group by sector
  const sectorGroups: Record<string, SurveyRow[]> = {};

  for (const survey of rows) {
    if (!survey.scores) continue;
    (sectorGroups[survey.sector] ??= []).push(survey);
  }

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
      digitalStrategy: 0,
      digitalReadiness: 0,
      humanCentric: 0,
      dataManagement: 0,
      automation: 0,
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
export interface SurveyStats {
  count: number;
  regionCount: number;
  sectorCount: number;
  averageScore: number;
}

/**
 * Aggregated survey stats for social proof and hero section
 */
export async function getSurveyStats(): Promise<SurveyStats> {
  // Aggregeringen gjøres i databasen — dette er ren telling, og trenger
  // ikke at radene hentes ned.
  const [row] = await sql<{
    count: string;
    region_count: string;
    sector_count: string;
    avg_score: string | null;
  }[]>`
    select
      count(*)                     as count,
      count(distinct region)       as region_count,
      count(distinct sector)       as sector_count,
      avg(overall_score)           as avg_score
    from surveys
    where completed_at is not null
      and scores is not null
      and include_in_leaderboard
  `;

  return {
    count: Number(row?.count ?? 0),
    regionCount: Number(row?.region_count ?? 0),
    sectorCount: Number(row?.sector_count ?? 0),
    averageScore: row?.avg_score ? Number(Number(row.avg_score).toFixed(1)) : 0,
  };
}

export async function getSurveyCount(): Promise<number> {
  const stats = await getSurveyStats();
  return stats.count;
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
