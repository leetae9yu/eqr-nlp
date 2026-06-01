import { afterEach, describe, expect, it, vi } from "vitest";
import { loadEcosIndicatorHistory } from "./ecos-history";
import { loadFrankfurterUsdKrwHistory } from "./frankfurter-history";

function jsonResponse(body: object, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  } as Response);
}

describe("historical source loaders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps Frankfurter USD/KRW historical rates into source observations", async () => {
    const fetcher = vi.fn((input: string | URL) => {
      expect(String(input)).toContain("from=USD");
      expect(String(input)).toContain("to=KRW");
      return jsonResponse({ rates: {
        "2026-05-28": { KRW: 1502.83 },
        "2026-05-29": { KRW: 1506.27 },
      } });
    });

    const result = await loadFrankfurterUsdKrwHistory(fetcher, { startDate: "2026-05-28", endDate: "2026-05-29" });

    expect(result.ok).toBe(true);
    expect(result.observationCount).toBe(2);
    expect(result.windowEnd).toBe("2026-05-29");
    expect(result.observations[0]).toMatchObject({ indicatorId: "usd-krw", sourceId: "source:frankfurter:usd-krw", value: 1502.83 });
  });

  it("maps ECOS daily rows into treasury-yield observations", async () => {
    const fetcher = vi.fn((input: string | URL) => {
      expect(String(input)).toContain("817Y002/D/20260528/20260529/010200000");
      return jsonResponse({ StatisticSearch: { row: [
        { TIME: "20260528", DATA_VALUE: "3.10", UNIT_NAME: "%" },
        { TIME: "20260529", DATA_VALUE: "3.12", UNIT_NAME: "%" },
      ] } });
    });

    const result = await loadEcosIndicatorHistory("treasury-yield", fetcher, { apiKey: "test-key", startDate: "2026-05-28", endDate: "2026-05-29" });

    expect(result.ok).toBe(true);
    expect(result.observations.map((observation) => observation.observedAt)).toEqual(["2026-05-28", "2026-05-29"]);
    expect(result.observations[1]).toMatchObject({ indicatorId: "treasury-yield", value: 3.12, unit: "%" });
  });

  it("maps ECOS monthly rows and labels base rate as a realized policy-rate proxy source", async () => {
    const fetcher = vi.fn(() => jsonResponse({ StatisticSearch: { row: [
      { TIME: "202604", DATA_VALUE: "2.50" },
      { TIME: "202605", DATA_VALUE: "2.50" },
    ] } }));

    const result = await loadEcosIndicatorHistory("base-rate-expectation", fetcher, { apiKey: "test-key", startDate: "2026-04", endDate: "2026-05" });

    expect(result.sourceId).toBe("source:ecos:policy-rate-realized-proxy");
    expect(result.observations.map((observation) => observation.observedAt)).toEqual(["2026-04", "2026-05"]);
  });

  it("returns an explicit ECOS coverage gap when no key is configured", async () => {
    const result = await loadEcosIndicatorHistory("m2-liquidity", vi.fn());

    expect(result.ok).toBe(false);
    expect(result.observationCount).toBe(0);
    expect(result.warnings.join(" ")).toContain("BOK_ECOS_API_KEY");
    expect(result.observations).toEqual([]);
  });

  it("preserves source errors as warnings instead of sample production data", async () => {
    const result = await loadFrankfurterUsdKrwHistory(vi.fn(() => jsonResponse({}, false)));

    expect(result.ok).toBe(false);
    expect(result.warnings.join(" ")).toContain("Frankfurter history failed");
    expect(result.observations).toEqual([]);
  });
});
