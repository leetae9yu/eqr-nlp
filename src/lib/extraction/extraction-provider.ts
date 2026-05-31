import type { DocumentNode, EntityNode, KgEventNode } from "../domain/graph-types";
import type { MacroIndicatorId } from "../types";

export type ExtractionResult = {
  document: DocumentNode;
  entities: EntityNode[];
  events: KgEventNode[];
  indicatorHints: Partial<Record<MacroIndicatorId, number>>;
  warnings: string[];
};

export type ExtractionProvider = {
  extract(document: DocumentNode): Promise<ExtractionResult>;
};
