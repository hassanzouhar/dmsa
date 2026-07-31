# Repository Guidelines

## Project Structure & Module Organization
- Core assessment: `scoring.ts` (0–10 question → 0–100 dimension/overall).
- SSB pipeline: `lib/ssb-api-client.ts` (PxWeb API + rate limiting), `lib/ssb-transformer.ts` (JSON‑stat → benchmarks & intelligence).
- Data + types: `entities/` (NACE, sizes), `types/firestore-schema.ts`.
- Scripts: `script/` (generate/extract/upload/tests). Docs in `docs/SSB_*.md` and `docs/BENCHMARK_SCHEMA.md`.
- Rules/config: `firestore.rules`, `storage.rules`.

## Build, Test, and Development Commands
- Generate all benchmarks (dry run first):
  - `npx tsx script/generate-all-benchmarks.ts --dry-run --output all-benchmarks-test.json`
  - Upload: `npx tsx script/generate-all-benchmarks.ts`
- Segment extract (scoped): `npx tsx script/extract-ssb-benchmarks.ts --sector C --size small --dry-run --output test.json`
- JSON‑stat smoke test: `npx tsx script/test-ssb-extraction.ts`
- Sector/size sanity test: `npx tsx script/test-sector-size-sanity.ts 10974 C J small`
- Validate JSON export: `npx tsx script/validate-benchmarks.ts all-benchmarks-test.json`
- Ensure Firebase Admin env set before uploads: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
- Initialize containers (optional): call `ensureBenchmarkCollections(db)` once at startup to create container docs.

## Coding Style & Naming Conventions
- TypeScript-first, 2‑space indent, descriptive names; avoid one‑letter vars.
- Use discriminated unions for question/answer types; keep user strings Norwegian.
- Filenames: kebab-case for modules/scripts (e.g., `ssb-api-client.ts`).

## Testing Guidelines
- Prefer `--dry-run` and inspect outputs (`*-overview.json`).
- Validate: rate limiting respected, scores in range (0–10 question; 0–100 dimension/overall), percentiles monotonic (p25 < p50 < p75).
- Ad hoc tests live under `script/test-*.ts` and run via `npx tsx`.

## Commit & Pull Request Guidelines
- Conventional Commits encouraged: `feat:`, `fix:`, `docs:`, `chore:`.
- PRs must include: purpose, linked issue, before/after JSON snippets or metrics, and doc updates if behavior changes.
- Keep diffs surgical; avoid unrelated refactors.

## Security & Configuration Tips
- Never commit secrets. Load Firebase Admin creds from env (see `docs/SSB_QUICKSTART.md`).
- Respect SSB API limits (30 req/min, ~800k cells/query). Use `ssbClient` and filtered queries.
- Firebase setup options:
  - Place service account at `script/service-account-key.json.json` (auto‑detected), or set `GOOGLE_APPLICATION_CREDENTIALS`.
  - Or define env vars: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

## CI
- GitHub Actions workflow `Generate Benchmarks` runs monthly (dry run + artifact). Trigger manually to upload to Firestore.

## Architecture Overview
- Benchmarks are precomputed (110+ docs) for fast reads. Fallback: segment → sector → size → national.
- Intelligence is precomputed from SSB benefits/challenges; user‑specific recommendations are derived at runtime.
 - Runtime helpers: `lib/benchmark-service.ts#getBenchmarkWithFallback` for retrieval, and `ensureBenchmarkCollections` to prime container docs.
 - Regions: generator creates `benchmarks/by-region/data/NO-xx` for all counties when SSB data is available.

## Agent-Specific Instructions
- When changing scoring or SSB logic, update docs (`docs/SSB_*.md`) and attach a dry‑run JSON. Favor incremental, verifiable commits.
