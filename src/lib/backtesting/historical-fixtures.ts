import type { BacktestExample } from "../domain/backtest-types";

export const historicalBacktestExamples: BacktestExample[] = [
  { eventId: "hist:chip-controls-2025-11", eventKind: "trade", indicatorId: "usd-krw", horizon: "1W", predictedDelta: 9.2, actualDelta: 11.4 },
  { eventId: "hist:export-guidance-2026-01", eventKind: "trade", indicatorId: "usd-krw", horizon: "1W", predictedDelta: 7.1, actualDelta: 6.3 },
  { eventId: "hist:tariff-risk-2026-03", eventKind: "trade", indicatorId: "usd-krw", horizon: "1W", predictedDelta: 5.6, actualDelta: 7.8 },
  { eventId: "hist:liquidity-facility-2025-12", eventKind: "liquidity", indicatorId: "m2-liquidity", horizon: "1M", predictedDelta: 0.32, actualDelta: 0.41 },
  { eventId: "hist:credit-easing-2026-02", eventKind: "liquidity", indicatorId: "m2-liquidity", horizon: "1M", predictedDelta: 0.25, actualDelta: 0.2 },
  { eventId: "hist:funding-stress-2026-04", eventKind: "liquidity", indicatorId: "m2-liquidity", horizon: "1M", predictedDelta: -0.22, actualDelta: -0.35 },
  { eventId: "hist:inflation-print-2025-10", eventKind: "inflation", indicatorId: "treasury-yield", horizon: "1W", predictedDelta: 0.06, actualDelta: 0.08 },
  { eventId: "hist:oil-shock-2026-01", eventKind: "inflation", indicatorId: "treasury-yield", horizon: "1W", predictedDelta: 0.09, actualDelta: 0.11 },
  { eventId: "hist:cpi-miss-2026-03", eventKind: "inflation", indicatorId: "base-rate-expectation", horizon: "1W", predictedDelta: -4.5, actualDelta: -3.8 },
  { eventId: "hist:bok-minutes-2026-04", eventKind: "rates", indicatorId: "base-rate-expectation", horizon: "1W", predictedDelta: 3.6, actualDelta: 4.2 },
  { eventId: "hist:yield-auction-2026-02", eventKind: "rates", indicatorId: "treasury-yield", horizon: "1D", predictedDelta: 0.03, actualDelta: 0.02 },
  { eventId: "hist:zero-control", eventKind: "macro", indicatorId: "usd-krw", horizon: "1D", predictedDelta: 0, actualDelta: 0 },
];
