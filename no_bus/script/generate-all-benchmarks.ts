#!/usr/bin/env tsx
/**
 * Generate All Benchmark Lenses
 *
 * Creates comprehensive benchmark data for all viewing angles:
 * - National aggregate
 * - By sector (23 sectors)
 * - By size (4 sizes)
 * - By region (16 regions) - if SSB data available
 * - Segments (sector × size: 92 combinations)
 *
 * Usage:
 *   npx tsx script/generate-all-benchmarks.ts [options]
 *
 * Options:
 *   --dry-run           Preview without uploading
 *   --output <path>     Save to JSON file
 *   --skip-intelligence Skip intelligence layers
 */

import { ssbClient, coreTables, optionalTables } from '../lib/ssb-api-client';
import { ssbTransformer } from '../lib/ssb-transformer';
import { getAdminFirestore, initializeAdminSDK } from '../lib/firebase-admin';
import { NACE_SECTORS } from '../entities/nace-sectors';
import { NORWEGIAN_COUNTIES, toRegionCode } from '../entities/norwegian-counties';
import fs from 'fs';

const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  output: args.includes('--output') ? args[args.indexOf('--output') + 1] : null,
  skipIntelligence: args.includes('--skip-intelligence'),
  includeOptional: args.includes('--include-optional')
};

const COMPANY_SIZES = ['micro', 'small', 'medium', 'large'];

interface BenchmarkLens {
  path: string;           // Firestore path
  type: 'national' | 'sector' | 'size' | 'region' | 'segment';
  id: string;
  sector?: string;
  sectorName?: string;
  companySize?: string;
  region?: string;
  data?: any;
}

class BenchmarkGenerator {
  private ssbData: Record<string, any> = {};
  private lenses: BenchmarkLens[] = [];

  async generate() {
    console.log('🌍 COMPREHENSIVE BENCHMARK GENERATION');
    console.log('=' .repeat(60));
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
    console.log(`Intelligence: ${options.skipIntelligence ? 'DISABLED' : 'ENABLED'}`);
    console.log('');

    // Step 1: Fetch all SSB data once
    await this.fetchSSBData();

    // Step 2: Generate all benchmark lenses
    await this.generateNational();
    await this.generateBySector();
    await this.generateBySize();
    await this.generateByRegion();
    await this.generateSegments();

    // Step 3: Save or upload
    if (options.output) {
      await this.saveToFile();
    } else if (!options.dryRun) {
      await this.uploadToFirestore();
    } else {
      this.printSummary();
    }
  }

