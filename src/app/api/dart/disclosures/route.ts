import { NextResponse } from "next/server";
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

  return NextResponse.json({
    source: result.source,
    availability: result.availability,
    documents: result.documents.map((document) => ({
      id: document.id,
      sourceId: document.sourceId,
      externalId: document.externalId,
      title: document.title,
      url: document.url,
      publishedAt: document.publishedAt,
      retrievedAt: document.retrievedAt,
      language: document.language,
      summary: document.summary,
      contentHash: document.contentHash,
      citation: document.citation,
    })),
    warnings: result.warnings,
  });
}
