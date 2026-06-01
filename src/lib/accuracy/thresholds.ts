import type { IndicatorThresholdConfig } from "./types";
import type { MacroIndicatorId } from "../types";

export const ACCURACY_THRESHOLD_VERSION = "accuracy-thresholds-2026-06-01";

export const indicatorThresholds: Record<MacroIndicatorId, IndicatorThresholdConfig> = {
  "usd-krw": {
    indicatorId: "usd-krw",
    label: "USD/KRW",
    sourceLabel: "Frankfurter daily FX",
    baselineType: "previous-value",
    gateMode: "all",
    minimumObservations: 60,
    minimumMaturedForecasts: 60,
    coverageFailureState: "INSUFFICIENT_COVERAGE",
    requiredMetrics: [
      { metric: "smapeImprovementPct", pragmatic: 10, balanced: 15, comparator: "gte", unit: "pct" },
      { metric: "directionalAccuracy", pragmatic: 53, balanced: 55, comparator: "gte", unit: "pct" },
    ],
  },
  "treasury-yield": {
    indicatorId: "treasury-yield",
    label: "국고채 3년 금리",
    sourceLabel: "한국은행 ECOS 국고채 3년",
    baselineType: "previous-value",
    gateMode: "all",
    minimumObservations: 60,
    minimumMaturedForecasts: 60,
    coverageFailureState: "INSUFFICIENT_COVERAGE",
    requiredMetrics: [
      { metric: "maeImprovementPct", pragmatic: 10, balanced: 15, comparator: "gte", unit: "pct" },
      { metric: "directionalAccuracy", pragmatic: 53, balanced: 55, comparator: "gte", unit: "pct" },
    ],
  },
  "base-rate-expectation": {
    indicatorId: "base-rate-expectation",
    label: "정책금리 실현/방향 프록시",
    sourceLabel: "한국은행 ECOS 기준금리 · expectation 아님",
    baselineType: "event-direction",
    gateMode: "all",
    minimumObservations: 10,
    minimumMaturedForecasts: 10,
    coverageFailureState: "INSUFFICIENT_COVERAGE",
    policyNote: "현재 무료 소스에서는 시장 내재 기대가 아니라 기준금리 실현/방향 프록시로 표시합니다.",
    requiredMetrics: [
      { metric: "eventDirectionHitRate", pragmatic: 60, balanced: 65, comparator: "gte", unit: "pct" },
    ],
  },
  "m2-liquidity": {
    indicatorId: "m2-liquidity",
    label: "M2 유동성",
    sourceLabel: "한국은행 ECOS M2",
    baselineType: "no-change-trend",
    gateMode: "all",
    minimumObservations: 18,
    minimumMaturedForecasts: 18,
    coverageFailureState: "INSUFFICIENT_COVERAGE",
    requiredMetrics: [
      { metric: "trendSmapeImprovementPct", pragmatic: 8, balanced: 10, comparator: "gte", unit: "pct" },
    ],
  },
};

export function getIndicatorThreshold(indicatorId: MacroIndicatorId) {
  return indicatorThresholds[indicatorId];
}
