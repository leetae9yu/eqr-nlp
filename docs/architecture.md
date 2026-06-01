# Architecture Notes

EQR NLP is static-first for v0, with server-only seams for live ingestion later.

## Runtime shape

- **Next.js App Router** renders the Korean dashboard, DART forecast, event detail, graph, backtest, and portfolio-simulation routes.
- **Static sample events** represent low-friction public feeds until a live ingestion job is approved.
- **Source adapters** isolate fixture, RSS, GDELT DOC API-style, and OpenDART disclosure inputs behind `SourceAdapter`; OpenDART reads `DART_API_KEY` first and `OPENDART_API_KEY` as a fallback.
- **`KoreaFinanceMcpAdapter`** isolates macro data lookup so a live `korea-finance-mcp` transport can replace fixtures later.
- **`GraphStore`** isolates KG persistence. `MemoryGraphStore` is deterministic and non-durable; a free-tier graph adapter can be added later without changing domain contracts.
- **Backtest calibration** generates `BacktestRun` and `Weight` nodes with MAE, RMSE, and zero-safe sMAPE.
- **Browser-local notes** use localStorage so the MVP does not require a database account.

## Data flow

```text
SourceAdapter -> Document -> OntologyFactory -> Evidence/Claim/Promotion -> RuleBasedExtractor -> Event/Entity/Indicator hints
             -> GraphStore -> provenance views
             -> Backtest calibration -> Weight nodes
             -> Forecast DTO -> Event, backtest, graph, portfolio simulation UI
```

## Extension seams

- Replace `FixtureKoreaFinanceMcpAdapter` with an HTTP/MCP client adapter.
- Run RSS/GDELT adapters and durable OpenDART ingestion from server-only jobs or bounded admin actions; the current `/dart` page performs request-time live OpenDART reads.
- Add a durable `GraphStore` adapter after a free-tier service is selected.
- Add a scoring strategy interface before model comparison or LLM extraction.
- Replace fixture historical windows with real event/indicator backfills.

## Public repo boundary

Local OMX workflow artifacts are intentionally not tracked in git. Public rationale is summarized in README and this `docs/` directory.
