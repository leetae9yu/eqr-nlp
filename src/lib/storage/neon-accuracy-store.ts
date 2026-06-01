import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { EvaluationRun, IssuedForecastTarget, MatchedForecastObservation, MetricResult, SourceObservation } from "../accuracy/types";
import type { MacroIndicatorId } from "../types";
import type { AccuracyStore, AccuracyStoreStatus, SourceRunRecord } from "./accuracy-store";

export class NeonAccuracyStore implements AccuracyStore {
  private sql: NeonQueryFunction<false, false>;

  constructor(connectionString: string) {
    this.sql = neon(connectionString);
  }

  status(): AccuracyStoreStatus {
    return { mode: "neon-postgres", productionEvidence: true, warnings: [] };
  }

  async recordSourceRun(run: SourceRunRecord) {
    await this.sql`
      insert into accuracy_source_runs (source_run_id, source_id, source_version, started_at, completed_at, status, warnings)
      values (${run.sourceRunId}, ${run.sourceId}, ${run.sourceVersion}, ${run.startedAt}, ${run.completedAt ?? null}, ${run.status}, ${JSON.stringify(run.warnings)}::jsonb)
      on conflict (source_run_id) do update set
        source_id = excluded.source_id,
        source_version = excluded.source_version,
        started_at = excluded.started_at,
        completed_at = excluded.completed_at,
        status = excluded.status,
        warnings = excluded.warnings
    `;
  }

  async listSourceRuns() {
    const rows = await this.sql`select * from accuracy_source_runs order by started_at`;
    return rows.map((row) => ({
      sourceRunId: String(row.source_run_id),
      sourceId: String(row.source_id),
      sourceVersion: String(row.source_version),
      startedAt: String(row.started_at),
      completedAt: row.completed_at ? String(row.completed_at) : undefined,
      status: row.status as SourceRunRecord["status"],
      warnings: Array.isArray(row.warnings) ? row.warnings as string[] : [],
    }));
  }

  async upsertObservations(observations: SourceObservation[]) {
    for (const observation of observations) {
      await this.sql`
        insert into accuracy_observations (observation_id, indicator_id, observed_at, value, source_id, source_version, retrieved_at, unit)
        values (${observation.observationId}, ${observation.indicatorId}, ${observation.observedAt}, ${observation.value}, ${observation.sourceId}, ${observation.sourceVersion}, ${observation.retrievedAt}, ${observation.unit})
        on conflict (observation_id) do update set
          indicator_id = excluded.indicator_id,
          observed_at = excluded.observed_at,
          value = excluded.value,
          source_id = excluded.source_id,
          source_version = excluded.source_version,
          retrieved_at = excluded.retrieved_at,
          unit = excluded.unit
      `;
    }
  }

  async listObservations(indicatorId?: MacroIndicatorId) {
    const rows = indicatorId
      ? await this.sql`select * from accuracy_observations where indicator_id = ${indicatorId} order by observed_at`
      : await this.sql`select * from accuracy_observations order by observed_at`;
    return rows.map(rowToObservation);
  }

  async issueForecastTargets(targets: IssuedForecastTarget[]) {
    for (const target of targets) {
      await this.sql`
        insert into accuracy_forecast_targets (forecast_id, issued_at, source_run_id, event_id, document_id, indicator_id, horizon, target_date, baseline_value, predicted_value, predicted_delta, predicted_direction, confidence, model_version, metric_version, source_version)
        values (${target.forecastId}, ${target.issuedAt}, ${target.sourceRunId}, ${target.eventId ?? null}, ${target.documentId ?? null}, ${target.indicatorId}, ${target.horizon}, ${target.targetDate}, ${target.baselineValue}, ${target.predictedValue ?? null}, ${target.predictedDelta ?? null}, ${target.predictedDirection}, ${target.confidence}, ${target.modelVersion}, ${target.metricVersion}, ${target.sourceVersion})
        on conflict (forecast_id) do update set
          issued_at = excluded.issued_at,
          source_run_id = excluded.source_run_id,
          event_id = excluded.event_id,
          document_id = excluded.document_id,
          indicator_id = excluded.indicator_id,
          horizon = excluded.horizon,
          target_date = excluded.target_date,
          baseline_value = excluded.baseline_value,
          predicted_value = excluded.predicted_value,
          predicted_delta = excluded.predicted_delta,
          predicted_direction = excluded.predicted_direction,
          confidence = excluded.confidence,
          model_version = excluded.model_version,
          metric_version = excluded.metric_version,
          source_version = excluded.source_version
      `;
    }
  }

  async listForecastTargets() {
    const rows = await this.sql`select * from accuracy_forecast_targets order by issued_at`;
    return rows.map(rowToForecastTarget);
  }

  async recordMatchedObservations(matches: MatchedForecastObservation[]) {
    for (const match of matches) {
      await this.sql`
        insert into accuracy_matched_observations (forecast_id, matched_observation_id, observed_value, observed_direction, evaluation_state, evaluated_at)
        values (${match.forecastId}, ${match.matchedObservationId ?? null}, ${match.observedValue ?? null}, ${match.observedDirection ?? null}, ${match.evaluationState}, ${match.evaluatedAt ?? null})
        on conflict (forecast_id) do update set
          matched_observation_id = excluded.matched_observation_id,
          observed_value = excluded.observed_value,
          observed_direction = excluded.observed_direction,
          evaluation_state = excluded.evaluation_state,
          evaluated_at = excluded.evaluated_at
      `;
    }
  }

