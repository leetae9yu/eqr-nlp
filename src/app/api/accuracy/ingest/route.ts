import { NextResponse } from "next/server";
import { ingestAndEvaluateAccuracy } from "../../../../lib/accuracy/evaluate";
import type { HistoryLoadResult } from "../../../../lib/history/types";

function isUnsafeMutationEnvironment() {
  return Boolean(process.env.DATABASE_URL || process.env.VERCEL || process.env.NODE_ENV === "production");
}

function authorizationState(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return isUnsafeMutationEnvironment()
      ? { ok: false, status: 503, error: "CRON_SECRET is required for protected ingestion in production or persistent-storage environments." }
      : { ok: true };
  }
  return request.headers.get("authorization") === `Bearer ${secret}`
    ? { ok: true }
    : { ok: false, status: 401, error: "unauthorized" };
}

function summarizeHistory(history: HistoryLoadResult) {
  return {
    ok: history.ok,
    indicatorId: history.indicatorId,
    sourceId: history.sourceId,
    sourceVersion: history.sourceVersion,
    windowStart: history.windowStart,
    windowEnd: history.windowEnd,
    observationCount: history.observationCount,
    warnings: history.warnings,
  };
}

export async function GET(request: Request) {
  const auth = authorizationState(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status, headers: { "Cache-Control": "no-store" } });
  }

  const result = await ingestAndEvaluateAccuracy();
  return NextResponse.json({
    ok: true,
    storeStatus: result.storeStatus,
    histories: result.histories.map(summarizeHistory),
    observationsStored: result.observationsStored,
    warnings: result.warnings,
    scorecard: result.scorecard,
    evaluationMode: result.evaluationMode,
  }, { headers: { "Cache-Control": "no-store" } });
}
