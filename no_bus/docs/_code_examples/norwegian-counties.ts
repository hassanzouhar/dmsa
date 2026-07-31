export interface NorwegianCounty {
  code: string;
  name: string;
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

export const getCountyName = (code?: string): string | undefined =>
  NORWEGIAN_COUNTIES.find((county) => county.code === code)?.name;

export const extractCountyCodeFromRegion = (region?: string): string => {
  if (!region) return '';
  const match = /NO-(\d{2})/.exec(region);
  return match ? match[1] : '';
};
