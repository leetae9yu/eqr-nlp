import type { SourceNode } from "../domain/graph-types";
import { assertServerOnly } from "../server-only";
import { createDocument, createDocumentId } from "./document-utils";
import { clampLimit, type FetchDocumentsInput, type FetchDocumentsResult, type FetchLike, type SourceAdapter } from "./source-types";

assertServerOnly("gdelt-news-adapter");

type GdeltArticle = { title?: string; url?: string; seendate?: string; sourcecountry?: string; domain?: string; language?: string };

function parseGdeltSeenDate(seenDate?: string): string {
  if (!seenDate) return new Date(0).toISOString();

  const compact = seenDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  const candidate = compact
    ? `${compact[1]}-${compact[2]}-${compact[3]}T${compact[4]}:${compact[5]}:${compact[6]}.000Z`
    : seenDate;
  const parsed = new Date(candidate);

  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

export class GdeltNewsAdapter implements SourceAdapter {
  id = "source:gdelt-doc";
  source: SourceNode = {
    id: this.id,
    kind: "source",
    sourceKind: "gdelt",
    name: "GDELT DOC API",
    homepageUrl: "https://api.gdeltproject.org/api/v2/doc/doc",
    freeTierOnly: true,
    paidRequiresApproval: false,
    reliabilityWeight: 0.62,
    createdAt: "2026-05-31T00:00:00.000Z",
  };

  constructor(private fetcher: FetchLike = fetch) {}

  async fetchDocuments(input: FetchDocumentsInput = {}): Promise<FetchDocumentsResult> {
    const limit = clampLimit(input.limit);
    const query = input.query ?? "Korea economy";
    const url = new URL(this.source.homepageUrl);
    url.searchParams.set("query", query);
    url.searchParams.set("mode", "artlist");
    url.searchParams.set("format", "json");
    url.searchParams.set("maxrecords", String(limit));
    const response = await this.fetcher(url);
    if (!response.ok) {
      return { source: this.source, availability: { ok: false, reason: `GDELT 요청 실패: ${response.status}` }, documents: [], warnings: [] };
    }
    const payload = await response.json() as { articles?: GdeltArticle[] };
    const documents = (payload.articles ?? []).slice(0, limit).map((article, index) => {
      const title = article.title ?? `GDELT 기사 ${index + 1}`;
      const articleUrl = article.url ?? this.source.homepageUrl;
      return createDocument({
        id: createDocumentId(this.source, articleUrl),
        sourceId: this.source.id,
        externalId: articleUrl,
        title,
        url: articleUrl,
        publishedAt: parseGdeltSeenDate(article.seendate),
        retrievedAt: new Date(0).toISOString(),
        language: article.language === "English" ? "en" : "unknown",
        rawText: title,
        summary: `${title}${article.domain ? ` (${article.domain})` : ""}`,
        citation: `GDELT: ${title}`,
      });
    });
    return { source: this.source, availability: { ok: true }, documents, warnings: [] };
  }
}
