import { afterEach, describe, expect, it, vi } from "vitest";
import type { DocumentNode } from "../domain/graph-types";
import { parseLimit } from "../sources/source-types";
import { documentToForecastEvent, getDartForecastBundle } from "./dart-forecast";


function dartResponse(count: number) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({
      status: "000",
      list: Array.from({ length: count }, (_, index) => {
        const id = String(202606010100 + index);
        return {
          rcept_no: id,
          report_nm: `반도체 수출 공급계약 ${index + 1}`,
          corp_name: `데모기업${index + 1}`,
          corp_code: `00${index}`,
          stock_code: `0059${index}`,
          rcept_dt: "20260601",
          flr_nm: "데모 제출인",
        };
      }),
    }),
  } as Response);
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.DART_API_KEY;
});

const document: DocumentNode = {
  id: "document:dart:forecast",
  kind: "document",
  sourceId: "source:opendart",
  externalId: "202606010099",
  title: "Demo Corp: 반도체 수출 공급계약 공시",
  url: "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=202606010099",
  publishedAt: "2026-06-01T00:00:00.000Z",
  retrievedAt: "2026-06-01T00:00:00.000Z",
  language: "ko",
  rawText: "Demo Corp semiconductor export contract disclosure mentions trade, KRW, funding and rate sensitivity.",
  summary: "반도체 수출 공급계약 공시",
  contentHash: "hash-dart-forecast",
  citation: "OpenDART filing 202606010099",
};

describe("DART forecast mapping", () => {
  it("converts a DART document into a forecast-ready event with macro signals", async () => {
    const event = await documentToForecastEvent(document, { id: "p", kind: "ontology-promotion", claimId: "c", status: "promoted", gateResults: [], decidedAt: "2026-06-01T00:00:00.000Z" });

    expect(event.id).toBe("dart-202606010099");
    expect(event.source).toContain("OpenDART");
    expect(event.macroSignals["usd-krw"]).toBeDefined();
    expect(event.evidence[0].url).toContain("dart.fss.or.kr");
  });

  it.each([
    [0, 1],
    [-4, 1],
    [2.9, 2],
    [parseLimit("not-a-number", 6, 25), 6],
    [999, 25],
  ])("clamps DART forecast bundle limit %s to %s usable forecasts", async (limit, expected) => {
    process.env.DART_API_KEY = "test-dart-key";
    vi.stubGlobal("fetch", vi.fn(() => dartResponse(30)));

    const bundle = await getDartForecastBundle({ limit });

    expect(bundle.sourceResult.availability.ok).toBe(true);
    expect(bundle.analyses).toHaveLength(expected);
    expect(bundle.sourceResult.documents.length).toBe(expected);
  });

});
