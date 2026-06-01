import { directionFromDelta } from "./metrics";

export type DatedValue = { date: string; value: number };

export function previousValueForecasts(series: DatedValue[]): number[] {
  return series.slice(1).map((_, index) => series[index].value);
}

export function noChangeTrendForecasts(series: DatedValue[]): number[] {
  return previousValueForecasts(series);
}

export function actualValuesAfterFirst(series: DatedValue[]): number[] {
  return series.slice(1).map((point) => point.value);
}

export function directionsFromSeries(series: DatedValue[]) {
  return series.slice(1).map((point, index) => directionFromDelta(point.value - series[index].value));
}
