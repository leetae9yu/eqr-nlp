import { macroSnapshots } from "./macro-data";
import type { MacroIndicatorId, MacroSnapshot } from "./types";

const FRANKFURTER_BASE_URL = "https://api.frankfurter.app";
const ECOS_BASE_URL = "https://ecos.bok.or.kr/api/StatisticSearch";

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
type SeriesPoint = { date: string; value: number };

type EcosIndicatorConfig = {
  statCode: string;
  cycle: "D" | "M";
  itemCode?: string;
  label: string;
  unit: string;
  source: string;
};

type EcosRow = {
  TIME?: string;
  DATA_VALUE?: string | number;
  ITEM_NAME1?: string;
  UNIT_NAME?: string;
};

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function compactDate(date: Date) {
  return toIsoDate(date).replaceAll("-", "");
}

function compactMonth(date: Date) {
  return date.toISOString().slice(0, 7).replace("-", "");
}

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function monthsAgo(months: number) {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - months);
  return date;
}

function normalizeEcosTime(time: string, cycle: "D" | "M") {
  if (cycle === "D") return `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(6, 8)}`;
  return `${time.slice(0, 4)}-${time.slice(4, 6)}`;
}

function toSnapshot(indicator: MacroIndicatorId, base: Omit<MacroSnapshot, "indicator" | "latestValue" | "previousValue" | "asOf" | "series">, series: SeriesPoint[]): MacroSnapshot {
  const ordered = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const latest = ordered.at(-1);
  const previous = ordered.at(-2) ?? latest;

  if (!latest) throw new Error(`No live macro series returned for ${indicator}`);

  return {
    indicator,
    ...base,
    latestValue: latest.value,
    previousValue: previous?.value ?? latest.value,
    asOf: latest.date,
    series: ordered.slice(-8),
  };
}

function withFallbackNotice(snapshot: MacroSnapshot, reason: string): MacroSnapshot {
  return {
    ...snapshot,
    source: `${snapshot.source} · 실시간 실패로 샘플 사용 (${reason})`,
  };
}

function getEcosApiKey() {
  return process.env.BOK_ECOS_API_KEY || process.env.ECOS_API_KEY;
}

function ecosConfig(indicator: Exclude<MacroIndicatorId, "usd-krw">): EcosIndicatorConfig {
  const configs: Record<Exclude<MacroIndicatorId, "usd-krw">, EcosIndicatorConfig> = {
    "base-rate-expectation": {
      statCode: process.env.EQR_ECOS_BASE_RATE_STAT_CODE || "722Y001",
      cycle: "M",
      itemCode: process.env.EQR_ECOS_BASE_RATE_ITEM_CODE || "0101000",
      label: "기준금리",
      unit: "%",
      source: "한국은행 ECOS 기준금리",
    },
    "treasury-yield": {
      statCode: process.env.EQR_ECOS_TREASURY_3Y_STAT_CODE || "817Y002",
      cycle: "D",
      itemCode: process.env.EQR_ECOS_TREASURY_3Y_ITEM_CODE || "010200000",
      label: "한국 국고채 3년 금리",
      unit: "%",
      source: "한국은행 ECOS 국고채 3년",
    },
    "m2-liquidity": {
      statCode: process.env.EQR_ECOS_M2_STAT_CODE || "161Y006",
      cycle: "M",
      itemCode: process.env.EQR_ECOS_M2_ITEM_CODE || "BBHA00",
      label: "M2 유동성",
      unit: "십억원",
      source: "한국은행 ECOS M2",
    },
  };

  return configs[indicator];
}

export class LiveKoreaFinanceMcpAdapter {
  constructor(private fetcher: FetchLike = fetch) {}

  async getMacroSnapshot(indicator: MacroIndicatorId): Promise<MacroSnapshot> {
    try {
      if (indicator === "usd-krw") return await this.getUsdKrwSnapshot();
      return await this.getEcosSnapshot(indicator);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      return withFallbackNotice(macroSnapshots[indicator], message);
    }
  }

  private async getUsdKrwSnapshot(): Promise<MacroSnapshot> {
    const latestUrl = new URL("/latest", FRANKFURTER_BASE_URL);
    latestUrl.searchParams.set("from", "USD");
    latestUrl.searchParams.set("to", "KRW");
    const latestResponse = await this.fetcher(latestUrl, { cache: "no-store" });
    if (!latestResponse.ok) throw new Error(`Frankfurter latest failed: ${latestResponse.status}`);
    const latestPayload = await latestResponse.json() as { date?: string; rates?: { KRW?: number } };
    if (!latestPayload.date || typeof latestPayload.rates?.KRW !== "number") throw new Error("Frankfurter latest missing KRW");

    const end = new Date(`${latestPayload.date}T00:00:00.000Z`);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 14);
    const historyUrl = new URL(`/${toIsoDate(start)}..${toIsoDate(end)}`, FRANKFURTER_BASE_URL);
    historyUrl.searchParams.set("from", "USD");
    historyUrl.searchParams.set("to", "KRW");
    const historyResponse = await this.fetcher(historyUrl, { cache: "no-store" });
    if (!historyResponse.ok) throw new Error(`Frankfurter history failed: ${historyResponse.status}`);
    const historyPayload = await historyResponse.json() as { rates?: Record<string, { KRW?: number }> };
    const series = Object.entries(historyPayload.rates ?? {})
      .flatMap(([date, rates]) => typeof rates.KRW === "number" ? [{ date, value: rates.KRW }] : []);

    return toSnapshot("usd-krw", {
      label: "USD/KRW",
      unit: "원/달러",
      source: "Frankfurter daily FX (ECB/official reference)",
    }, series.length ? series : [{ date: latestPayload.date, value: latestPayload.rates.KRW }]);
  }

  private async getEcosSnapshot(indicator: Exclude<MacroIndicatorId, "usd-krw">): Promise<MacroSnapshot> {
    const apiKey = getEcosApiKey();
    if (!apiKey) throw new Error("BOK_ECOS_API_KEY 또는 ECOS_API_KEY 없음");

    const config = ecosConfig(indicator);
    const endDate = config.cycle === "D" ? compactDate(new Date()) : compactMonth(new Date());
    const startDate = config.cycle === "D" ? compactDate(dateDaysAgo(45)) : compactMonth(monthsAgo(18));
    const path = [
      ECOS_BASE_URL,
      encodeURIComponent(apiKey),
      "json",
      "kr",
      "1",
      "100",
      config.statCode,
      config.cycle,
      startDate,
      endDate,
      config.itemCode,
    ].filter(Boolean).join("/");

    const response = await this.fetcher(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`ECOS request failed: ${response.status}`);
    const payload = await response.json() as { StatisticSearch?: { row?: EcosRow[] }; RESULT?: { CODE?: string; MESSAGE?: string } };
    if (payload.RESULT) throw new Error(`ECOS ${payload.RESULT.CODE ?? "error"}: ${payload.RESULT.MESSAGE ?? "unknown"}`);
    const rows = payload.StatisticSearch?.row ?? [];
    const series = rows.flatMap((row) => {
      const value = Number(row.DATA_VALUE);
      return row.TIME && Number.isFinite(value) ? [{ date: normalizeEcosTime(row.TIME, config.cycle), value }] : [];
    });

    return toSnapshot(indicator, {
      label: config.label,
      unit: config.unit,
      source: config.source,
    }, series);
  }
}
