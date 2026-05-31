import type { BacktestRunNode, DocumentNode, EntityNode, EvidencePath, ForecastNode, IndicatorNode, KgEventNode, KgNode, KgRelationship, ObservationNode, SourceNode, WeightNode } from "../domain/graph-types";
import type { PortfolioScenarioNode } from "../domain/portfolio-types";
import type { GraphSnapshot, GraphStore } from "./graph-store";

export class MemoryGraphStore implements GraphStore {
  private nodes = new Map<string, KgNode>();
  private portfolioScenarios = new Map<string, PortfolioScenarioNode>();
  private relationships = new Map<string, KgRelationship>();

  async upsertSource(source: SourceNode) { this.nodes.set(source.id, source); }
  async upsertDocument(document: DocumentNode) { this.nodes.set(document.id, document); }
  async upsertEntity(entity: EntityNode) { this.nodes.set(entity.id, entity); }
  async upsertEvent(event: KgEventNode) { this.nodes.set(event.id, event); }
  async upsertIndicator(indicator: IndicatorNode) { this.nodes.set(indicator.id, indicator); }
  async upsertObservation(observation: ObservationNode) { this.nodes.set(observation.id, observation); }
  async upsertForecast(forecast: ForecastNode) { this.nodes.set(forecast.id, forecast); }
  async upsertWeight(weight: WeightNode) { this.nodes.set(weight.id, weight); }
  async upsertBacktestRun(backtestRun: BacktestRunNode) { this.nodes.set(backtestRun.id, backtestRun); }
  async upsertPortfolioScenario(scenario: PortfolioScenarioNode) { this.portfolioScenarios.set(scenario.id, scenario); }
  async upsertRelationship(relationship: KgRelationship) { this.relationships.set(relationship.id, relationship); }

  async getNode(id: string) {
    return this.nodes.get(id) ?? this.portfolioScenarios.get(id);
  }

  async getForecastEvidencePath(forecastId: string): Promise<EvidencePath> {
    const visited = new Set<string>();
    const nodeIds = new Set<string>([forecastId]);
    const relationshipIds = new Set<string>();
    const queue = [forecastId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      for (const relationship of this.relationships.values()) {
        if (relationship.fromId === current || relationship.toId === current) {
          relationshipIds.add(relationship.id);
          const next = relationship.fromId === current ? relationship.toId : relationship.fromId;
          if (!visited.has(next)) {
            nodeIds.add(next);
            queue.push(next);
          }
        }
      }
    }

    return {
      forecastId,
      nodes: [...nodeIds].map((id) => this.nodes.get(id)).filter((node): node is KgNode => Boolean(node)),
      relationships: [...relationshipIds].map((id) => this.relationships.get(id)).filter((relationship): relationship is KgRelationship => Boolean(relationship)),
    };
  }

  async exportSnapshot(): Promise<GraphSnapshot> {
    return {
      nodes: [...this.nodes.values()],
      portfolioScenarios: [...this.portfolioScenarios.values()],
      relationships: [...this.relationships.values()],
    };
  }

  async importSnapshot(snapshot: GraphSnapshot): Promise<void> {
    this.nodes.clear();
    this.portfolioScenarios.clear();
    this.relationships.clear();
    for (const node of snapshot.nodes) this.nodes.set(node.id, node);
    for (const scenario of snapshot.portfolioScenarios) this.portfolioScenarios.set(scenario.id, scenario);
    for (const relationship of snapshot.relationships) this.relationships.set(relationship.id, relationship);
  }
}
