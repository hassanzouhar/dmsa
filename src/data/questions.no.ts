import { AssessmentSpec } from '@/src/types/assessment';

export const dmaNo_v1: AssessmentSpec = {
  version: '1.0.0',
  language: 'no',
  dimensions: [
    { 
      id: 'digitalStrategy', 
      name: 'dimension.digitalStrategy', 
      weight: 1, 
      targetLevel: 1,
      description: 'Digital forretningsstrategi og investeringsplaner' 
    },
    { 
      id: 'digitalReadiness', 
      name: 'dimension.digitalReadiness', 
      weight: 1, 
      targetLevel: 1,
      description: 'Bruk av grunnleggende og avanserte digitale teknologier' 
    },
    { 
      id: 'humanCentric', 
      name: 'dimension.humanCentric', 
      weight: 1, 
      targetLevel: 1,
      description: 'Kompetanse og engasjement for digitale teknologier' 
    },
    { 
      id: 'dataManagement', 
      name: 'dimension.dataManagement', 
      weight: 1, 
      targetLevel: 1,
      description: 'Databehandling, integrering og cybersikkerhet' 
    },
    { 
      id: 'automation', 
      name: 'dimension.automation', 
      weight: 1, 
      targetLevel: 1,
      description: 'Automatisering og kunstig intelligens' 
    },
    { 
      id: 'greenDigitalization', 
      name: 'dimension.greenDigitalization', 
      weight: 1, 
      targetLevel: 1,
      description: 'Bærekraftig digitalisering og miljøhensyn' 
    }
  ],
  questions: [
    // Dimension 1: Digital Business Strategy (Q1-Q2)
    {
      id: 'Q1',
      dimensionId: 'digitalStrategy',
      type: 'dual-checkboxes',
      title: 'Investeringer i digitalisering per forretningsområde',
      description: 'På hvilke forretningsområder har bedriften allerede investert eller planlegger å investere i digitalisering?',
      weight: 1,
      options: {
        left: { 
          id: 'Q1_invested', 
          label: 'Har allerede investert',
          weight: 1 
        },
        right: { 
          id: 'Q1_planning', 
          label: 'Planlegger å investere',
          weight: 0.5 
        }
      }
    },
    {
      id: 'Q2',
      dimensionId: 'digitalStrategy',
      type: 'checkboxes',
      title: 'Beredskap for digitalisering',
      description: 'På hvilke måter er bedriften forberedt på digitalisering?',
      weight: 1,
      options: [
        { id: 'Q2_needs', label: 'Digitaliseringsbehov identifisert', weight: 1 },
        { id: 'Q2_finance', label: 'Finansielle ressurser sikret', weight: 1 },
        { id: 'Q2_infrastructure', label: 'IKT-infrastruktur klar', weight: 1 },
        { id: 'Q2_specialists', label: 'IKT-spesialister ansatt/identifisert', weight: 1 },
        { id: 'Q2_leadership', label: 'Ledelse klar for endringer', weight: 1 },
        { id: 'Q2_employees', label: 'Ansatte klare til støtte', weight: 1 },
        { id: 'Q2_processes', label: 'Prosesser kan tilpasses', weight: 1 },
        { id: 'Q2_servitization', label: 'Produkter som tjeneste', weight: 1 },
        { id: 'Q2_satisfaction', label: 'Kundetilfredshet overvåkes', weight: 1 },
        { id: 'Q2_risks', label: 'Risikoer evalueres', weight: 1 }
      ]
    },

    // Dimension 2: Digital Readiness (Q3-Q4)
    {
      id: 'Q3',
      dimensionId: 'digitalReadiness',
      type: 'checkboxes',
      title: 'Grunnleggende digitale teknologier i bruk',
      description: 'Hvilke grunnleggende digitale teknologier brukes allerede?',
      weight: 1,
      options: [
        { id: 'Q3_connectivity', label: 'Tilkoblingsinfrastruktur', weight: 1 },
        { id: 'Q3_website', label: 'Bedriftens nettside', weight: 1 },
        { id: 'Q3_forms', label: 'Nettbaserte skjemaer/fora', weight: 1 },
        { id: 'Q3_chat', label: 'Live chat og sosiale nettverk', weight: 1 },
        { id: 'Q3_ecommerce', label: 'E-handelssalg', weight: 1 },
        { id: 'Q3_marketing', label: 'E-markedsføring', weight: 1 },
        { id: 'Q3_government', label: 'E-forvaltning', weight: 1 },
        { id: 'Q3_collaboration', label: 'Fjernsamarbeidsverktøy', weight: 1 },
        { id: 'Q3_intranet', label: 'Intern nettportal', weight: 1 },
        { id: 'Q3_management', label: 'Informasjonsstyringssystemer', weight: 1 }
      ]
    },
    {
      id: 'Q4',
      dimensionId: 'digitalReadiness',
      type: 'scale-0-5',
      title: 'Avanserte digitale teknologier',
      description: 'Hvilken status har følgende avanserte teknologier i bedriften?',
      weight: 1,
      scaleLabels: ['Ikke brukt', 'Vurderer', 'Prototype', 'Testing', 'Implementering', 'I bruk']
    },

    // Dimension 3: Human-Centric Digitalization (Q5-Q6)
    {
      id: 'Q5',
      dimensionId: 'humanCentric',
      type: 'checkboxes',
      title: 'Opplæring og oppgradering av ansatte',
      description: 'Hva gjør bedriften for å om- og oppgradere ansatte for digitalisering?',
      weight: 1,
      options: [
        { id: 'Q5_assessment', label: 'Ferdighetsvurderinger gjennomføres', weight: 1 },
        { id: 'Q5_plan', label: 'Opplæringsplan utformes', weight: 1 },
        { id: 'Q5_sessions', label: 'Korte treningsøkter organiseres', weight: 1 },
        { id: 'Q5_peer', label: 'Erfaringslæring tilrettelegges', weight: 1 },
        { id: 'Q5_internships', label: 'Praksisplasser tilbys', weight: 1 },
        { id: 'Q5_external', label: 'Ekstern opplæring sponses', weight: 1 },
        { id: 'Q5_subsidized', label: 'Subsidierte opplegg benyttes', weight: 1 }
      ]
    },
    {
      id: 'Q6',
      dimensionId: 'humanCentric',
      type: 'checkboxes',
      title: 'Ansattes engasjement og myndiggjøring',
      description: 'Hvordan engasjerer og styrker bedriften sine ansatte ved nye digitale løsninger?',
      weight: 1,
      options: [
        { id: 'Q6_awareness', label: 'Bevissthet om nye teknologier', weight: 1 },
        { id: 'Q6_transparency', label: 'Transparente digitaliseringsplaner', weight: 1 },
        { id: 'Q6_monitoring', label: 'Overvåking av personalets aksept', weight: 1 },
        { id: 'Q6_involvement', label: 'Involvering i design og utvikling', weight: 1 },
        { id: 'Q6_autonomy', label: 'Mer autonomi og verktøy', weight: 1 },
        { id: 'Q6_adaptation', label: 'Tilpasning av jobber og arbeidsflyter', weight: 1 },
        { id: 'Q6_flexibility', label: 'Fleksible arbeidsordninger', weight: 1 },
        { id: 'Q6_support', label: 'Digitalt støtteteam tilgjengelig', weight: 1 }
      ]
    },

    // Dimension 4: Data Management and Connectivity (Q7-Q8)
    {
      id: 'Q7',
      dimensionId: 'dataManagement',
      type: 'checkboxes',
      title: 'Databehandling og -utnyttelse',
      description: 'Hvordan administreres bedriftens data?',
      weight: 1,
      options: [
        { id: 'Q7_guidelines', label: 'Retningslinjer for databehandling', weight: 1 },
        { id: 'Q7_no_digital', label: 'Data samles ikke inn digitalt', weight: 0 }, // Negative indicator
        { id: 'Q7_storage', label: 'Relevante data lagres digitalt', weight: 1 },
        { id: 'Q7_integration', label: 'Data er riktig integrert', weight: 1 },
        { id: 'Q7_realtime', label: 'Data tilgjengelig i sanntid', weight: 1 },
        { id: 'Q7_analysis', label: 'Systematisk dataanalyse', weight: 1 },
        { id: 'Q7_external', label: 'Kombinering med eksterne kilder', weight: 1 },
        { id: 'Q7_accessible', label: 'Analyse tilgjengelig uten ekspert', weight: 1 }
      ]
    },
    {
      id: 'Q8',
      dimensionId: 'dataManagement',
      type: 'checkboxes',
      title: 'Cybersikkerhet og databeskyttelse',
      description: 'Er bedriftens data tilstrekkelig sikre?',
      weight: 1,
      options: [
        { id: 'Q8_policies', label: 'Datasikkerhetsretningslinjer på plass', weight: 1 },
        { id: 'Q8_protection', label: 'Kunderelaterte data beskyttet', weight: 1 },
        { id: 'Q8_training', label: 'Regelmessig cybersikkerhetsopplæring', weight: 1 },
        { id: 'Q8_monitoring', label: 'Cybertrusler overvåkes', weight: 1 },
        { id: 'Q8_backup', label: 'Fullstendig sikkerhetskopi vedlikeholdes', weight: 1 },
        { id: 'Q8_continuity', label: 'Forretningskontinuitetsplan på plass', weight: 1 }
      ]
    },

    // Dimension 5: Automation and Artificial Intelligence (Q9)
    {
      id: 'Q9',
      dimensionId: 'automation',
      type: 'scale-0-5',
      title: 'Automatisering og AI-teknologier',
      description: 'Status for automatisering og AI-teknologier i bedriften',
      weight: 1,
      scaleLabels: ['Brukes ikke', 'Vurderer', 'Prototype', 'Testing', 'Implementering', 'I bruk']
    },

    // Dimension 6: Green Digitalization (Q10-Q11)
    {
      id: 'Q10',
      dimensionId: 'greenDigitalization',
      type: 'checkboxes',
      title: 'Digitale teknologier for miljømessig bærekraft',
      description: 'Hvordan bruker bedriften digitale teknologier for bærekraft?',
      weight: 1,
      options: [
        { id: 'Q10_business_model', label: 'Bærekraftig forretningsmodell', weight: 1 },
        { id: 'Q10_services', label: 'Bærekraftig tjenestetilbud', weight: 1 },
        { id: 'Q10_products', label: 'Bærekraftige produkter', weight: 1 },
        { id: 'Q10_production', label: 'Bærekraftige produksjonsmetoder', weight: 1 },
        { id: 'Q10_emissions', label: 'Utslipp og avfallshåndtering', weight: 1 },
        { id: 'Q10_energy', label: 'Bærekraftig energiproduksjon', weight: 1 },
        { id: 'Q10_materials', label: 'Optimalisering av råmaterialforbruk', weight: 1 },
        { id: 'Q10_transport', label: 'Reduksjon av transport- og emballasjekostnader', weight: 1 },
        { id: 'Q10_behavior', label: 'Digitale applikasjoner for ansvarlig forbrukeratferd', weight: 1 },
        { id: 'Q10_paperless', label: 'Papirløse administrative prosesser', weight: 1 }
      ]
    },
    {
      id: 'Q11',
      dimensionId: 'greenDigitalization',
      type: 'tri-state',
      title: 'Miljøhensyn i digitale valg',
      description: 'Tar bedriften hensyn til miljøpåvirkninger i sine digitale valg?',
      weight: 1,
      triLabels: {
        yes: 'ui.yes',
        partial: 'ui.partial', 
        no: 'ui.no'
      }
    }
  ]
};

export default dmaNo_v1;