import type { MacroIndicatorId } from "../types";
import type { SourceObservation } from "../accuracy/types";
import type { HistoryLoadResult, HistoryLoaderOptions } from "./types";

const ECOS_BASE_URL = "https://ecos.bok.or.kr/api/StatisticSearch";
const SOURCE_VERSION = "ecos-statistic-search-v1";

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
type EcosIndicatorId = Exclude<MacroIndicatorId, "usd-krw">;
type EcosCycle = "D" | "M";

type EcosConfig = {
  statCode: string;
  cycle: EcosCycle;
  itemCode?: string;
  sourceId: string;
  unit: string;
};

type EcosRow = { TIME?: string; DATA_VALUE?: string | number; UNIT_NAME?: string };
type EcosPayload = { StatisticSearch?: { row?: EcosRow[] }; RESULT?: { CODE?: string; MESSAGE?: string } };

function getEcosApiKey(explicitKey?: string) {
  return explicitKey || process.env.BOK_ECOS_API_KEY || process.env.ECOS_API_KEY;
}

function compactDate(date: Date) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function compactMonth(date: Date) {
  return date.toISOString().slice(0, 7).replace("-", "");
}

function yearsAgo(years: number) {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date;
}

function monthsAgo(months: number) {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - months);
  return date;
}

function normalizeEcosTime(time: string, cycle: EcosCycle) {
  if (cycle === "D") return `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(6, 8)}`;
  return `${time.slice(0, 4)}-${time.slice(4, 6)}`;
}

export function ecosHistoryConfig(indicatorId: EcosIndicatorId): EcosConfig {
  const configs: Record<EcosIndicatorId, EcosConfig> = {
    "treasury-yield": {
      statCode: process.env.EQR_ECOS_TREASURY_3Y_STAT_CODE || "817Y002",
      cycle: "D",
      itemCode: process.env.EQR_ECOS_TREASURY_3Y_ITEM_CODE || "010200000",
      sourceId: "source:ecos:treasury-yield-3y",
      unit: "%",
    },
    "base-rate-expectation": {
      statCode: process.env.EQR_ECOS_BASE_RATE_STAT_CODE || "722Y001",
      cycle: "M",
      itemCode: process.env.EQR_ECOS_BASE_RATE_ITEM_CODE || "0101000",
      sourceId: "source:ecos:policy-rate-realized-proxy",
      unit: "%",
    },
    "m2-liquidity": {
      statCode: process.env.EQR_ECOS_M2_STAT_CODE || "161Y006",
      cycle: "M",
      itemCode: process.env.EQR_ECOS_M2_ITEM_CODE || "BBHA00",
      sourceId: "source:ecos:m2-liquidity",
      unit: "KRW bn",
    },
  };
  return configs[indicatorId];
}

function defaultWindow(cycle: EcosCycle, options: HistoryLoaderOptions) {
  if (cycle === "D") {
    return { start: options.startDate?.replaceAll("-", "") ?? compactDate(yearsAgo(10)), end: options.endDate?.replaceAll("-", "") ?? compactDate(new Date()) };
  }
  return { start: options.startDate?.slice(0, 7).replace("-", "") ?? compactMonth(monthsAgo(240)), end: options.endDate?.slice(0, 7).replace("-", "") ?? compactMonth(new Date()) };
}

export async function loadEcosIndicatorHistory(indicatorId: EcosIndicatorId, fetcher: FetchLike = fetch, options: HistoryLoaderOptions & { apiKey?: string } = {}): Promise<HistoryLoadResult> {
  const config = ecosHistoryConfig(indicatorId);
  const apiKey = getEcosApiKey(options.apiKey);
  if (!apiKey) {
    return {
      ok: false,
      indicatorId,
      sourceId: config.sourceId,
      sourceVersion: SOURCE_VERSION,
      observationCount: 0,
      warnings: ["BOK_ECOS_API_KEY 또는 ECOS_API_KEY가 없어 ECOS 히스토리를 수집하지 않았습니다."],
      observations: [],
    };
  }

  const window = defaultWindow(config.cycle, options);
  const limit = Math.min(Math.max(options.limit ?? 1000, 1), 1000);
  const path = [
    ECOS_BASE_URL,
    encodeURIComponent(apiKey),
    "json",
    "kr",
    "1",
    String(limit),
    config.statCode,
    config.cycle,
    window.start,
    window.end,
    config.itemCode,
  ].filter(Boolean).join("/");

  try {
    const response = await fetcher(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`ECOS history failed: ${response.status}`);
    const payload = await response.json() as EcosPayload;
    if (payload.RESULT) throw new Error(`ECOS ${payload.RESULT.CODE ?? "error"}: ${payload.RESULT.MESSAGE ?? "unknown"}`);
    const retrievedAt = new Date().toISOString();
    const observations: SourceObservation[] = (payload.StatisticSearch?.row ?? [])
      .flatMap((row) => {
        const value = Number(row.DATA_VALUE);
        return row.TIME && Number.isFinite(value) ? [{
          observationId: `obs:${config.sourceId.replace("source:", "")}:${normalizeEcosTime(row.TIME, config.cycle)}`,
          indicatorId,
          observedAt: normalizeEcosTime(row.TIME, config.cycle),
          value,
          sourceId: config.sourceId,
          sourceVersion: SOURCE_VERSION,
          retrievedAt,
          unit: row.UNIT_NAME || config.unit,
        }] : [];
      })
      .sort((a, b) => a.observedAt.localeCompare(b.observedAt));

    return {
      ok: observations.length > 0,
      indicatorId,
      sourceId: config.sourceId,
      sourceVersion: SOURCE_VERSION,
      windowStart: observations[0]?.observedAt,
      windowEnd: observations.at(-1)?.observedAt,
      observationCount: observations.length,
      warnings: observations.length ? [] : [`ECOS ${indicatorId} returned no observations.`],
      observations,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown ECOS error";
    return {
      ok: false,
      indicatorId,
      sourceId: config.sourceId,
      sourceVersion: SOURCE_VERSION,
      observationCount: 0,
      warnings: [message],
      observations: [],
    };
  }
}
