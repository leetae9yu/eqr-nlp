import { NextResponse } from "next/server";
import { getDartForecastBundle } from "@/lib/dart/dart-forecast";
import { parseLimit } from "@/lib/sources/source-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bundle = await getDartForecastBundle({
    corpCode: searchParams.get("corpCode") ?? undefined,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
    limit: parseLimit(searchParams.get("limit"), 6, 25),
  });

  return NextResponse.json({
    availability: bundle.sourceResult.availability,
    documentsFetched: bundle.sourceResult.documents.length,
    forecasts: bundle.analyses,
    promotions: bundle.promotions,
    warnings: bundle.warnings,
  });
}
