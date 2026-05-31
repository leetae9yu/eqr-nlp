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

## Live follow-up

A production path should replace these fixtures with:

1. A low-friction RSS/GDELT-style news feed adapter.
2. A korea-finance-mcp client adapter for ECOS/KRX/DART-backed data.
3. Historical event/indicator data for model evaluation.
