# Deep Interview Transcript — Korea Finance Forecast SaaS

- Profile: custom deep, user threshold <3%
- Context type: greenfield
- Final ambiguity: 2.4%
- Threshold: 3.0%
- Context snapshot: .omx/context/korea-finance-forecast-saas-20260531T052314Z.md
- External reference: https://github.com/emceeKim/korea-finance-mcp

## Condensed Transcript

1. **Intent / product boundary** — User chose `research-analyst`: first MVP is for research/analyst use, not retail trading.
2. **Outcome / killer workflow** — User chose `event-to-macro`: news/disclosure/policy events should predict future macro-variable effects.
3. **Scope / signal source pressure pass** — User chose `external-news-api`: add external news/RSS/API and combine with MCP data. This pressure-tested the assumption that event→macro prediction needs repeatable event sources.
4. **Non-goals / compliance** — User selected: no trading/portfolio, no real-time trading signal, no paid news vendor in MVP.
5. **Decision boundary / compliance** — User chose `defer-compliance`: legal/compliance wording and strict guardrails deferred; product feasibility comes first. Residual risk retained.
6. **Forecast targets** — User chose `macro-basket`.
7. **Minimum viable basket** — User selected `USD/KRW`, `base-rate-expectation`, `treasury-yield`, `M2/liquidity`.
8. **Forecast horizon** — User selected `multi-horizon`: 1D/1W/1M.
9. **MVP proof** — User chose `working-demo`: deployable end-to-end product demo is primary success.
10. **Deployment boundary** — User stated: decide stack later, but frontend should preferably be Vercel because additional signups/services are burdensome.
11. **News source constraint** — User chose `low-friction-feeds`: RSS/public feeds/GDELT-like low-friction sources first.
12. **Output contract** — User selected all: basket impact score, multi-horizon forecast, evidence/citations, uncertainty/confidence, time-series charts, analyst notes.

## Pressure-Pass Findings

- Original broad idea: “news/disclosures trigger forecasts.”
- Revisited assumption: event→macro prediction is not testable unless event sources are repeatable and low-friction enough for MVP ingestion.
- Resolution: use low-friction public/RSS/GDELT-like feeds first; combine with korea-finance-mcp macro/market data; paid news vendors are explicitly out of MVP.

## Residual Risks

- Compliance/legal posture is deliberately deferred, not solved.
- Multi-horizon + multi-basket + analyst notes makes v0 broader than a minimal proof; planning should cut implementation slices.
- News source availability/terms and korea-finance-mcp runtime/deployment constraints need feasibility review.
