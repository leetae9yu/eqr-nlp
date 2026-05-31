import type { NewsEvent } from "./types";

export const sampleEvents: NewsEvent[] = [
  {
    id: "chip-export-controls",
    title: "Export-control headlines lift Korea FX and rate sensitivity",
    source: "Public feed sample",
    publishedAt: "2026-05-29T08:30:00Z",
    region: "KR",
    summary:
      "A low-friction public news feed reports renewed export-control pressure in semiconductors, raising sensitivity around Korea's trade balance and policy-rate expectations.",
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
        label: "Trade-sensitive headline",
        source: "Public feed sample",
        url: "https://example.com/public-feed/chip-export-controls",
        quote: "Export-control risk increased for Korea's semiconductor supply chain.",
      },
    ],
  },
  {
    id: "energy-import-costs",
    title: "Oil import-cost shock revives inflation and liquidity concerns",
    source: "RSS fixture",
    publishedAt: "2026-05-28T22:10:00Z",
    region: "Global",
    summary:
      "Energy import prices rise after supply disruption headlines, creating a cross-current for USD/KRW, yields, and liquidity expectations.",
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
        label: "Energy price shock",
        source: "RSS fixture",
        url: "https://example.com/rss/energy-import-costs",
        quote: "Higher oil import costs can pressure inflation and external balances.",
      },
    ],
  },
  {
    id: "liquidity-support-package",
    title: "Liquidity-support package lowers near-term funding stress",
    source: "GDELT-like fixture",
    publishedAt: "2026-05-27T02:45:00Z",
    region: "KR",
    summary:
      "A policy support package points to easier liquidity conditions while leaving rate expectations mixed across horizons.",
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
        label: "Policy liquidity support",
        source: "GDELT-like fixture",
        url: "https://example.com/gdelt/liquidity-support-package",
        quote: "Liquidity facilities reduce short-term funding pressure.",
      },
    ],
  },
];

export function getEventById(id: string) {
  return sampleEvents.find((event) => event.id === id);
}
