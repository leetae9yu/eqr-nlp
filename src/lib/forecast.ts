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
    "usd-krw": "환율 민감도는 무역수지, 외부 위험, 원화/달러 관련 표현에 반응합니다.",
    "base-rate-expectation": "기준금리 기대는 물가, 성장, 자금조달 스트레스 단서에 반응합니다.",
    "treasury-yield": "국고채 금리 영향은 듀레이션, 물가, 정책금리 기대 경로를 반영합니다.",
    "m2-liquidity": "유동성 영향은 신용, 자금조달, 통화량 전이 단서를 반영합니다.",
  }[indicator];

  return `${horizon} ${direction} 시나리오: ${base}`;
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
            label: `백테스트 보정 ${calibration.backtestRun.weightVersion}`,
            source: "Fixture 과거 백테스트",
            url: "https://github.com/leetae9yu/eqr-nlp",
            quote: `${indicatorWeights[0].sampleSize}개 샘플; MAE ${indicatorWeights[0].mae}, RMSE ${indicatorWeights[0].rmse}, sMAPE ${indicatorWeights[0].smape}%.`,
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
            quote: `${snapshot.label} 샘플 최신값은 ${snapshot.asOf} 기준 ${snapshot.latestValue} ${snapshot.unit}입니다.`,
          },
          ...calibrationEvidence,
        ],
        graphEvidencePath: {
          nodeIds: [`source:${event.source.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, `event:${event.id}`, indicator, ...indicatorWeights.map((weight) => weight.id), calibration.backtestRun.id],
          relationshipTypes: ["PUBLISHED", "EVIDENCES", "AFFECTS", "CALIBRATED"],
          citations: event.evidence.map((item) => item.url),
        },
        uncertainty: [
          "실시간 korea-finance-mcp 전송 계층이 연결되기 전까지 매크로 스냅샷은 fixture를 사용합니다.",
          "점수는 리서치 데모용 시나리오 보조 지표이며 투자 추천이 아닙니다.",
          "실제 과거 market-data backfill이 연결되기 전까지 백테스트 지표는 결정론적 fixture 이력을 사용합니다.",
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
            rationale: `${rationaleFor(indicator, horizon, horizonDirection)}${calibratedWeight ? ` 백테스트 가중치 ${calibratedWeight.weight}, 샘플 ${calibratedWeight.sampleSize}개.` : " 이 fixture 기간에 정확히 매칭되는 보정 가중치는 아직 없습니다."}`,
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
      "v0 재현성을 위해 저마찰 공개 피드와 샘플 매크로 fixture를 사용합니다.",
      "프로덕션/수익화/자문형 포지셔닝 전 법무·컴플라이언스 검토가 필요합니다.",
    ],
  };
}
