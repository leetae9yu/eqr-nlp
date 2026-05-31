import type { SourceNode } from "../domain/graph-types";
import { assertServerOnly } from "../server-only";
import { createDocument, createDocumentId } from "./document-utils";
import { clampLimit, type FetchDocumentsInput, type FetchDocumentsResult, type FetchLike, type SourceAdapter } from "./source-types";

assertServerOnly("rss-news-adapter");

function textBetween(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? "";
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export class RssNewsAdapter implements SourceAdapter {
  id: string;
  source: SourceNode;

  constructor(private feedUrl: string, private fetcher: FetchLike = fetch) {
    this.id = `source:rss:${feedUrl}`;
    this.source = {
      id: this.id,
      kind: "source",
      sourceKind: "rss",
      name: "Configured RSS feed",
      homepageUrl: feedUrl,
      freeTierOnly: true,
      paidRequiresApproval: false,
      reliabilityWeight: 0.55,
      createdAt: "2026-05-31T00:00:00.000Z",
    };
  }

  async fetchDocuments(input: FetchDocumentsInput = {}): Promise<FetchDocumentsResult> {
    const limit = clampLimit(input.limit);
    const response = await this.fetcher(this.feedUrl);
    if (!response.ok) {
      return { source: this.source, availability: { ok: false, reason: `RSS request failed: ${response.status}` }, documents: [], warnings: [] };
    }
    const xml = await response.text();
    const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0]).slice(0, limit);
    const documents = items.map((item, index) => {
      const title = stripHtml(textBetween(item, "title")) || `RSS item ${index + 1}`;
      const url = stripHtml(textBetween(item, "link")) || this.feedUrl;
      const summary = stripHtml(textBetween(item, "description"));
      const publishedAt = new Date(stripHtml(textBetween(item, "pubDate")) || Date.now()).toISOString();
      const externalId = stripHtml(textBetween(item, "guid")) || url;
      return createDocument({
        id: createDocumentId(this.source, externalId),
        sourceId: this.source.id,
        externalId,
        title,
        url,
        publishedAt,
        retrievedAt: new Date(0).toISOString(),
        language: "unknown",
        rawText: summary || title,
        summary: summary || title,
        citation: `RSS: ${title}`,
      });
    });
    return { source: this.source, availability: { ok: true }, documents, warnings: [] };
  }
}
