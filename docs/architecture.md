# Architecture Notes

EQR NLP is intentionally static-first for v0.

## Runtime shape

- **Next.js App Router** renders the dashboard and event detail routes.
- **Static sample events** represent low-friction public feeds until a live RSS/GDELT-style adapter is approved.
- **`KoreaFinanceMcpAdapter`** isolates macro data lookup so live `korea-finance-mcp` transport can replace fixtures later.
- **Deterministic scoring** keeps v0 reproducible and testable; benchmarked models are a follow-up.
- **Browser-local notes** use localStorage so the MVP does not require a database account.

## Extension seams

- Replace `FixtureKoreaFinanceMcpAdapter` with an HTTP/MCP client adapter.
- Add a `NewsFeedAdapter` when live feed ingestion begins.
- Add a scoring strategy interface before historical evaluation or model comparison.
- Add hosted persistence only after the service choice is approved.

## Public repo boundary

Local OMX workflow artifacts are intentionally not tracked in git. Public rationale is summarized in README and this `docs/` directory.
