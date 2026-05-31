import type { DocumentNode, SourceNode } from "../domain/graph-types";

export type SourceAvailability = {
  ok: boolean;
  reason?: string;
};

export type FetchDocumentsInput = {
  query?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  corpCode?: string;
};

export type FetchDocumentsResult = {
  source: SourceNode;
  availability: SourceAvailability;
  documents: DocumentNode[];
  warnings: string[];
};

export type SourceAdapter = {
  id: string;
  source: SourceNode;
  fetchDocuments(input: FetchDocumentsInput): Promise<FetchDocumentsResult>;
};

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export function clampLimit(limit: number | undefined, max = 25) {
  if (limit === undefined) return Math.min(10, max);
  return Math.max(1, Math.min(limit, max));
}
