import { calibrateBacktestWeights } from "./backtesting/calibrate-weights";
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

function inferEventKind(event: NewsEvent) {
  const text = `${event.title} ${event.summary} ${event.tags.join(" ")}`.toLowerCase();
  if (text.includes("liquidity") || text.includes("funding")) return "liquidity";
  if (text.includes("inflation") || text.includes("oil") || text.includes("energy")) return "inflation";
  if (text.includes("rate") || text.includes("yield")) return "rates";
  if (text.includes("export") || text.includes("trade") || text.includes("semiconductor")) return "trade";
  if (text.includes("fx") || text.includes("krw") || text.includes("won")) return "fx";
  return "macro";
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
  const calibration = calibrateBacktestWeights();
  const eventKind = inferEventKind(event);

  const forecasts = await Promise.all(
    MACRO_BASKET.map(async (indicator): Promise<IndicatorForecast> => {
      const snapshot = await adapter.getMacroSnapshot(indicator);
      const eventSignal = event.macroSignals[indicator] ?? 0;
      const recentTrend = trend(snapshot);
      const baseImpact = clamp(eventSignal * indicatorSensitivity[indicator] + recentTrend * 8, -1, 1);
      const confidence = clamp(0.46 + Math.abs(eventSignal) * 0.32 + event.evidence.length * 0.04, 0.2, 0.91);
      const direction = toDirection(baseImpact);

      const indicatorWeights = calibration.weightNodes.filter((weight) => weight.indicatorId === indicator);
      const calibrationEvidence = indicatorWeights[0]
        ? [{
            label: `Backtest calibration ${calibration.backtestRun.weightVersion}`,
            source: "Fixture historical backtest",
            url: "https://github.com/leetae9yu/eqr-nlp",
            quote: `${indicatorWeights[0].sampleSize} samples; MAE ${indicatorWeights[0].mae}, RMSE ${indicatorWeights[0].rmse}, sMAPE ${indicatorWeights[0].smape}%.`,
          }]
        : [];

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
          ...calibrationEvidence,
        ],
        graphEvidencePath: {
          nodeIds: [`source:${event.source.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, `event:${event.id}`, indicator, ...indicatorWeights.map((weight) => weight.id), calibration.backtestRun.id],
          relationshipTypes: ["PUBLISHED", "EVIDENCES", "AFFECTS", "CALIBRATED"],
          citations: event.evidence.map((item) => item.url),
        },
        uncertainty: [
          "Fixture data is used until a live korea-finance-mcp transport is configured.",
          "Scores are scenario aids for research demos, not investment recommendations.",
          "Backtest metrics use deterministic fixture history until real historical market-data backfills are connected.",
        ],
        series: snapshot.series,
        forecasts: HORIZONS.map((horizon) => {
          const calibratedWeight = calibration.weightNodes.find((weight) => weight.indicatorId === indicator && weight.horizon === horizon && weight.fromId === `event-kind:${eventKind}`)
            ?? calibration.weightNodes.find((weight) => weight.indicatorId === indicator && weight.horizon === horizon);
          const weightMultiplier = calibratedWeight ? calibratedWeight.weight : 1;
          const impact = clamp(baseImpact * horizonMultipliers[horizon] * weightMultiplier, -1, 1);
          const horizonDirection = toDirection(impact);
          return {
            horizon,
            direction: horizonDirection,
            impact: Number((impact * 100).toFixed(1)),
            confidence: Number(clamp((confidence - (horizon === "1M" ? 0.08 : horizon === "1W" ? 0.03 : 0)) * (calibratedWeight?.confidence ?? 1), 0.1, 0.95).toFixed(2)),
            rationale: `${rationaleFor(indicator, horizon, horizonDirection)}${calibratedWeight ? ` Backtest weight ${calibratedWeight.weight} from ${calibratedWeight.sampleSize} samples.` : " No exact calibrated weight exists for this fixture horizon yet."}`,
            calibration: calibratedWeight ? {
              runId: calibratedWeight.calibrationRunId,
              weightId: calibratedWeight.id,
              weight: calibratedWeight.weight,
              sampleSize: calibratedWeight.sampleSize,
              mae: calibratedWeight.mae,
              rmse: calibratedWeight.rmse,
              smape: calibratedWeight.smape,
            } : undefined,
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
