import { AssessmentSpec } from '@/types/assessment';

export const dmaNo_v1: AssessmentSpec = {
  version: '1.0.0',
  language: 'no',
  dimensions: [
    { 
      id: 'digitalStrategy', 
      name: 'Digital Forretningsstrategi', 
      weight: 1, 
      targetLevel: 1,
      description: 'Digital forretningsstrategi og investeringsplaner' 
    },
    { 
      id: 'digitalReadiness', 
      name: 'Digital Beredskap', 
      weight: 1, 
      targetLevel: 1,
      description: 'Bruk av grunnleggende og avanserte digitale teknologier' 
    },
    { 
      id: 'humanCentric', 
      name: 'Menneskelig Digitalisering', 
      weight: 1, 
      targetLevel: 1,
      description: 'Kompetanse og engasjement for digitale teknologier' 
    },
    { 
      id: 'dataManagement', 
      name: 'Dataforvaltning og Tilkobling', 
      weight: 1, 
      targetLevel: 1,
      description: 'Databehandling, integrering og cybersikkerhet' 
    },
    { 
      id: 'automation', 
      name: 'Automatisering og KI', 
      weight: 1, 
      targetLevel: 1,
      description: 'Automatisering og kunstig intelligens' 
    },
    { 
      id: 'greenDigitalization', 
      name: 'Grønn Digitalisering', 
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
      type: 'table-dual-checkboxes',
      title: 'På hvilke av følgende forretningsområder har bedriften din allerede investert i digitalisering, og hvilke planlegger den å investere i fremtiden?',
      description: 'Velg alle alternativer som gjelder:',
      weight: 1,
      rows: [
        { id: 'product-service-design', label: 'Produkt-/tjenestedesign inkl. forskning, utvikling og innovasjon' },
        { id: 'project-planning', label: 'Prosjektplanlegging og-ledelse' },
        { id: 'operations', label: 'Drift (produksjon av fysiske varer/produksjon, pakking, vedlikehold, tjenester osv.)' },
        { id: 'collaboration', label: 'Samarbeid med andre interne lokasjoner eller andre selskaper i verdikjeden' },
        { id: 'inbound-logistics', label: 'Innkommende logistikk og lager' },
        { id: 'marketing-sales', label: 'Markedsføring, salg og kundeservice (kundebehandling, ordrebehandling, brukerstøtte, osv.)' },
        { id: 'delivery', label: 'Levering (utgående logistikk, eFaktura, osv.)' },
        { id: 'administration', label: 'Administrasjon og personalforvaltning' },
        { id: 'procurement', label: 'Innkjøp og anskaffelser' },
        { id: 'security-compliance', label: '(Cyber)sikkerhet og overholdelse av bestemmelser om personopplysninger/GDPR' }
      ],
      columns: {
        left: { id: 'already-invested', label: 'Har allerede investert', weight: 1 },
        right: { id: 'planning-to-invest', label: 'Planlegger å investere', weight: 0.5 }
      }
    },
    {
      id: 'Q2',
      dimensionId: 'digitalStrategy',
      type: 'checkboxes',
      title: 'På hvilke av følgende måter er din bedrift forberedt på (mer) digitalisering?',
      description: 'Velg alle alternativer som gjelder:',
      weight: 1,
      options: [
        { id: 'needs-identified', label: 'Digitaliseringsbehov er identifisert og er i tråd med forretningsmål', weight: 1 },
        { id: 'financial-resources', label: 'Finansielle ressurser (egne midler, tilskudd, lån) identifiseres for å sikre digitalisering i løpet av minst det neste året', weight: 1 },
        { id: 'ict-infrastructure', label: 'IKT-infrastrukturer er klare til å støtte digitaliseringsplaner', weight: 1 },
        { id: 'ict-specialists', label: 'IKT-spesialister er ansatt/innleid (eller ansettelses-/underleverandørbehov er identifisert)', weight: 1 },
        { id: 'management-ready', label: 'Bedriftens ledelse er klar til å lede de nødvendige organisasjonsendringene', weight: 1 },
        { id: 'departments-ready', label: 'Forretningsavdelinger som dette gjelder og deres ansatte er klare til å støtte digitaliseringsplaner', weight: 1 },
        { id: 'processes-adaptable', label: 'Forretningsutformingen og driftsprosesser kan tilpasses ved behov ved digitalisering', weight: 1 },
        { id: 'servitization', label: 'Produserte produkter er allerede kommersialisert som en tjeneste (såkalt servitisering) eller supplert med tjenester aktivert av digitale teknologier', weight: 1 },
        { id: 'customer-satisfaction', label: 'Kunders og partneres tilfredshet med nettbaserte tjenester/interaksjoner overvåkes regelmessig (på sosiale mediekanaler, e-handelsoperasjoner, e-postutveksling osv.)', weight: 1 },
        { id: 'risk-evaluation', label: 'Risikoer ved digitalisering (f.eks, effekter som ikke har vært planlagt på andre forretningsområder) evalueres', weight: 1 }
      ]
    },

    // Dimension 2: Digital Readiness (Q3-Q4)
    {
      id: 'Q3',
      dimensionId: 'digitalReadiness',
      type: 'checkboxes',
      title: 'Hvilke av følgende digitale teknologier og løsninger brukes allerede av din bedrift?',
      description: 'Velg alle alternativer som gjelder ved å huke av hver enkelt.',
      weight: 1,
      options: [
        { id: 'connectivity-infrastructure', label: 'Tilkoblingsinfrastruktur (høyhastighetsinternett (fiber), skydatatjenester, ekstern tilgang til kontorsystemer)', weight: 1 },
        { id: 'company-website', label: 'Bedriftens nettside', weight: 1 },
        { id: 'web-forms-blogs', label: 'Nettbaserte skjemaer eller blogger/fora for å kommunisere med kunder', weight: 1 },
        { id: 'live-chat-social', label: 'Live chat, sosiale nettverk og chatbots for å kommunisere med kunder', weight: 1 },
        { id: 'e-commerce', label: 'E-handelssalg (bedrift-til-forbruker, bedrift-til-bedrift)', weight: 1 },
        { id: 'e-marketing', label: 'E-markedsføring (nettannonser, sosiale medier for bedrifter, osv.)', weight: 1 },
        { id: 'e-government', label: 'E-forvaltning (interaksjon med offentlige myndigheter inkludert offentlige anskaffelser)', weight: 1 },
        { id: 'remote-collaboration', label: 'Fjernsamarbeidsverktøy (f.eks. fjernarbeidsplattform, videokonferanser, virtuell læring, bedriftsspesifikke)', weight: 1 },
        { id: 'intranet', label: 'Intern nettportal (intranett)', weight: 1 },
        { id: 'management-systems', label: 'Informasjonsstyringssystemer (f.eks. virksomhetens ressursplanlegging, regnskap, personalledelse,kunderelasjoner, styring av forsyningskjede, e-fakturering)', weight: 1 }
      ]
    },
    {
      id: 'Q4',
      dimensionId: 'digitalReadiness',
      type: 'scale-table',
      title: 'Hvilken av følgende avanserte digitale teknologiene er allerede i bruk i din bedrift?',
      description: 'Vurder alle alternativer som gjelder ved å bruke en skala fra 0-5 (0=Ikke brukt, 1=Vurderer å bruke, 2=Prototype, 3=Testing, 4=Implementering, 5=I bruk):',
      weight: 1,
      rows: [
        { id: 'simulation-digital-twins', label: 'Simulering og digitale tvillinger (dvs. digitale representasjoner av fysiske objekter/prosesser i sanntid)' },
        { id: 'vr-ar', label: 'Virtuell virkelighet, utvidet virkelighet' },
        { id: 'cad-cam', label: 'Datastyrt design (CAD) og produksjon (CAM)' },
        { id: 'manufacturing-execution', label: 'Systemer for utføring av produksjon' },
        { id: 'iot-iiot', label: 'Internett (IoT) og industrielt internett (I-IoT)' },
        { id: 'blockchain', label: 'Blokkjede-teknologi' },
        { id: 'additive-manufacturing', label: 'Additiv produksjon (for eks. 3D printere)' }
      ],
      scaleLabels: ['Ikke brukt', 'Vurderer å bruke', 'Prototyping', 'Testing', 'Implementering', 'I bruk']
    },

    // Dimension 3: Human-Centric Digitalization (Q5-Q6)
    {
      id: 'Q5',
      dimensionId: 'humanCentric',
      type: 'checkboxes',
      title: 'Hva gjør din bedrift for å om-og oppgradere sine ansatte for digitalisering?',
      description: 'Velg alle alternativer som gjelder:',
      weight: 1,
      options: [
        { id: 'skills-assessment', label: 'Gjennomfører vurderinger av personalets ferdigheter til å identifisere ferdighetshullene', weight: 1 },
        { id: 'training-plan', label: 'Utformer en opplæringsplan for å trene og oppgradere personalet', weight: 1 },
        { id: 'short-training', label: 'Organiserer korte treningsøkter, gir opplæring/veiledninger og andre e-læringsressurser', weight: 1 },
        { id: 'experiential-learning', label: 'Tilrettelegger for erfaringslæring/fagfellebasert opplæring/muligheter for eksperimentering', weight: 1 },
        { id: 'internships', label: 'Tilbyr praksisplasser og jobbplasseringer innen sentrale kapasitetsområder', weight: 1 },
        { id: 'external-training', label: 'Sponser ansattes deltakelse i opplæring organisert av eksterne organisasjoner (opplæringstilbydere, akademia, leverandører)', weight: 1 },
        { id: 'subsidized-training', label: 'Benytter seg av subsidierte opplærings- og kompetanseopplegg', weight: 1 }
      ]
    },
    {
      id: 'Q6',
      dimensionId: 'humanCentric',
      type: 'checkboxes',
      title: 'Når man tar i bruk nye digitale løsninger, hvordan engasjerer og styrker bedriften din sine ansatte?',
      description: 'Velg alle alternativer som gjelder:',
      weight: 1,
      options: [
        { id: 'awareness', label: 'Legger til rette for ansattes bevissthet om nye digitale teknologier', weight: 1 },
        { id: 'transparent-communication', label: 'Formidler digitaliseringsplaner til ansatte på en transparent og inkluderende måte', weight: 1 },
        { id: 'monitor-acceptance', label: 'Overvåker personalets aksept og iverksetter tiltak for å dempe de potensielle bivirkningene (f.eks. frykt for å endre; "alltid på"-kultur kontra balanse mellom arbeid og privatliv; beskyttelse mot risikoer for brudd på personvernet osv.)', weight: 1 },
        { id: 'involve-employees', label: 'Involverer ansatte (inkludert ikke-IKT ansatte) i design og utvikling av digitalisering av produkt/tjeneste/prosesser', weight: 1 },
        { id: 'autonomy-tools', label: 'Gir ansatte mer autonomi og hensiktsmessige digitale verktøy for å ta og gjennomføre beslutninger', weight: 1 },
        { id: 'adapt-jobs', label: 'Gjør om/tilpasser jobber og arbeidsfløter for å støtte måtene ansatte faktisk ønsker å jobbe på', weight: 1 },
        { id: 'flexible-work', label: 'Legger tilrette for mer fleksible arbeidsordninger muliggjort av digitalisering (f.eks. fjernarbeid)', weight: 1 },
        { id: 'support-team', label: 'Stiller et digitalt støtteteam/en digital tjeneste (internt/eksternt) til disposisjon for personalet', weight: 1 }
      ]
    },

    // Dimension 4: Data Management and Connectivity (Q7-Q8)
    {
      id: 'Q7',
      dimensionId: 'dataManagement',
      type: 'checkboxes',
      title: 'Hvordan administreres bedriftens data (dvs. lagres, organiseres, åpnes og utnyttes)?',
      description: 'Velg alle alternativer som gjelder:',
      weight: 1,
      options: [
        { id: 'data-governance', label: 'Organisasjonen har laget retningslinjer/plan/tiltakssett for databehandling', weight: 1 },
        { id: 'no-digital-collection', label: 'Data samles ikke inn digitalt', weight: -1 }, // Negative indicator
        { id: 'digital-storage', label: 'Relevante data lagres digitalt (f.eks. kontorapplikasjoner, e-postmapper, frittstående applikasjoner, CRM- eller ERP-system, etc.)', weight: 1 },
        { id: 'data-integration', label: 'Data er riktig integrert (f.eks. gjennom interoperable systemer, applikasjonsprogrammeringsgrensesnitt) selv når de er distribuert mellom forskjellige systemer', weight: 1 },
        { id: 'real-time-access', label: 'Data er tilgjengelig i sanntid fra forskjellige enheter og steder', weight: 1 },
        { id: 'systematic-analysis', label: 'Innsamlede data analyseres systematisk og rapporteres for beslutningstaking', weight: 1 },
        { id: 'external-enrichment', label: 'Dataanalyse berikes ved å kombinere eksterne kilder med egne data', weight: 1 },
        { id: 'self-service-analytics', label: 'Dataanalyse er tilgjengelig uten behov for eksperthjelp på regelmessig basis (f.eks. gjennom dashbord)', weight: 1 }
      ]
    },
    {
      id: 'Q8',
      dimensionId: 'dataManagement',
      type: 'checkboxes',
      title: 'Er din bedrift sine data tilstrekkelig sikre?',
      description: 'Velg alle alternativer som gjelder:',
      weight: 1,
      options: [
        { id: 'security-policies', label: 'Bedriftsretningslinjer for datasikkerhet/tiltakssett er på plass', weight: 1 },
        { id: 'customer-data-protection', label: 'Alle kunderelaterte data er beskyttet mot cyberangrep', weight: 1 },
        { id: 'security-training', label: 'Personalet får regelmessig informasjon og opplæring i cybersikkerhet og personvernproblemer/risikoer', weight: 1 },
        { id: 'threat-monitoring', label: 'Cybertrusler overvåkes og evalueres jevnlig', weight: 1 },
        { id: 'backup-maintained', label: 'En fullstendig sikkerhetskopi av kritiske bedriftsdata opprettholdes (på stedet/i skyen)', weight: 1 },
        { id: 'business-continuity', label: 'En forretningskontinuitetsplan er på plass i tilfelle katastrofale feil (f.eks. all data låst av et løsepengevirusangrep eller fysisk skade på IT-infrastrukturen)', weight: 1 }
      ]
    },

    // Dimension 5: Automation and Artificial Intelligence (Q9)
    {
      id: 'Q9',
      dimensionId: 'automation',
      type: 'scale-table',
      title: 'Hvilke av følgende teknologier og forretningsapplikasjoner bruker bedriften din allerede?',
      description: 'Vurder alle alternativer som gjelder ved å bruke en skala fra 0-5 (0=Brukes ikke, 1=Vurderer å bruke, 2=Lager prototyper, 3=Tester, 4=Implementerer, 5=I bruk):',
      weight: 1,
      rows: [
        { id: 'nlp', label: 'Naturlig språkbehandling inkl. chatbots, tekstutvinning, maskinoversettelse, følelsesanalyse' },
        { id: 'computer-vision', label: 'Datasyn / bildegjenkjenning' },
        { id: 'speech-processing', label: 'Lydbehandling / talegjenkjenning,-behandling og-syntese' },
        { id: 'robotics', label: 'Robotikk og autonome enheter' },
        { id: 'business-intelligence', label: 'Forretningsinnsikt (BI), dataanalyse, beslutningsstøttesystemer, anbefalingssystemer, intelligente kontrollsystemer' }
      ],
      scaleLabels: ['Ikke brukt', 'Vurderer å bruke', 'Prototyping', 'Testing', 'Implementering', 'I bruk']
    },

    // Dimension 6: Green Digitalization (Q10-Q11)
    {
      id: 'Q10',
      dimensionId: 'greenDigitalization',
      type: 'checkboxes',
      title: 'Hvordan bruker din bedrift digitale teknologier for å bidra til miljømessig bærekraft?',
      description: 'Velg alle alternativer som gjelder:',
      weight: 1,
      options: [
        { id: 'sustainable-business-model', label: 'Bærekraftig forretningsmodell (f.eks. sirkulær økonomimodell, produkt-som-tjeneste)', weight: 1 },
        { id: 'sustainable-services', label: 'Bærekraftig tjenestetilbud (f.eks. brukssporing for videre gjenbruk av andre brukere)', weight: 1 },
        { id: 'sustainable-products', label: 'Bærekraftige produkter (f.eks. økodesign, planlegging av hele produktets livssyklus, endt levetid og forlengelse av levetid)', weight: 1 },
        { id: 'sustainable-production', label: 'Bærekraftige produksjons- og produksjonsmetoder, materialer og komponenter (inkl. håndtering av endt levetid)', weight: 1 },
        { id: 'emissions-management', label: 'Utslipp, forurensning og/eller avfallshåndtering', weight: 1 },
        { id: 'sustainable-energy', label: 'Bærekraftig energiproduksjon i eget anlegg', weight: 1 },
        { id: 'material-optimization', label: 'Optimalisering av råmaterialforbruk/kostnad', weight: 1 },
        { id: 'transport-reduction', label: 'Reduksjon av transport- og emballasjekostnader', weight: 1 },
        { id: 'responsible-consumption', label: 'Digitale applikasjoner for å oppmuntre til ansvarlig forbrukeratferd', weight: 1 },
        { id: 'paperless-processes', label: 'Papirløse administrative prosesser', weight: 1 }
      ]
    },
    {
      id: 'Q11',
      dimensionId: 'greenDigitalization',
      type: 'tri-state-table',
      title: 'Tar bedriften din hensyn til miljøpåvirkninger i sine digitale valg og praksis?',
      description: 'Grader alle alternativene som gjelder ved å bruke skalaen: Nei, Delvis, Ja',
      weight: 1,
      rows: [
        { id: 'environmental-strategy', label: 'Miljøhensyn og standarder er integrert i bedriftens digitale strategi' },
        { id: 'environmental-management', label: 'Et miljøstyringssystem/sertifisering er implementert' },
        { id: 'procurement-criteria', label: 'Miljøaspekter er en del av digitale teknologier/leverandørers anskaffelseskriterier' },
        { id: 'energy-monitoring', label: 'Energiforbruket til digitale teknologier og datalagring overvåkes og optimaliseres' },
        { id: 'equipment-recycling', label: 'Resirkulering/gjenbruk av gammelt teknologisk utstyr praktiseres aktivt av bedriften' }
      ],
      triLabels: {
        yes: 'ui.yes',
        partial: 'ui.partial', 
        no: 'ui.no'
      }
    }
  ]
};

export default dmaNo_v1;