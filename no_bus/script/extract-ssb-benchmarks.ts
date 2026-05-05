#!/usr/bin/env tsx
/**
 * SSB Benchmark Extraction Script
 *
 * Extracts digital maturity data from Statistics Norway (SSB) and generates
 * benchmark documents for all sector/size combinations.
 *
 * Usage:
 *   npx tsx script/extract-ssb-benchmarks.ts [options]
 *
 * Options:
 *   --sector <code>     Extract only specific sector (A-V)
 *   --size <id>         Extract only specific size (micro, small, medium, large)
 *   --dry-run           Preview without saving to Firestore
 *   --skip-intelligence Skip intelligence layers (faster, scoring only)
 *   --output <path>     Save to JSON file instead of Firestore
 */

import { ssbClient } from '../lib/ssb-api-client';
import { ssbTransformer } from '../lib/ssb-transformer';
import { mapSizeToSSBCodes } from '../lib/ssb-mapping';
import { getAdminFirestore, initializeAdminSDK } from '../lib/firebase-admin';
import { COLLECTIONS } from '../types/firestore-schema';
import { NACE_SECTORS } from '../entities/nace-sectors';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  sector: args.includes('--sector') ? args[args.indexOf('--sector') + 1] : null,
  size: args.includes('--size') ? args[args.indexOf('--size') + 1] : null,
  dryRun: args.includes('--dry-run'),
  skipIntelligence: args.includes('--skip-intelligence'),
  output: args.includes('--output') ? args[args.indexOf('--output') + 1] : null
};

// Micro (1-9) ekskludert fordi SSB ICT-bruk ikke har data for foretak under 10 ansatte.
// Se mapSizeToSSBCodes() i no_bus/lib/ssb-mapping.ts for håndtering.
const COMPANY_SIZES = ['small', 'medium', 'large'];

// Priority tables for MVP
const PRIORITY_TABLES = [
  '10974', // E-commerce
  '10966', // Cloud services
  '12769', // Security measures
  '13265', // AI usage
  '10964', // ICT competence
  '14034', // Data analytics
  // Intelligence tables
  '10967', // Cloud benefits ⭐
  '13271', // AI use cases ⭐
  '12771', // Cybersecurity incidents ⭐
  '13272', // AI barriers ⭐
];

interface ExtractedBenchmark {
  sector: string;
  sectorName: string;
  companySize: string;
  data: any;
  success: boolean;
  error?: string;
}

class BenchmarkExtractor {
  private extracted: ExtractedBenchmark[] = [];
  private failed: string[] = [];

