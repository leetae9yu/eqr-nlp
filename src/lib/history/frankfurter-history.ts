import type { SourceObservation } from "../accuracy/types";
import type { HistoryLoadResult, HistoryLoaderOptions } from "./types";

const FRANKFURTER_BASE_URL = "https://api.frankfurter.app";
const SOURCE_ID = "source:frankfurter:usd-krw";
const SOURCE_VERSION = "frankfurter-daily-fx-v1";

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
type FrankfurterPayload = { amount?: number; base?: string; start_date?: string; end_date?: string; date?: string; rates?: Record<string, { KRW?: number }> | { KRW?: number } };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function yearsAgoIso(years: number) {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
}

function normalizeRates(payload: FrankfurterPayload) {
  if (!payload.rates) return [];
  if ("KRW" in payload.rates && typeof payload.rates.KRW === "number" && payload.date) {
    return [{ date: payload.date, value: payload.rates.KRW }];
  }
  return Object.entries(payload.rates as Record<string, { KRW?: number }>).flatMap(([date, rates]) => (
    typeof rates.KRW === "number" ? [{ date, value: rates.KRW }] : []
  ));
}

export async function loadFrankfurterUsdKrwHistory(fetcher: FetchLike = fetch, options: HistoryLoaderOptions = {}): Promise<HistoryLoadResult> {
  const endDate = options.endDate ?? todayIso();
  const startDate = options.startDate ?? yearsAgoIso(10);
  const url = new URL(`/${startDate}..${endDate}`, FRANKFURTER_BASE_URL);
  url.searchParams.set("from", "USD");
  url.searchParams.set("to", "KRW");

  try {
    const response = await fetcher(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Frankfurter history failed: ${response.status}`);
    const payload = await response.json() as FrankfurterPayload;
    const points = normalizeRates(payload).sort((a, b) => a.date.localeCompare(b.date));
    const limited = typeof options.limit === "number" ? points.slice(-Math.max(1, options.limit)) : points;
    const retrievedAt = new Date().toISOString();
    const observations: SourceObservation[] = limited.map((point) => ({
      observationId: `obs:frankfurter:usd-krw:${point.date}`,
      indicatorId: "usd-krw",
      observedAt: point.date,
      value: point.value,
      sourceId: SOURCE_ID,
      sourceVersion: SOURCE_VERSION,
      retrievedAt,
      unit: "KRW per USD",
    }));

    return {
      ok: observations.length > 0,
      indicatorId: "usd-krw",
      sourceId: SOURCE_ID,
      sourceVersion: SOURCE_VERSION,
      windowStart: observations[0]?.observedAt,
      windowEnd: observations.at(-1)?.observedAt,
      observationCount: observations.length,
      warnings: observations.length ? [] : ["Frankfurter returned no USD/KRW observations."],
      observations,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown Frankfurter error";
    return {
      ok: false,
      indicatorId: "usd-krw",
      sourceId: SOURCE_ID,
      sourceVersion: SOURCE_VERSION,
      observationCount: 0,
      warnings: [message],
      observations: [],
    };
  }
}
