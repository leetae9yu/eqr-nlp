export type HypotheticalPosition = {
  label: string;
  assetClass: "fx" | "rates" | "equity-index" | "cash" | "custom";
  notional: number;
  sensitivity: number;
};

export type PortfolioScenarioNode = {
  id: string;
  kind: "portfolio-scenario";
  name: string;
  createdAt: string;
  positions: HypotheticalPosition[];
  assumptions: string[];
  forecastIds: string[];
  simulationResult: {
    estimatedDelta: number;
    confidence: number;
    horizon: string;
  };
  disclaimer: string;
};

export const portfolioSimulationDisclaimer =
  "Hypothetical scenario simulation for research only. It is not investment advice, order execution, portfolio management, a recommendation, a buy/sell signal, or a target price.";
