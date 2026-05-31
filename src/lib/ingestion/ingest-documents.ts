import { createRelationship } from "../domain/graph-types";
import type { ExtractionProvider } from "../extraction/extraction-provider";
import { RuleBasedExtractor } from "../extraction/rule-based-extractor";
import type { GraphStore } from "../kg/graph-store";
import { MemoryGraphStore } from "../kg/memory-graph-store";
import type { SourceAdapter } from "../sources/source-types";
import { MACRO_BASKET } from "../types";

export type IngestDocumentsInput = {
  adapter: SourceAdapter;
  graphStore?: GraphStore;
  extractor?: ExtractionProvider;
  limit?: number;
  query?: string;
};

export type IngestDocumentsSummary = {
  sourceId: string;
  documentsFetched: number;
  entitiesExtracted: number;
  eventsExtracted: number;
  relationshipsWritten: number;
  warnings: string[];
};

export async function ingestDocuments({ adapter, graphStore = new MemoryGraphStore(), extractor = new RuleBasedExtractor(), limit = 10, query }: IngestDocumentsInput): Promise<IngestDocumentsSummary> {
  const result = await adapter.fetchDocuments({ limit, query });
  await graphStore.upsertSource(result.source);
  let entitiesExtracted = 0;
  let eventsExtracted = 0;
  let relationshipsWritten = 0;
  const warnings = [...result.warnings];

  if (!result.availability.ok) {
    warnings.push(result.availability.reason ?? "Source unavailable");
    return { sourceId: result.source.id, documentsFetched: 0, entitiesExtracted, eventsExtracted, relationshipsWritten, warnings };
  }

  for (const document of result.documents.slice(0, limit)) {
    await graphStore.upsertDocument(document);
    await graphStore.upsertRelationship(createRelationship("PUBLISHED", result.source.id, document.id));
    relationshipsWritten += 1;

    const extraction = await extractor.extract(document);
    for (const entity of extraction.entities) {
      await graphStore.upsertEntity(entity);
      await graphStore.upsertRelationship(createRelationship("MENTIONS", document.id, entity.id));
      entitiesExtracted += 1;
      relationshipsWritten += 1;
    }
    for (const event of extraction.events) {
      await graphStore.upsertEvent(event);
      await graphStore.upsertRelationship(createRelationship("EVIDENCES", document.id, event.id));
      eventsExtracted += 1;
      relationshipsWritten += 1;
      for (const indicator of MACRO_BASKET) {
        if (extraction.indicatorHints[indicator] !== undefined) {
          await graphStore.upsertRelationship(createRelationship("AFFECTS", event.id, indicator, { hint: extraction.indicatorHints[indicator] ?? 0 }));
          relationshipsWritten += 1;
        }
      }
    }
    warnings.push(...extraction.warnings);
  }

  return { sourceId: result.source.id, documentsFetched: result.documents.length, entitiesExtracted, eventsExtracted, relationshipsWritten, warnings };
}
