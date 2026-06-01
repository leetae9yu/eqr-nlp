import type { SourceNode } from "../domain/graph-types";
import { getDartApiKey } from "../env";
import { assertServerOnly } from "../server-only";
import { createDocument, createDocumentId } from "./document-utils";
import { clampLimit, type FetchDocumentsInput, type FetchDocumentsResult, type FetchLike, type SourceAdapter } from "./source-types";

assertServerOnly("dart-adapter");

type DartDisclosure = { rcept_no?: string; report_nm?: string; corp_name?: string; corp_code?: string; stock_code?: string; rcept_dt?: string; flr_nm?: string };

function toDartDate(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function defaultStartDate(daysBack = 30): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysBack);
  return toDartDate(date);
}

export class OpenDartAdapter implements SourceAdapter {
  id = "source:opendart";
  source: SourceNode = {
    id: this.id,
    kind: "source",
    sourceKind: "dart",
    name: "OpenDART disclosures",
    homepageUrl: "https://opendart.fss.or.kr/",
    freeTierOnly: true,
    paidRequiresApproval: false,
    reliabilityWeight: 0.8,
    createdAt: "2026-05-31T00:00:00.000Z",
  };

  constructor(private apiKey = getDartApiKey(), private fetcher: FetchLike = fetch) {}

  async fetchDocuments(input: FetchDocumentsInput = {}): Promise<FetchDocumentsResult> {
    if (!this.apiKey) {
      return { source: this.source, availability: { ok: false, reason: "DART_API_KEY or OPENDART_API_KEY is not configured" }, documents: [], warnings: ["DART live adapter is disabled until DART_API_KEY or OPENDART_API_KEY is set server-side."] };
    }
    const limit = clampLimit(input.limit, 100);
    const url = new URL("https://opendart.fss.or.kr/api/list.json");
    url.searchParams.set("crtfc_key", this.apiKey);
    if (input.corpCode) url.searchParams.set("corp_code", input.corpCode);
    url.searchParams.set("bgn_de", input.startDate ? input.startDate.replaceAll("-", "") : defaultStartDate());
    url.searchParams.set("end_de", input.endDate ? input.endDate.replaceAll("-", "") : toDartDate(new Date()));
    url.searchParams.set("page_count", String(limit));
    const response = await this.fetcher(url, { cache: "no-store" });
    if (!response.ok) {
      return { source: this.source, availability: { ok: false, reason: `OpenDART request failed: ${response.status}` }, documents: [], warnings: [] };
    }
    const payload = await response.json() as { status?: string; message?: string; list?: DartDisclosure[] };
    if (payload.status && payload.status !== "000") {
      return { source: this.source, availability: { ok: false, reason: payload.message ?? `OpenDART status ${payload.status}` }, documents: [], warnings: [] };
    }
    const documents = (payload.list ?? []).slice(0, limit).map((item) => {
      const externalId = item.rcept_no ?? `${item.corp_code}-${item.report_nm}`;
      const title = `${item.corp_name ?? "Unknown corp"}: ${item.report_nm ?? "Disclosure"}`;
      const url = item.rcept_no ? `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}` : this.source.homepageUrl;
      return createDocument({
        id: createDocumentId(this.source, externalId),
        sourceId: this.source.id,
        externalId,
        title,
        url,
        publishedAt: item.rcept_dt ? `${item.rcept_dt.slice(0, 4)}-${item.rcept_dt.slice(4, 6)}-${item.rcept_dt.slice(6, 8)}T00:00:00.000Z` : new Date(0).toISOString(),
        retrievedAt: new Date(0).toISOString(),
        language: "ko",
        rawText: `${title}\nSubmitter: ${item.flr_nm ?? "unknown"}\nStock: ${item.stock_code ?? "n/a"}`,
        summary: title,
        citation: `OpenDART filing ${externalId}`,
      });
    });
    return { source: this.source, availability: { ok: true }, documents, warnings: [] };
  }
}
