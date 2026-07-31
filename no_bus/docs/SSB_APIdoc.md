 API mot Statistikkbanken – brukereiledning
Via PxWebApi 2 kan man hente ut data fra alle tabeller i SSBs statistikkbank med http GET. Spørringen kan dermed være definert i selve URL-en.

Du kan hente hele tabeller eller deler av tabeller. Grensene per uttrekk er 800.000 dataceller, og antall spørringer er for tiden 30 per minutt. Grensen er per ip-adresse, og kan dermed gjelde for mange kollegaer på samme arbeidsplass. Se https://data.ssb.no/api/pxwebapi/v2/config.

API-et benytter Creative Commons-lisensen CC BY 4.0. 

Se også spesifikasjon på GitHub PxApiSpecs  og OpenAPI Specification.

Innhold

Finne tabeller
Grunnleggende informasjon om tabellen
Metadata for tabellen
Hente data fra tabell
Spørringer mot en tabell
Utformater
Eliminasjon
Verdimengder
Grupperinger (aggregering eller seleksjon)
Fotnoter
Post-spørringer
Responskoder
Kjente mangler
Annet
Eksempler på kode for bruk av API-et
Kontakt
1. Finne tabeller 

Du kan finne tabeller 

Via statistikkbankens grensesnitt PxWeb: https://www.ssb.no/statbank kan du lete opp og vise tabeller. Under den genererte tabellen ligger "API-spørring for denne tabellen". URL-en for PxWebApi 2 kan du kopiere eller redigere videre som forklart under punktet Spørringer mot en tabell.
eller via selve API-et: https://data.ssb.no/api/pxwebapi/v2/tables lister opp alle tabeller. Parameter pagesize angir hvor mange tabeller som tas med per side. Parameter pagenumber angir sidenummer i trefflista. 
Søk etter tabeller med parameter query 

Parameteren query søker i utgangspunktet i tabelltitler, variabler og variabelverdier. Søket er case-insensitivt. Filteret title begrenser søket til tittelfeltet. 

Eksempler: 

Søk etter teksten "kakemiks" i alle tabeller:
https://data.ssb.no/api/pxwebapi/v2/tables?query=kakemiks
 
Søk etter tabeller publisert på en gitt dato eller i et gitt tidsintervall:
https://data.ssb.no/api/pxwebapi/v2/tables/?query=updated:20250908*
https://data.ssb.no/api/pxwebapi/v2/tables/?query=updated:[20250908 TO 20250912*]
 
Søk etter "trend" og ord som begynner på "anlegg", (trunkeringstegn *):
https://data.ssb.no/api/pxwebapi/v2/tables?query=trend AND anlegg*
 
Søk etter "varenummer" og "HS" mindre enn 5 ord fra hverandre, (nærhetsoperator ~):
https://data.ssb.no/api/pxwebapi/v2/tables?query="varenummer hs" ~5
 
Søk etter ikke avslutta tabeller der tabelltittel inneholder "barn":
https://data.ssb.no/api/pxwebapi/v2/tables?query=title:barn&includeDiscontinued=false
 
Søk etter ikke avslutta tabeller der tittelen inneholder "foretak" og der fylke (F) er laveste regionale inndeling:
https://data.ssb.no/api/pxwebapi/v2/tables?lang=no&query=title:foretak AND title:(F)&includeDiscontinued=false
Søk etter tabeller som nylig er oppdatert 

Bruk parameter pastdays om du ønsker å finne tabeller som er oppdatert i løpet av f.eks. de 3 siste dagene: https://data.ssb.no/api/pxwebapi/v2/tables?pastdays=3 

2. Grunnleggende informasjon om tabellen 

Basisinformasjon om tabellen kan hentes med URL på formen 

https://data.ssb.no/api/pxwebapi/v2/tables/fem-sifret tabellnummer?lang=no 

Eksempel fra tabell 05810: https://data.ssb.no/api/pxwebapi/v2/tables/05810?lang=no 

Viser utsnitt av basisinformasjon om tabell 05810.
Her ser du blant annet tabelltittel (label), første og siste periode i tidsserien (firstPeriod og lastPeriod) og hvilke variabler som inngår (variableNames). Path viser tabellens plassering(er) i emnestrukturen. 
De samme metadata på engelsk får du med https://data.ssb.no/api/pxwebapi/v2/tables/05810?lang=en. 

3. Metadata for tabellen 

