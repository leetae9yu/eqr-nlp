# PRD — Beyond MVP Accuracy Release

## Status

- Source: `.omx/specs/deep-interview-beyond-mvp.md`
- Planning mode: RALPLAN direct consensus artifact
- Date: 2026-06-01
- Final interview ambiguity: 2.2% (<3%)

## Requirements Summary

EQR NLP must move beyond a plausible MVP demo into a defensible accuracy/validation release. The next release prioritizes forecast accuracy and validation over auth, billing, paid vendors, or full compliance.

The product must expose whether EQR NLP improves over naive baselines for a macro basket of:

1. USD/KRW
2. Korean treasury yield / KTB 3Y
3. Base-rate expectation / policy-rate direction
4. M2 / liquidity

The release state is `PASS` only if each required indicator is `PASS`. Aggregate basket performance must not hide individual `FAIL`, `INSUFFICIENT_COVERAGE`, or `PENDING` states.

## RALPLAN-DR Summary

### Principles

1. **Evidence before polish** — no score is production-grade unless backed by real historical data, baseline comparison, and coverage metadata.
2. **Per-indicator accountability** — aggregate basket score cannot mask a failed indicator.
3. **Free/public source first** — no paid news vendor, no intraday tick feed, no auth/billing dependency for this release.
4. **Explainability by default** — model/metric/source versions, confidence, and experimental labels must be visible beside outputs.
5. **Incremental persistence** — add durable ingestion/evaluation primitives without overbuilding full SaaS account infrastructure.

### Decision Drivers

1. User asked to leave MVP by improving **forecast accuracy/validation**, not merely UI or ingestion breadth.
2. Current repo already has live DART/macro fetching, KG/ontology, and fixture backtests; the weak link is real-history evaluation.
3. Vercel remains preferred deployment surface, so storage/scheduling should fit Vercel-native or low-friction marketplace patterns.

### Viable Options

#### Option A — Local/generated scorecard only

- Approach: Fetch public history on demand and compute scorecard dynamically without durable DB.
- Pros: Fastest implementation, minimal infra.
- Cons: Slow pages, rate-limit exposure, no reproducible ingestion ledger, weak beyond-MVP credibility.
- Verdict: rejected for post-MVP target.

#### Option B — Durable Vercel-compatible evaluation store

- Approach: Add a small persistence layer for source observations, forecasts, evaluation runs, and metric results. Use Vercel-friendly Postgres provider such as Neon via Marketplace; local/test may use in-memory fallback only, and that fallback must never be presented as production evidence.
- Pros: Reproducible, queryable, cron-friendly, supports scorecard history and model versions.
- Cons: Adds schema/migration/dependency complexity.
- Verdict: recommended.

#### Option C — Heavy graph-first architecture

- Approach: Move all data, ontology nodes, time series, and evaluation state into a managed graph DB first.
- Pros: Strong long-term ontology alignment.
- Cons: Slower path to measurable accuracy release; graph DB choice can be revisited after metric store proves value.
- Verdict: defer.

## ADR

### Decision

Implement Option B with a narrowed four-phase delivery contract: first define deterministic evaluation semantics, then add historical loaders and scorecard API, then add Neon Postgres persistence/cron ingestion, then ship the Korean UI/docs. The release is not allowed to claim production accuracy until forecast-target matching, gate states, and coverage gaps are deterministic.

### Drivers

- Real history and reproducibility are required to leave MVP.
- Existing backtesting is fixture-oriented under `src/lib/backtesting/`.
- Existing DART and macro adapters provide live request-time data but not a historical evaluation ledger.
- Vercel currently connects Postgres through Marketplace providers; Vercel Postgres itself is no longer the direct new-project product, so Neon/Supabase-style Postgres integration should be supported.

### Alternatives considered

- On-demand-only scorecard: rejected because it is not reproducible and is rate-limit fragile.
- Graph-first rewrite: rejected because it delays measurable accuracy and over-expands scope.
- Full SaaS productization: rejected for this release by explicit non-goal (`no-auth-billing`).

### Consequences

