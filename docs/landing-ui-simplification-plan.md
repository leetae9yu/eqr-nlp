# Landing UI Simplification Plan

## RALPLAN-DR summary

### Principles
1. Korean-first product clarity: a new visitor should understand the product before encountering implementation detail.
2. Analyst-tool credibility: simplify copy and navigation, not evidence signals.
3. Preserve working research depth: existing forecast, accuracy, ontology, backtest, and portfolio routes stay reachable.
4. No new dependencies: implement visual polish with existing React/CSS/SVG.
5. Reversible scope: make home/chrome and density changes without touching data/model/API contracts.

### Decision drivers
1. The home page currently exposes too many equally weighted CTAs, weakening conversion clarity.
2. The product needs a stronger visual proof block for ontology/knowledge-graph value.
3. The user wants a landing-page feel but selected an analyst-tool density direction, so the solution must reduce text/table clutter while keeping graphs, scores, and core metrics visible.

### Viable options
- **Chosen: Analyst landing shell + visual proof sections.** Rebuild `/` and shared nav around two primary CTAs, concise Korean copy, proof metrics, and an Obsidian-style graph visual. Keep detail routes intact.
- **Rejected: Minimal marketing landing only.** Too light for the requested analyst-tool feel and would hide credibility signals.
- **Rejected: Full redesign of every detail page.** Larger risk and slower validation; the first value comes from home/chrome and visual information architecture.

## PRD

### Objective
Transform EQR NLP’s first impression from a dense research dashboard into a polished Korean analyst-tool landing experience that introduces the product, highlights evidence-backed macro forecasts, and routes users to forecast and accuracy results.

### Scope
- Rework `src/app/page.tsx` into a landing-style product page with:
  - concise hero message,
  - at most two primary CTAs in the first screen,
  - proof/status cards,
  - Obsidian-like ontology/knowledge-graph visual section,
  - simplified feature journey to DART forecasts, accuracy, graph, and portfolio/backtest depth.
- Simplify `src/app/layout.tsx` navigation labels and hierarchy.
- Extend `src/app/globals.css` with landing/graph visual classes and responsive behavior.
- Preserve all existing routes and data/API behavior.

### Non-goals
- No DART/ECOS/Neon/API/model changes.
- No deletion of detail pages.
- No new UI dependency/library.
- No auth, billing, onboarding, or sign-up flow.
- No switch away from Korean-first UI.

### UX content direction
- Tone: concise Korean research SaaS, not consumer hype.
- First-screen promise: “공시·뉴스·거시지표를 연결해 예측 근거와 정확도까지 보여준다.”
- Primary CTAs: forecast results and accuracy/evidence.
- Secondary depth: DART collection, knowledge graph, backtest, portfolio simulation.

### Architecture
- Keep the app as a Next.js app-router frontend.
- Home page remains server component/static-friendly.
- Knowledge graph visual is presentational CSS/SVG/HTML and does not require graph DB changes.
- Existing route contracts and public APIs remain unchanged.

### Acceptance criteria
1. Home hero explains the product and output within 5 seconds.
2. First-screen hero exposes no more than two primary CTAs.
3. Home includes an Obsidian-style node/edge ontology visual section.
4. Long explanatory/table-like detail is moved below first impression or grouped into cards.
5. Mobile hero and graph visual remain readable without horizontal overflow.
6. `/dart/forecasts`, `/accuracy`, and `/graph` remain reachable from home/chrome.
7. Tests, lint, TypeScript, and build pass.

### Implementation sequence
1. Update home information architecture and Korean copy.
2. Update shared nav/footer to reduce top-level clutter.
3. Add CSS for landing proof cards and graph visual, including responsive rules.
4. Verify with tests/lint/typecheck/build and browser smoke if possible.

## ADR

### Decision
Implement a scoped landing/chrome redesign with a presentational Obsidian-style graph visual and reduced CTA/navigation density.

### Drivers
- Need immediate product clarity.
- Need preserve analyst credibility.
- Need keep current data system stable.

### Alternatives considered
- Minimal landing page: rejected because it underplays research-tool credibility.
- Full multi-page redesign: rejected because it increases risk and delays value.
- Add a graph visualization library: rejected because user disallowed new UI libraries and current scope can be achieved with CSS/SVG.

### Consequences
- Home becomes the product narrative source of truth.
- Detail routes continue to carry analytical depth.
- Further Obsidian-like graph interactivity can be planned later without blocking the first simplification pass.

### Follow-ups
- Later: make `/graph` itself interactive if desired.
- Later: add authenticated workspaces/billing only if product direction requires it.

## Goal-mode follow-up
Use `$ultragoal` by default for durable sequential execution and checkpoints. Team mode is not necessary for this bounded UI pass. Ralph remains an explicit fallback only.
