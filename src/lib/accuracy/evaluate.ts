import { loadEcosIndicatorHistory } from "../history/ecos-history";
import { loadFrankfurterUsdKrwHistory } from "../history/frankfurter-history";
import type { HistoryLoadResult } from "../history/types";
import { createAccuracyStore, type AccuracyStore, type SourceRunRecord } from "../storage";
import { MACRO_BASKET, type Direction, type MacroIndicatorId } from "../types";
import { directionsFromSeries, type DatedValue } from "./baselines";
import { ACCURACY_THRESHOLD_VERSION, getIndicatorThreshold } from "./thresholds";
import { directionalAccuracy, directionFromDelta, improvementPct, mae, smape } from "./metrics";
import { buildBasketScorecard, buildIndicatorScorecard } from "./scorecard";
import type { AccuracyMetricSet, BasketScorecard, IssuedForecastTarget, MatchedForecastObservation, MetricResult, SourceObservation } from "./types";

export const ACCURACY_MODEL_VERSION = "walk-forward-momentum-v1";
export const ACCURACY_SOURCE_VERSION = "free-history-loaders-v1";

export type AccuracyEvaluationMode = "read-only" | "persist-walk-forward-backtest";

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

type BuildOptions = {
  fetcher?: FetchLike;
  store?: AccuracyStore;
  now?: Date;
  historyLimit?: number;
};

function isoNow(now: Date) {
  return now.toISOString();
}