- Add schema and persistence abstraction.
- Add ingestion jobs/API routes and possibly `vercel.json` cron config.
- Add scorecard route/API and tests.
- Keep fallback behavior explicit when storage credentials or source coverage are missing.

### Follow-ups

- Later: auth/workspaces, paid vendors, managed graph DB, full compliance/legal review.
- Later: intraday/tick FX if user chooses trading-grade market data.

## Product Scope

### In scope

- Historical source ingestion for all four indicators where free/public APIs allow.
- Maximum-free-history collection with per-source coverage metadata.
- Evaluation runs against naive baselines.
- Per-indicator hard gates and aggregate basket summary.
- Pragmatic pass/fail and Balanced target gap display.
- Versioned metrics/model/source metadata.
- Experimental research-signal labels if signal-like outputs are added.

### Out of scope

- Intraday/tick FX.
- Paid news vendors.
- Login/billing/workspaces.
- Full institutional compliance implementation.
- Broker/order execution.
- Personalized investment advice.

## Recommended Architecture

### New modules

- `src/lib/accuracy/types.ts` — source observation, issued forecast target, matched observation, evaluation run, gate state, scorecard result types.
- `src/lib/accuracy/thresholds.ts` — Pragmatic and Balanced threshold definitions.
- `src/lib/accuracy/baselines.ts` — previous-value/no-change/random-walk baselines.
- `src/lib/accuracy/metrics.ts` — MAE, RMSE, sMAPE, directional accuracy, calibration/gap helpers.
- `src/lib/accuracy/evaluate.ts` — walk-forward/time-split evaluation engine.
- `src/lib/accuracy/scorecard.ts` — per-indicator hard gate and basket score aggregation.
- `src/lib/history/*` — historical loaders for Frankfurter FX, ECOS, DART/news events.
- `src/lib/storage/*` — persistence interface plus Neon Postgres implementation using `@neondatabase/serverless` and in-memory/test fallback only.
- `migrations/*.sql` — explicit SQL migrations for the accuracy ledger; no hidden schema mutation at runtime.

### New routes/APIs

- `src/app/accuracy/page.tsx` — Korean accuracy scorecard UI.
- `src/app/api/accuracy/scorecard/route.ts` — latest scorecard JSON.
- `src/app/api/accuracy/ingest/route.ts` — protected ingestion endpoint for Vercel Cron/manual run; must require `Authorization: Bearer ${CRON_SECRET}` when `CRON_SECRET` is configured.
- `vercel.json` — daily/weekly UTC cron schedule for ingestion/evaluation once the endpoint exists.

### Existing files to preserve

- `src/lib/dart/dart-forecast.ts` — existing DART forecast bundle must keep working.
- `src/lib/live-macro-adapter.ts` — live baselines stay as request-time display fallback.
- `src/lib/backtesting/*` — migrate or wrap fixture logic into accuracy metrics, do not delete until replacement tests exist.
- `src/app/dart/forecasts/page.tsx` — link to accuracy scorecard but do not break existing DART prediction UX.

## Data Source Plan

- USD/KRW: Frankfurter daily historical/reference rates; no API key; daily central-bank style rates.
- KTB 3Y / policy-rate realized direction / M2: ECOS with `BOK_ECOS_API_KEY`/`ECOS_API_KEY`; record coverage gaps when API key is absent or series is unavailable. Existing `base-rate-expectation` identifiers should be UI-labeled as policy-rate realized/direction proxy unless a true expectation proxy is added and marked experimental.
- DART events: OpenDART API via existing adapter; keep source document provenance.
- Public news/RSS/GDELT: use only free/public sources; paid vendors excluded.

## Forecast-Target Ledger Contract

Every evaluated prediction must be represented as an issued forecast target before it can be scored. Required ledger fields:

- `forecastId`
- `issuedAt`
- `sourceRunId`
- `eventId` / `documentId` when available
- `indicatorId`
- `horizon`
- `targetDate`
- `baselineValue`
- `predictedValue` or `predictedDelta`
- `predictedDirection`
- `confidence`
- `modelVersion`
- `metricVersion`
- `sourceVersion`
- `matchedObservationId`
- `observedValue`
- `observedDirection`
- `evaluationState`
- `evaluatedAt`

