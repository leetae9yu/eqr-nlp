import { describe, expect, it } from "vitest";
import { MemoryGraphStore } from "../kg/memory-graph-store";
import { calibrateBacktestWeights, seedBacktestCalibration } from "./calibrate-weights";
import { magnitudeMetrics, symmetricMeanAbsolutePercentageError } from "./metrics";

const zeroSafeExamples = [
  { eventId: "zero", eventKind: "macro", indicatorId: "usd-krw", horizon: "1D", predictedDelta: 0, actualDelta: 0 },
] as const;

describe("backtesting metrics and calibration", () => {
  it("computes magnitude metrics with zero-safe sMAPE", () => {
    expect(symmetricMeanAbsolutePercentageError([...zeroSafeExamples])).toBe(0);
    expect(magnitudeMetrics([
      { eventId: "a", eventKind: "trade", indicatorId: "usd-krw", horizon: "1W", predictedDelta: 10, actualDelta: 12 },
      { eventId: "b", eventKind: "trade", indicatorId: "usd-krw", horizon: "1W", predictedDelta: -5, actualDelta: -2 },
    ])).toMatchObject({ mae: 2.5, sampleSize: 2 });
  });

  it("calibrates weights from historical magnitude errors", () => {
    const bundle = calibrateBacktestWeights();

    expect(bundle.backtestRun.metricSummary.sampleSize).toBeGreaterThan(0);
    expect(bundle.weightNodes.length).toBeGreaterThan(0);
    expect(bundle.weightNodes.every((weight) => weight.calibrationRunId === bundle.backtestRun.id)).toBe(true);
    expect(bundle.weightNodes.every((weight) => weight.sampleSize > 0 && weight.rmse >= weight.mae)).toBe(true);
  });

  it("persists backtest metadata and calibrated weights in the graph", async () => {
    const graphStore = new MemoryGraphStore();
    const bundle = await seedBacktestCalibration(graphStore);
    const snapshot = await graphStore.exportSnapshot();

    expect(snapshot.nodes.map((node) => node.kind)).toEqual(expect.arrayContaining(["backtest-run", "weight"]));
    expect(snapshot.relationships.map((relationship) => relationship.type)).toEqual(expect.arrayContaining(["CALIBRATED", "USES_WEIGHT"]));
    expect(snapshot.nodes.find((node) => node.id === bundle.backtestRun.id)).toMatchObject({ metricSummary: expect.objectContaining({ sampleSize: expect.any(Number) }) });
  });
});
