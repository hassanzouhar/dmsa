#!/usr/bin/env node
/**
 * Kjører db/schema.sql mot DATABASE_URL.
 *
 * Skjemaet er idempotent (`create table if not exists`), så det er trygt
 * å kjøre om igjen. Ved skjemaendringer legges nye setninger til i
 * schema.sql; det finnes ingen egen migrasjonshistorikk — med to tabeller
 * er ikke det verdt kompleksiteten.
 *
 * Bruk:
 *   node scripts/db-migrate.mjs
 *   DATABASE_URL=postgres://... node scripts/db-migrate.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Les .env.local hvis DATABASE_URL ikke allerede er satt i miljøet.
if (!process.env.DATABASE_URL) {
  const envPath = path.join(root, '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL er ikke satt. Kjør `vercel env pull .env.local` først.');
  process.exit(1);
}

const schema = fs.readFileSync(path.join(root, 'db', 'schema.sql'), 'utf8');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

try {
  await sql.unsafe(schema);

  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `;
  console.log(`✅ Skjema kjørt. Tabeller: ${tables.map((t) => t.table_name).join(', ')}`);
} catch (error) {
  console.error('❌ Migrering feilet:', error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
