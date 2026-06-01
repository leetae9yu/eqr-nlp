# EQR NLP

[한국어 README](./README_ko.md)

EQR NLP is a Vercel-ready research demo for Korean macro-impact forecasting from low-friction news events, disclosures, and fixture-backed macro data. It turns source documents into an explainable event-to-macro knowledge graph, calibrates relationship weights with magnitude-error backtests, and shows multi-horizon scenario forecasts for a fixed Korean macro basket.

## What the demo shows

- A low-friction event feed using reproducible sample data.
- Server-only source adapter contracts for fixture, RSS, GDELT DOC API-style, and OpenDART disclosure inputs.
- A korea-finance-mcp adapter boundary for future live ECOS/KRX/DART-style macro data access.
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

- `/` — event queue and research boundaries.
- `/events/[id]` — macro basket forecast with evidence, uncertainty, and calibration context.
- `/graph` — live OpenDART KG provenance when `DART_API_KEY` is configured; fixture fallback otherwise.
- `/dart` — server-rendered live OpenDART disclosure list, KG ingestion status, ontology promotion gates, and pack export links.
- `/backtests` — deterministic fixture calibration run and generated weights.
- `/portfolio` — hypothetical scenario simulation only; no broker, order, personalized advice, recommendation, buy/sell signal, or target-price workflow.

## Why local fixtures first?

The approved MVP prioritizes a working product demo over benchmark accuracy or signup-heavy infrastructure. The app is designed so public feeds, OpenDART, and live korea-finance-mcp transports can replace sample adapters later without rewriting the dashboard contracts.

## Boundaries

This is a research demo. It does not provide order execution, broker integration, portfolio management automation, personalized investment advice, recommendations, buy/sell signals, or target prices. Portfolio functionality is limited to hypothetical scenario simulation and historical backtesting. Legal/compliance review is intentionally deferred before any production or monetized use.

## Tech stack

- Next.js App Router
- TypeScript
- Vitest
- ESLint
- Local fixture adapters for a zero-service MVP
- `MemoryGraphStore` for non-durable KG demos and tests

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Set `DART_API_KEY` in Vercel to enable live OpenDART reads. Optional live credentials can be copied from `.env.example`; the default demo still runs without API keys.

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
- [Cost boundaries](./docs/cost-boundaries.md)
- [Portfolio simulation boundary](./docs/portfolio-simulation-boundary.md)
- [OpenCrab-inspired ontology factory](./docs/opencrab-inspired-ontology.md)

## Project artifacts

Local OMX planning artifacts are not tracked in the public repository. Public implementation rationale is summarized in `docs/`.

## Live integration follow-ups

- Add durable scheduled ingestion for RSS/GDELT/OpenDART beyond the request-time live DART page.
- Add an actual korea-finance-mcp client transport for live macro snapshots.
- Add a free-tier graph database adapter behind `GraphStore` after setup is approved.
- Replace fixture backtest windows with real historical event/indicator data.
