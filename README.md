# EQR NLP

[한국어 README](./README_ko.md)

EQR NLP is a Vercel-ready research demo for Korean macro-impact forecasting from low-friction news events. It turns public-feed-style event items into explainable multi-horizon scenario scores for a fixed Korean macro basket.

## What the demo shows

- A low-friction event feed using reproducible sample data.
- A korea-finance-mcp adapter boundary for future live ECOS/KRX/DART data access.
- Macro-impact cards for:
  - USD/KRW
  - base-rate / policy-rate expectation
  - Korea treasury yield
  - M2 / liquidity
- 1D, 1W, and 1M horizon views for each basket item.
- Source-linked evidence, uncertainty/limitation flags, mini time-series charts, and browser-local analyst notes.

## Why local fixtures first?

The approved MVP prioritizes a working product demo over benchmark accuracy or signup-heavy infrastructure. The app is designed so public feeds and live korea-finance-mcp transports can replace the sample adapters later without rewriting the dashboard.

## Boundaries

This is a research demo. It does not provide order execution, portfolio management, or production investment-advice workflows. Legal/compliance review is intentionally deferred before any production or monetized use.

## Tech stack

- Next.js App Router
- TypeScript
- Vitest
- ESLint
- Local fixture adapters for a zero-service MVP

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Verification

```bash
npm test
npm run lint
npm run build
```

## Architecture and fixture provenance

- [Architecture notes](./docs/architecture.md)
- [Fixture provenance](./docs/fixture-provenance.md)

## Project artifacts

Local OMX planning artifacts are not tracked in the public repository. Public implementation rationale is summarized in `docs/`.

## Live integration follow-ups

- Add a low-friction RSS/GDELT-style feed adapter.
- Add an actual korea-finance-mcp client transport.
- Add persistence after a database choice is approved.
- Add historical evaluation once live event/indicator data is available.
