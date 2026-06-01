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
  "가상 시나리오 시뮬레이션 전용입니다. 투자자문, 주문 실행, 포트폴리오 관리, 추천, 매수/매도 신호, 목표가는 제공하지 않습니다.";
