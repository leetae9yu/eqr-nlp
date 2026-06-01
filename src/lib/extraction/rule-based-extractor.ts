import type { DocumentNode, EntityNode, EventKind, KgEventNode } from "../domain/graph-types";
import type { MacroIndicatorId } from "../types";
import type { ExtractionProvider, ExtractionResult } from "./extraction-provider";

const indicatorRules: Array<{ indicator: MacroIndicatorId; terms: string[]; score: number }> = [
  { indicator: "usd-krw", terms: ["fx", "foreign exchange", "won", "krw", "dollar", "trade", "export", "환율", "원화", "달러", "수출", "수입", "무역"], score: 0.55 },
  { indicator: "base-rate-expectation", terms: ["rate", "policy", "inflation", "bank of korea", "central bank", "금리", "기준금리", "정책", "인플레이션", "물가", "한국은행"], score: 0.45 },
  { indicator: "treasury-yield", terms: ["yield", "bond", "duration", "treasury", "rates", "국고채", "채권", "수익률", "장기금리"], score: 0.42 },
  { indicator: "m2-liquidity", terms: ["liquidity", "credit", "funding", "money supply", "m2", "유동성", "자금", "신용", "차입", "대출"], score: 0.5 },
];

const eventRules: Array<{ kind: EventKind; terms: string[] }> = [
  { kind: "disclosure", terms: ["disclosure", "filing", "dart", "report", "공시", "보고서", "사업보고서", "분기보고서"] },
  { kind: "policy", terms: ["policy", "government", "support", "facility", "정책", "정부", "지원"] },
  { kind: "trade", terms: ["export", "import", "trade", "semiconductor", "수출", "수입", "무역", "반도체"] },
  { kind: "inflation", terms: ["inflation", "oil", "energy", "price", "인플레이션", "물가", "유가", "에너지", "가격"] },
  { kind: "liquidity", terms: ["liquidity", "funding", "credit", "유동성", "자금", "신용"] },
  { kind: "rates", terms: ["rate", "yield", "bond", "금리", "채권", "국고채"] },
  { kind: "fx", terms: ["fx", "won", "krw", "dollar", "환율", "원화", "달러"] },
];

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function entityFromKeyword(document: DocumentNode, keyword: string, entityKind: EntityNode["entityKind"]): EntityNode {
  const id = `entity:${keyword.toLowerCase().replace(/[^a-z0-9가-힣]+/gi, "-")}`;
  return {
    id,
    kind: "entity",
    entityKind,
    name: keyword,
    aliases: [keyword],
    identifiers: {},
    country: keyword === "Korea" ? "KR" : undefined,
    metadata: { sourceDocumentId: document.id },
  };
}

export class RuleBasedExtractor implements ExtractionProvider {
  async extract(document: DocumentNode): Promise<ExtractionResult> {
    const text = `${document.title} ${document.summary} ${document.rawText}`.toLowerCase();
    const indicatorHints: Partial<Record<MacroIndicatorId, number>> = {};
    for (const rule of indicatorRules) {
      if (includesAny(text, rule.terms)) indicatorHints[rule.indicator] = rule.score;
    }

    const eventKind = eventRules.find((rule) => includesAny(text, rule.terms))?.kind ?? "macro";
    const sentiment: KgEventNode["sentiment"] = text.includes("support") || text.includes("easing") || text.includes("지원") || text.includes("완화") ? 1 : text.includes("shock") || text.includes("pressure") || text.includes("충격") || text.includes("압력") ? -1 : 0;
    const event: KgEventNode = {
      id: `event:${document.id.replace(/^document:/, "")}`,
      kind: "event",
      eventKind,
      label: document.title,
      occurredAt: document.publishedAt,
      region: text.includes("korea") || text.includes("krw") || document.language === "ko" ? "KR" : "Global",
      sentiment,
      magnitudeHint: Math.min(1, Object.keys(indicatorHints).length / 4),
      confidence: 0.58 + Math.min(0.25, Object.keys(indicatorHints).length * 0.05),
      tags: [eventKind, ...Object.keys(indicatorHints)],
      evidenceDocumentIds: [document.id],
    };

    const entities: EntityNode[] = [];
    if (text.includes("korea") || text.includes("krw") || text.includes("한국") || text.includes("원화")) entities.push(entityFromKeyword(document, "Korea", "country"));
    if (text.includes("semiconductor") || text.includes("반도체")) entities.push(entityFromKeyword(document, "Semiconductors", "sector"));
    if (text.includes("oil") || text.includes("energy") || text.includes("유가") || text.includes("에너지")) entities.push(entityFromKeyword(document, "Energy", "commodity"));
    if (document.sourceId.includes("opendart")) entities.push(entityFromKeyword(document, document.title.split(":")[0] || "DART company", "company"));

    return { document, entities, events: [event], indicatorHints, warnings: [] };
  }
}
