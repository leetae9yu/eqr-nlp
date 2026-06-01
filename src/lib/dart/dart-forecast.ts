import type { DocumentNode, EventKind, KgEventNode } from "../domain/graph-types";
import type { PromotionDecision } from "../domain/ontology-types";
import { RuleBasedExtractor } from "../extraction/rule-based-extractor";
import { analyzeEvent } from "../forecast";
import { promotionStatusLabelKo } from "../korean-labels";
import { buildOntologyPromotionPackage } from "../ontology/ontology-factory";
import { OpenDartAdapter } from "../sources/dart-adapter";
import { clampLimit, type FetchDocumentsInput, type FetchDocumentsResult } from "../sources/source-types";
import type { EventAnalysis, MacroIndicatorId, NewsEvent } from "../types";

function sentimentToSignal(sentiment: KgEventNode["sentiment"], magnitudeHint: number, baseScore: number) {
  const sign = sentiment === 0 ? 1 : Math.sign(sentiment);
  return Number((sign * Math.max(baseScore, magnitudeHint * 0.6, 0.18)).toFixed(2));
}

function baseDisclosureSignal(eventKind: EventKind): Partial<Record<MacroIndicatorId, number>> {
  if (eventKind === "disclosure") return { "usd-krw": 0.18, "treasury-yield": 0.12 };
  return {};
}

export async function documentToForecastEvent(document: DocumentNode, promotion?: PromotionDecision): Promise<NewsEvent> {
  const extractor = new RuleBasedExtractor();
  const extraction = await extractor.extract(document);
  const event = extraction.events[0];
  const macroSignals: Partial<Record<MacroIndicatorId, number>> = { ...baseDisclosureSignal(event?.eventKind ?? "disclosure") };

  for (const [indicator, score] of Object.entries(extraction.indicatorHints) as Array<[MacroIndicatorId, number]>) {
    macroSignals[indicator] = sentimentToSignal(event?.sentiment ?? 0, event?.magnitudeHint ?? 0, score);
  }

  return {
    id: `dart-${document.externalId}`,
    title: document.title,
    source: "OpenDART 실시간 공시",
    publishedAt: document.publishedAt,
    region: "KR",
    summary: `${document.summary} · 온톨로지 상태: ${promotionStatusLabelKo(promotion?.status ?? "candidate")}`,
    url: document.url,
    tags: ["DART", event?.eventKind ?? "disclosure", promotion?.status ?? "candidate", ...Object.keys(macroSignals)],
    sentiment: event?.sentiment ?? 0,
    macroSignals,
    evidence: [
      {
        label: document.title,
        source: "OpenDART",
        url: document.url,
        quote: document.citation,
      },
    ],
  };
}

export type DartForecastBundle = {
  sourceResult: FetchDocumentsResult;
  analyses: EventAnalysis[];
  promotions: PromotionDecision[];
  warnings: string[];
};

export async function getDartForecastBundle(input: FetchDocumentsInput = {}): Promise<DartForecastBundle> {
  const adapter = new OpenDartAdapter();
  const limit = clampLimit(input.limit, 25);
  const sourceResult = await adapter.fetchDocuments({ ...input, limit });
  const ontologyPack = await buildOntologyPromotionPackage(sourceResult.documents, "eqr-dart-forecast-pack");
  const promotionByEvidenceSlug = new Map(
    ontologyPack.promotions.map((promotion) => [promotion.claimId.replace(/^ontology-claim:/, ""), promotion]),
  );
  const forecastDocuments = sourceResult.documents
    .filter((document) => {
      const promotion = promotionByEvidenceSlug.get(document.id.replace(/^document:/, ""));
      return !promotion || promotion.status !== "rejected";
    })
    .slice(0, limit);
  const generatedAt = new Date().toISOString();
  const analyses = await Promise.all(
    forecastDocuments.map(async (document) => {
      const promotion = promotionByEvidenceSlug.get(document.id.replace(/^document:/, ""));
      const analysis = await analyzeEvent(await documentToForecastEvent(document, promotion));
      return { ...analysis, generatedAt };
    }),
  );

  return {
    sourceResult,
    analyses,
    promotions: ontologyPack.promotions,
    warnings: [
      ...sourceResult.warnings,
      ...ontologyPack.qualityReport.missingContextCandidates.map((claimId) => `승격 보류: ${claimId}`),
    ],
  };
}
