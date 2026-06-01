import { describe, expect, it, vi } from "vitest";
import { RuleBasedExtractor } from "../extraction/rule-based-extractor";
import { ingestDocuments } from "../ingestion/ingest-documents";
import { MemoryGraphStore } from "../kg/memory-graph-store";
import { OpenDartAdapter } from "./dart-adapter";
import { FixtureSourceAdapter } from "./fixture-source-adapter";
import { GdeltNewsAdapter } from "./gdelt-news-adapter";
import { RssNewsAdapter } from "./rss-news-adapter";

function response(body: string | object, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    text: async () => typeof body === "string" ? body : JSON.stringify(body),
    json: async () => typeof body === "string" ? JSON.parse(body) : body,
  } as Response);
}

describe("source adapters", () => {
  it("turns fixture events into deterministic documents", async () => {
    const result = await new FixtureSourceAdapter().fetchDocuments({ limit: 2 });

    expect(result.availability.ok).toBe(true);
    expect(result.documents).toHaveLength(2);
    expect(result.documents[0].sourceId).toBe("source:fixture-events");
  });

  it("parses RSS items with mocked fetch", async () => {
    const fetcher = vi.fn(() => response(`<?xml version="1.0"?><rss><channel><item><title>Korea liquidity support</title><link>https://example.com/a</link><description>Funding pressure eases</description><pubDate>Fri, 29 May 2026 00:00:00 GMT</pubDate><guid>a</guid></item></channel></rss>`));
    const result = await new RssNewsAdapter("https://example.com/rss", fetcher).fetchDocuments({ limit: 1 });

    expect(fetcher).toHaveBeenCalledOnce();
    expect(result.documents[0].title).toBe("Korea liquidity support");
  });

  it("parses GDELT article responses with mocked fetch", async () => {
    const fetcher = vi.fn(() => response({ articles: [{ title: "Korea rates story", url: "https://example.com/rates", seendate: "20260531T000000Z", language: "English" }] }));
    const result = await new GdeltNewsAdapter(fetcher).fetchDocuments({ query: "Korea rates", limit: 1 });

    expect(fetcher).toHaveBeenCalledOnce();
    expect(result.documents[0].citation).toContain("GDELT");
  });

  it("does not crash when DART API key is missing", async () => {
    const result = await new OpenDartAdapter(undefined).fetchDocuments({ limit: 1 });

    expect(result.availability.ok).toBe(false);
    expect(result.warnings.join(" ")).toContain("DART_API_KEY");
  });

  it("uses DART_API_KEY from server env and avoids fetch caching", async () => {
    const previous = process.env.DART_API_KEY;
    process.env.DART_API_KEY = "test-dart-key";
    const fetcher = vi.fn(() => response({ status: "000", list: [{ rcept_no: "202606010001", report_nm: "Major report", corp_name: "Demo Corp", corp_code: "001", stock_code: "005930", rcept_dt: "20260601", flr_nm: "Demo" }] }));

    try {
      const result = await new OpenDartAdapter(undefined, fetcher).fetchDocuments({ limit: 1 });

      expect(result.availability.ok).toBe(true);
      expect(result.documents[0].title).toContain("Demo Corp");
      expect(fetcher).toHaveBeenCalledWith(expect.any(URL), { cache: "no-store" });
    } finally {
      if (previous === undefined) delete process.env.DART_API_KEY;
      else process.env.DART_API_KEY = previous;
    }
  });

  it("ingests fixture documents into the graph without network", async () => {
    const graphStore = new MemoryGraphStore();
    const summary = await ingestDocuments({ adapter: new FixtureSourceAdapter(), graphStore, extractor: new RuleBasedExtractor(), limit: 1 });
    const snapshot = await graphStore.exportSnapshot();

    expect(summary.documentsFetched).toBe(1);
    expect(summary.eventsExtracted).toBeGreaterThanOrEqual(1);
    expect(snapshot.relationships.map((relationship) => relationship.type)).toEqual(expect.arrayContaining(["PUBLISHED", "EVIDENCES"]));
  });
});
