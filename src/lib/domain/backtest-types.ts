import type { ForecastHorizon, MacroIndicatorId } from "../types";

export type MagnitudeMetricSummary = {
  mae: number;
  rmse: number;
  smape: number;
  sampleSize: number;
};

export type BacktestExample = {
  eventId: string;
  indicatorId: MacroIndicatorId;
  horizon: ForecastHorizon;
  predictedDelta: number;
  actualDelta: number;
};

export type CalibrationResult = {
  runId: string;
  indicatorId: MacroIndicatorId;
  horizon: ForecastHorizon;
  eventKind: string;
  weight: number;
  confidence: number;
  metrics: MagnitudeMetricSummary;
};
