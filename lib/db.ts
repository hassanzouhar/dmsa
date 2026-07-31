/**
 * Datalag — Postgres (Neon)
 *
 * Erstatter lib/firebase-admin.ts og lib/email-survey-mapping.ts.
 * Alle spørringer mot databasen går gjennom dette modulet; API-rutene
 * skal ikke skrive SQL selv.
 *
 * Skjemaet ligger i db/schema.sql.
 */

import postgres from 'postgres';
import crypto from 'crypto';

// Én klient per prosess. I dev gjenbrukes den over hot reloads, ellers
// lekker vi tilkoblinger for hver endring.
const globalForDb = globalThis as unknown as { __dmsaSql?: postgres.Sql };

function createClient(): postgres.Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL er ikke satt');
  }
  return postgres(url, {
    // Neons pooler (PgBouncer i transaction mode) støtter ikke prepared
    // statements. Uten dette feiler spørringene i produksjon.
    prepare: false,
    max: 5,
    idle_timeout: 20,
  });
}

function getClient(): postgres.Sql {
  if (!globalForDb.__dmsaSql) {
    globalForDb.__dmsaSql = createClient();
  }
  return globalForDb.__dmsaSql;
}

/**
 * Tilkoblingen opprettes ved FØRSTE spørring, ikke ved import.
 *
 * `next build` laster rutemodulene for å samle sidedata. Med en klient som
 * ble opprettet på toppnivå ville et manglende DATABASE_URL felle bygget i
 * stedet for den enkelte forespørselen.
 */
