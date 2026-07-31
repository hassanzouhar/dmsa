import { expect, test } from '@jest/globals';
import { buildReport } from '../../src/report/builder';

const mockBenchmark = {
  segmentId: 'C_small',
  dimensions: {
    digitalStrategy: { indicatorMin: 30, indicatorMedian: 50, indicatorMax: 70, average: 55, indicatorCount: 3 },
    digitalReadiness: { indicatorMin: 30, indicatorMedian: 50, indicatorMax: 70, average: 55, indicatorCount: 3 },
    humanCentric: { indicatorMin: 30, indicatorMedian: 50, indicatorMax: 70, average: 55, indicatorCount: 3 },
    dataManagement: { indicatorMin: 30, indicatorMedian: 50, indicatorMax: 70, average: 55, indicatorCount: 3 },
    automation: { indicatorMin: 30, indicatorMedian: 50, indicatorMax: 70, average: 55, indicatorCount: 3 },
    greenDigitalization: { indicatorMin: 30, indicatorMedian: 50, indicatorMax: 70, average: 55, indicatorCount: 3 },
  },
  intelligence: {
    successPatterns: ['Start smått med sky-integrasjon'],
    commonChallenges: ['Datakvalitet varians'],
  },
};

const mockDb = {
  doc: (path: string) => ({
    async get() {
      if (path === '/benchmarks/segments/data/C_small') {
        return { exists: true, data: () => mockBenchmark };
      }
      return { exists: false, data: () => null };
    },
  }),
};

test('buildReport basic flow', async () => {
  const survey = {
    Q1: { rows: [{ id: 'a' }, { id: 'b' }], left: ['a'], right: ['b'] },
    Q2: { selected: ['needs-identified'], options: [{ id: 'needs-identified' }] },
    Q3: { selected: ['company-website'], options: [{ id: 'company-website' }] },
    Q4: { values: [5, 4, 3] },
    Q5: { selected: ['training-plan'], options: [{ id: 'training-plan' }] },
    Q6: { selected: ['awareness'], options: [{ id: 'awareness' }] },
    Q7: { selected: ['data-governance'], options: [{ id: 'data-governance' }] },
    Q8: { selected: ['security-policies'], options: [{ id: 'security-policies' }] },
    Q9: { values: [2, 3] },
    Q10: { selected: ['paperless-processes'], options: [{ id: 'paperless-processes' }] },
    Q11: { values: ['yes', 'partial', 'no'] },
  };

  const report = await buildReport({ db: mockDb as any, nace: 'C10.1', size: 'small', survey });

  expect(report.segment).toBe('C_small');
  expect(report.results.digitalStrategy.band).toBeDefined();
  expect(report.results.digitalStrategy.ref.indicatorCount).toBe(3);
});