  private async fetchSSBData() {
    const tablesToFetch = [
      ...Object.values(coreTables),
      ...(options.includeOptional ? Object.values(optionalTables) : [])
    ];

    console.log('📥 Step 1: Fetching SSB data...');
    console.log(`   Core tables: ${Object.values(coreTables).join(', ')}`);
    if (options.includeOptional) {
      console.log(`   Optional tables: ${Object.values(optionalTables).join(', ')}`);
    }
    console.log('');

    for (const tableId of tablesToFetch) {
      try {
        console.log(`   Fetching table ${tableId}...`);
        const data = await ssbClient.getTableData(tableId, { language: 'no' });
        this.ssbData[tableId] = data;

        const status = ssbClient.getRateLimitStatus();
        if (status.used > 25) {
          console.log(`   ⏳ Rate limit: ${status.used}/${status.limit}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Table ${tableId} failed:`, (error as Error).message);
        this.ssbData[tableId] = null;
      }
    }

    console.log(`\n   ✅ Fetched ${Object.keys(this.ssbData).filter(k => this.ssbData[k]).length}/${tablesToFetch.length} tables\n`);
  }

  private async generateNational() {
    console.log('🌐 Step 2: Generating national aggregate...');

    const benchmark = await ssbTransformer.transformBenchmark(
      this.ssbData,
      'ALL',  // Special code for national
      'all'
    );

    const metadata = {
      ...benchmark.metadata,
      scope: 'national'
    };

    this.lenses.push({
      path: 'benchmarks/national/data/all',
      type: 'national',
      id: 'all',
      data: {
        ...benchmark,
        type: 'national',
        id: 'all',
        segmentId: 'all',
        metadata
      }
    });

    console.log(`   ✅ National benchmark: avg=${benchmark.overall.average}\n`);
  }

  private async generateBySector() {
    console.log('🏢 Step 3: Generating by-sector benchmarks...');

    for (const sector of NACE_SECTORS) {
      try {
        const benchmark = await ssbTransformer.transformBenchmark(
          this.ssbData,
          sector.code,
          'all'  // All sizes aggregated
        );

        const metadata = {
          ...benchmark.metadata,
          scope: 'sector',
          sectorName: sector.name
        };

        this.lenses.push({
          path: `benchmarks/by-sector/data/${sector.code}`,
          type: 'sector',
          id: sector.code,
          sector: sector.code,
          sectorName: sector.name,
          data: {
            ...benchmark,
            type: 'sector',
            id: sector.code,
            sectorName: sector.name,
            segmentId: sector.code,
            metadata
          }
        });

        console.log(`   ✅ ${sector.code} (${sector.name}): avg=${benchmark.overall.average}`);
      } catch (error) {
        console.error(`   ❌ Failed ${sector.code}:`, (error as Error).message);
      }
    }

    console.log('');
  }

  private async generateBySize() {
    console.log('📏 Step 4: Generating by-size benchmarks...');

    for (const size of COMPANY_SIZES) {
      try {
        const benchmark = await ssbTransformer.transformBenchmark(
          this.ssbData,
          'ALL',  // All sectors aggregated
          size
        );

        const metadata = {
          ...benchmark.metadata,
          scope: 'size'
        };

        this.lenses.push({
          path: `benchmarks/by-size/data/${size}`,
          type: 'size',
          id: size,
          companySize: size,
          data: {
            ...benchmark,
            type: 'size',
            id: size,
            segmentId: size,
            metadata
          }
        });

        console.log(`   ✅ ${size}: avg=${benchmark.overall.average}`);
      } catch (error) {
        console.error(`   ❌ Failed ${size}:`, (error as Error).message);
      }
    }

    console.log('');
  }

  private async generateSegments() {
    console.log('🎯 Step 5: Generating segment benchmarks (sector × size)...');

    const total = NACE_SECTORS.length * COMPANY_SIZES.length;
    let current = 0;

    for (const sector of NACE_SECTORS) {
      for (const size of COMPANY_SIZES) {
        current++;
        const segmentId = `${sector.code}_${size}`;

        try {
          const benchmark = await ssbTransformer.transformBenchmark(
            this.ssbData,
            sector.code,
            size
          );

          const metadata = {
            ...benchmark.metadata,
            scope: 'segment',
            sectorName: sector.name,
            segmentId
          };

          this.lenses.push({
            path: `benchmarks/segments/data/${segmentId}`,
            type: 'segment',
            id: segmentId,
            sector: sector.code,
            sectorName: sector.name,
            companySize: size,
            data: {
              ...benchmark,
              type: 'segment',
              id: segmentId,
              segmentId,
              metadata
            }
          });

          if (current % 10 === 0 || current === total) {
            console.log(`   Progress: ${current}/${total} segments (${Math.round(current/total*100)}%)`);
          }
        } catch (error) {
          console.error(`   ❌ Failed ${segmentId}:`, (error as Error).message);
        }
      }
    }

    console.log('');
  }

  private async generateByRegion() {
    console.log('🗺️  Step 5b: Generating by-region benchmarks...');

    for (const county of NORWEGIAN_COUNTIES) {
      const code = county.code;
      const regionId = toRegionCode(code); // e.g., NO-03

      // Skip unknown
      try {
        const benchmark = await ssbTransformer.transformBenchmark(
          this.ssbData,
          'ALL',
          'all',
          regionId
        );

        const metadata = {
          ...benchmark.metadata,
          scope: 'region',
          regionName: county.name,
          region: regionId
        };

        this.lenses.push({
          path: `benchmarks/by-region/data/${regionId}`,
          type: 'region',
          id: regionId,
          region: regionId,
          data: {
            ...benchmark,
            type: 'region',
            id: regionId,
            region: regionId,
            segmentId: regionId,
            metadata
          }
        });

        console.log(`   ✅ ${regionId} (${county.name}): avg=${benchmark.overall.average}`);
      } catch (error) {
        console.error(`   ❌ Failed ${regionId}:`, (error as Error).message);
      }
    }

    console.log('');
  }

  private printSummary() {
    console.log('=' .repeat(60));
    console.log('📊 GENERATION SUMMARY');
    console.log('=' .repeat(60));

    const byType = {
      national: this.lenses.filter(l => l.type === 'national').length,
      sector: this.lenses.filter(l => l.type === 'sector').length,
      size: this.lenses.filter(l => l.type === 'size').length,
      region: this.lenses.filter(l => l.type === 'region').length,
      segment: this.lenses.filter(l => l.type === 'segment').length
    };

    console.log(`National:  ${byType.national} benchmark`);
    console.log(`Sector:    ${byType.sector} benchmarks`);
    console.log(`Size:      ${byType.size} benchmarks`);
    console.log(`Region:    ${byType.region} benchmarks`);
    console.log(`Segments:  ${byType.segment} benchmarks`);
    console.log(`─`.repeat(60));
    console.log(`Total:     ${this.lenses.length} benchmarks`);

    const debugStats = ssbTransformer.getDebugStats();
    if (
      debugStats.missingSectorMappings.length ||
      debugStats.missingSizeMappings.length ||
      debugStats.nullValueHits.length
    ) {
      console.log('\n🕵️  Debug stats (missing mappings / null values)');
      if (debugStats.missingSectorMappings.length) {
        console.log('   Missing sector mappings:');
        debugStats.missingSectorMappings.forEach(entry => console.log(`     - ${entry}`));
      }
      if (debugStats.missingSizeMappings.length) {
        console.log('   Missing size mappings:');
        debugStats.missingSizeMappings.forEach(entry => console.log(`     - ${entry}`));
      }
      if (debugStats.nullValueHits.length) {
        console.log('   Null value hits (table::dimension => count):');
        debugStats.nullValueHits
          .sort((a, b) => b.hits - a.hits)
          .slice(0, 20)
          .forEach(({ key, hits }) => console.log(`     - ${key}: ${hits}`));
      }
      console.log('─'.repeat(60));
    }

    if (options.dryRun) {
      console.log('\n💡 Dry run complete - use --output to save or remove --dry-run to upload');
    }
  }

  private async saveToFile() {
    const outputPath = options.output || './all-benchmarks.json';
    console.log(`\n💾 Saving to ${outputPath}...`);

    const output = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalBenchmarks: this.lenses.length,
        byType: {
          national: this.lenses.filter(l => l.type === 'national').length,
          sector: this.lenses.filter(l => l.type === 'sector').length,
          size: this.lenses.filter(l => l.type === 'size').length,
          segment: this.lenses.filter(l => l.type === 'segment').length
        },
        ssbTables: [
          ...Object.values(coreTables),
          ...(options.includeOptional ? Object.values(optionalTables) : [])
        ],
        options
      },
      benchmarks: this.lenses.map(lens => ({
        path: lens.path,
        type: lens.type,
        id: lens.id,
        sector: lens.sector,
        sectorName: lens.sectorName,
        companySize: lens.companySize,
        ...lens.data
      }))
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`✅ Saved ${this.lenses.length} benchmarks`);

