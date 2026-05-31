import type { ForecastHorizon, MacroIndicatorId } from "../types";

export type KgNodeKind =
  | "source"
  | "document"
  | "entity"
  | "event"
  | "indicator"
  | "observation"
  | "forecast"
  | "weight"
  | "backtest-run"
  | "portfolio-scenario";

export type SourceKind = "rss" | "gdelt" | "dart" | "fixture" | "manual";

export type SourceNode = {
  id: string;
  kind: "source";
  sourceKind: SourceKind;
  name: string;
  homepageUrl: string;
  freeTierOnly: boolean;
  paidRequiresApproval: boolean;
  reliabilityWeight: number;
  createdAt: string;
};

export type DocumentNode = {
  id: string;
  kind: "document";
  sourceId: string;
  externalId: string;
  title: string;
  url: string;
  publishedAt: string;
  retrievedAt: string;
  language: "ko" | "en" | "unknown";
  rawText: string;
  summary: string;
  contentHash: string;
  citation: string;
};

export type EntityKind = "company" | "country" | "sector" | "commodity" | "institution" | "policy-body" | "macro-indicator" | "unknown";

export type EntityNode = {
  id: string;
  kind: "entity";
  entityKind: EntityKind;
  name: string;
  aliases: string[];
  identifiers: Partial<Record<"dartCorpCode" | "ticker" | "isin" | "countryCode", string>>;
  country?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type EventKind = "disclosure" | "policy" | "trade" | "inflation" | "liquidity" | "rates" | "fx" | "macro" | "unknown";

export type KgEventNode = {
  id: string;
  kind: "event";
  eventKind: EventKind;
  label: string;
  occurredAt: string;
  region: "KR" | "Global";
  sentiment: -2 | -1 | 0 | 1 | 2;
  magnitudeHint: number;
  confidence: number;
  tags: string[];
  evidenceDocumentIds: string[];
};

export type IndicatorNode = {
  id: MacroIndicatorId;
  kind: "indicator";
  label: string;
  unit: string;
  frequency: "daily" | "weekly" | "monthly" | "event";
  source: string;
  directionSemantics: string;
};

export type ObservationNode = {
  id: string;
  kind: "observation";
  indicatorId: MacroIndicatorId;
  date: string;
  value: number;
  source: string;
  asOf: string;
  revision?: string;
};

export type ForecastNode = {
  id: string;
  kind: "forecast";
  generatedAt: string;
  indicatorId: MacroIndicatorId;
  horizon: ForecastHorizon;
  baselineValue: number;
  predictedDelta: number;
  predictedMagnitude: number;
  direction: "up" | "down" | "flat" | "mixed";
  confidence: number;
  modelVersion: string;
  evidencePathIds: string[];
  limitations: string[];
};

export type WeightNode = {
  id: string;
  kind: "weight";
  fromType: KgNodeKind;
  fromId: string;
  toType: KgNodeKind;
  toId: string;
  indicatorId: MacroIndicatorId;
  horizon: ForecastHorizon;
  weight: number;
  confidence: number;
  calibrationRunId: string;
  sampleSize: number;
  mae: number;
  rmse: number;
  smape: number;
  updatedAt: string;
};

export type BacktestRunNode = {
  id: string;
  kind: "backtest-run";
  runAt: string;
  windowStart: string;
  windowEnd: string;
  targetIndicators: MacroIndicatorId[];
  horizons: ForecastHorizon[];
  metricSummary: Record<string, number>;
  modelVersion: string;
  weightVersion: string;
  dataCutoff: string;
};

export type KgNode =
  | SourceNode
  | DocumentNode
  | EntityNode
  | KgEventNode
  | IndicatorNode
  | ObservationNode
  | ForecastNode
  | WeightNode
  | BacktestRunNode;

export type KgRelationshipType =
  | "PUBLISHED"
  | "MENTIONS"
  | "EVIDENCES"
  | "AFFECTS"
  | "HAS_OBSERVATION"
  | "PREDICTS"
  | "USES_EVENT"
  | "USES_WEIGHT"
  | "CITES"
  | "CALIBRATED"
  | "EVALUATED";

export type KgRelationship = {
  id: string;
  type: KgRelationshipType;
  fromId: string;
  toId: string;
  metadata?: Record<string, string | number | boolean>;
};

export type EvidencePath = {
  forecastId: string;
  nodes: KgNode[];
  relationships: KgRelationship[];
};

export function assertNonEmpty(value: string, field: string) {
  if (!value.trim()) {
    throw new Error(`${field} must be non-empty`);
  }
}

export function createRelationship(type: KgRelationshipType, fromId: string, toId: string, metadata?: KgRelationship["metadata"]): KgRelationship {
  assertNonEmpty(fromId, "fromId");
  assertNonEmpty(toId, "toId");
  return {
    id: `${type}:${fromId}->${toId}`,
    type,
    fromId,
    toId,
    metadata,
  };
}
