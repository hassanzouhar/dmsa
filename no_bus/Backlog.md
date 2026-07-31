# Backlog

Prioritized roadmap beyond immediate TODO.

P1 – Accuracy & Reliability
- Real percentile computation: ingest distributions when available; otherwise approximate from multiple indicators per dimension.
- Validation suite: scripted checks to assert ranges, monotonic percentiles, and non‑null values across all 110 docs.
- Robust JSON‑stat parsing: handle alternative dimension ids (e.g., language variants), missing values, and discontinued tables.

P2 – Coverage & Fallbacks
- Regional benchmarks (if SSB provides stable regional dims) → `benchmarks/by-region`.
- Explicit fallback recording (segment/sector/size/national) in documents consumed by UI.
- Micro company handling refinements (non‑linear factors by sector).

P3 – Intelligence Enhancements
- Expand success patterns (e.g., e‑commerce, social media, remote work) per `docs/BENCHMARK_SCHEMA.md`.
- Recommendation templates library with triggers; runtime interpolation service for user gaps.
- Trend detection & time‑series snapshots (quarterly comparisons).

P4 – Operations
- Scheduled monthly run (CI/cron) with artifact upload to `backups/` and Slack/Email notification.
- Rate‑limit telemetry and retry metrics.
- Data quality dashboard (counts, lastUpdated age, table health).

P5 – App Integration
- Benchmark service module with full fallback hierarchy and provenance flags.
- Feature flags for switching between legacy and SSB‑backed benchmarks.

Notes
- Always respect SSB limits (30 req/min, ~800k cells). Prefer filtered queries for targeted runs.
- Keep Norwegian user‑facing text consistent with assessment content.
