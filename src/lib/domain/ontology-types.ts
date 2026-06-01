import type { MacroIndicatorId } from "../types";
import type { EventKind } from "./graph-types";

export type OntologySpace =
  | "subject"
  | "resource"
  | "evidence"
  | "concept"
  | "claim"
  | "community"
  | "outcome"
  | "lever"
  | "policy";

export type PromotionStatus = "candidate" | "validated" | "promoted" | "rejected";

export type EvidenceNode = {
  id: string;
  kind: "ontology-evidence";
  space: "evidence";
  documentId: string;
  sourceId: string;
  url: string;
  contentHash: string;
  capturedAt: string;
  parserStatus: "parsed" | "partial" | "failed";
  coverage: {
    hasStableId: boolean;
    hasSourceUrl: boolean;
    hasContentHash: boolean;
    hasTimestamp: boolean;
  };
};

export type ClaimNode = {
  id: string;
  kind: "ontology-claim";
  space: "claim";
  statement: string;
  evidenceIds: string[];
  eventKind: EventKind;
  indicatorHints: Partial<Record<MacroIndicatorId, number>>;
  confidence: number;
  extractedAt: string;
};

export type PromotionDecision = {
  id: string;
  kind: "ontology-promotion";
  claimId: string;
  status: PromotionStatus;
  gateResults: QualityGateResult[];
  decidedAt: string;
  promotedEventId?: string;
  rejectionReason?: string;
};

export type QualityGateResult = {
  gate: "stable-id" | "content-hash" | "source-url" | "indicator-hint" | "confidence" | "duplicate";
  passed: boolean;
  detail: string;
};

export type QualityReport = {
  generatedAt: string;
  totalEvidence: number;
  totalClaims: number;
  totalCandidates: number;
  totalValidated: number;
  totalPromoted: number;
  totalRejected: number;
  averageClaimConfidence: number;
  gatePassRate: number;
  missingContextCandidates: string[];
};

export type OntologyPromotionPackage = {
  manifest: {
    name: string;
    version: "eqr-opencrab-inspired-v1";
    generatedAt: string;
    source: "eqr-nlp";
  };
  evidence: EvidenceNode[];
  claims: ClaimNode[];
  promotions: PromotionDecision[];
  qualityReport: QualityReport;
  graph: {
    nodesJsonl: string;
    edgesJsonl: string;
    evidenceJsonl: string;
    qualityJson: string;
  };
};
