-- Digital Maturity Assessment — Postgres-skjema
--
-- To tabeller. Erstatter fem Firestore-collections:
--   surveys + 3 subcollections  -> surveys (én rad)
--   email_surveys               -> indeks på surveys.email_hash
--   magic_links                 -> magic_links
--   analytics_events            -> fjernet (ble aldri lest)
--   analytics/global_metrics    -> fjernet (count(*) dekker behovet)
--
-- Tilstand som Firestore lagret redundant i `state` + `flags` er nå utledet:
--   T0/T1              = upgraded_at is null / not null
--   isCompleted        = completed_at is not null
--   hasResults         = scores is not null
--   hasExpandedAccess  = upgraded_at is not null
-- Det fjerner muligheten for at flaggene og tidsstemplene motsier hverandre.

create table if not exists surveys (
  id                    text primary key,
  survey_version        text        not null default 'v1.0'
                                    check (survey_version in ('v1.0', 'v1.1')),
  language              text        not null default 'no'
                                    check (language in ('no', 'en')),

  created_at            timestamptz not null default now(),
  completed_at          timestamptz,
  upgraded_at           timestamptz,

  -- Bedriftsdetaljer (tidligere companyDetails-objektet)
  company_name          text        not null,
  company_size          text        not null
                                    check (company_size in ('micro', 'small', 'medium', 'large')),
  nace                  text        not null,
  sector                text        not null,
  region                text        not null,

  -- Tilgang (tidligere retrieval-objektet). Kun hashen lagres.
  token_hash            text        not null,
  token_revoked         boolean     not null default false,

  -- Resultater. `answers` er den eneste genuint polymorfe strukturen:
  -- 7 spørsmålstyper med ulik form, og formen endrer seg mellom
  -- survey_version. Derfor jsonb her, og bare her.
  overall_score         integer     check (overall_score between 0 and 100),
  scores                jsonb,
  answers               jsonb,

  -- Brukervalg
  include_in_leaderboard boolean    not null default true,
  is_anonymous          boolean     not null default false,

  -- Kontaktdetaljer, satt ved T0 -> T1-oppgradering.
  -- Ligger inline i stedet for egen tabell: færre bevegelige deler.
  -- Sletting av persondata blir da en UPDATE som nuller disse feltene,
  -- ikke en DELETE — statistikkraden overlever.
  email                 text,
  email_hash            text,
  email_domain          text,
  contact_name          text,
  consent_accepted_at   timestamptz,
  policy_version        text,

  -- Et fullført survey må ha resultater, og omvendt.
  constraint completed_has_scores
    check ((completed_at is null) = (scores is null)),
  -- En oppgradering må ha e-post.
  constraint upgraded_has_email
    check (upgraded_at is null or email is not null)
);

-- Oppslag «alle surveys for denne e-posten». Erstatter hele
-- email_surveys-collectionen, som bare fantes fordi Firestore
-- trenger et eget reversindeks-dokument for dette.
create index if not exists surveys_email_hash_idx
  on surveys (email_hash)
  where email_hash is not null;

-- Leaderboard og benchmark-snitt filtrerer alltid på fullførte surveys.
create index if not exists surveys_completed_idx
  on surveys (sector, company_size, region)
  where completed_at is not null and include_in_leaderboard;

create table if not exists magic_links (
  token_hash    text        primary key,
  email_hash    text        not null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  -- Lenken er gjenbrukbar i gyldighetsperioden; vi teller bruk, ikke
  -- forbruker den. Firestore-versjonen hadde et `used`-felt som ble satt
  -- men aldri håndhevet — det er droppet.
  use_count     integer     not null default 0,
  first_used_at timestamptz,
  last_used_at  timestamptz
);

create index if not exists magic_links_email_hash_idx
  on magic_links (email_hash);

-- Utløpte lenker filtreres bort ved lesing (`expires_at > now()`), så den
-- manuelle opprydningsjobben Firestore krevde er ikke lenger nødvendig.
-- Denne indeksen gjør en eventuell opprydding billig.
create index if not exists magic_links_expires_at_idx
  on magic_links (expires_at);
