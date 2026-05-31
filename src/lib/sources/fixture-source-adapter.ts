import { sampleEvents } from "../events";
import type { SourceNode } from "../domain/graph-types";
import { assertServerOnly } from "../server-only";
import { createDocument, createDocumentId } from "./document-utils";
import { clampLimit, type FetchDocumentsInput, type FetchDocumentsResult, type SourceAdapter } from "./source-types";

assertServerOnly("fixture-source-adapter");

export const fixtureSource: SourceNode = {
  id: "source:fixture-events",
  kind: "source",
  sourceKind: "fixture",
  name: "EQR fixture events",
  homepageUrl: "https://github.com/leetae9yu/eqr-nlp",
  freeTierOnly: true,
  paidRequiresApproval: false,
  reliabilityWeight: 0.5,
  createdAt: "2026-05-31T00:00:00.000Z",
};

export class FixtureSourceAdapter implements SourceAdapter {
  id = fixtureSource.id;
  source = fixtureSource;

  async fetchDocuments(input: FetchDocumentsInput = {}): Promise<FetchDocumentsResult> {
    const limit = clampLimit(input.limit, sampleEvents.length);
    const query = input.query?.toLowerCase();
    const events = sampleEvents
      .filter((event) => !query || `${event.title} ${event.summary} ${event.tags.join(" ")}`.toLowerCase().includes(query))
      .slice(0, limit);

    return {
      source: this.source,
      availability: { ok: true },
      documents: events.map((event) => createDocument({
        id: createDocumentId(this.source, event.id),
        sourceId: this.source.id,
        externalId: event.id,
        title: event.title,
        url: event.url,
        publishedAt: event.publishedAt,
        retrievedAt: "2026-05-31T00:00:00.000Z",
        language: "en",
        rawText: `${event.summary}\n${event.evidence.map((item) => item.quote).join("\n")}`,
        summary: event.summary,
        citation: `${event.source}: ${event.title}`,
      })),
      warnings: ["Fixture documents are deterministic and not live source data."],
    };
  }
}
