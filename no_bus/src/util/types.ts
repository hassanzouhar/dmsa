import type { DimensionKey, DimensionScore } from '../benchmarks/types';

export type CompanySize = 'micro' | 'small' | 'medium' | 'large';

export type NaceLetter =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U';

export type AssessmentResponses = Record<string, any>;

export type Band = 'red' | 'yellow' | 'lightgreen' | 'green';

export type DimensionResult = {
  user: number;
  ref: DimensionScore;
  band: Band;
  deltaToMedian: number;
  percentileHint: number;
  lowSample?: boolean;
};

export type Report = {
  segment: string;
  results: Record<DimensionKey, DimensionResult>;
  tips?: string[];
};

export type FirestoreLike = {
  doc: (path: string) => {
    get: () => Promise<FirestoreSnapshotLike>;
  };
};

export type FirestoreSnapshotLike = {
  exists: boolean;
  data: () => any;
};
