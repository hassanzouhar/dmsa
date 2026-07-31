/**
 * SSB (Statistics Norway) API Client
 *
 * Fetches data from Statistics Norway's PxWebApi 2
 * - Rate limiting: 30 requests/minute
 * - Max cells per query: 800,000
 * - Format: json-stat2 (default)
 *
 * API Documentation: https://data.ssb.no/api/pxwebapi/v2/
 */

import {
  mapSizeToSSBCodes,
  mapSectorToNaceCodes,
  regionCodeVariants,
  SSB_NO_COVERAGE_REASON
} from './ssb-mapping';
import { tableMapping } from '../src/mapping/dimensionMapping';

const SSB_BASE_URL = 'https://data.ssb.no/api/pxwebapi/v2';
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

/**
 * Tabellene DTAM-benchmarkpipen faktisk leser — utledet fra `tableMapping` i
 * stedet for å vedlikeholdes som en parallell liste. Den håndskrevne varianten
 * hadde allerede drevet fra transformasjonen.
 */
export const coreTables: string[] = Array.from(
  new Set(Object.values(tableMapping).flatMap(cfg => cfg.tables))
);

/**
 * Tabeller som finnes i SSB, men som ingen dimensjon leser ennå. De hentes kun
 * med `--include-optional` og påvirker ikke skårene før de kobles inn i
 * `tableMapping`.
 */
export const optionalTables: string[] = ['10967']; // Skytjenester: nytteeffekter

interface SSBRequestOptions {
  language?: 'no' | 'en';
  format?: 'json-stat2' | 'csv' | 'json-px';
  valueCodes?: Record<string, string | string[]>;
}

interface RateLimitState {
  requests: number[];
  lastCleanup: number;
}

class SSBApiClient {
  private rateLimit: RateLimitState = {
    requests: [],
    lastCleanup: Date.now()
  };