Utfyllende metadata for et gitt tabellnummer kan hentes med URL på formen https://data.ssb.no/api/pxwebapi/v2/tables/fem-sifret tabellnummer/metadata?lang=no . Metadataene vises i format json-stat2, der objekter vises som { } og lister som [ ]. Utsnitt herfra kan brukes til å lage spørringen. 

Eksempel fra tabell 05810: https://data.ssb.no/api/pxwebapi/v2/tables/05810/metadata?lang=no

Viser utsnitt av metadata for tabell 05810.
Metadataene består av en tabelltittel label (nivå 1) samt en liste over variabler for tabellen. For variabelobjektene dimension (nivå 2) er de viktigste egenskapene: 

Variabelident (id) 
Variabelnavn (label) 
Eliminasjon (elimination) 
Hvert variabelobjekt inneholder to lister (nivå 3), en med verdikoder index og en med presentasjonstekster for verdiene label. 

Viser metadata for dimension kjønn tabell 05810.
For statistikkvariabler er alltid unit (måleenhet) og decimals (antall desimaler) oppgitt. Refperiod (referanstidspunkt) vil ofte være oppgitt.

Per statistikkvariabel kan det under extension finnes: 

Måletype (measuringType: Stock, Flow, Average, Other)
Pristype (priceType: Current, Fixed, NotApplicable) 
Sesong- og kalenderjustering (adjustment: SesOnly, WorkOnly, WorkAndSes, None) 
Basisperiode (basePeriod) 
Viser metadata for statistikkvariabel i tabell 05810.
4. Hente data fra tabell 

Data (tall) for et gitt tabellnummer kan hentes med URL på formen https://data.ssb.no/api/pxwebapi/v2/tables/fem-sifret tabellnummer/data?lang=no . 

For tabell 05810 vil https://data.ssb.no/api/pxwebapi/v2/tables/05810/data?lang=no gi en tabell fordelt på kjønn og alder for nyeste periode. Dette tilsvarer den default-uttrekket som man får når man velger samme tabell i PxWeb. Vær obs på at i default-tabellen vil kun to dimensjoner vise flere enn en verdi. For å hente ut tall i flere dimensjoner, må man presisere dette i API-spørringen (se punktet Spørringer mot en tabell). 

Default format er json-stat2, men du kan også velge andre formater (se punktet Utformater).

5. Spørringer mot en tabell 

Du kan bruke PxWeb for å bygge opp API-spørringer, eller du kan benytte applikasjoner som Postman, Hoppscotch eller lignende for å konstruere dine egne spørringer. I denne veiledningen viser vi eksempler på spørringer via Postman. 

Parametre til bruk i spørringer 

Bruk parameter lang om du ønsker engelsk språk. Default språk er norsk. 

For å angi variabel og verdier, bruk valueCodes[variabel-id]=verdi-index1, verdi-index2 etc. 

Du kan presisere en av flere kodelister til variabelen, bruk codeList[variabel-id]=kodeliste-id 

Om kodelista er en gruppering, kan du bruke outputValues[variabel-id]=aggregated|single for å spesifisere om du ønsker aggregerte eller enkeltverdier. 

Bruk outputformat om du ønsker å få ut noe annet enn default format. 

Trunkere med asterisk, maskere enkelttegn med spørsmålstegn 

I dette eksemplet fra tabell 03013 henter vi tall for statistikkvariabel (ContentsCode) KpiIndMnd for alle konsumgrupper med tosifret kode (??) og for alle måneder i 2020 (2020*): 

Utsnitt av tabell 03013 med tosifret kode (??) og for alle måneder i 2020 (2020*).
URL-en som blir laget ser da slik ut: https://data.ssb.no/api/pxwebapi/v2/tables/03013/data?valueCodes[Konsumgrp]=??&valueCodes[ContentsCode]=KpiIndMnd&valueCodes[Tid]=2020*

Det er mulig å sette trunkeringstegn både foran og bak søketermen. 

Hente de nyeste periodene, eller første verdiene 

Ønsker du tall for de n nyeste månedene, kan du bruke top(n): 


URL: https://data.ssb.no/api/pxwebapi/v2/tables/03013/data?valueCodes[Konsumgrp]=??&valueCodes[ContentsCode]=KpiIndMnd&valueCodes[Tid]=top(3)

Med [top(n, start)] kan du hente n verdier fra og med start-posisjonen. Bottom fungerer på samme måte som top, men henter verdier fra slutten av lista. 

Hente alle verdier fra en gitt startverdi 

