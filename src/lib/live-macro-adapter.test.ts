import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveKoreaFinanceMcpAdapter } from "./live-macro-adapter";

function jsonResponse(body: object, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  } as Response);
}

describe("live macro adapter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("loads live USD/KRW from Frankfurter history", async () => {
    const fetcher = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes("/latest")) return jsonResponse({ date: "2026-05-29", rates: { KRW: 1506.27 } });
      return jsonResponse({ rates: {
        "2026-05-27": { KRW: 1499.7 },
        "2026-05-28": { KRW: 1502.83 },
        "2026-05-29": { KRW: 1506.27 },
      } });
    });

    const snapshot = await new LiveKoreaFinanceMcpAdapter(fetcher).getMacroSnapshot("usd-krw");

    expect(snapshot.latestValue).toBe(1506.27);
    expect(snapshot.previousValue).toBe(1502.83);
    expect(snapshot.asOf).toBe("2026-05-29");
    expect(snapshot.source).toContain("Frankfurter");
  });

  it("loads ECOS-backed Korea treasury yield when a BOK key is configured", async () => {
    vi.stubEnv("BOK_ECOS_API_KEY", "test-ecos-key");
    const fetcher = vi.fn((input: string | URL) => {
      void input;
      return jsonResponse({ StatisticSearch: { row: [
        { TIME: "20260528", DATA_VALUE: "3.10" },
        { TIME: "20260529", DATA_VALUE: "3.12" },
      ] } });
    });

    const snapshot = await new LiveKoreaFinanceMcpAdapter(fetcher).getMacroSnapshot("treasury-yield");

    expect(snapshot.latestValue).toBe(3.12);
    expect(snapshot.previousValue).toBe(3.10);
    expect(snapshot.asOf).toBe("2026-05-29");
    expect(snapshot.source).toContain("ECOS");
    expect(String(fetcher.mock.calls[0][0])).toContain("817Y002/D/");
  });

  it("marks ECOS-only indicators as explicit sample fallback when the key is missing", async () => {
    const snapshot = await new LiveKoreaFinanceMcpAdapter(vi.fn()).getMacroSnapshot("m2-liquidity");

    expect(snapshot.source).toContain("실시간 실패로 샘플 사용");
    expect(snapshot.latestValue).toBeGreaterThan(0);
  });
});
