# Cost Boundaries

The MVP is free-tier first.

## Allowed by default

- Existing Vercel-compatible frontend/runtime.
- Free or low-friction public news feeds, including RSS/GDELT-like sources.
- OpenDART API integration using user-provided environment credentials.
- Local or in-memory graph storage for tests and demos.
- Free graph tiers only after explicit setup.

## Requires explicit approval

- Paid news/data vendors.
- Paid graph database tiers.
- Paid extraction or LLM providers.
- Any service that requires a credit card for the MVP path.

## Current graph storage decision

`MemoryGraphStore` is the default initial graph store. It is deterministic and useful for tests, but it is non-durable. A Neo4j adapter is a later extension point, not an initial dependency.