A forecast cannot be included in pass/fail scoring until the matching future observation exists. Unmatched forecasts are `PENDING`, not failures.

## Gate States

All scorecard levels must use explicit states:

- `PASS` — required metrics satisfy the Pragmatic gate.
- `FAIL` — required metrics are available but fail the Pragmatic gate.
- `INSUFFICIENT_COVERAGE` — missing key/source/history/sample size prevents scoring.
- `PENDING` — forecast target exists but target observation date has not matured.

Basket state rules:

- `PASS` only if every required indicator is `PASS`.
- `FAIL` if any required indicator is `FAIL`.
- `INSUFFICIENT_COVERAGE` if no indicator fails but at least one required indicator lacks coverage.
- `PENDING` only for not-yet-matured evaluations and must not be shown as accuracy evidence.

## Deterministic Threshold Package

### Per-indicator configs

Each indicator config must declare: required metrics, minimum observation count, minimum historical coverage, gate mode, Pragmatic threshold, Balanced threshold, and coverage-failure behavior.

### Pragmatic release gate

- `usd-krw`: required metrics `smapeImprovementPct` and `directionalAccuracy`; minimum 60 matured daily observations; gate passes if sMAPE improves by at least 10% over previous-value baseline **and** directional accuracy is at least 53%.
- `treasury-yield`: required metrics `maeImprovementPct` and `directionalAccuracy`; minimum 60 matured daily observations; gate passes if MAE improves by at least 10% over previous-value baseline **and** directional accuracy is at least 53%.
- `base-rate-expectation`: label as `policy-rate realized/direction proxy` unless a true expectation source is added; required metric `eventDirectionHitRate`; minimum 10 rate-relevant matured events or `INSUFFICIENT_COVERAGE`; gate passes at 60% hit rate.
- `m2-liquidity`: required metric `trendSmapeImprovementPct`; minimum 18 monthly observations or `INSUFFICIENT_COVERAGE`; gate passes at 8% improvement over no-change trend baseline.

### Balanced target

- `usd-krw`: sMAPE improvement 15% and directional accuracy 55%.
- `treasury-yield`: MAE improvement 15% and directional accuracy 55%.
- `base-rate-expectation`: policy-rate event direction hit rate 65%.
- `m2-liquidity`: trend sMAPE improvement 10%.

The implementation may add supplementary metrics, but these required metrics and state semantics cannot be weakened without a new plan.

## Acceptance Criteria

1. `/accuracy` exists and renders a Korean scorecard.
2. Scorecard covers all four indicators or marks coverage gaps per indicator.
3. Each indicator has deterministic state: `PASS`, `FAIL`, `INSUFFICIENT_COVERAGE`, or `PENDING`.
4. Basket summary cannot show overall pass when any indicator hard gate fails, has insufficient coverage, or is still pending.
5. Each indicator displays:
   - gate state,
   - source coverage window,
   - observation count,
   - baseline type,
   - model/metric version,
   - Pragmatic pass/fail,
   - Balanced target gap.
6. Historical data comes from real source adapters when credentials/API access are available; fixture-only backtest is not presented as production scorecard. Forecast-target records must be persisted or represented in the ledger contract before scoring.
7. Missing keys or source failures produce visible coverage gaps, not silent sample values.
8. Existing DART forecast route still builds and tests pass.
9. Experimental signals are labeled research/experimental and not investment advice.
10. Tests cover metric calculations, threshold hard gates, coverage gaps, API rendering, and non-regression of existing forecast tests.

## Implementation Steps

1. **Accuracy domain and thresholds**
   - Add `src/lib/accuracy/types.ts`, `thresholds.ts`, `metrics.ts`.
   - Port/reuse functions from `src/lib/backtesting/metrics.ts` where possible.

2. **Historical source loaders**
   - Add `src/lib/history/frankfurter-history.ts` for USD/KRW historical daily data.
   - Add `src/lib/history/ecos-history.ts` for KTB/base-rate/M2 history with coverage-gap results.
   - Add adapters for DART/news event history using existing `src/lib/sources/*` patterns.

