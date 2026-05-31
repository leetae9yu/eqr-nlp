import { createHash } from "node:crypto";
import type { DocumentNode, SourceNode } from "../domain/graph-types";

export function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

export function createDocumentId(source: SourceNode, externalId: string) {
  return `document:${source.sourceKind}:${stableHash(`${source.id}:${externalId}`)}`;
}

export function createDocument(input: Omit<DocumentNode, "kind" | "id" | "contentHash"> & { id?: string; contentHash?: string }): DocumentNode {
  const raw = `${input.title}\n${input.url}\n${input.rawText}`;
  return {
    ...input,
    id: input.id ?? `document:${stableHash(raw)}`,
    kind: "document",
    contentHash: input.contentHash ?? stableHash(raw),
  };
}
