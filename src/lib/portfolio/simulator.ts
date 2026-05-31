import type { HypotheticalPosition, PortfolioScenarioNode } from "../domain/portfolio-types";
import { portfolioSimulationDisclaimer } from "../domain/portfolio-types";
import type { EventAnalysis, MacroIndicatorId } from "../types";

export const portfolioRouteCapabilities = [
  "hypothetical-scenario-simulation",
  "macro-basket-delta-estimate",
  "backtest-context-display",
] as const;

const assetIndicatorMap: Record<HypotheticalPosition["assetClass"], MacroIndicatorId> = {
  fx: "usd-krw",
  rates: "treasury-yield",
  "equity-index": "base-rate-expectation",
  cash: "m2-liquidity",
  custom: "usd-krw",
};

export const sampleHypotheticalPositions: HypotheticalPosition[] = [
  { label: "KRW receivable exposure", assetClass: "fx", notional: 1_000_000, sensitivity: -0.08 },
  { label: "Korea duration sleeve", assetClass: "rates", notional: 500_000, sensitivity: -0.12 },
  { label: "Liquidity reserve", assetClass: "cash", notional: 300_000, sensitivity: 0.05 },
];

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

export function simulateHypotheticalPortfolio(analysis: EventAnalysis, positions: HypotheticalPosition[] = sampleHypotheticalPositions): PortfolioScenarioNode {
  const estimatedDelta = positions.reduce((sum, position) => {
    const indicator = assetIndicatorMap[position.assetClass];
    const forecast = analysis.forecasts.find((item) => item.indicator === indicator);
    if (!forecast) return sum;
    return sum + position.notional * position.sensitivity * (forecast.impactScore / 100);
  }, 0);
  const confidence = analysis.forecasts.reduce((sum, forecast) => sum + forecast.confidence, 0) / Math.max(analysis.forecasts.length, 1);

  return {
    id: `portfolio-scenario:${analysis.event.id}`,
    kind: "portfolio-scenario",
    name: `Hypothetical macro basket simulation · ${analysis.event.title}`,
    createdAt: analysis.generatedAt,
    positions,
    assumptions: [
      "Position notionals are user-supplied hypothetical research inputs.",
      "Sensitivity values are simple scenario multipliers, not optimized allocations.",
      "No broker, execution, suitability, or personalized advisory workflow is implemented.",
    ],
    forecastIds: analysis.forecasts.flatMap((forecast) => forecast.forecasts.map((horizon) => `${forecast.indicator}:${horizon.horizon}`)),
    simulationResult: {
      estimatedDelta: round(estimatedDelta),
      confidence: round(confidence, 3),
      horizon: "basket-current",
    },
    disclaimer: portfolioSimulationDisclaimer,
  };
}

export function assertSimulationOnlyCapabilities(capabilities: readonly string[] = portfolioRouteCapabilities): void {
  const forbidden = [/broker/i, /order/i, /advice/i, /buy/i, /sell/i, /target[-\s]?price/i, /recommendation/i];
  const matched = capabilities.flatMap((capability) => forbidden.filter((pattern) => pattern.test(capability)).map((pattern) => `${capability}:${pattern}`));
  if (matched.length > 0) {
    throw new Error(`Portfolio route exposes non-simulation capabilities: ${matched.join(", ")}`);
  }
}
