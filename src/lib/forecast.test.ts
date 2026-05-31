import { describe, expect, it } from "vitest";
import { sampleEvents } from "./events";
import { analyzeEvent } from "./forecast";
import { HORIZONS, MACRO_BASKET } from "./types";
import { productBoundaries } from "./product-copy";

describe("forecast domain", () => {
  it("returns every macro basket indicator with all horizons", async () => {
    const analysis = await analyzeEvent(sampleEvents[0]);

    expect(analysis.forecasts.map((forecast) => forecast.indicator)).toEqual([...MACRO_BASKET]);
    for (const forecast of analysis.forecasts) {
      expect(forecast.forecasts.map((horizon) => horizon.horizon)).toEqual([...HORIZONS]);
      expect(forecast.evidence.length).toBeGreaterThanOrEqual(2);
      expect(forecast.uncertainty.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic for a fixed event", async () => {
    const first = await analyzeEvent(sampleEvents[1]);
    const second = await analyzeEvent(sampleEvents[1]);

    expect(second).toEqual(first);
  });

  it("includes graph path and backtest calibration context when available", async () => {
    const analysis = await analyzeEvent(sampleEvents[0]);
    const calibratedHorizons = analysis.forecasts.flatMap((forecast) => forecast.forecasts.filter((horizon) => horizon.calibration));

    expect(analysis.forecasts.every((forecast) => forecast.graphEvidencePath?.relationshipTypes.includes("CALIBRATED"))).toBe(true);
    expect(calibratedHorizons.length).toBeGreaterThan(0);
    expect(calibratedHorizons[0].calibration).toMatchObject({
      runId: expect.stringContaining("backtest:"),
      sampleSize: expect.any(Number),
      mae: expect.any(Number),
      rmse: expect.any(Number),
      smape: expect.any(Number),
    });
  });

  it("keeps structured product boundaries out of trading tooling", () => {
    const copy = productBoundaries.join(" ").toLowerCase();

    expect(copy).toContain("no order execution");
    expect(copy).toContain("portfolio management");
    expect(copy).not.toContain("buy signal");
    expect(copy).not.toContain("sell signal");
    expect(copy).not.toContain("target price");
  });
});