Ønsker du tall for alle verdier fra startverdi x, kan du bruke from(x): 

Utsnitt av tabell 03013 for alle verdier fra startverdi.
URL: https://data.ssb.no/api/pxwebapi/v2/tables/03013/data?valueCodes[Konsumgrp]=??&valueCodes[ContentsCode]=KpiIndMnd&valueCodes[Tid]=from(2022M01) 

Hente alle verdier i et gitt spenn 

Du kan bruke [range (x,y)] for å hente alle verdier i spennet fra x til y: 

Utsnitt av tabell 03013 for å hente alle verdier i spennet fra x til y.
URL: https://data.ssb.no/api/pxwebapi/v2/tables/03013/data?valueCodes[Konsumgrp]=[range(01.1,02.2)]&valueCodes[ContentsCode]=KpiIndMnd&valueCodes[Tid]=from(2022M01)

6. Utformater 

API-et kan gi resultatet i 7 hovedformater: 

json-stat2  (default) 
csv (tekstformat) 
px (brukes i PxWeb og PxWin) 
xlsx (Excel) 
html 
json-px 
parquet 
For formatene csv, html og xlsx kan du spesifisere visning av kode/tekst og tabelltittel:

UseCodes (vis koder) 
UseTexts (vis tekst) 
UseCodesAndTexts (vis koder og tekst) 
IncludeTitle (ta med tabelltittel) 
Og for csv-filer kan du velge mellom ulike skilletegn: 

SeparatorTab (tabulator mellom kolonner) 
SparatorSpace (mellomrom mellom kolonner) 
SeparatorSemicolon (semikolon mellom kolonner) 
Eksempel: 

Utsnitt av tabell 03024 med utformat.
URL: https://data.ssb.no/api/pxwebapi/v2/tables/03024/data?valuecodes[ContentsCode]=*&valuecodes[Varegrupper2]=*&stub=VareGrupper2,Tid&heading=ContentsCode&valuecodes[Tid]=top(3)&outputformat=csv&outputformatparams=separatorsemicolon,usecodesandtexts 

Ved utformatene csv, html og xlsx bruker du stub for å angi hvilke variabler du vil plassere i forspalten av tabellen og heading for de variablene du vil plassere i tabellhodet. 

Om du plasserer alle variabler i stub, får du en såkalt pivotvennlig tabell: 
https://data.ssb.no/api/pxwebapi/v2/tables/03024/data?valuecodes[ContentsCode]=*&valuecodes[Varegrupper2]=*&stub=VareGrupper2,Tid,ContentsCode&valuecodes[Tid]=top(3)&outputformat=csv&outputformatparams=separatorsemicolon,usecodesandtexts 

Desimalskilletegn er . (punktum) for alle språk og alle formater, unntatt Excel på norsk der desimalskilletegnet er komma. 

7. Eliminasjon 

En eliminerbar variabel kan tas helt vekk fra spørringen. 

Er variabelen eliminerbar (true) vises: 

enten en eliminasjonsverdi, vanligvis summen 
eller så aggregeres samtlige verdier til en 
Er variabelen ikke eliminerbar (false), må man velge noe fra den. Tid og statistikkvariabel (ContentsCode) er ikke eliminerbar. 

8. Verdimengder 

En variabel kan ha flere verdimengder (valuesets) tilknyttet. Disse vil i så fall være listet opp under endepunkt metadata, angitt som codeLists/vs. Eksempelvis kan regionvariabelen ha både fylkesliste og kommuneliste: 
https://data.ssb.no/api/pxwebapi/v2/codeLists/vs_Fylker?lang=no 

https://data.ssb.no/api/pxwebapi/v2/codeLists/vs_Kommun?lang=no 

Du kan spesifisere hvilken verdimengde du vil hente tall fra med codelist: https://data.ssb.no/api/pxwebapi/v2/tables/01222/data?valueCodes[Region]=*&valueCodes[ContentsCode]=Folketallet1&valueCodes[Tid]=from(2022K1)&codelist[Region]=vs_Fylker

9. Grupperinger (aggregering eller seleksjon) 

En variabel kan ha grupperinger tilknyttet. Grupperinger vil i så fall vises under endepunkt metadata, angitt som codeLists/agg. Et eksempel fra https://data.ssb.no/api/pxwebapi/v2/tables/07459/metadata er Kommuner 2024, sammenslåtte tidsserier: 

Utsnitt av tabell 07459 om gruppering agg_KommSummer
Fra https://data.ssb.no/api/pxwebapi/v2/codeLists/agg_KommSummer?lang=no kan du se hvordan grupperingen er bygget opp: 

