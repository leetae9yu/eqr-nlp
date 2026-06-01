import type { MacroIndicatorId } from "../types";
import type { SourceObservation } from "../accuracy/types";

export type HistoryCoverage = {
  ok: boolean;
  indicatorId: MacroIndicatorId;
  sourceId: string;
  sourceVersion: string;
  windowStart?: string;
  windowEnd?: string;
  observationCount: number;
  warnings: string[];
};

export type HistoryLoadResult = HistoryCoverage & {
  observations: SourceObservation[];
};

export type HistoryLoaderOptions = {
  startDate?: string;
  endDate?: string;
  limit?: number;
};
