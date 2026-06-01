import type { Direction, ForecastHorizon, MacroIndicatorId } from "../types";

export type AccuracyGateState = "PASS" | "FAIL" | "INSUFFICIENT_COVERAGE" | "PENDING";

export type AccuracyMetricKey =
  | "mae"
  | "rmse"
  | "smape"
  | "directionalAccuracy"
  | "smapeImprovementPct"
  | "maeImprovementPct"
  | "trendSmapeImprovementPct"
  | "eventDirectionHitRate";

export type AccuracyMetricSet = Partial<Record<AccuracyMetricKey, number>>;

export type AccuracyCoverage = {
  observationCount: number;
  maturedForecastCount: number;
  pendingForecastCount: number;
  windowStart?: string;
  windowEnd?: string;
  sourceIds: string[];
  warnings: string[];
};

export type AccuracyThresholdTarget = {
  metric: AccuracyMetricKey;
  pragmatic: number;
  balanced: number;
  comparator: "gte" | "lte";
  unit: "pct" | "value";
};

export type IndicatorThresholdConfig = {
  indicatorId: MacroIndicatorId;
  label: string;
  sourceLabel: string;
  baselineType: "previous-value" | "no-change-trend" | "event-direction";
  gateMode: "all";
  minimumObservations: number;
  minimumMaturedForecasts: number;
  requiredMetrics: AccuracyThresholdTarget[];
  coverageFailureState: Extract<AccuracyGateState, "INSUFFICIENT_COVERAGE">;
  policyNote?: string;
};

export type MetricGateResult = {
  metric: AccuracyMetricKey;
  actual?: number;
  pragmatic: number;
  balanced: number;
  comparator: "gte" | "lte";
  pragmaticPass: boolean;
  balancedGap: number;
  unit: "pct" | "value";
};

export type IndicatorGateInput = {
  indicatorId: MacroIndicatorId;
  metrics: AccuracyMetricSet;
  coverage: AccuracyCoverage;
  hasPendingTargets?: boolean;
};

export type IndicatorGateResult = {
  indicatorId: MacroIndicatorId;
  state: AccuracyGateState;
  pragmaticPass: boolean;
  metricResults: MetricGateResult[];
  failureReasons: string[];
};

export type SourceObservation = {
  observationId: string;
  indicatorId: MacroIndicatorId;
  observedAt: string;
  value: number;
  sourceId: string;
  sourceVersion: string;
  retrievedAt: string;
  unit: string;
};

export type IssuedForecastTarget = {
  forecastId: string;
  issuedAt: string;
  sourceRunId: string;
  eventId?: string;
  documentId?: string;
  indicatorId: MacroIndicatorId;
  horizon: ForecastHorizon;
  targetDate: string;
  baselineValue: number;
  predictedValue?: number;
  predictedDelta?: number;
  predictedDirection: Direction;
  confidence: number;
  modelVersion: string;
  metricVersion: string;
  sourceVersion: string;
};

export type MatchedForecastObservation = IssuedForecastTarget & {
  matchedObservationId?: string;
  observedValue?: number;
  observedDirection?: Direction;
  evaluationState: AccuracyGateState;
  evaluatedAt?: string;
};

export type EvaluationRun = {
  evaluationRunId: string;
  runAt: string;
  metricVersion: string;
  modelVersion: string;
  sourceRunIds: string[];
  windowStart?: string;
  windowEnd?: string;
};

export type MetricResult = {
  evaluationRunId: string;
  indicatorId: MacroIndicatorId;
  horizon?: ForecastHorizon;
  metric: AccuracyMetricKey;
  value: number;
  baselineValue?: number;
  sampleSize: number;
};

export type IndicatorScorecard = {
  indicatorId: MacroIndicatorId;
  label: string;
  state: AccuracyGateState;
  metrics: AccuracyMetricSet;
  gate: IndicatorGateResult;
  coverage: AccuracyCoverage;
  baselineType: IndicatorThresholdConfig["baselineType"];
  modelVersion: string;
  metricVersion: string;
  sourceVersion: string;
  policyNote?: string;
};

export type BasketScorecard = {
  generatedAt: string;
  state: AccuracyGateState;
  indicators: IndicatorScorecard[];
  thresholdVersion: string;
  modelVersion: string;
  metricVersion: string;
  warnings: string[];
};
