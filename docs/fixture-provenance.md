# Fixture Provenance

The current demo uses synthetic fixtures to prove product flow without API keys, paid vendors, or extra cloud accounts.

## Event fixtures

`src/lib/events.ts` contains public-feed-style sample events. URLs point to `example.com` to make it explicit that they are placeholders, not live news records.

## Macro fixtures

`src/lib/macro-data.ts` contains sample macro snapshots for:

- USD/KRW
- base-rate expectation
- Korea treasury yield
- M2 liquidity

These values are deterministic demo data. The forecast UI labels them as fixture data until a live korea-finance-mcp transport is configured.

## Source adapter fixtures

`FixtureSourceAdapter` converts the sample event feed into `Document` nodes for KG ingestion. RSS, GDELT, and OpenDART adapters are implemented with mocked tests and server-only boundaries, but live network ingestion is not enabled by default.

## Backtest fixtures

`src/lib/backtesting/historical-fixtures.ts` contains frozen historical examples for deterministic weight calibration. They validate the magnitude-error pipeline but are not a claim of production accuracy.

## Live follow-up

A production path should replace these fixtures with:

1. A low-friction RSS/GDELT-style news feed adapter.
2. An OpenDART disclosure adapter with a user-provided server-side API key.
3. A korea-finance-mcp client adapter for ECOS/KRX/DART-backed macro data.
4. Historical event/indicator data for model evaluation.