export const sql: postgres.Sql = new Proxy((() => {}) as unknown as postgres.Sql, {
  apply(_target, _thisArg, args: Parameters<postgres.Sql>) {
    return (getClient() as (...a: Parameters<postgres.Sql>) => unknown)(...args);
  },
  get(_target, prop: string | symbol) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * SHA-256 av normalisert e-post. Brukes som oppslagsnøkkel slik at
 * magic-link-flyten aldri trenger å sammenligne e-poster i klartekst.
 */
export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// ---------------------------------------------------------------------------
// Typer
// ---------------------------------------------------------------------------

export type CompanySize = 'micro' | 'small' | 'medium' | 'large';
export type Language = 'no' | 'en';
export type SurveyVersion = 'v1.0' | 'v1.1';

export interface DimensionScore {
  score: number;
  target: number;
  gap: number;
}

export interface Scores {
  dimensions: Record<string, DimensionScore>;
  overall: number;
  maturityClassification: { level: number; label: string; band: string };
}

/** Én rad i surveys, slik den kommer fra databasen. */
export interface SurveyRow {
  id: string;
  survey_version: SurveyVersion;
  language: Language;
  created_at: Date;
  completed_at: Date | null;
  upgraded_at: Date | null;
  company_name: string;
  company_size: CompanySize;
  nace: string;
  sector: string;
  region: string;
  token_hash: string;
  token_revoked: boolean;
  overall_score: number | null;
  scores: Scores | null;
  answers: Record<string, unknown> | null;
  include_in_leaderboard: boolean;
  is_anonymous: boolean;
  email: string | null;
  email_hash: string | null;
  email_domain: string | null;
  contact_name: string | null;
  consent_accepted_at: Date | null;
  policy_version: string | null;
}

/**
 * API-formen frontend forventer. Radene er flate, men `/results`-siden leser
 * `survey.companyDetails.*` og `survey.flags.includeInLeaderboard`, så vi
 * beholder den formen utad. Migreringen blir da rent backend-intern.
 *
 * Merk at `state` og `flags` her er UTLEDET fra tidsstempler — de lagres ikke.
 */
export interface SurveyDocument {
  id: string;
  state: 'T0' | 'T1';
  surveyVersion: SurveyVersion;
  language: Language;
  createdAt: string;
  completedAt?: string;
  upgradedAt?: string;
  companyDetails: {
    companyName: string;
    companySize: CompanySize;
    nace: string;
    sector: string;
    region: string;
  };
  flags: {
    isCompleted: boolean;
    hasResults: boolean;
    hasExpandedAccess: boolean;
    includeInLeaderboard: boolean;
    isAnonymous: boolean;
  };
  overallScore?: number;
  scores?: Scores;
  retrieval: { tokenHash: string; createdAt: string; revoked: boolean };
}

export function toSurveyDocument(row: SurveyRow): SurveyDocument {
  return {
    id: row.id,
    state: row.upgraded_at ? 'T1' : 'T0',
    surveyVersion: row.survey_version,
    language: row.language,
    createdAt: row.created_at.toISOString(),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
    ...(row.upgraded_at ? { upgradedAt: row.upgraded_at.toISOString() } : {}),
    companyDetails: {
      companyName: row.company_name,
      companySize: row.company_size,
      nace: row.nace,
      sector: row.sector,
      region: row.region,
    },
    flags: {
      isCompleted: row.completed_at !== null,
      hasResults: row.scores !== null,
      hasExpandedAccess: row.upgraded_at !== null,
      includeInLeaderboard: row.include_in_leaderboard,
      isAnonymous: row.is_anonymous,
    },
    ...(row.overall_score !== null ? { overallScore: row.overall_score } : {}),
    ...(row.scores !== null ? { scores: row.scores } : {}),
    // Hashen eksponeres aldri utover dette objektet; rutene erstatter den
    // med '[REDACTED]' før svaret sendes.
    retrieval: {
      tokenHash: row.token_hash,
      createdAt: row.created_at.toISOString(),
      revoked: row.token_revoked,
    },
  };
}

// ---------------------------------------------------------------------------
// Surveys
// ---------------------------------------------------------------------------

export async function createSurvey(input: {
  id: string;
  surveyVersion: SurveyVersion;
  language: Language;
  companyName: string;
  companySize: CompanySize;
  nace: string;
  sector: string;
  region: string;
  tokenHash: string;
}): Promise<void> {
  await sql`
    insert into surveys (
      id, survey_version, language,
      company_name, company_size, nace, sector, region,
      token_hash
    ) values (
      ${input.id}, ${input.surveyVersion}, ${input.language},
      ${input.companyName}, ${input.companySize}, ${input.nace},
      ${input.sector}, ${input.region},
      ${input.tokenHash}
    )
  `;
}

export async function getSurvey(id: string): Promise<SurveyRow | null> {
  const [row] = await sql<SurveyRow[]>`select * from surveys where id = ${id}`;
  return row ?? null;
}

/**
 * Fullfør et survey. Returnerer false hvis det allerede er fullført,
 * slik at kalleren kan svare 409 uten en egen forhåndssjekk — betingelsen
 * er en del av UPDATE-en, så to samtidige kall kan ikke begge lykkes.
 */
export async function completeSurvey(input: {
  id: string;
  answers: Record<string, unknown>;
  scores: Scores;
  isAnonymous: boolean;
}): Promise<Date | null> {
  const [row] = await sql<{ completed_at: Date }[]>`
    update surveys set
      completed_at  = now(),
      scores        = ${sql.json(input.scores as unknown as postgres.JSONValue)},
      answers       = ${sql.json(input.answers as postgres.JSONValue)},
      overall_score = ${Math.round(input.scores.overall)},
      is_anonymous  = ${input.isAnonymous}
    where id = ${input.id} and completed_at is null
    returning completed_at
  `;
  return row?.completed_at ?? null;
}

export async function setAnonymous(id: string, isAnonymous: boolean): Promise<void> {
  await sql`update surveys set is_anonymous = ${isAnonymous} where id = ${id}`;
}

/**
 * Oppgrader T0 -> T1 ved å knytte kontaktdetaljer til survey-et.
 * Returnerer null hvis det allerede er oppgradert.
 */
export async function upgradeSurvey(input: {
  id: string;
  email: string;
  contactName?: string;
  policyVersion: string;
}): Promise<Date | null> {
  const [row] = await sql<{ upgraded_at: Date }[]>`
    update surveys set
      upgraded_at         = now(),
      email               = ${input.email},
      email_hash          = ${hashEmail(input.email)},
      email_domain        = ${input.email.split('@')[1]?.toLowerCase() ?? ''},
      contact_name        = ${input.contactName ?? null},
      consent_accepted_at = now(),
      policy_version      = ${input.policyVersion}
    where id = ${input.id} and upgraded_at is null
    returning upgraded_at
  `;
  return row?.upgraded_at ?? null;
}

/** Erstatter email_surveys-collectionen. */
export async function getSurveyIdsByEmail(email: string): Promise<string[]> {
  const rows = await sql<{ id: string }[]>`
    select id from surveys
    where email_hash = ${hashEmail(email)}
    order by created_at desc
  `;
  return rows.map((r) => r.id);
}

export async function countSurveysByEmail(email: string): Promise<number> {
  const [row] = await sql<{ count: string }[]>`
    select count(*) from surveys where email_hash = ${hashEmail(email)}
  `;
  return Number(row?.count ?? 0);
}

/**
 * Fullførte surveys for leaderboard og benchmark-aggregering.
 * Filtrering på fylke/land gjøres av kalleren, siden `region` er et
 * sammensatt felt ('NO-03') som parses i leaderboard-tjenesten.
 */
export async function listCompletedSurveys(options: {
  sector?: string;
  companySize?: string;
  limit?: number;
} = {}): Promise<SurveyRow[]> {
  return sql<SurveyRow[]>`
    select * from surveys
    where completed_at is not null
      and scores is not null
      and include_in_leaderboard
      ${options.sector ? sql`and sector = ${options.sector}` : sql``}
      ${options.companySize ? sql`and company_size = ${options.companySize}` : sql``}
    order by overall_score desc nulls last
    ${options.limit ? sql`limit ${options.limit}` : sql``}
  `;
}

/**
 * Gjennomsnittlig totalskår for et segment. Erstatter mønsteret der
 * hele collectionen ble hentet ned og snittet i minnet.
 */
export async function averageScoreBy(
  field: 'sector' | 'company_size' | 'region',
  value: string
): Promise<number | null> {
  const [row] = await sql<{ avg: string | null }[]>`
    select avg(overall_score) as avg from surveys
    where completed_at is not null
      and include_in_leaderboard
      and ${sql(field)} = ${value}
  `;
  return row?.avg == null ? null : Math.round(Number(row.avg));
}

// ---------------------------------------------------------------------------
// Magic links
// ---------------------------------------------------------------------------

export async function insertMagicLink(input: {
  tokenHash: string;
  emailHash: string;
  expiresAt: Date;
}): Promise<void> {
  await sql`
    insert into magic_links (token_hash, email_hash, expires_at)
    values (${input.tokenHash}, ${input.emailHash}, ${input.expiresAt})
    on conflict (token_hash) do nothing
  `;
}

/**
 * Slå opp en magic link og registrer bruken i samme spørring.
 * Utløpte lenker filtreres bort her, så ingen egen opprydningsjobb trengs.
 * Returnerer null når lenken ikke finnes, er utløpt, eller tilhører en
 * annen e-post — kalleren skiller ikke mellom disse utad.
 */
export async function consumeMagicLink(input: {
  tokenHash: string;
  emailHash: string;
}): Promise<{ email_hash: string } | null> {
  const [row] = await sql<{ email_hash: string }[]>`
    update magic_links set
      use_count     = use_count + 1,
      first_used_at = coalesce(first_used_at, now()),
      last_used_at  = now()
    where token_hash = ${input.tokenHash}
      and email_hash = ${input.emailHash}
      and expires_at > now()
    returning email_hash
  `;
  return row ?? null;
}
