# EQR NLP

[한국어 README](./README_ko.md)

EQR NLP is a Vercel-ready research demo for Korean macro-impact forecasting from low-friction news events, disclosures, and live-first macro baselines. It turns source documents into an explainable event-to-macro knowledge graph, calibrates relationship weights with magnitude-error backtests, and shows multi-horizon scenario forecasts for a fixed Korean macro basket.

## What the demo shows

- A low-friction event feed using reproducible sample data.
- Server-only source adapter contracts for fixture, RSS, GDELT DOC API-style, and OpenDART disclosure inputs.
- Live-first macro baseline adapter: USD/KRW uses no-key Frankfurter daily FX; ECOS-backed base rate, KTB 3Y, and M2 activate with `BOK_ECOS_API_KEY` or `ECOS_API_KEY`, with explicit sample fallback if unavailable.
- A beyond-MVP `/accuracy` scorecard that evaluates real-history forecasts against naive baselines with PASS / FAIL / INSUFFICIENT_COVERAGE / PENDING gate states.
- A memory-backed knowledge graph with Source, Document, Entity, Event, Indicator, Observation, Weight, BacktestRun, Forecast, and PortfolioScenario concepts.
- Macro-impact cards for:
  - USD/KRW
  - base-rate / policy-rate expectation
  - Korea treasury yield
  - M2 / liquidity
- 1D, 1W, and 1M horizon views for each basket item.
- OpenCrab-inspired evidence → claim → promotion lifecycle for DART ontology construction.
- Backtest-calibrated weight context with MAE, RMSE, and zero-safe sMAPE.
- Source-linked evidence, KG path hints, uncertainty flags, mini time-series charts, browser-local analyst notes, and hypothetical portfolio simulation.

## App routes

- `/` — Korean dashboard with DART-first forecast entry point and research boundaries.
- `/events/[id]` — macro basket forecast with evidence, uncertainty, and calibration context.
- `/graph` — live OpenDART KG provenance when `DART_API_KEY` is configured; fixture fallback otherwise.
- `/dart` — server-rendered live OpenDART disclosure list, KG ingestion status, ontology promotion gates, and pack export links.
- `/dart/forecasts` — live OpenDART disclosures converted into macro forecast result cards.
- `/accuracy` — Korean macro-basket accuracy scorecard with source coverage, hard gates, balanced target gaps, model/metric/source versions, and no-investment-advice copy.
- `/backtests` — deterministic fixture calibration run and generated weights.
- `/portfolio` — hypothetical scenario simulation only; no broker, order, personalized advice, recommendation, buy/sell signal, or target-price workflow.

## Why explicit fallback remains

The approved MVP prioritizes a working product demo over benchmark accuracy or signup-heavy infrastructure. The app now uses live DART and live-first macro baselines where no-key or configured official APIs are available, while preserving explicit sample fallback for missing credentials.

## Boundaries

This is a research demo. It does not provide order execution, broker integration, portfolio management automation, personalized investment advice, recommendations, buy/sell signals, or target prices. Portfolio functionality is limited to hypothetical scenario simulation and historical backtesting. Legal/compliance review is intentionally deferred before any production or monetized use.

## Tech stack

- Next.js App Router
- TypeScript
- Vitest
- ESLint
- Live-first adapters with explicit sample fallback for missing credentials
- `MemoryGraphStore` for non-durable KG demos and tests

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Set `DART_API_KEY` in Vercel to enable live OpenDART reads. USD/KRW uses Frankfurter without a key. Set `BOK_ECOS_API_KEY` or `ECOS_API_KEY` to enable official ECOS-backed base-rate, treasury-yield, and M2 baselines. Set `DATABASE_URL` to a Neon/Vercel Marketplace Postgres database for durable accuracy evidence; without it, `/accuracy` uses an explicit non-production in-memory store. Set `CRON_SECRET` to protect `/api/accuracy/ingest` when Vercel Cron runs. Optional credentials can be copied from `.env.example`; the app still builds without API keys but marks fallback/coverage gaps explicitly.

## Verification

```bash
npm test
npm run lint
npm run build
```

## Architecture and provenance

- [Architecture notes](./docs/architecture.md)
- [Fixture provenance](./docs/fixture-provenance.md)
- [Knowledge graph schema](./docs/knowledge-graph-schema.md)
- [Backtesting and weight calibration](./docs/backtesting.md)
- [Beyond-MVP accuracy release plan](./docs/beyond-mvp-accuracy-plan.md)
- [Beyond-MVP accuracy test spec](./docs/beyond-mvp-accuracy-test-spec.md)
- [Cost boundaries](./docs/cost-boundaries.md)
- [Portfolio simulation boundary](./docs/portfolio-simulation-boundary.md)
- [OpenCrab-inspired ontology factory](./docs/opencrab-inspired-ontology.md)

## Project artifacts

Local OMX planning artifacts are not tracked in the public repository. Public implementation rationale is summarized in `docs/`.

## Live integration follow-ups

- Expand durable scheduled ingestion for RSS/GDELT/OpenDART beyond the current accuracy history cron.
- Replace/extend the direct live macro adapter with a korea-finance-mcp transport when its runtime contract is finalized.
- Add a free-tier graph database adapter behind `GraphStore` after setup is approved.
- Replace fixture backtest windows with real historical event/indicator data.
