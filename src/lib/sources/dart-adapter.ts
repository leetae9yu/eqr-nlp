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
    name: "OpenDART 공시",
    homepageUrl: "https://opendart.fss.or.kr/",
    freeTierOnly: true,
    paidRequiresApproval: false,
    reliabilityWeight: 0.8,
    createdAt: "2026-05-31T00:00:00.000Z",
  };

  constructor(private apiKey = getDartApiKey(), private fetcher: FetchLike = fetch) {}

  async fetchDocuments(input: FetchDocumentsInput = {}): Promise<FetchDocumentsResult> {
    if (!this.apiKey) {
      return { source: this.source, availability: { ok: false, reason: "서버 환경 변수 DART_API_KEY 또는 OPENDART_API_KEY가 설정되지 않았습니다" }, documents: [], warnings: ["서버 측 DART_API_KEY 또는 OPENDART_API_KEY가 설정될 때까지 DART 실시간 어댑터가 비활성화됩니다."] };
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
      return { source: this.source, availability: { ok: false, reason: `OpenDART 요청 실패: ${response.status}` }, documents: [], warnings: [] };
    }
    const payload = await response.json() as { status?: string; message?: string; list?: DartDisclosure[] };
    if (payload.status && payload.status !== "000") {
      return { source: this.source, availability: { ok: false, reason: payload.message ?? `OpenDART 상태 ${payload.status}` }, documents: [], warnings: [] };
    }
    const retrievedAt = new Date().toISOString();
    const documents = (payload.list ?? []).slice(0, limit).map((item) => {
      const externalId = item.rcept_no ?? `${item.corp_code}-${item.report_nm}`;
      const title = `${item.corp_name ?? "알 수 없는 회사"}: ${item.report_nm ?? "공시"}`;
      const url = item.rcept_no ? `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}` : this.source.homepageUrl;
      return createDocument({
        id: createDocumentId(this.source, externalId),
        sourceId: this.source.id,
        externalId,
        title,
        url,
        publishedAt: item.rcept_dt ? `${item.rcept_dt.slice(0, 4)}-${item.rcept_dt.slice(4, 6)}-${item.rcept_dt.slice(6, 8)}T00:00:00.000Z` : new Date(0).toISOString(),
        retrievedAt,
        language: "ko",
        rawText: `${title}\n제출인: ${item.flr_nm ?? "알 수 없음"}\n종목코드: ${item.stock_code ?? "없음"}`,
        summary: title,
        citation: `OpenDART 공시 ${externalId}`,
      });
    });
    return { source: this.source, availability: { ok: true }, documents, warnings: [] };
  }
}
