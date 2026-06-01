# Test Spec — Beyond MVP Accuracy Release

## Unit Tests

### Metrics

- `mae` returns absolute average error.
- `rmse` penalizes larger errors.
- `smape` handles zero/near-zero safely.
- directional accuracy ignores/handles flat cases deterministically.
- baseline improvement calculation handles worse-than-baseline and missing baseline.

### Thresholds and states

- Pragmatic and Balanced thresholds are exported with version IDs.
- Per-indicator threshold lookup is deterministic.
- Required metrics, minimum sample size, minimum coverage window, and gate mode are explicit per indicator.
- Hard gate returns `INSUFFICIENT_COVERAGE` when required metrics/history are missing; it does not silently pass or fail without coverage.
- Basket state is `PASS` only if every required indicator is `PASS`; any `FAIL` produces basket `FAIL`; coverage gaps produce basket `INSUFFICIENT_COVERAGE` if no hard failure exists; not-yet-matured targets produce `PENDING`.
- Boundary tests cover exact-threshold `PASS`, just-below-threshold `FAIL`, insufficient sample coverage, and pending target observations for every indicator config.

### Scorecard

- Aggregate basket pass is false when any indicator hard gate fails.
- Aggregate basket pass is true only when all required indicators pass.
- Coverage-gap indicators are shown separately and produce `INSUFFICIENT_COVERAGE`.
- Pending/unmatured forecast targets produce `PENDING`, not accuracy evidence.
- Balanced target gap is computed and displayed even when Pragmatic passes.

## Integration Tests

### Storage and migrations

- SQL migration files under `migrations/*.sql` are syntactically smoke-checked or parsed by a lightweight migration test.
- Storage adapter contract tests run against in-memory implementation and assert the same logical behavior expected from Neon Postgres implementation.
- Tests assert no hidden runtime schema mutation: application code must not create/alter production tables outside migrations.
- `DATABASE_URL` absent behavior returns explicit non-production in-memory/test fallback or storage unavailable state; it must not present persisted production evidence.
- Source runs, observations, issued forecast targets, matched observations, evaluation runs, and metric results can be inserted/read through the storage interface.
- Persisted ledger rows preserve all required forecast-target fields listed above.

### Source loaders

- Frankfurter historical loader maps USD/KRW observations to dated series.
- ECOS loader maps daily/monthly rows to normalized dates.
- Missing ECOS key returns coverage gap, not sample production data.
- Source errors are preserved as warnings with source IDs.

### Evaluation engine

- Evaluator compares model forecast against naive baseline.
- Evaluator records sample size, coverage window, horizon, metric version, model version.
- Issued forecast target ledger preserves every required field through scoring: forecastId, issuedAt, sourceRunId, eventId/documentId when present, indicatorId, horizon, targetDate, baselineValue, predictedValue/predictedDelta, predictedDirection, confidence, modelVersion, metricVersion, sourceVersion, matchedObservationId, observedValue, observedDirection, evaluationState, evaluatedAt.
- Forecasts are not scored before target observation maturity.
- Walk-forward/time-split does not leak future observations into past forecasts.

### API routes

- `/api/accuracy/scorecard` returns indicators, basket summary, thresholds, coverage, generatedAt, and gate states (`PASS`, `FAIL`, `INSUFFICIENT_COVERAGE`, `PENDING`).
- `/api/accuracy/ingest` rejects unauthorized calls when `CRON_SECRET` is configured and accepts `Authorization: Bearer ${CRON_SECRET}`.
- `vercel.json` cron path points at the protected ingest route once route exists.
- In no-storage/no-key local mode, scorecard returns explicit coverage gaps or dev fallback, not fake live claims.

## UI Tests / Smoke Checks

- `/accuracy` renders Korean scorecard headings.
- `/accuracy` displays four indicator rows/cards or explicit gap cards.
- `/accuracy` shows Pragmatic gate state and Balanced gap.
- `/dart/forecasts` still renders and links to `/accuracy`.
- Global nav includes accuracy/검증 link if added.

## Regression Tests

- Existing `npm test` suite remains green.
- `npm run lint` passes.
- `npm run build` passes.
- `npm audit --audit-level=high` passes or documented exception exists.
- `git diff --check` passes.

## Manual Verification

1. Run local dev server.
2. Open `/accuracy`.
3. Confirm Korean UI labels.
4. Confirm no investment-advice language.
5. Confirm missing credentials are visible as coverage gaps.
6. With ECOS/DART keys configured, trigger ingestion and confirm real observations populate.

## Acceptance Evidence Required

- Test output for unit/integration tests.
- Build/lint output.
- Screenshot or browser snapshot of `/accuracy`.
- Short summary of source coverage by indicator.
- Commit hash and pushed branch.


## Consensus Review Changelog

- Architect blocker coverage added for deterministic ledger and gate semantics.
- Critic blocker coverage added for full ledger-field preservation, storage adapter contract tests, migration smoke validation, DATABASE_URL-absent behavior, no hidden runtime schema mutation, and all four gate states.
