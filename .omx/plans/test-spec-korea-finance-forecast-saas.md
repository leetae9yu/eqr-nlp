# Test Spec — EQR NLP Korea Macro Forecast SaaS

## Verification Strategy

Use small, deterministic checks that prove the v0 demo contract without relying on paid vendors or live credentials.

## Unit Tests

- Forecast pipeline returns all four basket indicators for each event.
- Each indicator includes exactly 1D, 1W, and 1M horizons.
- Scoring is deterministic for a fixed event and macro snapshot.
- Evidence list is non-empty and includes URL/source metadata.
- Confidence/uncertainty flags are present for every indicator.
- Guardrail copy excludes order execution, portfolio management, and real-time trading-signal language in structured product constants.

## Integration / Component Checks

- Home page renders sample event feed.
- Event detail route renders:
  - impact cards for USD/KRW, base-rate expectation, treasury yield, M2/liquidity
  - multi-horizon forecasts
  - evidence panel
  - uncertainty summary
  - time-series chart blocks
  - analyst notes control

## E2E / Smoke Checks

- `npm run build` compiles the Vercel-ready app.
- If browser tooling is available, smoke open `/` and one event route.
- Otherwise use Next build plus unit/component tests as the MVP gate.

## Documentation Checks

- README.md is English and links to README_ko.md.
- README_ko.md exists and mirrors key setup/scope in Korean.
- README states v0 is a research demo, not trading/portfolio advice.
- README lists setup commands and environment-free demo mode.

## Final Quality Gate

- `npm test`
- `npm run lint`
- `npm run build`
- `git status --short` reviewed before final push.
