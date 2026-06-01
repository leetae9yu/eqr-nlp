import type { EvaluationRun, IssuedForecastTarget, MatchedForecastObservation, MetricResult, SourceObservation } from "../accuracy/types";
import type { MacroIndicatorId } from "../types";
import type { AccuracyStore, AccuracyStoreStatus, SourceRunRecord } from "./accuracy-store";

export class InMemoryAccuracyStore implements AccuracyStore {
  private sourceRuns = new Map<string, SourceRunRecord>();
  private observations = new Map<string, SourceObservation>();
  private targets = new Map<string, IssuedForecastTarget>();
  private matches = new Map<string, MatchedForecastObservation>();
  private evaluationRuns = new Map<string, EvaluationRun>();
  private metricResults = new Map<string, MetricResult>();

  status(): AccuracyStoreStatus {
    return {
      mode: "memory-non-production",
      productionEvidence: false,
      warnings: ["DATABASE_URL이 없어 인메모리 비프로덕션 저장소를 사용합니다. 이 결과는 운영 정확도 증거가 아닙니다."],
    };
  }

  async recordSourceRun(run: SourceRunRecord) {
    this.sourceRuns.set(run.sourceRunId, structuredClone(run));
  }

  async listSourceRuns() {
    return [...this.sourceRuns.values()].map((run) => structuredClone(run));
  }

  async upsertObservations(observations: SourceObservation[]) {
    for (const observation of observations) this.observations.set(observation.observationId, structuredClone(observation));
  }

  async listObservations(indicatorId?: MacroIndicatorId) {
    return [...this.observations.values()]
      .filter((observation) => !indicatorId || observation.indicatorId === indicatorId)
      .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
      .map((observation) => structuredClone(observation));
  }

  async issueForecastTargets(targets: IssuedForecastTarget[]) {
    for (const target of targets) this.targets.set(target.forecastId, structuredClone(target));
  }

  async listForecastTargets() {
    return [...this.targets.values()].map((target) => structuredClone(target));
  }

  async recordMatchedObservations(matches: MatchedForecastObservation[]) {
    for (const match of matches) this.matches.set(match.forecastId, structuredClone(match));
  }

  async listMatchedObservations() {
    return [...this.matches.values()].map((match) => structuredClone(match));
  }

  async recordEvaluationRun(run: EvaluationRun) {
    this.evaluationRuns.set(run.evaluationRunId, structuredClone(run));
  }

  async listEvaluationRuns() {
    return [...this.evaluationRuns.values()].map((run) => structuredClone(run));
  }

  async recordMetricResults(results: MetricResult[]) {
    for (const result of results) {
      this.metricResults.set(metricResultKey(result), structuredClone(result));
    }
  }

  async listMetricResults() {
    return [...this.metricResults.values()].map((result) => structuredClone(result));
  }
}

function metricResultKey(result: MetricResult) {
  return `${result.evaluationRunId}|${result.indicatorId}|${result.horizon ?? ""}|${result.metric}`;
}
