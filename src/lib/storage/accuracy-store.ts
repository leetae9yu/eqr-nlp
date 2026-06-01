import type { EvaluationRun, IssuedForecastTarget, MatchedForecastObservation, MetricResult, SourceObservation } from "../accuracy/types";
import type { MacroIndicatorId } from "../types";

export type SourceRunStatus = "ok" | "coverage_gap" | "error";

export type SourceRunRecord = {
  sourceRunId: string;
  sourceId: string;
  sourceVersion: string;
  startedAt: string;
  completedAt?: string;
  status: SourceRunStatus;
  warnings: string[];
};

export type AccuracyStoreMode = "memory-non-production" | "neon-postgres" | "unavailable";

export type AccuracyStoreStatus = {
  mode: AccuracyStoreMode;
  productionEvidence: boolean;
  warnings: string[];
};

export interface AccuracyStore {
  status(): AccuracyStoreStatus;
  recordSourceRun(run: SourceRunRecord): Promise<void>;
  listSourceRuns(): Promise<SourceRunRecord[]>;
  upsertObservations(observations: SourceObservation[]): Promise<void>;
  listObservations(indicatorId?: MacroIndicatorId): Promise<SourceObservation[]>;
  issueForecastTargets(targets: IssuedForecastTarget[]): Promise<void>;
  listForecastTargets(): Promise<IssuedForecastTarget[]>;
  recordMatchedObservations(matches: MatchedForecastObservation[]): Promise<void>;
  listMatchedObservations(): Promise<MatchedForecastObservation[]>;
  recordEvaluationRun(run: EvaluationRun): Promise<void>;
  listEvaluationRuns(): Promise<EvaluationRun[]>;
  recordMetricResults(results: MetricResult[]): Promise<void>;
  listMetricResults(): Promise<MetricResult[]>;
}
