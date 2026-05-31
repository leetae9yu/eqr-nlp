# PRD — EQR NLP Korea Macro Forecast SaaS

## Decision
Build a greenfield, Vercel-friendly Next.js demo for analysts. The demo ingests low-friction public/news-like events, combines them with a korea-finance-mcp-inspired macro data adapter, and displays multi-horizon macro-impact forecasts for a fixed Korean macro basket.

## Requirements Summary

- Audience: research analysts.
- Core workflow: event/news item → macro data context → forecast scoring → dashboard/detail view.
- Forecast basket:
  - USD/KRW
  - base-rate / policy-rate expectation
  - treasury yield
  - M2 / liquidity
- Horizons: 1D, 1W, 1M.
- Required event detail output:
  - basket-level impact score and direction
  - multi-horizon forecasts
  - evidence/source links
  - uncertainty/confidence and limitations
  - related time-series charts
  - analyst notes
- Deployment stance: frontend should be Vercel-ready; avoid signup-heavy services for v0.
- Data stance: low-friction public feeds/sample feed first; paid news vendors out of MVP.
- Compliance stance: legal review is deferred, but MVP must not include order execution, portfolio management, or real-time trading signal UX.

## RALPLAN-DR Summary

### Principles

1. **Demo end-to-end before optimizing accuracy** — the first proof is a working product path, not benchmark superiority.
2. **Low operational friction** — no required paid vendors, DB accounts, or extra cloud services for local/Vercel preview.
3. **Evidence-first output** — every forecast-like score must show source/evidence and uncertainty.
4. **Compliance-aware boundaries** — avoid trading/order/portfolio/realtime signal surfaces.
5. **Composable adapters** — news, MCP data, and scoring should be replaceable without rewriting UI.

### Decision Drivers

1. User wants Vercel-first frontend and minimal signup burden.
2. User wants a public repo with English README and Korean README link.
3. Scope needs enough realism to show MCP/data integration without blocking on external credentials.

### Viable Options

#### Option A — Next.js static-first demo with local adapters (chosen)

- Pros: Vercel-ready, no required DB/API keys, easy to test, easy public repo onboarding.
- Cons: initial feed/MCP data are sample/adapter-backed rather than live production ingestion.

#### Option B — Next.js + live MCP HTTP + hosted DB

- Pros: closer to production and live data.
- Cons: requires external services/secrets; violates low-friction constraint for v0.

#### Option C — Python forecasting backend + separate frontend

- Pros: richer modeling path.
- Cons: more deployment complexity; not needed for working demo acceptance.

## ADR

- **Decision**: Implement Option A with a Next.js App Router app, TypeScript, local adapter modules, deterministic scoring, localStorage-backed analyst notes, and static/sample data that documents where live korea-finance-mcp and public feed adapters plug in.
- **Drivers**: Vercel fit, low signup friction, public repo clarity, fast end-to-end demo.
- **Alternatives considered**: live MCP + DB, Python backend, standalone API-first prototype.
- **Why chosen**: It satisfies the user’s first release gate while preserving extension points.
- **Consequences**: Forecasts are demonstrative/research-oriented; live data and benchmark validation are future work.
- **Follow-ups**: add live RSS/GDELT adapter, add actual MCP client transport, add persistence when user approves external services, add model evaluation.

## Implementation Steps and Commit Slices

1. **Project scaffold and tooling**
   - Initialize git, package scripts, TypeScript, Next.js, ESLint, Vitest, Playwright-or-smoke alternative if lightweight.
   - Add `.gitignore`, `README.md`, `README_ko.md` placeholders.
   - Commit: `Establish the Vercel-ready application foundation`.

2. **Domain model and deterministic pipeline**
   - Add typed macro basket, horizons, sample events, source/evidence model, MCP adapter interface, scoring/forecast service.
   - Add unit tests for scoring determinism, basket coverage, horizon coverage, and non-goal guardrails.
   - Commit: `Make the forecast pipeline explainable before live integrations`.

3. **Dashboard and event detail UX**
   - Add feed list, event detail, impact cards, multi-horizon table, time-series mini charts, evidence panel, uncertainty flags.
   - Commit: `Expose macro-impact research workflow in the dashboard`.

4. **Analyst notes and low-friction persistence**
   - Add client-side notes per event with localStorage fallback and no external account dependency.
   - Commit: `Keep analyst annotations local for a zero-service MVP`.

5. **Docs and public readiness**
   - English README first; Korean README_ko; link from README to Korean doc.
   - Add architecture notes, setup, scripts, limitations, compliance/deferred risk statement.
   - Commit: `Document the public research demo boundary`.

6. **Final verification and push**
   - Run install/build/test/lint.
   - Run final cleanup/review checks.
   - Create public GitHub repo `eqr-nlp` and push if authenticated.


## Architect ITERATE Revisions Incorporated

- Domain schema must be explicit: `NewsEvent`, `MacroSnapshot`, `Evidence`, `IndicatorForecast`, and `EventAnalysis` are first-class TypeScript types under `src/lib/`.
- Forecast semantics must be labeled as deterministic research scenario scoring, not production prediction accuracy. Each indicator has direction, impact score, confidence, horizon rationales, evidence, and uncertainty.
- Mock adapter provenance must be visible: fixture data is clearly labeled as sample ECOS/KRX/MCP-adapter data until live korea-finance-mcp transport is configured.
- Persistence is intentionally low-friction: analyst notes use localStorage for v0 and need no database account.
- Tests must cover schema completeness, deterministic forecasts, evidence/uncertainty presence, boundary copy, and local note persistence.

## Testable Acceptance Criteria

- App can be installed and run locally with `npm install` and `npm run dev`.
- `npm test` passes deterministic scoring/domain tests.
- `npm run lint` passes.
- `npm run build` passes.
- Event list is visible on the home page.
- Selecting/viewing an event shows all four basket items.
- Each basket item has 1D/1W/1M forecast output.
- Detail view includes evidence links, uncertainty/confidence, charts, and analyst notes.
- No UI copy exposes order execution, portfolio optimization, paid-news dependency, or real-time trading-signal positioning.
- README.md is English-first and links to README_ko.md.

## Risks and Mitigations

- **Risk**: Users mistake scores for investment advice.
  - Mitigation: research-demo language, no trading/portfolio/realtime signal features, uncertainty shown beside every score.
- **Risk**: Live korea-finance-mcp integration requires secrets/remote runtime.
  - Mitigation: adapter interface + sample adapter for v0; document live integration as follow-up.
- **Risk**: Multi-basket/multi-horizon UI gets too broad.
  - Mitigation: fixed four-item basket and compact cards/tables.
- **Risk**: GitHub public push fails due auth/repo conflict.
  - Mitigation: verify `gh auth status`; if repo exists, use existing or report exact blocker.

## Available-Agent-Types Roster / Staffing Guidance

- Solo executor is sufficient because repo is greenfield and scope is bounded.
- Use verifier/code-reviewer only if final quality gate surfaces ambiguous failures.
- Team mode is not required unless live integrations expand scope.

## Goal-Mode Follow-up

Use `$ultragoal` with this PRD and `.omx/plans/test-spec-korea-finance-forecast-saas.md` as the durable ledger. Commit after each slice above.
