# OpenCrab-Inspired Ontology Factory

EQR NLP now treats DART ingestion as an evidence-first ontology factory instead of direct event creation.

## Borrowed methodology

OpenCrab/LocalCrab describes a flow from source material through evidence collection, ontology grammar extraction, graph validation, and exportable packs. EQR applies that idea in a narrower finance-specific form:

```text
OpenDART document
  -> EvidenceNode
  -> ClaimNode
  -> PromotionDecision(candidate | validated | promoted | rejected)
  -> KG event / indicator forecast input
  -> JSON/JSONL ontology pack
```

## Lifecycle gates

Each DART document is checked for:

- stable id
- content hash
- source URL
- macro indicator hint
- confidence threshold
- duplicate content hash

Only fully passing records become `promoted`. Partial records remain `validated`; duplicate or structurally unsafe records are `rejected`.

## Pack export

`/api/dart/ontology-pack` returns a promotion package with:

- manifest
- evidence nodes
- claim nodes
- promotion decisions
- quality report
- graph JSONL strings

`/api/dart/ontology-pack?format=jsonl` returns node JSONL for quick import or inspection.

## Current storage stance

The lifecycle is request-time and memory-only. The next heavy-MVP step is durable storage for evidence, claims, promotion decisions, and graph edges.
