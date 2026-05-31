import { describe, expect, it } from "vitest";
import { createRelationship, type BacktestRunNode, type DocumentNode, type ForecastNode, type IndicatorNode, type KgEventNode, type SourceNode, type WeightNode } from "../domain/graph-types";
import { MemoryGraphStore } from "./memory-graph-store";

const source: SourceNode = {
  id: "source:gdeltdemo",
  kind: "source",
  sourceKind: "gdelt",
  name: "GDELT demo",
  homepageUrl: "https://www.gdeltproject.org/",
  freeTierOnly: true,
  paidRequiresApproval: true,
  reliabilityWeight: 0.7,
  createdAt: "2026-05-31T00:00:00.000Z",
};

const document: DocumentNode = {
  id: "document:chip-news",
  kind: "document",
  sourceId: source.id,
  externalId: "chip-news",
  title: "Chip controls pressure KRW",
  url: "https://example.com/chip-news",
  publishedAt: "2026-05-31T00:00:00.000Z",
  retrievedAt: "2026-05-31T00:01:00.000Z",
  language: "en",
  rawText: "Semiconductor export controls pressure the Korean won.",
  summary: "Chip export controls pressure KRW.",
  contentHash: "hash-chip-news",
  citation: "GDELT demo, 2026-05-31",
};

const event: KgEventNode = {
  id: "event:chip-controls",
  kind: "event",
  eventKind: "trade",
  label: "Chip export controls",
  occurredAt: "2026-05-31T00:00:00.000Z",
  region: "KR",
  sentiment: -1,
  magnitudeHint: 0.8,
  confidence: 0.72,
  tags: ["semiconductors", "exports"],
  evidenceDocumentIds: [document.id],
};

const indicator: IndicatorNode = {
  id: "usd-krw",
  kind: "indicator",
  label: "USD/KRW",
  unit: "KRW",
  frequency: "daily",
  source: "fixture",
  directionSemantics: "Higher means KRW weakness",
};

const backtest: BacktestRunNode = {
  id: "backtest:fixture-001",
  kind: "backtest-run",
  runAt: "2026-05-31T00:02:00.000Z",
  windowStart: "2026-01-01",
  windowEnd: "2026-05-30",
  targetIndicators: ["usd-krw"],
  horizons: ["1W"],
  metricSummary: { mae: 1.2, rmse: 1.5, smape: 8.4 },
  modelVersion: "fixture-v1",
  weightVersion: "weights-v1",
  dataCutoff: "2026-05-30",
};

const weight: WeightNode = {
  id: "weight:event-usdkrw-1w",
  kind: "weight",
  fromType: "event",
  fromId: event.id,
  toType: "indicator",
  toId: indicator.id,
  indicatorId: "usd-krw",
  horizon: "1W",
  weight: 0.64,
  confidence: 0.67,
  calibrationRunId: backtest.id,
  sampleSize: 12,
  mae: 1.2,
  rmse: 1.5,
  smape: 8.4,
  updatedAt: "2026-05-31T00:03:00.000Z",
};

const forecast: ForecastNode = {
  id: "forecast:usdkrw-chip-1w",
  kind: "forecast",
  generatedAt: "2026-05-31T00:04:00.000Z",
  indicatorId: "usd-krw",
  horizon: "1W",
  baselineValue: 1360,
  predictedDelta: 12,
  predictedMagnitude: 12,
  direction: "up",
  confidence: 0.66,
  modelVersion: "fixture-v1",
  evidencePathIds: [source.id, document.id, event.id, indicator.id, weight.id, backtest.id],
  limitations: ["Fixture-backed contract test"],
};

async function seedGraph(store: MemoryGraphStore) {
  await store.upsertSource(source);
  await store.upsertDocument(document);
  await store.upsertEvent(event);
  await store.upsertIndicator(indicator);
  await store.upsertBacktestRun(backtest);
  await store.upsertWeight(weight);
  await store.upsertForecast(forecast);
  await store.upsertRelationship(createRelationship("PUBLISHED", source.id, document.id));
  await store.upsertRelationship(createRelationship("EVIDENCES", document.id, event.id));
  await store.upsertRelationship(createRelationship("AFFECTS", event.id, indicator.id, { weightId: weight.id, horizon: "1W" }));
  await store.upsertRelationship(createRelationship("USES_WEIGHT", forecast.id, weight.id));
  await store.upsertRelationship(createRelationship("PREDICTS", forecast.id, indicator.id));
  await store.upsertRelationship(createRelationship("CITES", forecast.id, document.id));
  await store.upsertRelationship(createRelationship("CALIBRATED", backtest.id, weight.id));
}

describe("MemoryGraphStore contract", () => {
  it("stores and retrieves a forecast provenance path", async () => {
    const store = new MemoryGraphStore();
    await seedGraph(store);

    const path = await store.getForecastEvidencePath(forecast.id);

    expect(path.nodes.map((node) => node.id)).toEqual(expect.arrayContaining([source.id, document.id, event.id, indicator.id, weight.id, forecast.id, backtest.id]));
    expect(path.relationships.map((relationship) => relationship.type)).toEqual(expect.arrayContaining(["PUBLISHED", "EVIDENCES", "AFFECTS", "USES_WEIGHT", "PREDICTS", "CITES", "CALIBRATED"]));
  });

  it("round-trips graph snapshots for deterministic fixtures", async () => {
    const first = new MemoryGraphStore();
    await seedGraph(first);
    const snapshot = await first.exportSnapshot();

    const second = new MemoryGraphStore();
    await second.importSnapshot(snapshot);

    expect(await second.exportSnapshot()).toEqual(snapshot);
  });
});