  async extractAll() {
    console.log('🚀 SSB BENCHMARK EXTRACTION');
    console.log('=' .repeat(50));
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
    console.log(`Intelligence: ${options.skipIntelligence ? 'DISABLED' : 'ENABLED'}`);
    console.log('');

    // Determine which segments to extract.
    // Filtrer ut sektorer uten SSB ICT-bruk-dekning (A, B, O, P, Q, T, U)
    // — disse vil bare returnere `no-ssb-coverage`-sentinels.
    const allSectors = options.sector
      ? NACE_SECTORS.filter(s => s.code === options.sector)
      : NACE_SECTORS;

    const skipped = allSectors.filter(s => s.ssbCoverage === 'none');
    const sectors = allSectors.filter(s => s.ssbCoverage !== 'none');

    if (sectors.length === 0) {
      console.error('❌ Ingen sektorer å prosessere — sektor mangler SSB-dekning');
      process.exit(1);
    }

    if (skipped.length > 0) {
      console.log(`⏭️  Hopper over ${skipped.length} sektorer uten SSB ICT-bruk-dekning: ${skipped.map(s => s.code).join(', ')}`);
    }

    // Filtrer bort 'micro' om bruker oppga den eksplisitt.
    const requestedSize = options.size;
    if (requestedSize === 'micro') {
      console.error('❌ SSB ICT-bruk har ingen data for foretak med 1-9 ansatte (micro). Avbryter.');
      process.exit(1);
    }
    const sizes = requestedSize ? [requestedSize] : COMPANY_SIZES;

    const totalSegments = sectors.length * sizes.length;
    console.log(`📊 Extracting ${totalSegments} segments:`);
    console.log(`   Sectors: ${sectors.length} (${sectors.map(s => s.code).join(', ')})`);
    console.log(`   Sizes: ${sizes.join(', ')}`);
    console.log('');

    let current = 0;

    for (const sector of sectors) {
      for (const size of sizes) {
        current++;
        console.log(`\n[${current}/${totalSegments}] Processing ${sector.code} (${sector.name}) - ${size}`);

        try {
          await this.extractSegment(sector.code, sector.name, size);
        } catch (error) {
          console.error(`   ❌ Failed:`, error);
          this.failed.push(`${sector.code}-${size}`);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 EXTRACTION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${this.extracted.filter(e => e.success).length}`);
    console.log(`❌ Failed: ${this.failed.length}`);

    if (this.failed.length > 0) {
      console.log(`\nFailed segments: ${this.failed.join(', ')}`);
    }

    // Save or upload results
    if (options.output) {
      await this.saveToFile();
    } else if (!options.dryRun) {
      await this.uploadToFirestore();
    } else {
      console.log('\n💡 Dry run complete - use --output to save results');
    }
  }

  private async extractSegment(sectorCode: string, sectorName: string, companySize: string) {
    console.log(`   📥 Fetching SSB data...`);

    // Sjekk størrelses-mapping eksplisitt før vi gjør SSB-kall.
    // Dette unngår én rundtur per tabell som garantert returnerer no-coverage.
    const sizeCodes = mapSizeToSSBCodes(companySize);
    if (sizeCodes.length === 0) {
      console.warn(`   ⏭️  ${companySize} har ingen SSB ICT-bruk-dekning, hopper over.`);
      this.extracted.push({
        sector: sectorCode,
        sectorName,
        companySize,
        data: null,
        success: false,
        error: 'no-ssb-coverage'
      });
      return;
    }

    // TODO (uvektet snitt): mapSizeToSSBCodes returnerer ofte FLERE koder
    // (small=['02','03'], medium=['04','05']). For en korrekt aggregat må vi
    // hente per-kode, vekte etter foretakspopulasjon (12936/07091), og snitte.
    // I første pass sender vi multi-value-listen rett til SSB API og bruker
    // uvektet snitt nedstrøms. Forbedres når firm-population-data er tilgjengelig.

    const ssbData: Record<string, any> = {};

    for (const tableId of PRIORITY_TABLES) {
      try {
        console.log(`      Table ${tableId}...`);

        // Use segment-filtered pulls to reduce payloads and improve accuracy
        const data = await ssbClient.getTableDataBySegment(tableId, sectorCode, companySize, {
          language: 'no'
        });

        // Sentinel: getTableDataBySegment kortslutter med no-ssb-coverage
        // når sektor/størrelse mangler dekning — hopp pent over.
        if (data && data.reason === 'no-ssb-coverage') {
          ssbData[tableId] = null;
          continue;
        }

        ssbData[tableId] = data;

        // Show rate limit status
        const rateLimitStatus = ssbClient.getRateLimitStatus();
        if (rateLimitStatus.used > 25) {
          console.log(`      ⏳ Rate limit: ${rateLimitStatus.used}/${rateLimitStatus.limit} (resets in ${rateLimitStatus.resetsIn}s)`);
        }

      } catch (error) {
        console.warn(`      ⚠️  Table ${tableId} failed:`, (error as Error).message);
        ssbData[tableId] = null;
      }
    }

    // Transform to benchmark data
    console.log(`   🔄 Transforming data...`);

    const benchmark = await ssbTransformer.transformBenchmark(
      ssbData,
      sectorCode,
      companySize
    );

    console.log(`   ✅ Benchmark generated`);
    console.log(`      Overall score: ${benchmark.overall.average}`);
    console.log(`      Data source: ${benchmark.dataSource}`);
    console.log(`      Sample size: ${benchmark.overall.sampleSize}`);

    this.extracted.push({
      sector: sectorCode,
      sectorName,
      companySize,
      data: benchmark,
      success: true
    });
  }

  private async saveToFile() {
    const outputPath = options.output || './ssb-benchmarks.json';

    console.log(`\n💾 Saving to ${outputPath}...`);

    const output = {
      metadata: {
        extractedAt: new Date().toISOString(),
        totalSegments: this.extracted.length,
        successful: this.extracted.filter(e => e.success).length,
        failed: this.failed.length,
        options
      },
      benchmarks: this.extracted.filter(e => e.success).map(e => ({
        sector: e.sector,
        sectorName: e.sectorName,
        companySize: e.companySize,
        ...e.data
      }))
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ Saved ${output.benchmarks.length} benchmarks to ${outputPath}`);
  }

  private async uploadToFirestore() {
    console.log(`\n☁️  Uploading to Firestore...`);

    initializeAdminSDK();
    const db = getAdminFirestore();

    let uploaded = 0;

    for (const extracted of this.extracted) {
      if (!extracted.success) continue;

      try {
        const docRef = db
          .collection(COLLECTIONS.BENCHMARKS)
          .doc(extracted.sector)
          .collection('sizes')
          .doc(extracted.companySize);

        await docRef.set({
          ...extracted.data,
          updatedAt: new Date().toISOString()
        });

        uploaded++;
        console.log(`   ✅ ${extracted.sector}-${extracted.companySize}`);

      } catch (error) {
        console.error(`   ❌ Failed to upload ${extracted.sector}-${extracted.companySize}:`, error);
      }
    }

    console.log(`\n✅ Uploaded ${uploaded} benchmarks to Firestore`);
  }
}

// Main execution
async function main() {
  try {
    const extractor = new BenchmarkExtractor();
    await extractor.extractAll();

    console.log('\n🎉 Extraction complete!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { BenchmarkExtractor };
