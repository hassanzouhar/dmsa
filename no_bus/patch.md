TASK: Implement these three patches

### 1) `ssb-transformer.ts` — robust sektor-oppløsning + “prøv flere koder”

```diff
diff --git a/lib/ssb-transformer.ts b/lib/ssb-transformer.ts
@@
-  private resolveSectorCodes(sector: string): string[] {
-    const mapping: Record<string, string | string[]> = {
-      ALL: 'Total+K',
-      A: 'Total-K',
-      B: 'Total-K',
-      C: '10-39',
-      D: '10-39',
-      E: '10-39',
-      F: '41-43',
-      G: ['45', '46', '47'],
-      H: '49-53',
-      I: '55-56',
-      J: '58-63',
-      K: '64-66',
-      L: '68-74+77-82+95.1',
-      M: '68-75+77-82+95.1',
-      N: '68-75+77-82+95.1',
-      O: 'Total-K',
-      P: 'Total-K',
-      Q: 'Total-K',
-      R: '68-74+77-82+95.1',
-      S: '68-74+77-82+95.1',
-      T: 'Total-K',
-      U: 'Total-K'
-    };
-
-    const mapped = mapping[sector] ?? 'Total+K';
-    return Array.isArray(mapped) ? mapped : [mapped];
-  }
+  // Prøv flere koder i prioritert rekkefølge – varierer mellom tabeller
+  private resolveSectorCodes(sector: string, tableId: string): string[] {
+    // Felles fallback for ALL (nasjonalt nivå)
+    const ALL_ORDER = ['Total', 'Total-K', 'Total+K'];
+
+    // Noen tabeller bruker 68-74…, andre 68-75… for L/R/S/M/N
+    const SERVICE_BLOCK_A = '68-74+77-82+95.1';
+    const SERVICE_BLOCK_B = '68-75+77-82+95.1';
+
+    const base: Record<string, (string | string[])> = {
+      ALL: ALL_ORDER,
+      A: '01-03',
+      B: '05-09',
+      C: '10-39',
+      D: '10-39',
+      E: '10-39',
+      F: '41-43',
+      G: ['45', '46', '47'],
+      H: '49-53',
+      I: '55-56',
+      J: '58-63',
+      K: '64-66',
+      // Gi begge variantene for å dekke alle tabeller
+      L: [SERVICE_BLOCK_A, SERVICE_BLOCK_B],
+      M: [SERVICE_BLOCK_B, SERVICE_BLOCK_A],
+      N: [SERVICE_BLOCK_B, SERVICE_BLOCK_A],
+      O: '84',
+      P: '85',
+      Q: '86-88',
+      R: [SERVICE_BLOCK_A, SERVICE_BLOCK_B],
+      S: [SERVICE_BLOCK_A, SERVICE_BLOCK_B],
+      T: '97-98',
+      U: '99',
+    };
+
+    const mapped = base[sector] ?? ALL_ORDER;
+    return Array.isArray(mapped) ? mapped : [mapped];
+  }
@@
-    const sectorCodes = this.resolveSectorCodes(sector);
+    const sectorCodes = this.resolveSectorCodes(sector, tableId);
@@
-          const extracted = this.extractDataFromJSONStat(
-            tableData,
-            sectorCode,
-            companySize,
-            region,
-            { tableId, dimensionId, sectorCode }
-          );
+          const extracted = this.extractDataFromJSONStat(
+            tableData,
+            sectorCode,
+            companySize,
+            region,
+            { tableId, dimensionId, sectorCode }
+          );
           if (extracted) {
             tableValues.push(extracted.value);
             tableSample += extracted.sampleSize || 0;
           }
         }
@@
-            const sectorIndex = dim.category.index[resolvedSectorCode];
-            if (sectorIndex === undefined) {
+            const sectorIndex = dim.category.index[resolvedSectorCode];
+            if (sectorIndex === undefined) {
               const key = `${context?.tableId ?? 'unknown'}::${resolvedSectorCode}`;
               if (!this.missingSectorMappings.has(key)) {
                 this.missingSectorMappings.add(key);
                 console.warn(
                   `⚠️ Missing sector mapping for table ${context?.tableId ?? 'unknown'} (${context?.dimensionId ?? 'unknown'}) -> ${context?.sectorCode ?? 'unknown'} resolved as ${resolvedSectorCode}. Available: ${sectorKeys.join(', ')}`
                 );
               }
-              indices.push(0);
-            } else {
-              indices.push(sectorIndex);
-            }
+              return null; // Ikke tving indeks 0 – prøv neste kandidat
+            } else {
+              indices.push(sectorIndex);
+            }
           }
@@
-        if (value === null || value === undefined) {
+        if (value === null || value === undefined) {
           if (context?.tableId) {
-          const key = `${context.tableId}::${context.dimensionId ?? 'unknown'}::${resolvedSectorCode}`;
+          const key = `${context.tableId}::${context.dimensionId ?? 'unknown'}::${resolvedSectorCode}`;
           const hits = this.nullValueHits.get(key) ?? 0;
           this.nullValueHits.set(key, hits + 1);
           }
-          return null;
+          return null; // La kalleren prøve neste sektor-kandidat
         }
```