3. **Storage abstraction**
   - Add storage interface and in-memory/test fallback.
   - Add Neon Postgres implementation with `@neondatabase/serverless` and `DATABASE_URL`.
   - Add SQL migrations under `migrations/` for observations, source runs, issued forecast targets, matched observations, evaluation runs, and metric results.
   - Production persistence requires `DATABASE_URL`; local/test may use in-memory storage only, never SQLite unless a future plan explicitly introduces it. In-memory storage must be visibly marked non-production and cannot back production accuracy claims.

4. **Evaluation engine**
   - Implement naive baselines.
   - Implement walk-forward or time-split evaluator.
   - Produce per-indicator metrics and coverage metadata.

5. **Scorecard API and UI**
   - Add `/api/accuracy/scorecard` and `/accuracy`.
   - Link `/accuracy` from global nav and `/dart/forecasts`.
   - UI follows existing `DESIGN.md` Apple-inspired Korean style.

6. **Scheduled ingestion/evaluation**
   - Add protected `GET /api/accuracy/ingest` endpoint.
   - Require `Authorization: Bearer ${CRON_SECRET}` when `CRON_SECRET` is set.
   - Add Vercel Cron config in `vercel.json` using UTC schedule.
   - Ensure manual local run path exists for tests/dev.

7. **Testing and documentation**
   - Unit tests for metrics, thresholds, scorecard hard gates.
   - Integration tests for source failure/coverage gap behavior.
   - Build/lint/test/audit.
   - Update README/README_ko with data freshness and accuracy scorecard semantics.

## Risks and Mitigations

- **ECOS key absent**: display coverage gaps; do not fake production scorecard.
- **Sparse policy-rate/M2 events**: use `INSUFFICIENT_COVERAGE` state and separate threshold semantics; do not pretend realized base-rate is a market expectation.
- **API rate limits/timeouts**: persist observations and schedule ingestion instead of on-demand full-history fetch.
- **Metric overclaiming**: always compare against naive baseline and show sample size/window.
- **Investment-advice confusion**: label outputs as research/experimental; no broker/order UX.
- **Vercel runtime limits**: chunk ingestion and avoid long full-history jobs in request path.

## Available-Agent-Types Roster

- `architect`: storage/evaluation architecture review.
- `dependency-expert`: Postgres/client/dependency choice and source API risk review.
- `executor`: implementation lanes.
- `test-engineer`: scorecard/evaluator tests and fixture design.
- `verifier`: completion evidence and non-regression verification.
- `writer`: README/README_ko and product copy.
- `code-reviewer`: final code review.

## Follow-up Staffing Guidance

Recommended `$ultragoal` + `$team` split:

1. Data/source lane — `executor`, medium reasoning.
2. Metrics/evaluation lane — `executor` + `test-engineer`, high reasoning for correctness.
3. Storage/API lane — `executor` + `dependency-expert`, medium/high reasoning.
4. UI/docs lane — `executor` + `writer`, medium reasoning.
5. Verification lane — `verifier` after integration, high reasoning.

## Team Verification Path

Team must prove:

- Accuracy tests pass.
- Existing tests pass.
- `/accuracy` renders.
- `/dart/forecasts` still renders.
- Missing credentials show coverage gaps.
- Scorecard hard gate blocks aggregate pass on any indicator failure.

## Goal-Mode Follow-up Suggestions

- Default: `$ultragoal .omx/plans/prd-beyond-mvp-accuracy-release.md` for durable implementation checkpoints.
- Use `$team` under Ultragoal for parallel lanes.
- Use `$performance-goal` only if runtime/latency becomes the primary constraint.
- Use `$ralph` only as explicit fallback for single-owner persistence.


## Consensus Review Changelog

- Architect iteration applied: added explicit forecast-target ledger, deterministic gates, aggregate states, policy-rate proxy language, Neon/Postgres path, and cron secret protection.
- Critic iteration applied: removed SQLite fallback ambiguity, required all four gate states in acceptance wording, and strengthened storage/ledger/migration test requirements in the paired test spec.
