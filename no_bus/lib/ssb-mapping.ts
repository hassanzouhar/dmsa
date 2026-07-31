/**
 * Canonical mapping mellom DMSA og SSB-koder.
 *
 * Tidligere hadde `ssb-api-client.ts` og `ssb-transformer.ts` hver sin (ulike!)
 * versjon av sektor- og størrelses-mappingen. Begge er nå konsolidert hit.
 *
 * SSB ICT-bruk-sysselsettingskoder (tabeller 10970, 10974, 10980 osv.):
 *   '02' = 10-19 ansatte
 *   '03' = 20-49 ansatte
 *   '04' = 50-99 ansatte
 *   '05' = 100+ ansatte (inkluderer 100-249 OG 250+ — SSB slår sammen)
 *
 * VIKTIG: SSB ICT-bruk har INGEN data for foretak med 1-9 ansatte (micro).
 * For DMSA "micro" returnerer vi tom array — kalleren må håndtere
 * "ingen baseline tilgjengelig"-tilfelle.
 *
 * NACE-koder leses fra `entities/nace-sectors.ts` der hver sektor er
 * beriket med `ssbCoverage` ('full' | 'partial' | 'none') og `ssbNaceCodes`.
 */

import { NACE_SECTORS } from '../entities/nace-sectors';

export const SSB_NO_COVERAGE_REASON = 'no-ssb-coverage' as const;
export type NoCoverageReason = typeof SSB_NO_COVERAGE_REASON;

/**
 * Map en DMSA-størrelse til SSB ICT-bruk-sysselsettingskoder.
 *
 * Returnerer en array fordi flere DMSA-størrelser aggregerer flere SSB-koder:
 *  - 'small'  → ['02','03']  fordi DMSA small (10-49) = SSB 10-19 + 20-49
 *  - 'medium' → ['04','05']  fordi DMSA medium (50-249) inkluderer 50-99 og
 *                             100+ (OBS: SSB '05' inkluderer også 250+, så
 *                             resultatet er forurenset av enterprise — best
 *                             tilgjengelige proxy)
 *  - 'large'  → ['05']        SSB 100+ er beste proxy for 250+ vi har
 *  - 'micro'  → []            SSB ICT-bruk har ingen 1-9-data
 */
export function mapSizeToSSBCodes(size: string): string[] {
  const sizeMap: Record<string, string[]> = {
    micro: [],            // SSB ICT-bruk har ikke 1-9
    small: ['02', '03'],  // 10-19 + 20-49 = 10-49
    medium: ['04', '05'], // 50-99 + 100+ — '05' inkluderer 250+ (lossy)
    large: ['05']         // 100+ (best available; inkluderer noe medium)
  };
  return sizeMap[size] ?? [];
}

/**
 * Map en DMSA-sektor (A–U) til SSB ICT-bruk NACE-range-koder.
 *
 * Returnerer tom array for sektorer som ikke har SSB ICT-bruk-dekning
 * (A, B, O, P, Q, T, U). Kaller må sjekke length === 0 og hoppe over
 * SSB-kallet.
 */
export function mapSectorToNaceCodes(sector: string): string[] {
  const entry = NACE_SECTORS.find(s => s.code === sector.toUpperCase());
  return entry?.ssbNaceCodes ?? [];
}

/**
 * Fylkeskoder skrives ulikt av SSB avhengig av tabell — 'NO-03', '03' og 'NO03'
 * forekommer alle. Returnerer variantene i prioritert rekkefølge slik at både
 * API-klienten og transformeren kan slå opp likt.
 */
export function regionCodeVariants(region: string): string[] {
  const compact = region.replace(/^NO-?/, '');
  return Array.from(new Set([region, compact, `NO-${compact}`, `NO${compact}`]));
}

/**
 * Sjekk om en sektor har SSB ICT-bruk-dekning (full eller partial).
 * Brukes f.eks. av extract-scriptet for å filtrere ut sektorer som
 * ikke kan benchmarkes mot SSB.
 */
export function hasSSBCoverage(sector: string): boolean {
  return mapSectorToNaceCodes(sector).length > 0;
}
