import type { NewsEvent } from "./types";

export const sampleEvents: NewsEvent[] = [
  {
    id: "chip-export-controls",
    title: "수출통제 헤드라인이 한국 환율·금리 민감도를 높임",
    source: "공개 피드 샘플",
    publishedAt: "2026-05-29T08:30:00Z",
    region: "KR",
    summary:
      "저마찰 공개 피드가 반도체 수출통제 압력 재부각을 보도하면서 한국 무역수지와 정책금리 기대 민감도를 높입니다.",
    url: "https://example.com/public-feed/chip-export-controls",
    tags: ["semiconductors", "exports", "fx", "rates"],
    sentiment: -1,
    macroSignals: {
      "usd-krw": 0.82,
      "base-rate-expectation": -0.34,
      "treasury-yield": 0.28,
      "m2-liquidity": -0.12,
    },
    evidence: [
      {
        label: "무역 민감 헤드라인",
        source: "공개 피드 샘플",
        url: "https://example.com/public-feed/chip-export-controls",
        quote: "한국 반도체 공급망의 수출통제 리스크가 증가했습니다.",
      },
    ],
  },
  {
    id: "energy-import-costs",
    title: "유가 수입비용 충격이 물가·유동성 우려를 재점화",
    source: "RSS 샘플",
    publishedAt: "2026-05-28T22:10:00Z",
    region: "Global",
    summary:
      "공급 차질 헤드라인 이후 에너지 수입 가격이 상승하면서 USD/KRW, 금리, 유동성 기대에 복합 영향을 줍니다.",
    url: "https://example.com/rss/energy-import-costs",
    tags: ["energy", "inflation", "imports", "liquidity"],
    sentiment: -2,
    macroSignals: {
      "usd-krw": 0.65,
      "base-rate-expectation": 0.46,
      "treasury-yield": 0.58,
      "m2-liquidity": -0.3,
    },
    evidence: [
      {
        label: "에너지 가격 충격",
        source: "RSS 샘플",
        url: "https://example.com/rss/energy-import-costs",
        quote: "유가 수입비용 상승은 물가와 대외수지에 압력을 줄 수 있습니다.",
      },
    ],
  },
  {
    id: "liquidity-support-package",
    title: "유동성 지원 패키지가 단기 자금조달 스트레스를 낮춤",
    source: "GDELT 유사 샘플",
    publishedAt: "2026-05-27T02:45:00Z",
    region: "KR",
    summary:
      "정책 지원 패키지는 유동성 여건 완화를 시사하지만 기간별 금리 기대는 혼조입니다.",
    url: "https://example.com/gdelt/liquidity-support-package",
    tags: ["policy", "liquidity", "funding", "rates"],
    sentiment: 1,
    macroSignals: {
      "usd-krw": -0.25,
      "base-rate-expectation": -0.2,
      "treasury-yield": -0.18,
      "m2-liquidity": 0.76,
    },
    evidence: [
      {
        label: "정책 유동성 지원",
        source: "GDELT 유사 샘플",
        url: "https://example.com/gdelt/liquidity-support-package",
        quote: "유동성 공급 장치는 단기 자금조달 압력을 낮춥니다.",
      },
    ],
  },
];

export function getEventById(id: string) {
  return sampleEvents.find((event) => event.id === id);
}