Utsnitt av tabell 07459 om grupperinger.
Under valueMap kan du se hvilke kommunekoder som summeres opp til gruppekodene K-3101, K-3203 osv. Grupperingen benyttes sammen med outputValues[Region]= aggregated for å velge ut aggregerte tall, her for å summere opp tall for sammenslåtte kommuner og kommuner som har byttet kode i løpet av årene. Eksempel for Moss, som i 2020 ble slått sammen av kommunene 0104 og 0136, og som i 2024 byttet kode fra 3002 til 3103: 

https://data.ssb.no/api/pxwebapi/v2/tables/07459/data?lang=no&valueCodes[Region]=K-3103&valueCodes[Tid]=*&valueCodes[ContentsCode]=Personer1&codelist[Region]=agg_KommSummer&outputValues[Region]=aggregated  
 
Et annet eksempel fra samme tabell er Fylker 2024-: 

Utsnitt av tabell 07459 med gruppering agg_Fylker2024
Fra https://data.ssb.no/api/pxwebapi/v2/codeLists/agg_Fylker2024?lang=no kan du se hvordan grupperingen er bygget opp: 

Utsnitt av tabell07459 viser hvordan grupperingen er bygget opp.
Her er code og valueMap like. Grupperingen benyttes sammen med outputValues[Region]= single for å velge ut noen verdier fra den fulle lista, i dette tilfellet den nyeste fylkesinndelingen. Eksempel: 
https://data.ssb.no/api/pxwebapi/v2/tables/07459/data?lang=no&valueCodes[Region]=*&valueCodes[ContentsCode]=Personer1&valueCodes[Tid]=top(1)&codelist[Region]=agg_Fylker2024&outputValues[Region]=single 

10. Fotnoter 

Eventuelle fotnoter er oppgitt under note, og kan være tilknyttet tabell, variabel eller verdi. Flere fotnoter kan være tilknyttet samme element. De er da adskilt med hermetegn og komma. Se f.eks. 
https://data.ssb.no/api/pxwebapi/v2/tables/12880/metadata. 

11. Post-spørringer 

PxWebApi 2 støtter også POST-spørringer. Se eksempel på https://github.com/janbrus/ssb-api-python-examples/blob/master/PxWebApi2/laks_nor.ipynb 

12. Responskoder 

Mulige feilkoder dersom spørringen ikke gir svar: 

400 – Feil syntaks i spørringen. 

403 – Sperre ved spørring om for stort datasett. API-ets grense er 800 000 celler (inkl. tomme celler). Statistikkbanken har ellers en grense på 300 000 celler. 

404 – Ressurs ikke funnet. Kan skyldes feilstavet URL eller URL som overskrider grensa på ca. 2100 tegn. 

429 – For mange spørringer. Grensen er 30 spørringer per minutt. Flere store spørringer bør uansett kjøres i sekvens. Vent til du har fått respons på den forrige, før du fyrer av den neste. 

503 – Utilgjengelig tjeneste. 

13. Kjente mangler 

Endepunkt navigation er inntil videre tatt bort. I stedet viser endepunkt tables tabellens plassering(er) i emnestrukturen under paths. Oversikt over hele emnestrukturen finnes på https://www.ssb.no/xp/_/service/mimir/subjectStructurStatistics.

URL-en i GET-spørringen kan ikke overstige ca. 2100 tegn. I stedet for å ramse opp lange verdilister i spørringen, bruk * (asterisk), spørsmålstegn, from/to eller range.  

Vær også obs på at den GET-URL-en som PxWeb genererer alltid vil ramse opp akkurat de samme periodene som du valgte. I praksis vil man som oftest å ønske at spørringen skal ta med alle nyere perioder neste gang man kjører den. Da må du justere URL-en til valueCode[Tid]=* eller =from(starttidspunkt), alternativt =top(antall nyeste perioder).

14. Annet 

Hvordan bruke Statistikkbanken 

Før du bruker API-et bør du være fortrolig med Statistikkbanken. Vi viser til Statistikkbankens hjelpesider og instruksjonsvideoene.

Det er nyttig å følge med på siden som viser strukturelle endringer og tabeller som avsluttes og erstattes av nye. 

Det hender at flere verdier blir føyd til i eksisterende kodelister. Du vil derfor få en mer robust spørring ved å bruke * (asterisk) etter valueCode i stedet for å ramse opp alle verdiene.

