import { macroSnapshots } from "./macro-data";
import type { MacroIndicatorId, MacroSnapshot } from "./types";

export type KoreaFinanceMcpAdapter = {
  getMacroSnapshot(indicator: MacroIndicatorId): Promise<MacroSnapshot>;
};

export class FixtureKoreaFinanceMcpAdapter implements KoreaFinanceMcpAdapter {
  async getMacroSnapshot(indicator: MacroIndicatorId): Promise<MacroSnapshot> {
    return macroSnapshots[indicator];
  }
}

export const koreaFinanceMcpTools = [
  "get_indicator",
  "get_timeseries",
  "compare_indicators",
  "get_dashboard",
  "get_market_index",
] as const;
