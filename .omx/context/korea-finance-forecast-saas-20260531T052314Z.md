# Deep Interview Context Snapshot — korea-finance-forecast-saas

## Task statement
User wants to build a SaaS that uses `https://github.com/emceeKim/korea-finance-mcp` so that when disclosures/news or similar finance events appear, the SaaS predicts macro variables or specific indicators/indices. User expects an early version could be hosted on Vercel.

## Desired outcome
Execution-ready product/technical requirements for an MVP SaaS: event ingestion, signal extraction, forecasting target(s), UI/API surface, deployment constraints, and legal/safety boundaries.

## Stated solution
Use korea-finance-mcp as the data/tool layer; build a Vercel-style SaaS around disclosure/news-triggered forecasts.

## Probable intent hypothesis
Create a Korean finance intelligence product that turns public finance events and market/macro data into forward-looking indicator/index forecasts, likely for research, monitoring, or decision support.

## Known facts/evidence
- Local `/home/opc/projects/eqr-nlp` is effectively greenfield: no source/config/tests/manifest found beyond `.omx` runtime state (`omx explore` preflight).
- GitHub README for `emceeKim/korea-finance-mcp` describes 15 tools across ECOS, real estate, DART, and KRX, including `get_indicator`, `get_timeseries`, `get_disclosure`, `get_financials`, `get_stock_price`, and `get_market_index`.
- The same README states the MCP is intentionally legally conservative and excludes price prediction, stock recommendations, target price, portfolio optimization, and order placement.
- README states stack: TypeScript, `@modelcontextprotocol/sdk`, Node.js, Fly.io, GitHub Actions, Zod; public data sources include ECOS, data.go.kr, R-ONE, OpenDART, and KRX.
- External source checked: https://github.com/emceeKim/korea-finance-mcp (opened 2026-05-31).

## Constraints
- Must distinguish allowed informational forecasting/research from regulated investment advice/recommendations.
- Vercel may fit web/API frontend, but MCP server or background workers may need separate runtime if long-lived processes, scheduled jobs, queues, or Python/model jobs are required.
- Need up-to-date data/API feasibility checks before final architecture.

## Unknowns/open questions
- Primary user/customer and use case.
- Forecast target: macro variables, market indices, sector indices, individual stocks, real estate indicators, or only scenario impact ranges.
- Prediction horizon and update cadence.
- Whether “news” source is inside MCP, external news APIs/RSS, or user-provided URLs.
- Legal/product boundary: research dashboard vs investment signal vs recommendations.
- MVP success metric and acceptable model accuracy/evidence standard.

## Decision-boundary unknowns
- What the agent may choose autonomously: stack, model method, data schema, deployment topology, compliance wording, UX scope.
- What requires explicit user confirmation: regulated prediction/recommendation posture, target assets/indices, monetization/customer segment, data vendor/API spend.

## Likely codebase touchpoints
Greenfield; likely future touchpoints: Next.js/Vercel frontend, API route/serverless functions, MCP client adapter, ingestion scheduler/queue, database, forecasting/evaluation service, compliance/disclaimer layer.

## Prompt-safe initial-context summary status
not_needed