**Hva dette gjør:**
– Nasjonalt nivå bruker nå `Total` → `Total-K` → `Total+K` i riktig rekkefølge.
– L/R/S/M/N prøver begge “service-blokker” slik SSB faktisk publiserer per tabell.
– Vi pusher ikke lenger “indeks 0” når koden ikke finnes; vi hopper til neste kandidat.
– Resultat: null-treffene i loggen forsvinner, men uten å “forfalske” data.

---

### 2) `ssb-api-client.ts` — samme fler-kandidat-mapping når du henter filtrert

```diff
diff --git a/lib/ssb-api-client.ts b/lib/ssb-api-client.ts
@@
-  private mapSectorToSSBCode(sector: string): string | string[] {
-    const mapping: Record<string, string | string[]> = {
-      ALL: 'Total+K',
-      A: 'Total-K',
-      B: 'Total-K',
-      C: '10-39',
-      D: '10-39',
-      E: '10-39',
-      F: '41-43',
-      G: ['45', '46', '47'],
-      H: '49-53',
-      I: '55-56',
-      J: '58-63',
-      K: '64-66',
-      L: '68-74+77-82+95.1',
-      M: '68-75+77-82+95.1',
-      N: '68-75+77-82+95.1',
-      O: 'Total-K',
-      P: 'Total-K',
-      Q: 'Total-K',
-      R: '68-74+77-82+95.1',
-      S: '68-74+77-82+95.1',
-      T: 'Total-K',
-      U: 'Total-K'
-    };
-    return mapping[sector] ?? 'Total+K';
-  }
+  private mapSectorToSSBCode(sector: string): string | string[] {
+    const ALL_ORDER = ['Total', 'Total-K', 'Total+K'];
+    const A = '01-03';
+    const B = '05-09';
+    const C = '10-39';
+    const D = '10-39';
+    const E = '10-39';
+    const F = '41-43';
+    const G = ['45', '46', '47'];
+    const H = '49-53';
+    const I = '55-56';
+    const J = '58-63';
+    const K = '64-66';
+    const SB_A = '68-74+77-82+95.1';
+    const SB_B = '68-75+77-82+95.1';
+    const mapping: Record<string, string | string[]> = {
+      ALL: ALL_ORDER,
+      A, B, C, D, E, F, G, H, I, J, K,
+      L: [SB_A, SB_B],
+      M: [SB_B, SB_A],
+      N: [SB_B, SB_A],
+      O: '84',
+      P: '85',
+      Q: '86-88',
+      R: [SB_A, SB_B],
+      S: [SB_A, SB_B],
+      T: '97-98',
+      U: '99',
+    };
+    return mapping[sector] ?? ALL_ORDER;
+  }
@@
-    if (sectorDimension) {
-      const valueCodes: Record<string, string | string[]> = {};
-      const sectorFilter = this.mapSectorToSSBCode(sector);
-      valueCodes[sectorDimension.id] = sectorFilter;
-    }
+    if (sectorDimension) {
+      const valueCodes: Record<string, string | string[]> = {};
+      const sectorFilter = this.mapSectorToSSBCode(sector);
+      valueCodes[sectorDimension.id] = sectorFilter;
+    }
```

**Hvorfor:** samme fler-kandidat-logikk når vi henter “per segment” via API-klienten – ellers kan transformeren klare å finne data, mens direkte filtrerte kall feiler på grunn av en litt annen kode i én tabell.

---

### 3) `script/generate-all-benchmarks.ts` — gjør region/nasjonal mer robuste (valgfritt)

Det ser allerede bra ut (nasjonalt = 53, regioner = 53). Hvis du vil være helt sikker på at vi **aldri** får 0 fordi en enkelt aggregatkode mangler, kan du legge inn en myk fallback: hvis *alle* forsøk for `ALL` feiler for en dimensjon, ta **snitt av sektorer** for den dimensjonen.

```diff
diff --git a/script/generate-all-benchmarks.ts b/script/generate-all-benchmarks.ts
@@
-    // national
+    // national
     this.lenses.push({
       path: { type: 'national', id: 'all' },
       meta: { /* ... */ }
     });
@@
-    // after building national document
+    // after building national document
+    // Soft fallback: hvis en dimensjon i 'all' mangler, bruk sektor-snitt
+    if (options.dryRun && this.payload?.benchmarks?.length) {
+      const national = this.payload.benchmarks.find(b => b.segmentId === 'all');
+      if (national) {
+        const sectors = this.payload.benchmarks.filter(b => /^[A-U](_(micro|small|medium|large))?$/.test(b.segmentId));
+        const dimKeys = Object.keys(national.dimensions || {});
+        for (const dk of dimKeys) {
+          const d = national.dimensions[dk];
+          if (!d || d.sampleSize === 0 || d.average === 0) {
+            const vals = sectors.map(s => s.dimensions?.[dk]?.average ?? 0).filter(v => v > 0);
+            if (vals.length) {
+              const avg = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
+              national.dimensions[dk] = { ...(d ?? {}), average: avg, score: avg, sampleSize: vals.length * 50 };
+            }
+          }
+        }
+      }
+    }
``
