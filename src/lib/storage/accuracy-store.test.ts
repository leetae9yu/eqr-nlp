import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { InMemoryAccuracyStore, createAccuracyStore } from ".";
import type { IssuedForecastTarget, MatchedForecastObservation, SourceObservation } from "../accuracy/types";

const sourceRun = {
  sourceRunId: "source-run-1",
  sourceId: "source:test",
  sourceVersion: "source-v1",
  startedAt: "2026-06-01T00:00:00.000Z",
  completedAt: "2026-06-01T00:00:01.000Z",
  status: "ok" as const,
  warnings: [],
};

const observation: SourceObservation = {
  observationId: "obs-1",
  indicatorId: "usd-krw",
  observedAt: "2026-06-08",
  value: 1515,
  sourceId: "source:test",
  sourceVersion: "source-v1",
  retrievedAt: "2026-06-08T09:00:00.000Z",
  unit: "KRW per USD",
};

const target: IssuedForecastTarget = {
  forecastId: "forecast-1",
  issuedAt: "2026-06-01T00:00:00.000Z",
  sourceRunId: "source-run-1",
  eventId: "event-1",
  documentId: "document-1",
  indicatorId: "usd-krw",
  horizon: "1W",
  targetDate: "2026-06-08",
  baselineValue: 1500,
  predictedValue: 1512,
  predictedDelta: 12,
  predictedDirection: "up",
  confidence: 0.61,
  modelVersion: "model-v1",
  metricVersion: "metric-v1",
  sourceVersion: "source-v1",
};

const match: MatchedForecastObservation = {
  ...target,
  matchedObservationId: "obs-1",
  observedValue: 1515,
  observedDirection: "up",
  evaluationState: "PASS",
  evaluatedAt: "2026-06-08T09:00:00.000Z",
};

async function seedStore(store: InMemoryAccuracyStore) {
  await store.recordSourceRun(sourceRun);
  await store.upsertObservations([observation]);
  await store.issueForecastTargets([target]);
  await store.recordMatchedObservations([match]);
  await store.recordEvaluationRun({
    evaluationRunId: "eval-1",
    runAt: "2026-06-08T09:01:00.000Z",
    metricVersion: "metric-v1",
    modelVersion: "model-v1",
    sourceRunIds: ["source-run-1"],
    windowStart: "2026-06-01",
    windowEnd: "2026-06-08",
  });
  await store.recordMetricResults([{ evaluationRunId: "eval-1", indicatorId: "usd-krw", horizon: "1W", metric: "directionalAccuracy", value: 100, baselineValue: 50, sampleSize: 1 }]);
}

describe("accuracy storage contract", () => {
  it("uses an explicit non-production in-memory fallback when DATABASE_URL is absent", () => {
    const store = createAccuracyStore("");

    expect(store.status()).toMatchObject({ mode: "memory-non-production", productionEvidence: false });
    expect(store.status().warnings.join(" ")).toContain("운영 정확도 증거가 아닙니다");
  });

  it("persists source runs, observations, forecasts, matches, evaluation runs and metrics", async () => {
    const store = new InMemoryAccuracyStore();
    await seedStore(store);

    expect(await store.listSourceRuns()).toEqual([sourceRun]);
    expect(await store.listObservations("usd-krw")).toEqual([observation]);
    expect(await store.listForecastTargets()).toEqual([target]);
    expect(await store.listMatchedObservations()).toEqual([match]);
    expect((await store.listEvaluationRuns())[0]).toMatchObject({ evaluationRunId: "eval-1", sourceRunIds: ["source-run-1"] });
    expect((await store.listMetricResults())[0]).toMatchObject({ metric: "directionalAccuracy", sampleSize: 1 });
  });

  it("preserves every required forecast-target ledger field through matched scoring", async () => {
    const store = new InMemoryAccuracyStore();
    await seedStore(store);
    const [storedMatch] = await store.listMatchedObservations();

    expect(storedMatch).toEqual(match);
    expect(Object.keys(storedMatch).sort()).toEqual([
      "baselineValue", "confidence", "documentId", "evaluatedAt", "evaluationState", "eventId", "forecastId", "horizon", "indicatorId", "issuedAt", "matchedObservationId", "metricVersion", "modelVersion", "observedDirection", "observedValue", "predictedDelta", "predictedDirection", "predictedValue", "sourceRunId", "sourceVersion", "targetDate",
    ].sort());
  });

  it("keeps schema creation in SQL migrations instead of runtime storage code", () => {
    const migrationSql = readdirSync("migrations").filter((file) => file.endsWith(".sql")).map((file) => readFileSync(join("migrations", file), "utf8")).join("\n");
    const storageRuntime = readdirSync("src/lib/storage").filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts")).map((file) => readFileSync(join("src/lib/storage", file), "utf8")).join("\n").toLowerCase();

    expect(migrationSql).toContain("create table if not exists accuracy_forecast_targets");
    expect(migrationSql).toContain("accuracy_metric_results");
    expect(storageRuntime).not.toContain("create table");
    expect(storageRuntime).not.toContain("alter table");
  });
});
