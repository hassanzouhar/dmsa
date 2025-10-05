export const COUNTRY_LABELS: Record<string, string> = {
  NO: 'Norge',
  SE: 'Sverige',
  DK: 'Danmark',
  FI: 'Finland',
  IS: 'Island',
  DE: 'Tyskland',
  GB: 'Storbritannia',
  FR: 'Frankrike',
  NL: 'Nederland',
  BE: 'Belgia',
  AT: 'Østerrike',
  CH: 'Sveits',
  ES: 'Spania',
  IT: 'Italia',
  PL: 'Polen',
  US: 'USA',
  CA: 'Canada',
  OTHER: 'Annet land'
};

export const getCountryDisplayName = (code?: string): string | undefined => {
  if (!code) return undefined;
  return COUNTRY_LABELS[code] || code;
};
