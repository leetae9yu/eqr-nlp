import type { BacktestExample, MagnitudeMetricSummary } from "../domain/backtest-types";

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

export function meanAbsoluteError(examples: BacktestExample[]): number {
  if (examples.length === 0) return 0;
  return round(examples.reduce((sum, example) => sum + Math.abs(example.predictedDelta - example.actualDelta), 0) / examples.length);
}

export function rootMeanSquaredError(examples: BacktestExample[]): number {
  if (examples.length === 0) return 0;
  const mse = examples.reduce((sum, example) => sum + (example.predictedDelta - example.actualDelta) ** 2, 0) / examples.length;
  return round(Math.sqrt(mse));
}

export function symmetricMeanAbsolutePercentageError(examples: BacktestExample[]): number {
  if (examples.length === 0) return 0;
  const total = examples.reduce((sum, example) => {
    const denominator = Math.abs(example.predictedDelta) + Math.abs(example.actualDelta);
    if (denominator === 0) return sum;
    return sum + (2 * Math.abs(example.predictedDelta - example.actualDelta)) / denominator;
  }, 0);
  return round((total / examples.length) * 100, 2);
}

export function magnitudeMetrics(examples: BacktestExample[]): MagnitudeMetricSummary {
  return {
    mae: meanAbsoluteError(examples),
    rmse: rootMeanSquaredError(examples),
    smape: symmetricMeanAbsolutePercentageError(examples),
    sampleSize: examples.length,
  };
}
