import { describe, expect, it } from "vitest";
import { buildFixtureKnowledgeGraph, buildIndicatorProvenancePaths, getFixtureGraphStatus } from "./graph-provenance";

const relationshipChain = ["PUBLISHED", "EVIDENCES", "AFFECTS"];

describe("graph provenance", () => {
  it("builds a memory-only fixture graph with source, document, event, indicator, and observation nodes", async () => {
    const { graphStore } = await buildFixtureKnowledgeGraph(2);
    const snapshot = await graphStore.exportSnapshot();
    const kinds = snapshot.nodes.map((node) => node.kind);

    expect(kinds).toEqual(expect.arrayContaining(["source", "document", "event", "indicator", "observation"]));
    expect(snapshot.relationships.map((relationship) => relationship.type)).toEqual(expect.arrayContaining(relationshipChain));
  });

  it("summarizes indicator provenance paths from sources to affected indicators", async () => {
    const { graphStore } = await buildFixtureKnowledgeGraph(3);
    const paths = buildIndicatorProvenancePaths(await graphStore.exportSnapshot());

    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].relationshipIds).toHaveLength(3);
    expect(paths.some((path) => path.indicatorId === "usd-krw")).toBe(true);
  });

  it("exposes a non-durable graph status for the UI", async () => {
    const status = await getFixtureGraphStatus();

    expect(status.storageMode).toBe("memory-non-durable");
    expect(status.counts.source).toBe(1);
    expect(status.sourceCoverage[0].documentCount).toBeGreaterThan(0);
    expect(status.indicatorPaths.length).toBeGreaterThan(0);
  });
});
