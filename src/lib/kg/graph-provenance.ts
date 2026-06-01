import { createRelationship, type DocumentNode, type KgNode, type SourceNode } from "../domain/graph-types";
import { RuleBasedExtractor } from "../extraction/rule-based-extractor";
import { ingestDocuments } from "../ingestion/ingest-documents";
import { OpenDartAdapter } from "../sources/dart-adapter";
import { FixtureSourceAdapter } from "../sources/fixture-source-adapter";
import type { SourceAdapter } from "../sources/source-types";
import { MACRO_BASKET, type MacroIndicatorId } from "../types";
import type { GraphSnapshot, GraphStore } from "./graph-store";
import { getIndicatorNode, getLatestObservationNode } from "./indicator-nodes";
import { MemoryGraphStore } from "./memory-graph-store";

export type GraphNodeCounts = Record<KgNode["kind"] | "portfolio-scenario", number>;

export type GraphSourceMode = "fixture" | "dart-live";

export type SourceCoverage = {
  source: SourceNode;
  documentCount: number;
  eventCount: number;
  entityCount: number;
  warnings: string[];
};

export type IndicatorProvenancePath = {
  indicatorId: MacroIndicatorId;
  indicatorLabel: string;
  sourceName: string;
  documentTitle: string;
  eventLabel: string;
  relationshipIds: string[];
  citation: string;
};

export type GraphStatus = {
  generatedAt: string;
  sourceMode: GraphSourceMode;
  storageMode: "memory-non-durable";
  counts: GraphNodeCounts;
  sourceCoverage: SourceCoverage[];
  indicatorPaths: IndicatorProvenancePath[];
  warnings: string[];
};

function emptyCounts(): GraphNodeCounts {
  return {
    source: 0,
    document: 0,
    entity: 0,
    event: 0,
    indicator: 0,
    observation: 0,
    forecast: 0,
    weight: 0,
    "backtest-run": 0,
    "portfolio-scenario": 0,
  };
}

export function countGraphNodes(snapshot: GraphSnapshot): GraphNodeCounts {
  const counts = emptyCounts();
  for (const node of snapshot.nodes) counts[node.kind] += 1;
  counts["portfolio-scenario"] = snapshot.portfolioScenarios.length;
  return counts;
}

export async function seedIndicatorLayer(graphStore: GraphStore): Promise<void> {
  for (const indicator of MACRO_BASKET) {
    const indicatorNode = getIndicatorNode(indicator);
    const observation = getLatestObservationNode(indicator);
    await graphStore.upsertIndicator(indicatorNode);
    await graphStore.upsertObservation(observation);
    await graphStore.upsertRelationship(createRelationship("HAS_OBSERVATION", indicatorNode.id, observation.id, { asOf: observation.asOf }));
  }
}

export async function buildKnowledgeGraphFromSource(adapter: SourceAdapter, limit = 10): Promise<{ graphStore: MemoryGraphStore; warnings: string[] }> {
  const graphStore = new MemoryGraphStore();
  await seedIndicatorLayer(graphStore);
  const summary = await ingestDocuments({
    adapter,
    graphStore,
    extractor: new RuleBasedExtractor(),
    limit,
  });

  return { graphStore, warnings: summary.warnings };
}

export async function buildFixtureKnowledgeGraph(limit = 3): Promise<{ graphStore: MemoryGraphStore; warnings: string[] }> {
  return buildKnowledgeGraphFromSource(new FixtureSourceAdapter(), limit);
}

export async function buildDartKnowledgeGraph(limit = 10): Promise<{ graphStore: MemoryGraphStore; warnings: string[] }> {
  return buildKnowledgeGraphFromSource(new OpenDartAdapter(), limit);
}

function findNode<T extends KgNode["kind"]>(snapshot: GraphSnapshot, id: string, kind: T): Extract<KgNode, { kind: T }> | undefined {
  return snapshot.nodes.find((node): node is Extract<KgNode, { kind: T }> => node.id === id && node.kind === kind);
}

