import { MACRO_BASKET, type MacroIndicatorId } from "../types";
import { ACCURACY_THRESHOLD_VERSION, getIndicatorThreshold } from "./thresholds";
import type { AccuracyGateState, BasketScorecard, IndicatorGateInput, IndicatorGateResult, IndicatorScorecard, MetricGateResult } from "./types";

function passes(actual: number | undefined, target: number, comparator: "gte" | "lte") {
  if (typeof actual !== "number" || !Number.isFinite(actual)) return false;
  return comparator === "gte" ? actual >= target : actual <= target;
}

function gapToBalanced(actual: number | undefined, balanced: number, comparator: "gte" | "lte") {
  if (typeof actual !== "number" || !Number.isFinite(actual)) return Number((comparator === "gte" ? balanced : -balanced).toFixed(4));
  const gap = comparator === "gte" ? Math.max(0, balanced - actual) : Math.max(0, actual - balanced);
  return Number(gap.toFixed(4));
}

export function evaluateIndicatorGate(input: IndicatorGateInput): IndicatorGateResult {
  const config = getIndicatorThreshold(input.indicatorId);
  const failureReasons: string[] = [];

  if (input.hasPendingTargets && input.coverage.maturedForecastCount === 0) {
    return {
      indicatorId: input.indicatorId,
      state: "PENDING",
      pragmaticPass: false,
      metricResults: [],
      failureReasons: ["아직 만기 도래한 관측치가 없어 평가 대기 중입니다."],
    };
  }

  if (input.coverage.observationCount < config.minimumObservations) {
    failureReasons.push(`관측치 ${input.coverage.observationCount}개 < 최소 ${config.minimumObservations}개`);
  }
  if (input.coverage.maturedForecastCount < config.minimumMaturedForecasts) {
    failureReasons.push(`만기 예측 ${input.coverage.maturedForecastCount}개 < 최소 ${config.minimumMaturedForecasts}개`);
  }

  const metricResults: MetricGateResult[] = config.requiredMetrics.map((target) => {
    const actual = input.metrics[target.metric];
    const pragmaticPass = passes(actual, target.pragmatic, target.comparator);
    if (actual === undefined) failureReasons.push(`필수 지표 ${target.metric} 누락`);
    return {
      metric: target.metric,
      actual,
      pragmatic: target.pragmatic,
      balanced: target.balanced,
      comparator: target.comparator,
      pragmaticPass,
      balancedGap: gapToBalanced(actual, target.balanced, target.comparator),
      unit: target.unit,
    };
  });

  if (failureReasons.length > 0) {
    return { indicatorId: input.indicatorId, state: config.coverageFailureState, pragmaticPass: false, metricResults, failureReasons };
  }

  const pragmaticPass = metricResults.every((result) => result.pragmaticPass);
  return {
    indicatorId: input.indicatorId,
    state: pragmaticPass ? "PASS" : "FAIL",
    pragmaticPass,
    metricResults,
    failureReasons: pragmaticPass ? [] : metricResults.filter((result) => !result.pragmaticPass).map((result) => `${result.metric} gate failed`),
  };
}

export function aggregateBasketState(states: AccuracyGateState[]): AccuracyGateState {
  if (states.some((state) => state === "FAIL")) return "FAIL";
  if (states.some((state) => state === "INSUFFICIENT_COVERAGE")) return "INSUFFICIENT_COVERAGE";
  if (states.some((state) => state === "PENDING")) return "PENDING";
  return "PASS";
}

export function buildIndicatorScorecard(input: IndicatorGateInput & { modelVersion: string; metricVersion: string; sourceVersion: string }): IndicatorScorecard {
  const config = getIndicatorThreshold(input.indicatorId);
  const gate = evaluateIndicatorGate(input);

  return {
    indicatorId: input.indicatorId,
    label: config.label,
    state: gate.state,
    metrics: input.metrics,
    gate,
    coverage: input.coverage,
    baselineType: config.baselineType,
    modelVersion: input.modelVersion,
    metricVersion: input.metricVersion,
    sourceVersion: input.sourceVersion,
    policyNote: config.policyNote,
  };
}

export function buildBasketScorecard(indicators: IndicatorScorecard[], generatedAt = new Date().toISOString()): BasketScorecard {
  const missingIndicators = MACRO_BASKET.filter((indicator) => !indicators.some((score) => score.indicatorId === indicator));
  const completeIndicators = [
    ...indicators,
    ...missingIndicators.map((indicatorId: MacroIndicatorId) => buildIndicatorScorecard({
      indicatorId,
      metrics: {},
      coverage: { observationCount: 0, maturedForecastCount: 0, pendingForecastCount: 0, sourceIds: [], warnings: ["scorecard input missing"] },
      modelVersion: "unknown",
      metricVersion: ACCURACY_THRESHOLD_VERSION,
      sourceVersion: "missing",
    })),
  ];

  return {
    generatedAt,
    state: aggregateBasketState(completeIndicators.map((indicator) => indicator.state)),
    indicators: completeIndicators,
    thresholdVersion: ACCURACY_THRESHOLD_VERSION,
    modelVersion: completeIndicators[0]?.modelVersion ?? "unknown",
    metricVersion: ACCURACY_THRESHOLD_VERSION,
    warnings: completeIndicators.flatMap((indicator) => indicator.coverage.warnings),
  };
}