Spesialtegn i URL

En del spesialtegn blir omkodet i URL :

 (mellomrom)

%20

+

%2B

"

%22

(

%28

)

%29

[

%5B

]

%5D

Hvis du benytter Postman til å lage spørringen, blir tegnene endret automatisk.

Spesialtegn i tabellene 

API-et kan vise spesialtegn i stedet for tall: 

. 

Ikke mulig å oppgi tall 

Tall finnes ikke på det dette tidspunktet, fordi kategorien ikke var i bruk da tallene ble samlet inn. 

.. 

Tallgrunnlag mangler 

Tall er ikke kommet inn i våre databaser eller er for usikre til å publiseres. 

: 

Vises ikke av konfidensialitetshensyn 

Tall publiseres ikke for å unngå å identifisere personer eller virksomheter. 

I json-stat2 vises spesialtegnene under status, mens data vises som null. 

JSON 

JSON-syntaks se: https://www.json.org. 

Vi anbefaler å ha en JSON viewer i nettleseren. Mange nettlesere har dette innebygd.  Du kan også hente inn tillegg som f.eks. https://jsonview.com.  

JSON-stat 

JSON-stat er et format spesielt utviklet for vise statistiske tabeller, altså datasett med mange dimensjoner. JSON-stat representerer verdiene i datakubene som et flatt array (row-major order). Det viser en trestruktur, med hovedelementene dataset, dimension og value med tilknyttet status. I tillegg er statistikkvariabel, geografiske variabler og tid tildelt egne roller ('role'), for enkel tilgang. 

JSON-stat benyttes av mange statistiske byråer, og API-ene til Eurostat og Verdensbanken. Det finnes dessuten ferdige biblioteker for bl.a.: Javascript, Python, R og Java.  
For mer informasjon om formatet og biblioteker, se https://json-stat.org/. 

JSON-stat Toolkit er nyttig, spesielt for javascript. For å forstå strukturen på JSON-stat anbefales å prøve ut JSON-stat explorer. Toolkit inkluderer også JSON-stat Command Line Conversion Tools. Disse fleksible konverteringsverktøyene der jsonstat2csv gir bedre tilpasset CSV. Denne forutsetter at node.js er installert. 

jsonstat2csv – converts JSON-stat into CSV 
arrow2jsonstat – converts an Apache Arrow file to JSON-stat 
csv2jsonstat – converts CSV into JSON-stat 
jsonstat2array – converts JSON-stat into an array of arrays 
jsonstat2arrobj – converts JSON-stat into an array of objects 
jsonstat2arrow – converts JSON-stat to the Apache Arrow format 
jsonstat2objarr – converts JSON-stat into an object of column-oriented arrays 
jsonstat2object – converts JSON-stat into a Google DataTable object 
jsonstatdice – creates JSON-stat from JSON-stat 
sdmx2jsonstat – converts SDMX(JSON) into JSON-stat - convert OECD, UN and IMF API-data to JSON-stat 
For JSON-stat eksempler i Javascript, se: https://observablehq.com/@jsonstat, https://github.com/badosa og https://bl.ocks.org/badosa. 

Lenker til klassifikasjoner og variabeldefinisjoner 

I JSON-stat datasettene lenker vi til en klassifikasjon slik: {"Kjonn": "urn:ssb:classification:klass:2"}. Tallet til slutt er en ID slik at urn:ssb:classification:klass:2 - kan omskrives til:  https://www.ssb.no/klass/klassifikasjoner/2   
eller denne adressen i Klass API: http://data.ssb.no/api/klass/v1/classifications/2

Variabeldefinisjoner angis i JSON-stat på formen {Kostnadsart: "urn:ssb:conceptvariable:vardok:1116"} der 1116 er en ID. Denne kan omskrives til https://www.ssb.no/a/metadata/conceptvariable/vardok/1116/nb. /nb angir språk. Språk kan være enten nb, nn eller en. Legger du til /xml etter /a får du XML. 

15. Eksempler på kode for bruk av API-et 

Se https://github.com/janbrus/ssb-api-python-examples/tree/master/PxWebApi2 for enkle kodeeksempler som bruker PxWebApi 2. 

16. Kontakt 

Kontakt statistikkbanken@ssb.no om du har spørsmål til tabellene eller API-et. 

Det er også mulig å gi tilbakemeldinger på GitHub: 

https://github.com/PxTools/PxApiSpecs 

https://github.com/PxTools/PxWebApi 
