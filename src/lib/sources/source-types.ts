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

export function parseLimit(value: number | string | null | undefined, fallback = 10, max = 25) {
  const parsed = typeof value === "number" ? value : value ? Number(value) : fallback;
  const finite = Number.isFinite(parsed) ? parsed : fallback;
  const integer = Math.floor(finite);
  return Math.max(1, Math.min(integer, max));
}

export function clampLimit(limit: number | undefined, max = 25) {
  return parseLimit(limit, 10, max);
}
