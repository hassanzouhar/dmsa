import { fetchBenchmarkDoc } from '../benchmarks/fetch';
import type { DimensionKey } from '../benchmarks/types';
import { scoreCheckboxes, scoreScaleTable, scoreTableDualCheckboxes, scoreTriStateTable } from '../mapping/questionAdapters';
import { aggregateDimension } from '../scoring/aggregate';
import { applyNegativeIndicators, clamp100 } from '../scoring/normalize';
import type {
  AssessmentResponses,
  CompanySize,
  DimensionResult,
  FirestoreLike,
  NaceLetter,
  Report,
} from '../util/types';
import { normalizeSize } from '../util/size';
import { toNaceLetter } from '../util/nace';
import { compareToBenchmark } from './compare';

const NEGATIVE_INDICATOR_IDS = ['no-digital-collection'];

type BuildParams = {
  db: FirestoreLike;
  nace: string;
  size: string;
  survey: AssessmentResponses;
};

export async function buildReport({ db, nace, size, survey }: BuildParams): Promise<Report> {
  const naceLetter: NaceLetter = toNaceLetter(nace);
  const companySize: CompanySize = normalizeSize(size);

  const q1 = clamp100(
    scoreTableDualCheckboxes(
      survey.Q1?.rows ?? [],
      survey.Q1?.left ?? [],
      survey.Q1?.right ?? [],
      1,
      0.5
    )
  );
  const q2 = clamp100(scoreCheckboxes(survey.Q2?.selected ?? [], survey.Q2?.options ?? []));

  const q3 = clamp100(scoreCheckboxes(survey.Q3?.selected ?? [], survey.Q3?.options ?? []));
  const q4 = clamp100(scoreScaleTable(survey.Q4?.values ?? []));

  const q5 = clamp100(scoreCheckboxes(survey.Q5?.selected ?? [], survey.Q5?.options ?? []));
  const q6 = clamp100(scoreCheckboxes(survey.Q6?.selected ?? [], survey.Q6?.options ?? []));

  const q7Base = clamp100(scoreCheckboxes(survey.Q7?.selected ?? [], survey.Q7?.options ?? []));
  const q7Negatives = NEGATIVE_INDICATOR_IDS.map(id => Boolean(survey.Q7?.selected?.includes(id)));
  const q7 = clamp100(applyNegativeIndicators(q7Base, q7Negatives, 15));
  const q8 = clamp100(scoreCheckboxes(survey.Q8?.selected ?? [], survey.Q8?.options ?? []));

  const q9 = clamp100(scoreScaleTable(survey.Q9?.values ?? []));

  const q10 = clamp100(scoreCheckboxes(survey.Q10?.selected ?? [], survey.Q10?.options ?? []));
  const q11 = clamp100(scoreTriStateTable(survey.Q11?.values ?? []));

  const dimensionScores: Record<DimensionKey, number> = {
    digitalStrategy: aggregateDimension([
      { id: 'Q1', score: q1 },
      { id: 'Q2', score: q2 },
    ]),
    digitalReadiness: aggregateDimension([
      { id: 'Q3', score: q3 },
      { id: 'Q4', score: q4 },
    ]),
    humanCentric: aggregateDimension([
      { id: 'Q5', score: q5 },
      { id: 'Q6', score: q6 },
    ]),
    dataManagement: aggregateDimension([
      { id: 'Q7', score: q7 },
      { id: 'Q8', score: q8 },
    ]),
    automation: aggregateDimension([{ id: 'Q9', score: q9 }]),
    greenDigitalization: aggregateDimension([
      { id: 'Q10', score: q10 },
      { id: 'Q11', score: q11 },
    ]),
  };

  const { doc: benchmarkDoc } = await fetchBenchmarkDoc(db, naceLetter, companySize);

  const results = (Object.keys(dimensionScores) as DimensionKey[]).reduce(
    (acc, key) => {
      const userScore = clamp100(dimensionScores[key]);
      const reference = benchmarkDoc.dimensions[key];
      if (!reference) {
        acc[key] = {
          user: userScore,
          ref: {
            average: 0,
            indicatorMin: 0,
            indicatorMedian: 0,
            indicatorMax: 0,
            indicatorCount: 0,
          },
          band: 'red',
          deltaToMedian: userScore,
          percentileHint: 20,
          lowSample: true,
        } as DimensionResult;
        return acc;
      }

      const comparison = compareToBenchmark(userScore, reference);
      // «Lavt datagrunnlag» = færre enn to SSB-indikatorer bak dimensjonen.
      const lowSample = reference.indicatorCount < 2 ? true : undefined;
      acc[key] = {
        user: userScore,
        ref: reference,
        ...comparison,
        lowSample,
      } as DimensionResult;
      return acc;
    },
    {} as Record<DimensionKey, DimensionResult>
  );

  const weakestDimensions = (Object.entries(results) as [DimensionKey, DimensionResult][])
    .sort((a, b) => a[1].user - b[1].user)
    .slice(0, 2)
    .map(([key]) => key);

  const tips: string[] = [];
  const successPatterns = benchmarkDoc.intelligence?.successPatterns ?? [];
  const commonChallenges = benchmarkDoc.intelligence?.commonChallenges ?? [];

  if (successPatterns.length) {
    tips.push(`Mulig tiltak (${weakestDimensions.join(', ')}): ${successPatterns[0]}`);
    if (successPatterns[1]) {
      tips.push(`Mulig tiltak: ${successPatterns[1]}`);
    }
  }

  if (commonChallenges.length) {
    tips.push(`Vær obs: ${commonChallenges[0]}`);
  }

  return {
    segment: benchmarkDoc.segmentId ?? `${naceLetter}_${companySize}`,
    results,
    tips: tips.length ? tips : undefined,
  };
}
