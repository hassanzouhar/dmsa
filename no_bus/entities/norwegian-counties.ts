export interface NorwegianCounty {
  code: string; // e.g., '03'
  name: string; // e.g., 'Oslo'
}

export const NORWEGIAN_COUNTIES: NorwegianCounty[] = [
  { code: '03', name: 'Oslo' },
  { code: '11', name: 'Rogaland' },
  { code: '15', name: 'Møre og Romsdal' },
  { code: '18', name: 'Nordland - Nordlánnda' },
  { code: '31', name: 'Østfold' },
  { code: '32', name: 'Akershus' },
  { code: '33', name: 'Buskerud' },
  { code: '34', name: 'Innlandet' },
  { code: '39', name: 'Vestfold' },
  { code: '40', name: 'Telemark' },
  { code: '42', name: 'Agder' },
  { code: '46', name: 'Vestland' },
  { code: '50', name: 'Trøndelag - Trööndelage' },
  { code: '55', name: 'Troms - Romsa - Tromssa' },
  { code: '56', name: 'Finnmark - Finnmárku - Finmarkku' },
  { code: '99', name: 'Uoppgitt' }
];

export const toRegionCode = (countyCode: string) => `NO-${countyCode}`;

export const getCountyName = (code?: string): string | undefined =>
  NORWEGIAN_COUNTIES.find((c) => c.code === code)?.name;

