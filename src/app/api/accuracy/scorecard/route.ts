import { NextResponse } from "next/server";
import { buildAccuracyScorecard } from "../../../../lib/accuracy/evaluate";

export async function GET() {
  const scorecard = await buildAccuracyScorecard();
  return NextResponse.json(scorecard, {
    headers: { "Cache-Control": "no-store" },
  });
}
