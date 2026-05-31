export const MACRO_BASKET = [
  "usd-krw",
  "base-rate-expectation",
  "treasury-yield",
  "m2-liquidity",
] as const;

export type MacroIndicatorId = (typeof MACRO_BASKET)[number];

export const HORIZONS = ["1D", "1W", "1M"] as const;
export type ForecastHorizon = (typeof HORIZONS)[number];

export type Direction = "up" | "down" | "mixed" | "flat";

export type Evidence = {
  label: string;
  source: string;
  url: string;
  quote: string;
};

export type NewsEvent = {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  region: "KR" | "Global";
  summary: string;
  url: string;
  tags: string[];
  sentiment: -2 | -1 | 0 | 1 | 2;
  macroSignals: Partial<Record<MacroIndicatorId, number>>;
  evidence: Evidence[];
};

export type MacroSnapshot = {
  indicator: MacroIndicatorId;
  label: string;
  unit: string;
  latestValue: number;
  previousValue: number;
  asOf: string;
  source: string;
  series: Array<{ date: string; value: number }>;
};

export type CalibrationContext = {
  runId: string;
  weightId: string;
  weight: number;
  sampleSize: number;
  mae: number;
  rmse: number;
  smape: number;
};

export type HorizonForecast = {
  horizon: ForecastHorizon;
  direction: Direction;
  impact: number;
  confidence: number;
  rationale: string;
  calibration?: CalibrationContext;
};

export type GraphEvidencePath = {
  nodeIds: string[];
  relationshipTypes: string[];
  citations: string[];
};

export type IndicatorForecast = {
  indicator: MacroIndicatorId;
  label: string;
  unit: string;
  baseline: number;
  direction: Direction;
  impactScore: number;
  confidence: number;
  forecasts: HorizonForecast[];
  evidence: Evidence[];
  graphEvidencePath?: GraphEvidencePath;
  uncertainty: string[];
  series: Array<{ date: string; value: number }>;
};

export type EventAnalysis = {
  event: NewsEvent;
  generatedAt: string;
  forecasts: IndicatorForecast[];
  limitations: string[];
};
