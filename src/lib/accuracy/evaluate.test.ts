import { afterEach, describe, expect, it, vi } from "vitest";
import { InMemoryAccuracyStore } from "../storage";
import { buildAccuracyScorecard, ingestAccuracyHistories } from "./evaluate";

function jsonResponse(body: object, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: async () => body } as Response);
}

function fetcher(input: string | URL) {
  const url = String(input);
  if (url.includes("frankfurter")) {
    return jsonResponse({ rates: Object.fromEntries(Array.from({ length: 65 }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return [`2026-03-${day.length === 2 && Number(day) <= 31 ? day : "31"}`, { KRW: 1400 + index }];
    })) });
  }
  return jsonResponse({ StatisticSearch: { row: [] } });
}

describe("accuracy evaluation engine", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("ingests free histories into the configured store", async () => {
    const store = new InMemoryAccuracyStore();
    const result = await ingestAccuracyHistories({ store, fetcher, now: new Date("2026-06-01T00:00:00.000Z") });

    expect(result.observationsStored).toBeGreaterThan(0);
    expect(await store.listSourceRuns()).toHaveLength(4);
    expect((await store.listObservations("usd-krw")).length).toBeGreaterThan(0);
  });

  it("builds a four-indicator scorecard with explicit coverage gaps", async () => {
    const store = new InMemoryAccuracyStore();
    const scorecard = await buildAccuracyScorecard({ store, fetcher, now: new Date("2026-06-01T00:00:00.000Z") });

    expect(scorecard.indicators).toHaveLength(4);
    expect(scorecard.indicators.map((indicator) => indicator.indicatorId)).toEqual(expect.arrayContaining(["usd-krw", "treasury-yield", "base-rate-expectation", "m2-liquidity"]));
    expect(scorecard.state).toBe("INSUFFICIENT_COVERAGE");
    expect(scorecard.indicators.find((indicator) => indicator.indicatorId === "base-rate-expectation")?.label).toContain("정책금리");
    expect(await store.listForecastTargets()).not.toHaveLength(0);
    expect(await store.listMatchedObservations()).not.toHaveLength(0);
  });
});
