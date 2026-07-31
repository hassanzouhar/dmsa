export const NACE_SECTORS = [
  { code: 'A', name: 'Jordbruk, skogbruk og fiske' },
  { code: 'B', name: 'Bergverksdrift og utvinning' },
  { code: 'C', name: 'Industri' },
  { code: 'D', name: 'Kraftforsyning' },
  { code: 'E', name: 'Vannforsyning, avløp og renovasjon' },
  { code: 'F', name: 'Bygge- og anleggsvirksomhet' },
  { code: 'G', name: 'Vare, Engros eller detaljhandel' },
  { code: 'H', name: 'Transport og lagring' },
  { code: 'I', name: 'Overnattings- og serveringsvirksomhet' },
  { code: 'J', name: 'Utgivelse, kringkasting, innnholdsproduksjon og distribusjonsvirksomhet' },
  { code: 'K', name: 'Telekommunikasjon, Programmering, Konsulent eller andre tjenester knyttet til IT' },
  { code: 'L', name: 'Finansiell tjenesteyting' },
  { code: 'M', name: 'Eiendomsvirksomhet' },
  { code: 'N', name: 'Faglig, vitenskaplig og teknisk tjenesteyting' },
  { code: 'O', name: 'Forretningsmessig tjenesteyting' },
  { code: 'P', name: 'Offentlig administrasjon og forsvar, trygdeordninger underlagt offentlig forvaltning' },
  { code: 'Q', name: 'Undervisning' },
  { code: 'R', name: 'Helse- og sosialtjenester' },
  { code: 'S', name: 'Kultur, underholdning og fritid i alt' },
  { code: 'T', name: 'Annen tjenesteyting' },
  { code: 'U', name: 'Lønnet arbeid i private husholdninger,vareproduksjon eller tjenesteyting' },
  { code: 'V', name: 'Aktiviteter i Internasjonale organisasjoner og organer' }
];


export const COMPANY_SIZES = [
  {
    id: 'micro',
    name: 'Mikrobedrift, "ENK"',
    description: 'Årlig omsetning under 2M EUR',
    employees: '1-9 ansatte'
  },
  {
    id: 'small',
    name: 'Liten bedrift',
    description: 'Årlig omsetning under 10M EUR',
    employees: '10-49 ansatte'
  },
  {
    id: 'medium',
    name: 'Mellomstor bedrift',
    description: 'Årlig omsetning under 50 mill. EUR',
    employees: '50-249 ansatte'
  },
  {
    id: 'large',
    name: 'Stor bedrift',
    description: 'Årlig omsetning over 50 mill. EUR',
    employees: '250+ ansatte'
  }
];
