export interface NaceSector {
  code: string;
  name: string;
}

export const NACE_SECTORS: NaceSector[] = [
  { code: 'A', name: 'Jordbruk, skogbruk og fiske' },
  { code: 'B', name: 'Bergverksdrift og utvinning' },
  { code: 'C', name: 'Industri' },
  { code: 'D', name: 'Kraftforsyning' },
  { code: 'E', name: 'Vannforsyning, avløp og renovasjon' },
  { code: 'F', name: 'Bygge- og anleggsvirksomhet' },
  { code: 'G', name: 'Varehandel og reparasjon av motorvogner' },
  { code: 'H', name: 'Transport og lagring' },
  { code: 'I', name: 'Overnattings- og serveringsvirksomhet' },
  { code: 'J', name: 'Informasjon og kommunikasjon' },
  { code: 'K', name: 'Finansiell tjenesteyting og forsikring' },
  { code: 'L', name: 'Eiendomsdrift' },
  { code: 'M', name: 'Faglig, vitenskapelig og teknisk tjenesteyting' },
  { code: 'N', name: 'Forretningsmessig tjenesteyting' },
  { code: 'O', name: 'Offentlig administrasjon og forsvar' },
  { code: 'P', name: 'Undervisning' },
  { code: 'Q', name: 'Helse- og sosialtjenester' },
  { code: 'R', name: 'Kultur, underholdning og fritid' },
  { code: 'S', name: 'Annen tjenesteyting' },
  { code: 'T', name: 'Private husholdninger som arbeidsgivere' },
  { code: 'U', name: 'Internasjonale organisasjoner og organer' }
];

const NACE_MAP = NACE_SECTORS.reduce<Record<string, string>>((acc, sector) => {
  acc[sector.code] = sector.name;
  return acc;
}, {});

export const getNaceName = (code?: string): string | undefined => {
  if (!code) return undefined;
  return NACE_MAP[code.toUpperCase()];
};
