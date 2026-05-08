/**
 * NACE-sektorer (A–U) med metadata om SSB ICT-bruk-dekning.
 *
 * `ssbCoverage`:
 *   - 'full'    : Sektoren har egne celler i SSB ICT-bruk-tabellene (10970, 10974, 10980 osv.)
 *   - 'partial' : SSB har data, men aggregert sammen med andre sektorer
 *                  (f.eks. C+D+E i NACE-range '10-39', eller L+M+N+R+S i '68-75+77-82+95.1').
 *                  UI bør gjøre dette eksplisitt for brukeren.
 *   - 'none'    : SSB ICT-bruk publiserer ingen data for denne sektoren.
 *                  Kalleren må håndtere "ingen baseline tilgjengelig"-tilfelle.
 *
 * `ssbNaceCodes`:
 *   SSB ICT-bruk NACE-range-kodene denne DMSA-sektoren mapper til.
 *   Tom array når ssbCoverage === 'none'.
 */
export type SsbCoverage = 'full' | 'partial' | 'none';

export interface NaceSector {
  code: string;
  name: string;
  /** Dekning i SSB ICT-bruk-i-foretak-tabellene */
  ssbCoverage: SsbCoverage;
  /** SSB ICT-bruk NACE-koder denne sektoren mapper til (tom array hvis 'none') */
  ssbNaceCodes: string[];
}

// Service-block aggregat brukt for L/M/N/R/S i flere SSB ICT-bruk-tabeller.
const SERVICE_BLOCK = '68-75+77-82+95.1';

export const NACE_SECTORS: NaceSector[] = [
  { code: 'A', name: 'Jordbruk, skogbruk og fiske',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'B', name: 'Bergverksdrift og utvinning',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'C', name: 'Industri',
    ssbCoverage: 'partial', ssbNaceCodes: ['10-39'] }, // aggregat med D+E
  { code: 'D', name: 'Kraftforsyning',
    ssbCoverage: 'partial', ssbNaceCodes: ['10-39'] },
  { code: 'E', name: 'Vannforsyning, avløp og renovasjon',
    ssbCoverage: 'partial', ssbNaceCodes: ['10-39'] },
  { code: 'F', name: 'Bygge- og anleggsvirksomhet',
    ssbCoverage: 'full', ssbNaceCodes: ['41-43'] },
  { code: 'G', name: 'Varehandel og reparasjon av motorvogner',
    ssbCoverage: 'full', ssbNaceCodes: ['45', '46', '47'] },
  { code: 'H', name: 'Transport og lagring',
    ssbCoverage: 'full', ssbNaceCodes: ['49-53'] },
  { code: 'I', name: 'Overnattings- og serveringsvirksomhet',
    ssbCoverage: 'full', ssbNaceCodes: ['55-56'] },
  { code: 'J', name: 'Informasjon og kommunikasjon',
    ssbCoverage: 'full', ssbNaceCodes: ['58-63'] },
  { code: 'K', name: 'Finansiell tjenesteyting og forsikring',
    ssbCoverage: 'full', ssbNaceCodes: ['64-66'] },
  { code: 'L', name: 'Eiendomsdrift',
    ssbCoverage: 'partial', ssbNaceCodes: [SERVICE_BLOCK] },
  { code: 'M', name: 'Faglig, vitenskapelig og teknisk tjenesteyting',
    ssbCoverage: 'partial', ssbNaceCodes: [SERVICE_BLOCK] },
  { code: 'N', name: 'Forretningsmessig tjenesteyting',
    ssbCoverage: 'partial', ssbNaceCodes: [SERVICE_BLOCK] },
  { code: 'O', name: 'Offentlig administrasjon og forsvar',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'P', name: 'Undervisning',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'Q', name: 'Helse- og sosialtjenester',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'R', name: 'Kultur, underholdning og fritid',
    ssbCoverage: 'partial', ssbNaceCodes: [SERVICE_BLOCK] },
  { code: 'S', name: 'Annen tjenesteyting',
    ssbCoverage: 'partial', ssbNaceCodes: [SERVICE_BLOCK] },
  { code: 'T', name: 'Private husholdninger som arbeidsgivere',
    ssbCoverage: 'none', ssbNaceCodes: [] },
  { code: 'U', name: 'Internasjonale organisasjoner og organer',
    ssbCoverage: 'none', ssbNaceCodes: [] }
];

const NACE_MAP = NACE_SECTORS.reduce<Record<string, string>>((acc, sector) => {
  acc[sector.code] = sector.name;
  return acc;
}, {});

export const getNaceName = (code?: string): string | undefined => {
  if (!code) return undefined;
  return NACE_MAP[code.toUpperCase()];
};
