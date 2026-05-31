# Execution-Ready Spec — Korea Finance MCP Macro Forecast SaaS

## Metadata

- Source workflow: `$deep-interview`
- Profile: custom deep (`ambiguity < 3%` requested by user)
- Rounds: 12
- Final ambiguity: **2.4%**
- Threshold: **3.0%**
- Context type: **greenfield**
- Context snapshot: .omx/context/korea-finance-forecast-saas-20260531T052314Z.md
- Transcript: .omx/interviews/korea-finance-forecast-saas-20260531T054153Z.md
- External reference: https://github.com/emceeKim/korea-finance-mcp

## Clarity Breakdown

| Dimension | Score | Gap |
|---|---:|---|
| Intent | 0.96 | Research/analyst use is clear; exact buyer/persona can be refined later. |
| Outcome | 0.94 | Event→macro forecasting workflow is clear. |
| Scope | 0.93 | Basket, horizons, output contract, and news-source constraint are defined. |
| Constraints | 0.91 | Low-friction feeds, Vercel-preferred frontend, no paid vendor MVP, no trading/portfolio are clear. |
| Success criteria | 0.86 | Working deployed demo is primary; quantitative model benchmark remains future work. |

Weighted ambiguity: **2.4%**.

## Intent

Build a SaaS research dashboard for analysts that turns low-friction financial news/public feed events into macro-impact forecasts using korea-finance-mcp data/tools as the finance data layer.

## Desired Outcome

A deployable v0 product demo where an analyst can open a news/event item and see predicted impact on a Korean macro basket across multiple horizons, with evidence, uncertainty, charts, and notes.

## In Scope

1. **Audience**: research/analyst workflow.
2. **Core workflow**: event/news item → MCP macro/market data lookup → macro-impact forecast/scoring → dashboard output.
3. **News input**: low-friction public feeds first, such as RSS/public feeds/GDELT-like sources where feasible.
4. **MCP/data layer**: use korea-finance-mcp capabilities where appropriate for ECOS/KRX/DART-style finance data access.
5. **Forecast basket**:
   - USD/KRW
   - Base-rate / policy-rate expectation
   - Treasury yields
   - M2 / liquidity
6. **Horizons**: 1D, 1W, 1M.
7. **Dashboard output contract**:
   - Basket-level impact score / direction
   - 1D/1W/1M forecast per basket item
   - Evidence sentences and source links
   - Uncertainty/confidence and data/model limitations
   - Related time-series charts
   - Analyst notes per event
8. **Primary success criterion**: deployable end-to-end working demo: news ingestion → MCP lookup → forecast score → dashboard.

## Out of Scope / Non-goals

- Trading/order execution.
- Portfolio management or optimization.
- Real-time/ultra-short-term trading signals.
- Paid news vendors for MVP.
- Quantitative benchmark superiority as the first release gate; model accuracy benchmarking can follow after demo viability.

## Decision Boundaries

OMX/planning may decide:

- Concrete frontend framework and app structure, with Vercel strongly preferred for frontend.
- Whether minimal backend pieces are needed, but should avoid signup-heavy external services unless clearly justified.
- Database/cache choice for prototype, provided operational burden stays low.
- Forecast method for v0, as long as outputs include evidence and uncertainty.
- Low-friction news/feed source shortlist.

Requires explicit user confirmation later:

- Any paid vendor, paid database, or signup-heavy infrastructure.
- Compliance/legal wording if the product moves beyond feasibility demo.
- Any feature that looks like investment advice, individual-security recommendation, or trading signal.
- Expansion beyond the selected macro basket.

## Constraints

- Greenfield repo: no existing code or app stack beyond OMX state.
- Frontend should preferably deploy to Vercel.
- Avoid additional external accounts/services when practical.
- Start with low-friction public news feeds, not paid vendors.
- Legal/compliance review is deferred, so downstream plans must carry a residual-risk note.
- korea-finance-mcp appears intentionally conservative around regulated prediction/recommendation features; downstream design should not blindly convert the SaaS into advice/trading tooling without review.

## Testable Acceptance Criteria

A v0 demo is acceptable when:

1. A deployed or locally reproducible app shows a feed/list of low-friction news/event items.
2. Selecting one event triggers or displays an analysis pipeline result.
3. The pipeline retrieves or references relevant macro/finance data via korea-finance-mcp or an adapter/mocked equivalent during early development.
4. The event detail page shows all four basket items: USD/KRW, base-rate expectation, treasury yield, M2/liquidity.
5. Each basket item shows 1D, 1W, and 1M forecast/impact views.
6. Each result includes evidence/source links and at least one explanation sentence.
7. Each result includes uncertainty/confidence and limitation flags.
8. Time-series charts are shown for relevant indicators.
9. Analyst notes can be created/saved for an event, at least in prototype storage.
10. MVP does not include trading/order execution, portfolio optimization, paid news vendor dependency, or real-time trading-signal UX.

## Assumptions Exposed + Resolutions

- **Assumption**: Event→macro prediction is testable from arbitrary news.
  - **Resolution**: constrain to repeatable low-friction feeds first.
- **Assumption**: Vercel can host everything.
  - **Resolution**: frontend should prefer Vercel; stack details are deferred to planning, with low operational burden as a constraint.
- **Assumption**: Product can ignore compliance.
  - **Resolution**: compliance is deferred but retained as residual risk; no trading/portfolio/real-time trading signals in MVP.
- **Assumption**: A single macro target is enough.
  - **Resolution**: user wants a macro basket, narrowed to four indicators.

## Pressure-Pass Findings

The interview revisited the original event→forecast claim and forced a repeatability/data-source boundary. The chosen path is not arbitrary news scraping or paid terminals; it is low-friction public feeds first, paired with MCP-accessible macro/finance data.

## Brownfield Evidence vs Inference Notes

- `[from-code][auto-confirmed]`: local project is effectively greenfield/empty except OMX state.
- `[from-research]`: `korea-finance-mcp` public README describes ECOS/DART/KRX/real-estate finance tools and conservative exclusions around recommendations/predictions/trading. Treat this as external repo context to verify during planning.

## Technical Context Findings

Likely architecture candidates for planning:

- Next.js/Vercel frontend and API layer for dashboard/demo.
- MCP client adapter around korea-finance-mcp.
- Low-friction feed ingestion adapter (RSS/public feeds/GDELT-like options to be evaluated).
- Storage for events, forecasts, chart data, and analyst notes.
- Forecast/scoring service that can initially be heuristic/LLM-assisted and later benchmarked.
- Charting component for macro time series.

## Recommended Handoff

Use `$ralplan` next to compare architecture options, data-source feasibility, Vercel-compatible deployment, and MVP slicing before implementation.

Suggested command:

```bash
$plan --consensus --direct .omx/specs/deep-interview-korea-finance-forecast-saas.md
```

Then use `$ultragoal` or `$team` for implementation after planning artifacts exist.

## Residual Risk

Compliance/legal posture is intentionally deferred. Downstream planning must preserve this as a risk and avoid implementing investment-advice/trading-signal features without explicit confirmation.
