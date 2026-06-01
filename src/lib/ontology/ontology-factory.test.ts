import { describe, expect, it } from "vitest";
import type { DocumentNode } from "../domain/graph-types";
import { buildOntologyPromotionPackage } from "./ontology-factory";

const document: DocumentNode = {
  id: "document:dart:001",
  kind: "document",
  sourceId: "source:opendart",
  externalId: "202606010001",
  title: "Demo Corp: export financing disclosure",
  url: "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=202606010001",
  publishedAt: "2026-06-01T00:00:00.000Z",
  retrievedAt: "2026-06-01T00:00:00.000Z",
  language: "ko",
  rawText: "Demo Corp export financing disclosure mentions trade, funding, rate and KRW exposure.",
  summary: "Demo Corp export financing disclosure",
  contentHash: "hash-001",
  citation: "OpenDART filing 202606010001",
};

describe("ontology factory", () => {
  it("promotes evidence-backed claims when quality gates pass", async () => {
    const pack = await buildOntologyPromotionPackage([document]);

    expect(pack.evidence[0]).toMatchObject({ space: "evidence", documentId: document.id });
    expect(pack.claims[0]).toMatchObject({ space: "claim" });
    expect(pack.promotions[0].status).toBe("promoted");
    expect(pack.qualityReport.totalPromoted).toBe(1);
    expect(pack.graph.nodesJsonl).toContain("ontology-evidence");
  });

  it("keeps duplicate documents out of promoted state", async () => {
    const duplicate = { ...document, id: "document:dart:duplicate", externalId: "202606010002" };
    const pack = await buildOntologyPromotionPackage([document, duplicate]);

    expect(pack.promotions.map((promotion) => promotion.status)).toEqual(["promoted", "rejected"]);
    expect(pack.qualityReport.totalRejected).toBe(1);
  });
});
