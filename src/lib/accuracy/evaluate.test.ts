import { afterEach, describe, expect, it, vi } from "vitest";
import { InMemoryAccuracyStore } from "../storage";
import { buildAccuracyScorecard, ingestAccuracyHistories, ingestAndEvaluateAccuracy } from "./evaluate";

function jsonResponse(body: object, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: async () => body } as Response);
}

function rates(count: number) {
  const result: Record<string, { KRW: number }> = {};
  for (let index = 0; index < count; index += 1) {
    const date = new Date(Date.UTC(2026, 0, 1 + index)).toISOString().slice(0, 10);
    result[date] = { KRW: 1400 + (index % 2 === 0 ? 0 : 10) };
  }
  return result;
}

function fetcher(input: string | URL) {
  const url = String(input);
  if (url.includes("frankfurter")) return jsonResponse({ rates: rates(65) });
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

  it("builds scorecards from an explicit store without mutating ledger rows", async () => {
    const store = new InMemoryAccuracyStore();
    await ingestAccuracyHistories({ store, fetcher, now: new Date("2026-06-01T00:00:00.000Z") });

    const scorecard = await buildAccuracyScorecard({ store, fetcher, now: new Date("2026-06-01T00:00:00.000Z") });

    expect(scorecard.indicators).toHaveLength(4);
    expect(scorecard.state).not.toBe("PASS");
    expect(scorecard.indicators.some((indicator) => indicator.state === "INSUFFICIENT_COVERAGE")).toBe(true);
    expect(await store.listForecastTargets()).toHaveLength(0);
    expect(await store.listMatchedObservations()).toHaveLength(0);
  });

  it("persists walk-forward evaluation only from the protected mutation path", async () => {
    const store = new InMemoryAccuracyStore();
    const result = await ingestAndEvaluateAccuracy({ store, fetcher, now: new Date("2026-06-01T00:00:00.000Z") });

    expect(result.evaluationMode).toBe("persist-walk-forward-backtest");
    expect(result.scorecard.indicators.find((indicator) => indicator.indicatorId === "base-rate-expectation")?.label).toContain("정책금리");
    expect(await store.listForecastTargets()).not.toHaveLength(0);
    expect(await store.listMatchedObservations()).not.toHaveLength(0);
    expect((await store.listMatchedObservations()).some((match) => match.evaluationState === "FAIL")).toBe(true);
  });

  it("provides a non-persistent preview for default in-memory read paths", async () => {
    vi.stubGlobal("fetch", vi.fn(fetcher));

    const scorecard = await buildAccuracyScorecard({ now: new Date("2026-06-01T00:00:00.000Z") });

    expect(scorecard.warnings.join(" ")).toContain("비프로덕션 프리뷰");
    expect(scorecard.indicators.find((indicator) => indicator.indicatorId === "usd-krw")?.coverage.observationCount).toBeGreaterThan(0);
  });
});
