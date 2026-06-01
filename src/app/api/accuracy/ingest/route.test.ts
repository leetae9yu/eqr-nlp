import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

function jsonResponse(body: object) {
  return Promise.resolve({ ok: true, status: 200, json: async () => body } as Response);
}

describe("accuracy ingest API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects unauthorized cron calls when CRON_SECRET is configured", async () => {
    vi.stubEnv("CRON_SECRET", "secret");

    const response = await GET(new Request("https://example.com/api/accuracy/ingest"));

    expect(response.status).toBe(401);
  });

  it("fails closed when persistent storage is configured without CRON_SECRET", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://example");

    const response = await GET(new Request("https://example.com/api/accuracy/ingest"));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toContain("CRON_SECRET");
  });

  it("accepts Bearer CRON_SECRET and returns ingestion summary", async () => {
    vi.stubEnv("CRON_SECRET", "secret");
    vi.stubGlobal("fetch", vi.fn((input: string | URL) => {
      if (String(input).includes("frankfurter")) return jsonResponse({ rates: { "2026-05-29": { KRW: 1506.27 } } });
      return jsonResponse({ StatisticSearch: { row: [] } });
    }));

    const response = await GET(new Request("https://example.com/api/accuracy/ingest", { headers: { authorization: "Bearer secret" } }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.observationsStored).toBe(1);
    expect(payload.evaluationMode).toBe("persist-walk-forward-backtest");
    expect(payload.histories[0]).toMatchObject({ indicatorId: "usd-krw", observationCount: 1 });
    expect(payload.histories[0].observations).toBeUndefined();
  });
});
