import type { DocumentNode, KgEventNode } from "../domain/graph-types";
import type { ClaimNode, EvidenceNode, OntologyPromotionPackage, PromotionDecision, QualityGateResult, QualityReport } from "../domain/ontology-types";
import { RuleBasedExtractor } from "../extraction/rule-based-extractor";

const FACTORY_VERSION = "eqr-opencrab-inspired-v1" as const;

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

function evidenceId(document: DocumentNode) {
  return `ontology-evidence:${document.id.replace(/^document:/, "")}`;
}

function claimId(document: DocumentNode) {
  return `ontology-claim:${document.id.replace(/^document:/, "")}`;
}

function promotionId(document: DocumentNode) {
  return `ontology-promotion:${document.id.replace(/^document:/, "")}`;
}

export function buildEvidenceNode(document: DocumentNode): EvidenceNode {
  return {
    id: evidenceId(document),
    kind: "ontology-evidence",
    space: "evidence",
    documentId: document.id,
    sourceId: document.sourceId,
    url: document.url,
    contentHash: document.contentHash,
    capturedAt: document.retrievedAt,
    parserStatus: document.rawText.trim().length > 0 ? "parsed" : "partial",
    coverage: {
      hasStableId: Boolean(document.externalId || document.id),
      hasSourceUrl: document.url.startsWith("http"),
      hasContentHash: document.contentHash.length > 0,
      hasTimestamp: !Number.isNaN(Date.parse(document.publishedAt)),
    },
  };
}

export async function buildClaimNode(document: DocumentNode, extractor = new RuleBasedExtractor()): Promise<{ claim: ClaimNode; event?: KgEventNode }> {
  const extraction = await extractor.extract(document);
  const event = extraction.events[0];
  const evidence = buildEvidenceNode(document);
  const hints = extraction.indicatorHints;
  const hintLabels = Object.entries(hints).map(([indicator, score]) => `${indicator}=${score}`).join(", ") || "no indicator hint";

  return {
    event,
    claim: {
      id: claimId(document),
      kind: "ontology-claim",
      space: "claim",
      statement: `${document.title} implies ${event?.eventKind ?? "macro"} impact candidates: ${hintLabels}.`,
      evidenceIds: [evidence.id],
      eventKind: event?.eventKind ?? "unknown",
      indicatorHints: hints,
      confidence: event?.confidence ?? 0,
      extractedAt: new Date().toISOString(),
    },
  };
}

export function evaluateQualityGates(document: DocumentNode, evidence: EvidenceNode, claim: ClaimNode, seenContentHashes: Set<string>): QualityGateResult[] {
  const duplicate = seenContentHashes.has(document.contentHash);
  return [
    { gate: "stable-id", passed: evidence.coverage.hasStableId, detail: evidence.coverage.hasStableId ? "Document has stable id." : "Missing stable id." },
    { gate: "content-hash", passed: evidence.coverage.hasContentHash, detail: evidence.coverage.hasContentHash ? "Document has content hash." : "Missing content hash." },
    { gate: "source-url", passed: evidence.coverage.hasSourceUrl, detail: evidence.coverage.hasSourceUrl ? "Document has source URL." : "Missing source URL." },
    { gate: "indicator-hint", passed: Object.keys(claim.indicatorHints).length > 0, detail: Object.keys(claim.indicatorHints).length > 0 ? "At least one macro indicator hint extracted." : "No macro indicator hint extracted." },
    { gate: "confidence", passed: claim.confidence >= 0.55, detail: `Claim confidence ${claim.confidence.toFixed(2)}.` },
    { gate: "duplicate", passed: !duplicate, detail: duplicate ? "Duplicate content hash." : "Content hash not seen earlier in this package." },
  ];
}

export function decidePromotion(document: DocumentNode, claim: ClaimNode, gates: QualityGateResult[], event?: KgEventNode): PromotionDecision {
  const failed = gates.filter((gate) => !gate.passed);
  const base = {
    id: promotionId(document),
    kind: "ontology-promotion" as const,
    claimId: claim.id,
    gateResults: gates,
    decidedAt: new Date().toISOString(),
  };

  if (failed.some((gate) => gate.gate === "stable-id" || gate.gate === "content-hash" || gate.gate === "duplicate")) {
    return { ...base, status: "rejected", rejectionReason: failed.map((gate) => gate.detail).join(" ") };
  }

  if (failed.length > 0) {
    return { ...base, status: "validated" };
  }

  return { ...base, status: "promoted", promotedEventId: event?.id };
}

function toJsonl(items: unknown[]) {
  return items.map((item) => JSON.stringify(item)).join("\n") + (items.length ? "\n" : "");
}

export function buildQualityReport(evidence: EvidenceNode[], claims: ClaimNode[], promotions: PromotionDecision[]): QualityReport {
  const gateResults = promotions.flatMap((promotion) => promotion.gateResults);
  return {
    generatedAt: new Date().toISOString(),
    totalEvidence: evidence.length,
    totalClaims: claims.length,
    totalCandidates: promotions.length,
    totalValidated: promotions.filter((promotion) => promotion.status === "validated").length,
    totalPromoted: promotions.filter((promotion) => promotion.status === "promoted").length,
    totalRejected: promotions.filter((promotion) => promotion.status === "rejected").length,
    averageClaimConfidence: claims.length ? round(claims.reduce((sum, claim) => sum + claim.confidence, 0) / claims.length, 3) : 0,
    gatePassRate: gateResults.length ? round(gateResults.filter((gate) => gate.passed).length / gateResults.length, 3) : 0,
    missingContextCandidates: promotions
      .filter((promotion) => promotion.status !== "promoted")
      .map((promotion) => promotion.claimId),
  };
}

export async function buildOntologyPromotionPackage(documents: DocumentNode[], packageName = "eqr-dart-ontology-pack"): Promise<OntologyPromotionPackage> {
  const evidence: EvidenceNode[] = [];
  const claims: ClaimNode[] = [];
  const promotions: PromotionDecision[] = [];
  const seenContentHashes = new Set<string>();

  for (const document of documents) {
    const evidenceNode = buildEvidenceNode(document);
    const { claim, event } = await buildClaimNode(document);
    const gates = evaluateQualityGates(document, evidenceNode, claim, seenContentHashes);
    const decision = decidePromotion(document, claim, gates, event);

    evidence.push(evidenceNode);
    claims.push(claim);
    promotions.push(decision);
    seenContentHashes.add(document.contentHash);
  }

  const qualityReport = buildQualityReport(evidence, claims, promotions);
  return {
    manifest: {
      name: packageName,
      version: FACTORY_VERSION,
      generatedAt: new Date().toISOString(),
      source: "eqr-nlp",
    },
    evidence,
    claims,
    promotions,
    qualityReport,
    graph: {
      nodesJsonl: toJsonl([...evidence, ...claims, ...promotions]),
      edgesJsonl: toJsonl(promotions.flatMap((promotion) => [
        { fromId: promotion.claimId, type: "SUPPORTED_BY", toId: claims.find((claim) => claim.id === promotion.claimId)?.evidenceIds[0] },
        promotion.promotedEventId ? { fromId: promotion.claimId, type: "PROMOTED_TO", toId: promotion.promotedEventId } : undefined,
      ].filter(Boolean))),
      evidenceJsonl: toJsonl(evidence),
      qualityJson: JSON.stringify(qualityReport, null, 2),
    },
  };
}
