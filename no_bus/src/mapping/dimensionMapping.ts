/**
 * Canonical kobling mellom DMSA-dimensjoner, spørsmål og SSB-tabeller.
 *
 * Eieren av denne filen er sannheten — `ssb-transformer.ts` importerer
 * herfra (tidligere holdt den sin egen, ulike, kopi).
 */

import type { DimensionKey } from '../benchmarks/types';

export const DimensionToQuestions: Record<string, string[]> = {
  digitalStrategy: ['Q1', 'Q2'],
  digitalReadiness: ['Q3', 'Q4'],
  humanCentric: ['Q5', 'Q6'],
  dataManagement: ['Q7', 'Q8'],
  automation: ['Q9'],
  greenDigitalization: ['Q10', 'Q11'],
};

export type DimensionConfig = {
  tables: string[];
  indicators: string[];
  /** Per-tabell-fortegn — `-1` for tabeller der høyere verdi er negativt
   *  (f.eks. KI-barrierer i 13272 — flere barrierer = lavere modenhet). */
  weights?: Record<string, number>;
};

/**
 * Hvilke SSB-tabeller som mater hver DMSA-dimensjon.
 * Brukes av `SSBTransformer.transformDimensionScore`.
 */
export const tableMapping: Record<DimensionKey, DimensionConfig> = {
  digitalStrategy: {
    tables: ['10966', '10974', '10964'],
    indicators: ['Skybruk', 'E-faktura', 'Digitaliseringsplaner']
  },
  digitalReadiness: {
    tables: ['10966', '10983', '14034'],
    indicators: ['Skybruk', 'Datautveksling', 'Avansert analyse']
  },
  humanCentric: {
    tables: ['10964', '12769'],
    indicators: ['IKT-kompetanse', 'Sikkerhetsopplæring']
  },
  dataManagement: {
    tables: ['10983', '14034', '12771'],
    indicators: ['Interoperabilitet', 'Analysebruk', 'Sikkerhetshendelser']
  },
  automation: {
    tables: ['13265', '13271', '13272'],
    indicators: ['Bruk av KI', 'Formål med KI', 'Hindringer for KI'],
    weights: { '13272': -1 }
  },
  greenDigitalization: {
    tables: ['10974'],
    indicators: ['E-faktura', 'Papirløse prosesser']
  }
} as const;

/**
 * Avledet flat liste over SSB-proxy-tabeller per dimensjon.
 * Eksponert for bakoverkompatibilitet med kode som tidligere brukte
 * `SsbProxies` direkte.
 */
export const SsbProxies: Record<string, string[]> = Object.fromEntries(
  Object.entries(tableMapping).map(([dim, cfg]) => [dim, [...cfg.tables]])
);
