import type { BacktestRunNode, DocumentNode, EntityNode, EvidencePath, ForecastNode, IndicatorNode, KgEventNode, KgNode, KgRelationship, ObservationNode, SourceNode, WeightNode } from "../domain/graph-types";
import type { PortfolioScenarioNode } from "../domain/portfolio-types";

export type GraphSnapshot = {
  nodes: KgNode[];
  portfolioScenarios: PortfolioScenarioNode[];
  relationships: KgRelationship[];
};

export type GraphStore = {
  upsertSource(source: SourceNode): Promise<void>;
  upsertDocument(document: DocumentNode): Promise<void>;
  upsertEntity(entity: EntityNode): Promise<void>;
  upsertEvent(event: KgEventNode): Promise<void>;
  upsertIndicator(indicator: IndicatorNode): Promise<void>;
  upsertObservation(observation: ObservationNode): Promise<void>;
  upsertForecast(forecast: ForecastNode): Promise<void>;
  upsertWeight(weight: WeightNode): Promise<void>;
  upsertBacktestRun(backtestRun: BacktestRunNode): Promise<void>;
  upsertPortfolioScenario(scenario: PortfolioScenarioNode): Promise<void>;
  upsertRelationship(relationship: KgRelationship): Promise<void>;
  getNode(id: string): Promise<KgNode | PortfolioScenarioNode | undefined>;
  getForecastEvidencePath(forecastId: string): Promise<EvidencePath>;
  exportSnapshot(): Promise<GraphSnapshot>;
  importSnapshot(snapshot: GraphSnapshot): Promise<void>;
};
