import { FixtureKoreaFinanceMcpAdapter, type KoreaFinanceMcpAdapter } from "./mcp-adapter";
import { HORIZONS, MACRO_BASKET, type Direction, type EventAnalysis, type ForecastHorizon, type IndicatorForecast, type MacroIndicatorId, type MacroSnapshot, type NewsEvent } from "./types";

const horizonMultipliers: Record<ForecastHorizon, number> = {
  "1D": 0.65,
  "1W": 1,
  "1M": 1.35,
};

const indicatorSensitivity: Record<MacroIndicatorId, number> = {
  "usd-krw": 1.1,
  "base-rate-expectation": 0.82,
  "treasury-yield": 0.9,
  "m2-liquidity": 0.74,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toDirection(score: number): Direction {
  if (score > 0.18) return "up";
  if (score < -0.18) return "down";
  if (Math.abs(score) <= 0.06) return "flat";
  return "mixed";
}

function trend(snapshot: MacroSnapshot) {
  const diff = snapshot.latestValue - snapshot.previousValue;
  return snapshot.previousValue === 0 ? 0 : diff / Math.abs(snapshot.previousValue);
}

function rationaleFor(indicator: MacroIndicatorId, horizon: ForecastHorizon, direction: Direction) {
  const base = {
    "usd-krw": "FX sensitivity is driven by trade-balance and external-risk language in the event.",
    "base-rate-expectation": "Policy-rate expectation reacts to inflation, growth, and funding-stress clues.",
    "treasury-yield": "Treasury-yield impact reflects duration, inflation, and policy expectation channels.",
    "m2-liquidity": "Liquidity impact reflects credit, funding, and money-supply transmission clues.",
  }[indicator];

  return `${horizon} ${direction} case: ${base}`;
}

export async function analyzeEvent(
  event: NewsEvent,
  adapter: KoreaFinanceMcpAdapter = new FixtureKoreaFinanceMcpAdapter(),
): Promise<EventAnalysis> {
  const forecasts = await Promise.all(
    MACRO_BASKET.map(async (indicator): Promise<IndicatorForecast> => {
      const snapshot = await adapter.getMacroSnapshot(indicator);
      const eventSignal = event.macroSignals[indicator] ?? 0;
      const recentTrend = trend(snapshot);
      const baseImpact = clamp(eventSignal * indicatorSensitivity[indicator] + recentTrend * 8, -1, 1);
      const confidence = clamp(0.46 + Math.abs(eventSignal) * 0.32 + event.evidence.length * 0.04, 0.2, 0.91);
      const direction = toDirection(baseImpact);

      return {
        indicator,
        label: snapshot.label,
        unit: snapshot.unit,
        baseline: snapshot.latestValue,
        direction,
        impactScore: Number((baseImpact * 100).toFixed(1)),
        confidence: Number(confidence.toFixed(2)),
        evidence: [
          ...event.evidence,
          {
            label: snapshot.label,
            source: snapshot.source,
            url: "https://github.com/emceeKim/korea-finance-mcp",
            quote: `${snapshot.label} latest fixture is ${snapshot.latestValue} ${snapshot.unit} as of ${snapshot.asOf}.`,
          },
        ],
        uncertainty: [
          "Fixture data is used until a live korea-finance-mcp transport is configured.",
          "Scores are scenario aids for research demos, not investment recommendations.",
        ],
        series: snapshot.series,
        forecasts: HORIZONS.map((horizon) => {
          const impact = clamp(baseImpact * horizonMultipliers[horizon], -1, 1);
          const horizonDirection = toDirection(impact);
          return {
            horizon,
            direction: horizonDirection,
            impact: Number((impact * 100).toFixed(1)),
            confidence: Number(clamp(confidence - (horizon === "1M" ? 0.08 : horizon === "1W" ? 0.03 : 0), 0.1, 0.95).toFixed(2)),
            rationale: rationaleFor(indicator, horizon, horizonDirection),
          };
        }),
      };
    }),
  );

  return {
    event,
    generatedAt: "2026-05-31T00:00:00.000Z",
    forecasts,
    limitations: [
      "Low-friction public feeds and sample macro fixtures are used for v0 reproducibility.",
      "Legal/compliance review is deferred before any production monetization or advice-like positioning.",
    ],
  };
}
