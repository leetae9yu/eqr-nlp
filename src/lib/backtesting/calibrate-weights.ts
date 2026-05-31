import type { BacktestRunNode, WeightNode } from "../domain/graph-types";
import type { BacktestExample, CalibrationResult } from "../domain/backtest-types";
import { HORIZONS, MACRO_BASKET } from "../types";
import type { GraphStore } from "../kg/graph-store";
import { createRelationship } from "../domain/graph-types";
import { magnitudeMetrics } from "./metrics";
import { historicalBacktestExamples } from "./historical-fixtures";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function groupKey(example: BacktestExample) {
  return `${example.eventKind}|${example.indicatorId}|${example.horizon}`;
}

function scalarWeight(examples: BacktestExample[]) {
  const denominator = examples.reduce((sum, example) => sum + example.predictedDelta ** 2, 0);
  if (denominator === 0) return 0;
  const numerator = examples.reduce((sum, example) => sum + example.predictedDelta * example.actualDelta, 0);
  return Number(clamp(numerator / denominator, -2, 2).toFixed(4));
}

function confidenceFor(metrics: { mae: number; sampleSize: number }) {
  const sampleConfidence = metrics.sampleSize / (metrics.sampleSize + 5);
  const errorPenalty = 1 / (1 + metrics.mae);
  return Number(clamp(0.25 + sampleConfidence * 0.5 + errorPenalty * 0.25, 0.2, 0.92).toFixed(2));
}

export type CalibrationBundle = {
  backtestRun: BacktestRunNode;
  calibrationResults: CalibrationResult[];
  weightNodes: WeightNode[];
};

export function calibrateBacktestWeights(
  examples: BacktestExample[] = historicalBacktestExamples,
  runId = "backtest:fixture-calibration-20260531",
): CalibrationBundle {
  const groups = new Map<string, BacktestExample[]>();
  for (const example of examples) {
    groups.set(groupKey(example), [...(groups.get(groupKey(example)) ?? []), example]);
  }

  const calibrationResults: CalibrationResult[] = [...groups.entries()].map(([key, group]) => {
    const [eventKind, indicatorId, horizon] = key.split("|") as [string, CalibrationResult["indicatorId"], CalibrationResult["horizon"]];
    const metrics = magnitudeMetrics(group);
    const weight = scalarWeight(group);
    return {
      runId,
      indicatorId,
      horizon,
      eventKind,
      weight,
      confidence: confidenceFor(metrics),
      metrics,
    };
  }).sort((a, b) => a.indicatorId.localeCompare(b.indicatorId) || a.horizon.localeCompare(b.horizon) || a.eventKind.localeCompare(b.eventKind));

  const metricSummary = magnitudeMetrics(examples);
  const backtestRun: BacktestRunNode = {
    id: runId,
    kind: "backtest-run",
    runAt: "2026-05-31T00:00:00.000Z",
    windowStart: "2025-10-01",
    windowEnd: "2026-05-30",
    targetIndicators: [...MACRO_BASKET],
    horizons: [...HORIZONS],
    metricSummary: {
      mae: metricSummary.mae,
      rmse: metricSummary.rmse,
      smape: metricSummary.smape,
      sampleSize: metricSummary.sampleSize,
    },
    modelVersion: "rule-extractor-v1",
    weightVersion: "backtest-calibrated-fixture-v1",
    dataCutoff: "2026-05-30",
  };

  const weightNodes = calibrationResults.map((result): WeightNode => ({
    id: `weight:${result.eventKind}:${result.indicatorId}:${result.horizon}`,
    kind: "weight",
    fromType: "event",
    fromId: `event-kind:${result.eventKind}`,
    toType: "indicator",
    toId: result.indicatorId,
    indicatorId: result.indicatorId,
    horizon: result.horizon,
    weight: result.weight,
    confidence: result.confidence,
    calibrationRunId: runId,
    sampleSize: result.metrics.sampleSize,
    mae: result.metrics.mae,
    rmse: result.metrics.rmse,
    smape: result.metrics.smape,
    updatedAt: backtestRun.runAt,
  }));

  return { backtestRun, calibrationResults, weightNodes };
}

export async function seedBacktestCalibration(graphStore: GraphStore, bundle = calibrateBacktestWeights()): Promise<CalibrationBundle> {
  await graphStore.upsertBacktestRun(bundle.backtestRun);
  for (const weight of bundle.weightNodes) {
    await graphStore.upsertWeight(weight);
    await graphStore.upsertRelationship(createRelationship("CALIBRATED", bundle.backtestRun.id, weight.id, { sampleSize: weight.sampleSize }));
    await graphStore.upsertRelationship(createRelationship("USES_WEIGHT", weight.fromId, weight.id, { horizon: weight.horizon, indicatorId: weight.indicatorId }));
  }
  return bundle;
}
