import { describe, expect, it } from "vitest";
import { actualValuesAfterFirst, directionsFromSeries, previousValueForecasts } from "./baselines";
import { aggregateBasketState, buildBasketScorecard, buildIndicatorScorecard, evaluateIndicatorGate } from "./scorecard";
import { indicatorThresholds } from "./thresholds";
import { directionalAccuracy, directionFromDelta, improvementPct, mae, rmse, smape } from "./metrics";
import type { AccuracyCoverage, AccuracyMetricSet, MatchedForecastObservation } from "./types";
import type { MacroIndicatorId } from "../types";

const enoughCoverage = (count: number): AccuracyCoverage => ({
  observationCount: count,
  maturedForecastCount: count,
  pendingForecastCount: 0,
  windowStart: "2025-01-01",
  windowEnd: "2026-05-29",
  sourceIds: ["test-source"],
  warnings: [],
});

const passingMetrics: Record<MacroIndicatorId, AccuracyMetricSet> = {
  "usd-krw": { smapeImprovementPct: 10, directionalAccuracy: 53 },
  "treasury-yield": { maeImprovementPct: 10, directionalAccuracy: 53 },
  "base-rate-expectation": { eventDirectionHitRate: 60 },
  "m2-liquidity": { trendSmapeImprovementPct: 8 },
};

const failingMetrics: Record<MacroIndicatorId, AccuracyMetricSet> = {
  "usd-krw": { smapeImprovementPct: 9.99, directionalAccuracy: 53 },
  "treasury-yield": { maeImprovementPct: 10, directionalAccuracy: 52.99 },
  "base-rate-expectation": { eventDirectionHitRate: 59.99 },
  "m2-liquidity": { trendSmapeImprovementPct: 7.99 },
};

describe("accuracy metrics", () => {
  it("computes MAE, RMSE, sMAPE and baseline improvements", () => {
    expect(mae([10, 20], [12, 18])).toBe(2);
    expect(rmse([10, 20], [13, 16])).toBe(3.5355);
    expect(smape([0, 10], [0, 20])).toBe(33.33);
    expect(improvementPct(8, 10)).toBe(20);
    expect(improvementPct(12, 10)).toBe(-20);
  });

  it("handles directions deterministically", () => {
    expect(directionFromDelta(1)).toBe("up");
    expect(directionFromDelta(-1)).toBe("down");
    expect(directionFromDelta(0)).toBe("flat");
    expect(directionalAccuracy(["up", "mixed", "flat"], ["up", "down", "flat"])).toBe(100);
  });

  it("creates previous-value baseline arrays from dated series", () => {
    const series = [{ date: "2026-01-01", value: 1 }, { date: "2026-01-02", value: 3 }, { date: "2026-01-03", value: 2 }];

    expect(previousValueForecasts(series)).toEqual([1, 3]);
    expect(actualValuesAfterFirst(series)).toEqual([3, 2]);
    expect(directionsFromSeries(series)).toEqual(["up", "down"]);
  });
});