function toSeries(observations: SourceObservation[]): DatedValue[] {
  return observations
    .map((observation) => ({ date: observation.observedAt, value: observation.value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function modelForecastValues(series: DatedValue[]) {
  return series.slice(2).map((_, index) => {
    const previousPrevious = series[index].value;
    const previous = series[index + 1].value;
    return previous + (previous - previousPrevious);
  });
}

function baselineValuesForModelWindow(series: DatedValue[]) {
  return series.slice(1, -1).map((point) => point.value);
}

function actualValuesForModelWindow(series: DatedValue[]) {
  return series.slice(2).map((point) => point.value);
}

function directionsFromForecasts(forecasts: number[], baselines: number[]): Direction[] {
  return forecasts.map((forecast, index) => directionFromDelta(forecast - baselines[index]));
}

function directionHit(predicted: Direction, observed: Direction) {
  return predicted === observed || predicted === "mixed";
}

function historyToMetrics(indicatorId: MacroIndicatorId, observations: SourceObservation[]): AccuracyMetricSet {
  const series = toSeries(observations);
  if (series.length < 3) return {};

  const modelForecasts = modelForecastValues(series);
  const baselineForecasts = baselineValuesForModelWindow(series);
  const actuals = actualValuesForModelWindow(series);
  const actualDirections = directionsFromSeries(series).slice(1);
  const predictedDirections = directionsFromForecasts(modelForecasts, baselineForecasts);
  const modelMae = mae(modelForecasts, actuals);
  const baselineMae = mae(baselineForecasts, actuals);
  const modelSmape = smape(modelForecasts, actuals);
  const baselineSmape = smape(baselineForecasts, actuals);

  if (indicatorId === "usd-krw") {
    return {
      smape: modelSmape,
      smapeImprovementPct: improvementPct(modelSmape, baselineSmape),
      directionalAccuracy: directionalAccuracy(predictedDirections, actualDirections),
    };
  }

  if (indicatorId === "treasury-yield") {
    return {
      mae: modelMae,
      maeImprovementPct: improvementPct(modelMae, baselineMae),
      directionalAccuracy: directionalAccuracy(predictedDirections, actualDirections),
    };
  }

  if (indicatorId === "base-rate-expectation") {
    return {
      eventDirectionHitRate: directionalAccuracy(predictedDirections, actualDirections),
    };
  }

  return {
    trendSmapeImprovementPct: improvementPct(modelSmape, baselineSmape),
  };
}

function buildLedgerRows(indicatorId: MacroIndicatorId, observations: SourceObservation[], now: Date, sourceRunId: string) {
  const series = toSeries(observations);
  if (series.length < 3) return { targets: [] as IssuedForecastTarget[], matches: [] as MatchedForecastObservation[] };
  const modelForecasts = modelForecastValues(series);
  const baselineForecasts = baselineValuesForModelWindow(series);
  const actuals = actualValuesForModelWindow(series);
  const targets: IssuedForecastTarget[] = [];
  const matches: MatchedForecastObservation[] = [];

  for (let index = 0; index < modelForecasts.length; index += 1) {
    const issuedPoint = series[index + 1];
    const targetPoint = series[index + 2];
    const predictedValue = modelForecasts[index];
    const baselineValue = baselineForecasts[index];
    const observedValue = actuals[index];
    const predictedDirection = directionFromDelta(predictedValue - baselineValue);
    const observedDirection = directionFromDelta(observedValue - baselineValue);
    const target: IssuedForecastTarget = {
      forecastId: `forecast:${indicatorId}:walk-forward-backtest:${targetPoint.date}`,
      issuedAt: `${issuedPoint.date.length === 7 ? `${issuedPoint.date}-01` : issuedPoint.date}T00:00:00.000Z`,
      sourceRunId,
      indicatorId,
      horizon: indicatorId === "m2-liquidity" || indicatorId === "base-rate-expectation" ? "1M" : "1D",
      targetDate: targetPoint.date,
      baselineValue,
      predictedValue,
      predictedDelta: predictedValue - baselineValue,
      predictedDirection,
      confidence: 0.5,
      modelVersion: `${ACCURACY_MODEL_VERSION}:walk-forward-backtest`,
      metricVersion: ACCURACY_THRESHOLD_VERSION,
      sourceVersion: observations[index + 2]?.sourceVersion ?? ACCURACY_SOURCE_VERSION,
    };
    targets.push(target);
    matches.push({
      ...target,
      matchedObservationId: observations[index + 2]?.observationId,
      observedValue,
      observedDirection,
      evaluationState: directionHit(predictedDirection, observedDirection) ? "PASS" : "FAIL",
      evaluatedAt: isoNow(now),
    });
  }

  return { targets, matches };
}

function sourceRunFromHistory(result: HistoryLoadResult, now: Date): SourceRunRecord {
  return {
    sourceRunId: `source-run:${result.sourceId}:${isoNow(now)}`,
    sourceId: result.sourceId,
    sourceVersion: result.sourceVersion,
    startedAt: isoNow(now),
    completedAt: isoNow(now),
    status: result.ok ? "ok" : "coverage_gap",
    warnings: result.warnings,
  };
}

export async function loadAllFreeHistories(options: BuildOptions = {}): Promise<HistoryLoadResult[]> {
  const fetcher = options.fetcher ?? fetch;
  const historyLimit = options.historyLimit ?? 1000;
  return [
    await loadFrankfurterUsdKrwHistory(fetcher, { limit: historyLimit }),
    await loadEcosIndicatorHistory("treasury-yield", fetcher, { limit: historyLimit }),
    await loadEcosIndicatorHistory("base-rate-expectation", fetcher, { limit: historyLimit }),
    await loadEcosIndicatorHistory("m2-liquidity", fetcher, { limit: historyLimit }),
  ];
}

export async function ingestAccuracyHistories(options: BuildOptions = {}) {
  const now = options.now ?? new Date();
  const store = options.store ?? createAccuracyStore();
  const histories = await loadAllFreeHistories(options);

  for (const history of histories) {
    const run = sourceRunFromHistory(history, now);
    await store.recordSourceRun(run);
    await store.upsertObservations(history.observations);
  }

  return {
    storeStatus: store.status(),
    histories,
    observationsStored: histories.reduce((sum, history) => sum + history.observationCount, 0),
    warnings: histories.flatMap((history) => history.warnings),
  };
}


function scorecardFromHistories(histories: HistoryLoadResult[], store: AccuracyStore, now: Date): BasketScorecard {
  const indicators = MACRO_BASKET.map((indicatorId) => {
    const history = histories.find((item) => item.indicatorId === indicatorId);
    const observations = history?.observations ?? [];
    const config = getIndicatorThreshold(indicatorId);
    return buildIndicatorScorecard({
      indicatorId,
      metrics: historyToMetrics(indicatorId, observations),
      coverage: {
        observationCount: observations.length,
        maturedForecastCount: Math.max(0, observations.length - 2),
        pendingForecastCount: 0,
        windowStart: observations[0]?.observedAt,
        windowEnd: observations.at(-1)?.observedAt,
        sourceIds: [...new Set(observations.map((observation) => observation.sourceId))],
        warnings: history?.warnings ?? ["저장된 이력 또는 프리뷰 이력이 없습니다."],
      },
      modelVersion: `${ACCURACY_MODEL_VERSION}:nonpersistent-preview`,
      metricVersion: ACCURACY_THRESHOLD_VERSION,
      sourceVersion: observations[0]?.sourceVersion ?? config.sourceLabel,
    });
  });
  const scorecard = buildBasketScorecard(indicators, isoNow(now));
  return {
    ...scorecard,
    warnings: [...scorecard.warnings, ...store.status().warnings, "비프로덕션 프리뷰: 공개 read path는 ledger를 쓰지 않습니다."],
  };
}

async function scorecardFromStore(store: AccuracyStore, now: Date): Promise<BasketScorecard> {
  const sourceRuns = await store.listSourceRuns();
  const indicators = [];

  for (const indicatorId of MACRO_BASKET) {
    const observations = await store.listObservations(indicatorId);
    const config = getIndicatorThreshold(indicatorId);
    const matchingRuns = sourceRuns.filter((run) => observations.some((observation) => observation.sourceId === run.sourceId));
    const metrics = historyToMetrics(indicatorId, observations);
    indicators.push(buildIndicatorScorecard({
      indicatorId,
      metrics,
      coverage: {
        observationCount: observations.length,
        maturedForecastCount: Math.max(0, observations.length - 2),
        pendingForecastCount: 0,
        windowStart: observations[0]?.observedAt,
        windowEnd: observations.at(-1)?.observedAt,
        sourceIds: [...new Set(observations.map((observation) => observation.sourceId))],
        warnings: observations.length ? matchingRuns.flatMap((run) => run.warnings) : sourceRuns.filter((run) => run.sourceId.includes(indicatorId) || run.sourceId.includes(config.sourceLabel)).flatMap((run) => run.warnings),
      },
      modelVersion: ACCURACY_MODEL_VERSION,
      metricVersion: ACCURACY_THRESHOLD_VERSION,
      sourceVersion: observations[0]?.sourceVersion ?? config.sourceLabel,
    }));
  }

  const scorecard = buildBasketScorecard(indicators, isoNow(now));
  return {
    ...scorecard,
    warnings: [...scorecard.warnings, ...store.status().warnings],
  };
}

export async function buildAccuracyScorecard(options: BuildOptions = {}): Promise<BasketScorecard> {
  const now = options.now ?? new Date();
  const explicitStore = Boolean(options.store);
  const store = options.store ?? createAccuracyStore();
  if (!explicitStore && store.status().mode === "memory-non-production") {
    const histories = await loadAllFreeHistories(options);
    return scorecardFromHistories(histories, store, now);
  }
  return scorecardFromStore(store, now);
}

export async function ingestAndEvaluateAccuracy(options: BuildOptions = {}) {
  const now = options.now ?? new Date();
  const store = options.store ?? createAccuracyStore();
  const ingestion = await ingestAccuracyHistories({ ...options, store, now });

  for (const indicatorId of MACRO_BASKET) {
    const observations = await store.listObservations(indicatorId);
    const sourceRun = (await store.listSourceRuns()).find((run) => observations.some((observation) => observation.sourceId === run.sourceId));
    const sourceRunId = sourceRun?.sourceRunId ?? `source-run:missing:${indicatorId}:${isoNow(now)}`;
    const { targets, matches } = buildLedgerRows(indicatorId, observations, now, sourceRunId);
    if (targets.length) {
      await store.issueForecastTargets(targets);
      await store.recordMatchedObservations(matches);
    }
    const metrics = historyToMetrics(indicatorId, observations);
    const evaluationRunId = `eval:${indicatorId}:walk-forward-backtest:${observations[0]?.observedAt ?? "none"}:${observations.at(-1)?.observedAt ?? "none"}`;
    const metricResults = Object.entries(metrics).map(([metric, value]) => ({
      evaluationRunId,
      indicatorId,
      metric: metric as MetricResult["metric"],
      value,
      sampleSize: Math.max(0, observations.length - 2),
    }));
    await store.recordEvaluationRun({
      evaluationRunId,
      runAt: isoNow(now),
      metricVersion: ACCURACY_THRESHOLD_VERSION,
      modelVersion: `${ACCURACY_MODEL_VERSION}:walk-forward-backtest`,
      sourceRunIds: sourceRun ? [sourceRun.sourceRunId] : [],
      windowStart: observations[0]?.observedAt,
      windowEnd: observations.at(-1)?.observedAt,
    });
    await store.recordMetricResults(metricResults);
  }

  return {
    ...ingestion,
    scorecard: await scorecardFromStore(store, now),
    evaluationMode: "persist-walk-forward-backtest" satisfies AccuracyEvaluationMode,
  };
}
