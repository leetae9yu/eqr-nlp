import { describe, expect, it } from "vitest";
import { sampleEvents } from "../events";
import { analyzeEvent } from "../forecast";
import { portfolioSimulationDisclaimer } from "../domain/portfolio-types";
import { assertSimulationOnlyCapabilities, portfolioRouteCapabilities, simulateHypotheticalPortfolio } from "./simulator";

describe("portfolio simulation guardrails", () => {
  it("simulates a hypothetical basket without creating trading instructions", async () => {
    const analysis = await analyzeEvent(sampleEvents[0]);
    const scenario = simulateHypotheticalPortfolio(analysis);

    expect(scenario.kind).toBe("portfolio-scenario");
    expect(scenario.positions.length).toBeGreaterThan(0);
    expect(scenario.simulationResult.estimatedDelta).toEqual(expect.any(Number));
    expect(scenario.disclaimer.toLowerCase()).toContain("hypothetical scenario simulation");
  });

  it("keeps route capabilities free of broker/order/advice/recommendation verbs", () => {
    expect(() => assertSimulationOnlyCapabilities()).not.toThrow();
    expect(portfolioRouteCapabilities.join(" ")).toContain("hypothetical-scenario-simulation");
  });

  it("states prohibited activities only as exclusions in the disclaimer", () => {
    const copy = portfolioSimulationDisclaimer.toLowerCase();

    expect(copy).toContain("not investment advice");
    expect(copy).toContain("order execution");
    expect(copy).toContain("buy/sell signal");
  });
});