    // Also save structure overview
    const overviewPath = outputPath.replace('.json', '-overview.json');
    const overview = {
      metadata: output.metadata,
      structure: this.lenses.map(l => ({
        path: l.path,
        type: l.type,
        id: l.id,
        sector: l.sector,
        companySize: l.companySize,
        overallScore: l.data?.overall?.average
      }))
    };
    fs.writeFileSync(overviewPath, JSON.stringify(overview, null, 2));
    console.log(`✅ Saved overview to ${overviewPath}`);
  }

  private async uploadToFirestore() {
    console.log('\n☁️  Uploading to Firestore...\n');

    let db: ReturnType<typeof getAdminFirestore> | null = null;
    try {
      initializeAdminSDK();
      db = getAdminFirestore();
    } catch (err) {
      console.warn('⚠️  Firebase not configured for upload. Saving to file instead.');
      console.warn('    ', (err as Error).message);
      if (!options.output) {
        // Fall back to file output
        const fallbackPath = './all-benchmarks-test.json';
        options.output = fallbackPath;
        await this.saveToFile();
        return;
      }
      await this.saveToFile();
      return;
    }

    // Ensure container documents exist for predictable structure and UI visibility
    const containers = ['national', 'by-sector', 'by-size', 'by-region', 'segments'];
    for (const c of containers) {
      await db!.collection('benchmarks').doc(c).set({
        type: 'container',
        id: c,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    let uploaded = 0;
    let failed = 0;

    for (const lens of this.lenses) {
      try {
        // Parse path: benchmarks/{collection}/data/{docId}
        const pathParts = lens.path.split('/');
        const collection = pathParts[1];  // 'national', 'by-sector', etc.
        const docId = pathParts[3];

        await db!
          .collection('benchmarks')
          .doc(collection)
          .collection('data')
          .doc(docId)
          .set({
            ...lens.data,
            updatedAt: new Date().toISOString()
          });

        uploaded++;

        if (uploaded % 20 === 0) {
          console.log(`   ✅ Uploaded ${uploaded}/${this.lenses.length}...`);
        }
      } catch (error) {
        console.error(`   ❌ Failed ${lens.path}:`, error);
        failed++;
      }
    }

    console.log('');
    console.log('=' .repeat(60));
    console.log(`✅ Uploaded ${uploaded} benchmarks`);
    if (failed > 0) {
      console.log(`❌ Failed ${failed} benchmarks`);
    }
  }
}

async function main() {
  try {
    const generator = new BenchmarkGenerator();
    await generator.generate();

    console.log('\n🎉 Generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { BenchmarkGenerator };
