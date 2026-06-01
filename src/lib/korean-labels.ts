import type { PromotionStatus } from "./domain/ontology-types";
import type { Direction, ForecastHorizon, MacroIndicatorId } from "./types";

export function indicatorLabelKo(indicator: MacroIndicatorId): string {
  return {
    "usd-krw": "달러/원 환율",
    "base-rate-expectation": "기준금리 기대",
    "treasury-yield": "국고채 금리",
    "m2-liquidity": "M2 유동성",
  }[indicator];
}

export function directionLabelKo(direction: Direction): string {
  return {
    up: "상승",
    down: "하락",
    flat: "보합",
    mixed: "혼조",
  }[direction];
}

export function horizonLabelKo(horizon: ForecastHorizon): string {
  return {
    "1D": "1일",
    "1W": "1주",
    "1M": "1개월",
  }[horizon];
}


export function promotionStatusLabelKo(status: PromotionStatus | "candidate"): string {
  return {
    candidate: "후보",
    validated: "검증",
    promoted: "승격",
    rejected: "거절",
  }[status];
}