describe("accuracy thresholds and scorecard states", () => {
  it("exports deterministic threshold configs for every indicator", () => {
    expect(Object.keys(indicatorThresholds).sort()).toEqual(["base-rate-expectation", "m2-liquidity", "treasury-yield", "usd-krw"].sort());
    expect(indicatorThresholds["base-rate-expectation"].policyNote).toContain("프록시");
    expect(indicatorThresholds["usd-krw"].requiredMetrics.map((metric) => metric.metric)).toEqual(["smapeImprovementPct", "directionalAccuracy"]);
  });

  it.each(Object.keys(indicatorThresholds) as MacroIndicatorId[])("passes exact pragmatic threshold for %s", (indicatorId) => {
    const config = indicatorThresholds[indicatorId];
    const result = evaluateIndicatorGate({ indicatorId, metrics: passingMetrics[indicatorId], coverage: enoughCoverage(config.minimumObservations) });

    expect(result.state).toBe("PASS");
    expect(result.pragmaticPass).toBe(true);
    expect(result.metricResults.every((metric) => metric.balancedGap >= 0)).toBe(true);
  });

  it.each(Object.keys(indicatorThresholds) as MacroIndicatorId[])("fails just below pragmatic threshold for %s", (indicatorId) => {
    const config = indicatorThresholds[indicatorId];
    const result = evaluateIndicatorGate({ indicatorId, metrics: failingMetrics[indicatorId], coverage: enoughCoverage(config.minimumObservations) });

    expect(result.state).toBe("FAIL");
    expect(result.pragmaticPass).toBe(false);
  });

  it.each(Object.keys(indicatorThresholds) as MacroIndicatorId[])("marks insufficient coverage for %s", (indicatorId) => {
    const result = evaluateIndicatorGate({ indicatorId, metrics: passingMetrics[indicatorId], coverage: enoughCoverage(1) });

    expect(result.state).toBe("INSUFFICIENT_COVERAGE");
    expect(result.failureReasons.join(" ")).toContain("최소");
  });

  it("marks unmatured targets as pending instead of accuracy evidence", () => {
    const result = evaluateIndicatorGate({
      indicatorId: "usd-krw",
      metrics: {},
      coverage: { ...enoughCoverage(0), pendingForecastCount: 1 },
      hasPendingTargets: true,
    });

    expect(result.state).toBe("PENDING");
  });

  it("aggregates basket state with hard-gate precedence", () => {
    expect(aggregateBasketState(["PASS", "PASS"])).toBe("PASS");
    expect(aggregateBasketState(["PASS", "PENDING"])).toBe("PENDING");
    expect(aggregateBasketState(["PASS", "INSUFFICIENT_COVERAGE", "PENDING"])).toBe("INSUFFICIENT_COVERAGE");
    expect(aggregateBasketState(["PASS", "FAIL", "INSUFFICIENT_COVERAGE"])).toBe("FAIL");
  });

  it("builds a basket scorecard that cannot hide missing indicators", () => {
    const scorecard = buildBasketScorecard([
      buildIndicatorScorecard({
        indicatorId: "usd-krw",
        metrics: passingMetrics["usd-krw"],
        coverage: enoughCoverage(60),
        modelVersion: "test-model",
        metricVersion: "test-metric",
        sourceVersion: "test-source",
      }),
    ], "2026-06-01T00:00:00.000Z");

    expect(scorecard.indicators).toHaveLength(4);
    expect(scorecard.state).toBe("INSUFFICIENT_COVERAGE");
  });
});

describe("forecast-target ledger contract", () => {
  it("preserves every required field through a matched evaluation row", () => {
    const row: MatchedForecastObservation = {
      forecastId: "forecast-1",
      issuedAt: "2026-06-01T00:00:00.000Z",
      sourceRunId: "source-run-1",
      eventId: "event-1",
      documentId: "document-1",
      indicatorId: "usd-krw",
      horizon: "1W",
      targetDate: "2026-06-08",
      baselineValue: 1500,
      predictedValue: 1512,
      predictedDelta: 12,
      predictedDirection: "up",
      confidence: 0.61,
      modelVersion: "model-v1",
      metricVersion: "metric-v1",
      sourceVersion: "source-v1",
      matchedObservationId: "obs-1",
      observedValue: 1515,
      observedDirection: "up",
      evaluationState: "PASS",
      evaluatedAt: "2026-06-08T09:00:00.000Z",
    };

    expect(Object.keys(row).sort()).toEqual([
      "baselineValue", "confidence", "documentId", "evaluatedAt", "evaluationState", "eventId", "forecastId", "horizon", "indicatorId", "issuedAt", "matchedObservationId", "metricVersion", "modelVersion", "observedDirection", "observedValue", "predictedDelta", "predictedDirection", "predictedValue", "sourceRunId", "sourceVersion", "targetDate",
    ].sort());
  });
});