  /**
   * Rate limiting check - ensures we don't exceed 30 req/min
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Clean up requests older than 1 minute
    this.rateLimit.requests = this.rateLimit.requests.filter(
      timestamp => now - timestamp < RATE_WINDOW
    );

    // If at limit, wait until oldest request expires
    if (this.rateLimit.requests.length >= RATE_LIMIT) {
      const oldestRequest = this.rateLimit.requests[0];
      const waitTime = RATE_WINDOW - (now - oldestRequest) + 100; // +100ms buffer

      console.log(`⏳ Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Recursively check again after waiting
      return this.checkRateLimit();
    }

    // Record this request
    this.rateLimit.requests.push(now);
  }

  /**
   * Fetch table metadata
   */
  async getTableMetadata(tableId: string, language: 'no' | 'en' = 'no'): Promise<any> {
    await this.checkRateLimit();

    const url = `${SSB_BASE_URL}/tables/${tableId}/metadata?lang=${language}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`SSB API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Failed to fetch metadata for table ${tableId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch table data
   *
   * Uses SSB API v0 (POST with JSON body) for filtering support
   */
  async getTableData(
    tableId: string,
    options: SSBRequestOptions = {}
  ): Promise<any> {
    await this.checkRateLimit();

    const {
      language = 'no',
      format = 'json-stat2',
      valueCodes = {}
    } = options;

    const url = `https://data.ssb.no/api/v0/${language}/table/${tableId}`;

    // Build POST body if we have filters
    const hasFilters = Object.keys(valueCodes).length > 0;

    if (hasFilters) {
      // Build query structure for POST request
      const query: any[] = [];

      for (const [code, values] of Object.entries(valueCodes)) {
        const valueArray = Array.isArray(values) ? values : [values];

        // Handle special filters like "top(1)"
        if (valueArray.length === 1 && valueArray[0].startsWith('top(')) {
          const topN = valueArray[0].match(/top\((\d+)\)/)?.[1] || '1';
          query.push({
            code,
            selection: {
              filter: 'top',
              values: [topN]
            }
          });
        } else {
          query.push({
            code,
            selection: {
              filter: 'item',
              values: valueArray
            }
          });
        }
      }

      const body = {
        query,
        response: {
          format: format === 'json-stat2' ? 'json-stat2' : 'json'
        }
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error(`Dataset too large (>800k cells). Use more specific filters.`);
          }
          throw new Error(`SSB API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`❌ Failed to fetch data for table ${tableId}:`, error);
        throw error;
      }
    } else {
      // No filters - use PxWeb v2 GET default data endpoint
      try {
        const getUrl = `${SSB_BASE_URL}/tables/${tableId}/data?lang=${language}`;
        const response = await fetch(getUrl);

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error(`Dataset too large (>800k cells). Use more specific filters.`);
          }
          throw new Error(`SSB API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`❌ Failed to fetch data for table ${tableId}:`, error);
        throw error;
      }
    }
  }

  /**
   * Get data for specific sector and company size.
   *
   * Returnerer et sentinel-objekt `{ data: null, reason: 'no-ssb-coverage' }`
   * dersom DMSA-sektoren eller -størrelsen ikke har SSB ICT-bruk-dekning.
   * Kalleren må sjekke for dette før data brukes nedstrøms.
   */
  async getTableDataBySegment(
    tableId: string,
    sector: string,  // NACE-DMSA-code (A-U)
    companySize: string,  // 'micro' | 'small' | 'medium' | 'large'
    options: Omit<SSBRequestOptions, 'valueCodes'> = {}
  ): Promise<any> {
    // Resolve mappings opp-front så vi kan kortslutte uten å spørre SSB.
    const naceCodes = mapSectorToNaceCodes(sector);
    const sizeCodes = mapSizeToSSBCodes(companySize);

    if (naceCodes.length === 0 || sizeCodes.length === 0) {
      const missing: string[] = [];
      if (naceCodes.length === 0) missing.push(`sector=${sector}`);
      if (sizeCodes.length === 0) missing.push(`size=${companySize}`);
      console.warn(
        `⏭️  Skipping SSB call for table ${tableId}: no coverage for ${missing.join(', ')}`
      );
      return { data: null, reason: SSB_NO_COVERAGE_REASON, sector, companySize };
    }

    const metadata = await this.getTableMetadata(tableId, options.language);

    // Find dimension names for sector and size
    const sectorDimension = this.findDimensionByType(metadata, 'sector');
    const sizeDimension = this.findDimensionByType(metadata, 'size');
    const timeDimension = this.findDimensionByType(metadata, 'time');

    const valueCodes: Record<string, string | string[]> = {};

    // Add sector filter — pass array directly (SSB v0 query supports multi-value).
    if (sectorDimension) {
      valueCodes[sectorDimension.id] = naceCodes.length === 1 ? naceCodes[0] : naceCodes;
    }

    // Add size filter — same multi-value handling.
    if (sizeDimension) {
      valueCodes[sizeDimension.id] = sizeCodes.length === 1 ? sizeCodes[0] : sizeCodes;
    }

    // Get latest time period
    if (timeDimension) {
      valueCodes[timeDimension.id] = 'top(1)'; // Most recent period
    }

    return this.getTableData(tableId, {
      ...options,
      valueCodes
    });
  }

  /**
   * Batch fetch multiple tables (respects rate limiting)
   */
  async batchFetchTables(
    tableIds: string[],
    options: SSBRequestOptions = {}
  ): Promise<Record<string, any>> {
    console.log(`📊 Fetching ${tableIds.length} tables from SSB...`);

    const results: Record<string, any> = {};
    let successful = 0;
    let failed = 0;

    for (const tableId of tableIds) {
      try {
        console.log(`  Fetching table ${tableId}...`);
        results[tableId] = await this.getTableData(tableId, options);
        successful++;
      } catch (error) {
        console.error(`  ⚠️  Failed to fetch table ${tableId}`);
        failed++;
        results[tableId] = null; // Mark as failed
      }
    }

    console.log(`✅ Batch complete: ${successful} succeeded, ${failed} failed`);
    return results;
  }

  async fetchCoreTables(options: SSBRequestOptions = {}): Promise<Record<string, any>> {
    return this.batchFetchTables(coreTables, options);
  }

  /**
   * Search for tables by query
   */
  async searchTables(
    query: string,
    options: {
      includeDiscontinued?: boolean;
      pageSize?: number;
      pageNumber?: number;
    } = {}
  ): Promise<any> {
    await this.checkRateLimit();

    const params = new URLSearchParams({
      query,
      includeDiscontinued: String(options.includeDiscontinued ?? false),
      ...(options.pageSize && { pagesize: String(options.pageSize) }),
      ...(options.pageNumber && { pagenumber: String(options.pageNumber) })
    });

    const url = `${SSB_BASE_URL}/tables?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SSB API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Helper: Find dimension by semantic type
   */
  private findDimensionByType(
    metadata: any,
    type: 'sector' | 'size' | 'time' | 'region'
  ): { id: string; label?: string; category?: any } | null {
    if (!metadata?.dimension) return null;

    // JSON-stat2 legger dimensjons-ID-en i NØKKELEN, ikke i verdiobjektet.
    // Å lese `dim.id` ga `undefined`, som ble til query-koden "undefined" og
    // fikk SSB til å svare 400 på hvert eneste segment-kall.
    const entries = Object.entries<any>(metadata.dimension);

    // Common Norwegian dimension names. NB: SSB bruker nynorskformen
    // «sysselsette» i flere tabeller, så mønsteret må matche stammen.
    const patterns = {
      sector: /n[æå]ring|sektor|sn2007|nace/i,
      size: /syssel|ansatte|st[øo]rrelse/i,
      time: /tid|år|periode|kvartal|måned/i,
      region: /region|fylke|county|kommune/i
    };

    const match = entries.find(([key, dim]) =>
      patterns[type].test(dim?.label ?? '') || patterns[type].test(key)
    );

    return match ? { id: match[0], ...match[1] } : null;
  }

  /**
   * Fetch data for a specific region (county). Accepts codes like 'NO-03' or '03'.
   */
  async getTableDataByRegion(
    tableId: string,
    region: string,
    options: Omit<SSBRequestOptions, 'valueCodes'> = {}
  ): Promise<any> {
    const metadata = await this.getTableMetadata(tableId, options.language);

    const regionDimension = this.findDimensionByType(metadata, 'region');
    const timeDimension = this.findDimensionByType(metadata, 'time');

    const valueCodes: Record<string, string> = {};
    if (regionDimension) {
      // Metadata er allerede hentet — slå opp hvilken skrivemåte tabellen bruker
      // ('NO-03', '03' eller 'NO03') i stedet for å sende koden rå og håpe.
      const index = regionDimension.category?.index as Record<string, number> | undefined;
      const match = index
        ? regionCodeVariants(region).find(variant => index[variant] !== undefined)
        : undefined;
      if (index && !match) {
        throw new Error(
          `Ukjent fylkeskode ${region} for tabell ${tableId}. Tilgjengelige: ${Object.keys(index).join(', ')}`
        );
      }
      valueCodes[regionDimension.id] = match ?? region;
    }
    if (timeDimension) {
      valueCodes[timeDimension.id] = 'top(1)';
    }

    return this.getTableData(tableId, { ...options, valueCodes });
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): { used: number; limit: number; resetsIn: number } {
    const now = Date.now();
    const activeRequests = this.rateLimit.requests.filter(
      timestamp => now - timestamp < RATE_WINDOW
    );

    const oldestRequest = activeRequests[0];
    const resetsIn = oldestRequest
      ? Math.max(0, RATE_WINDOW - (now - oldestRequest))
      : 0;

    return {
      used: activeRequests.length,
      limit: RATE_LIMIT,
      resetsIn: Math.ceil(resetsIn / 1000) // seconds
    };
  }
}

// Export singleton instance
export const ssbClient = new SSBApiClient();

// Export types
export type { SSBRequestOptions };
