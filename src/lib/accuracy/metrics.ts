import type { Direction } from "../types";

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function mae(predicted: number[], actual: number[]): number {
  const pairs = zipNumeric(predicted, actual);
  return round(mean(pairs.map(([p, a]) => Math.abs(p - a))));
}

export function rmse(predicted: number[], actual: number[]): number {
  const pairs = zipNumeric(predicted, actual);
  return round(Math.sqrt(mean(pairs.map(([p, a]) => (p - a) ** 2))));
}

export function smape(predicted: number[], actual: number[]): number {
  const pairs = zipNumeric(predicted, actual);
  if (pairs.length === 0) return 0;
  const values = pairs.map(([p, a]) => {
    const denominator = Math.abs(p) + Math.abs(a);
    if (denominator === 0) return 0;
    return (2 * Math.abs(p - a)) / denominator;
  });
  return round(mean(values) * 100, 2);
}

export function improvementPct(modelError: number, baselineError: number): number {
  if (!Number.isFinite(modelError) || !Number.isFinite(baselineError) || baselineError <= 0) return 0;
  return round(((baselineError - modelError) / baselineError) * 100, 2);
}

export function directionFromDelta(delta: number, flatBand = 0): Direction {
  if (delta > flatBand) return "up";
  if (delta < -flatBand) return "down";
  return "flat";
}

export function directionalAccuracy(predicted: Direction[], actual: Direction[]): number {
  const pairs = predicted
    .map((prediction, index) => [prediction, actual[index]] as const)
    .filter((pair): pair is readonly [Direction, Direction] => Boolean(pair[1]));
  if (pairs.length === 0) return 0;
  const hits = pairs.filter(([prediction, observed]) => prediction === observed || prediction === "mixed").length;
  return round((hits / pairs.length) * 100, 2);
}

function zipNumeric(predicted: number[], actual: number[]) {
  return predicted
    .map((prediction, index) => [prediction, actual[index]] as const)
    .filter(([prediction, observed]) => Number.isFinite(prediction) && Number.isFinite(observed));
}
