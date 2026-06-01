import { NextResponse } from "next/server";
import { buildOntologyPromotionPackage } from "@/lib/ontology/ontology-factory";
import { OpenDartAdapter } from "@/lib/sources/dart-adapter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const adapter = new OpenDartAdapter();
  const result = await adapter.fetchDocuments({
    corpCode: searchParams.get("corpCode") ?? undefined,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
    limit: Number(searchParams.get("limit") ?? 20),
  });
  const pack = await buildOntologyPromotionPackage(result.documents, "eqr-dart-live-request-pack");

  if (searchParams.get("format") === "jsonl") {
    return new Response(pack.graph.nodesJsonl, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "content-disposition": "attachment; filename=eqr-dart-ontology-nodes.jsonl",
      },
    });
  }

  return NextResponse.json({
    availability: result.availability,
    warnings: result.warnings,
    ...pack,
  });
}