  async listMatchedObservations() {
    const rows = await this.sql`
      select t.*, m.matched_observation_id, m.observed_value, m.observed_direction, m.evaluation_state, m.evaluated_at
      from accuracy_forecast_targets t
      join accuracy_matched_observations m on m.forecast_id = t.forecast_id
      order by t.issued_at
    `;
    return rows.map((row) => ({ ...rowToForecastTarget(row), ...rowToMatchOnly(row) }));
  }

  async recordEvaluationRun(run: EvaluationRun) {
    await this.sql`
      insert into accuracy_evaluation_runs (evaluation_run_id, run_at, metric_version, model_version, source_run_ids, window_start, window_end)
      values (${run.evaluationRunId}, ${run.runAt}, ${run.metricVersion}, ${run.modelVersion}, ${JSON.stringify(run.sourceRunIds)}::jsonb, ${run.windowStart ?? null}, ${run.windowEnd ?? null})
      on conflict (evaluation_run_id) do update set
        run_at = excluded.run_at,
        metric_version = excluded.metric_version,
        model_version = excluded.model_version,
        source_run_ids = excluded.source_run_ids,
        window_start = excluded.window_start,
        window_end = excluded.window_end
    `;
  }

  async listEvaluationRuns() {
    const rows = await this.sql`select * from accuracy_evaluation_runs order by run_at`;
    return rows.map((row) => ({
      evaluationRunId: String(row.evaluation_run_id),
      runAt: String(row.run_at),
      metricVersion: String(row.metric_version),
      modelVersion: String(row.model_version),
      sourceRunIds: Array.isArray(row.source_run_ids) ? row.source_run_ids as string[] : [],
      windowStart: row.window_start ? String(row.window_start) : undefined,
      windowEnd: row.window_end ? String(row.window_end) : undefined,
    }));
  }

  async recordMetricResults(results: MetricResult[]) {
    for (const result of results) {
      await this.sql`
        insert into accuracy_metric_results (evaluation_run_id, indicator_id, horizon, metric, value, baseline_value, sample_size)
        values (${result.evaluationRunId}, ${result.indicatorId}, ${result.horizon ?? null}, ${result.metric}, ${result.value}, ${result.baselineValue ?? null}, ${result.sampleSize})
      `;
    }
  }

  async listMetricResults() {
    const rows = await this.sql`select * from accuracy_metric_results order by evaluation_run_id, indicator_id, metric`;
    return rows.map((row) => ({
      evaluationRunId: String(row.evaluation_run_id),
      indicatorId: row.indicator_id,
      horizon: row.horizon ?? undefined,
      metric: row.metric,
      value: Number(row.value),
      baselineValue: row.baseline_value === null ? undefined : Number(row.baseline_value),
      sampleSize: Number(row.sample_size),
    } as MetricResult));
  }
}

function rowToObservation(row: Record<string, unknown>): SourceObservation {
  return {
    observationId: String(row.observation_id),
    indicatorId: row.indicator_id as SourceObservation["indicatorId"],
    observedAt: String(row.observed_at),
    value: Number(row.value),
    sourceId: String(row.source_id),
    sourceVersion: String(row.source_version),
    retrievedAt: String(row.retrieved_at),
    unit: String(row.unit),
  };
}

function rowToForecastTarget(row: Record<string, unknown>): IssuedForecastTarget {
  return {
    forecastId: String(row.forecast_id),
    issuedAt: String(row.issued_at),
    sourceRunId: String(row.source_run_id),
    eventId: row.event_id ? String(row.event_id) : undefined,
    documentId: row.document_id ? String(row.document_id) : undefined,
    indicatorId: row.indicator_id as IssuedForecastTarget["indicatorId"],
    horizon: row.horizon as IssuedForecastTarget["horizon"],
    targetDate: String(row.target_date),
    baselineValue: Number(row.baseline_value),
    predictedValue: row.predicted_value === null ? undefined : Number(row.predicted_value),
    predictedDelta: row.predicted_delta === null ? undefined : Number(row.predicted_delta),
    predictedDirection: row.predicted_direction as IssuedForecastTarget["predictedDirection"],
    confidence: Number(row.confidence),
    modelVersion: String(row.model_version),
    metricVersion: String(row.metric_version),
    sourceVersion: String(row.source_version),
  };
}

function rowToMatchOnly(row: Record<string, unknown>): Pick<MatchedForecastObservation, "matchedObservationId" | "observedValue" | "observedDirection" | "evaluationState" | "evaluatedAt"> {
  return {
    matchedObservationId: row.matched_observation_id ? String(row.matched_observation_id) : undefined,
    observedValue: row.observed_value === null ? undefined : Number(row.observed_value),
    observedDirection: row.observed_direction as MatchedForecastObservation["observedDirection"],
    evaluationState: row.evaluation_state as MatchedForecastObservation["evaluationState"],
    evaluatedAt: row.evaluated_at ? String(row.evaluated_at) : undefined,
  };
}