function buildSourceCoverage(snapshot: GraphSnapshot, warnings: string[]): SourceCoverage[] {
  return snapshot.nodes
    .filter((node): node is SourceNode => node.kind === "source")
    .map((source) => {
      const documentIds = snapshot.relationships
        .filter((relationship) => relationship.type === "PUBLISHED" && relationship.fromId === source.id)
        .map((relationship) => relationship.toId);
      const eventIds = snapshot.relationships
        .filter((relationship) => relationship.type === "EVIDENCES" && documentIds.includes(relationship.fromId))
        .map((relationship) => relationship.toId);
      const entityIds = snapshot.relationships
        .filter((relationship) => relationship.type === "MENTIONS" && documentIds.includes(relationship.fromId))
        .map((relationship) => relationship.toId);

      return {
        source,
        documentCount: new Set(documentIds).size,
        eventCount: new Set(eventIds).size,
        entityCount: new Set(entityIds).size,
        warnings,
      };
    });
}

export function buildIndicatorProvenancePaths(snapshot: GraphSnapshot): IndicatorProvenancePath[] {
  const published = snapshot.relationships.filter((relationship) => relationship.type === "PUBLISHED");
  const evidenced = snapshot.relationships.filter((relationship) => relationship.type === "EVIDENCES");
  const affects = snapshot.relationships.filter((relationship) => relationship.type === "AFFECTS");
  const paths: IndicatorProvenancePath[] = [];

  for (const affectsRelationship of affects) {
    const event = findNode(snapshot, affectsRelationship.fromId, "event");
    const indicator = findNode(snapshot, affectsRelationship.toId, "indicator");
    if (!event || !indicator) continue;

    const evidenceRelationship = evidenced.find((relationship) => relationship.toId === event.id);
    if (!evidenceRelationship) continue;
    const document = findNode(snapshot, evidenceRelationship.fromId, "document");
    if (!document) continue;

    const publishRelationship = published.find((relationship) => relationship.toId === document.id);
    if (!publishRelationship) continue;
    const source = findNode(snapshot, publishRelationship.fromId, "source");
    if (!source) continue;

    paths.push({
      indicatorId: indicator.id,
      indicatorLabel: indicator.label,
      sourceName: source.name,
      documentTitle: document.title,
      eventLabel: event.label,
      relationshipIds: [publishRelationship.id, evidenceRelationship.id, affectsRelationship.id],
      citation: document.citation,
    });
  }

  return paths.sort((a, b) => a.indicatorId.localeCompare(b.indicatorId) || a.documentTitle.localeCompare(b.documentTitle));
}

export function getDocumentCitation(snapshot: GraphSnapshot, documentId: string): string | undefined {
  const document = findNode(snapshot, documentId, "document") as DocumentNode | undefined;
  return document?.citation;
}

export async function getGraphStatusFromSource(sourceMode: GraphSourceMode = "fixture", limit = 10): Promise<GraphStatus> {
  const { graphStore, warnings } = sourceMode === "dart-live"
    ? await buildDartKnowledgeGraph(limit)
    : await buildFixtureKnowledgeGraph(Math.min(limit, 3));
  const snapshot = await graphStore.exportSnapshot();
  return {
    generatedAt: new Date().toISOString(),
    sourceMode,
    storageMode: "memory-non-durable",
    counts: countGraphNodes(snapshot),
    sourceCoverage: buildSourceCoverage(snapshot, warnings),
    indicatorPaths: buildIndicatorProvenancePaths(snapshot),
    warnings,
  };
}

export async function getFixtureGraphStatus(): Promise<GraphStatus> {
  return getGraphStatusFromSource("fixture", 3);
}

export async function getDartGraphStatus(limit = 10): Promise<GraphStatus> {
  return getGraphStatusFromSource("dart-live", limit);
}
