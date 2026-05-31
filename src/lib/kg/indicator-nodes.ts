import { macroSnapshots } from "../macro-data";
import type { IndicatorNode, ObservationNode } from "../domain/graph-types";
import type { MacroIndicatorId } from "../types";

export function getIndicatorNode(indicator: MacroIndicatorId): IndicatorNode {
  const snapshot = macroSnapshots[indicator];
  return {
    id: indicator,
    kind: "indicator",
    label: snapshot.label,
    unit: snapshot.unit,
    frequency: indicator === "m2-liquidity" ? "monthly" : "daily",
    source: snapshot.source,
    directionSemantics: `${snapshot.label} is modeled as a signed magnitude forecast in ${snapshot.unit}.`,
  };
}

export function getLatestObservationNode(indicator: MacroIndicatorId): ObservationNode {
  const snapshot = macroSnapshots[indicator];
  return {
    id: `observation:${indicator}:${snapshot.asOf}`,
    kind: "observation",
    indicatorId: indicator,
    date: snapshot.asOf,
    value: snapshot.latestValue,
    source: snapshot.source,
    asOf: snapshot.asOf,
  };
}
