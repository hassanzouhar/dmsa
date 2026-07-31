# TODO

Short, high‑impact tasks to reach full functionality.

1) JSON‑stat Sector/Size Correctness
✓ Sector mapping applied in transformer; ✓ segment-filtered pulls in extractor.
→ Next: run `npm run test:sanity` against a couple of tables.

2) Checkbox Scoring With Negative Weights
- Implemented: normalize with positive mass and subtract selected negative weight (see `scoring.ts`).
- Add sample cases in `docs/_code_examples/` demonstrating expected 0–10 outputs.

3) Micro Segment Inference
- Implement `micro` inference when SSB lacks 1–9 employees: derive from `small` with factor (see `docs/SSB_EXTRACTION_GUIDE.md`).
- Mark `dataSource='ssb-inferred'` and `hasSufficientData=false`.

4) Percentiles and Sample Size
✓ Percentiles derived from indicator set; clamped and monotonic.
→ Next: improve sampleSize when table metadata allows; document method.

5) Segment Fetch Optimization
✓ Extractor uses `getTableDataBySegment`.

6) Fallback Flags & Metadata
- Ensure fallback provenance is set when using sector/size/national aggregates.
- Include `ssbTables` and `lastUpdated` consistently.

7) CI Script and Snapshot
✓ GitHub Actions monthly dry run + artifact; manual upload on dispatch.

8) Documentation Updates
- Keep `docs/SSB_DIMENSION_MAPPING.md` and `docs/BENCHMARK_SCHEMA.md` in sync when adding tables/fields.

Owner: sole developer (this repo)

---

## New Benchmark Report Module

[x] Map existing assessment + benchmark types to proposed `src/` layout (identify reuse vs new definitions).
[x] Scaffold `src/` tree with placeholders for benchmarks, mapping, scoring, report, and util modules.
[x] Implement benchmark fetcher with segment/sector/national fallbacks, cross-dimension sample-size guard, and in-memory cache.
[x] Port scoring adapters (checkbox, dual-table, scale, tri-state) and normalization helpers to emit 0–100 scores with clamps and negative indicator penalties.
[x] Build aggregation + report builder pipeline (survey → dimension scores → benchmark comparison → tips + `lowSample` flag).
[x] Wire up public entry point and update Firestore + assessment types as needed.
[x] Add unit tests for adapters, aggregation, comparison, and end-to-end builder using mocked Firestore.
[x] Document behaviour changes (low-sample flag, caching) in relevant SSB docs and ensure TODO items reference dry-run validation.
