import Link from "next/link";
import { Badge } from "@/components/Badge";
import { hasDartApiKey } from "@/lib/env";
import { buildOntologyPromotionPackage } from "@/lib/ontology/ontology-factory";
import { getDartGraphStatus } from "@/lib/kg/graph-provenance";
import { OpenDartAdapter } from "@/lib/sources/dart-adapter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const item = params[key];
  return Array.isArray(item) ? item[0] : item;
}

export default async function DartPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const limit = Number(value(params, "limit") ?? 20);
  const input = {
    corpCode: value(params, "corpCode"),
    startDate: value(params, "startDate"),
    endDate: value(params, "endDate"),
    limit,
  };
  const adapter = new OpenDartAdapter();
  const result = await adapter.fetchDocuments(input);
  const graphStatus = await getDartGraphStatus(Math.min(limit, 20));
  const ontologyPack = await buildOntologyPromotionPackage(result.documents, "eqr-dart-live-request-pack");
  const keyConfigured = hasDartApiKey();

  return (
    <main className="shell">
      <Link className="back-link" href="/">← Dashboard</Link>
      <section className="hero detail-hero">
        <p className="eyebrow">Live OpenDART ingestion</p>
        <h1>Read DART disclosures from Vercel server env.</h1>
        <p>
          This page uses the server-side <code>DART_API_KEY</code> environment variable, falls back to
          <code> OPENDART_API_KEY</code>, converts disclosures into documents, and runs the same KG extraction pipeline.
        </p>
        <div className="tag-row">
          <Badge>{keyConfigured ? "DART key configured" : "DART key missing"}</Badge>
          <Badge>{result.availability.ok ? "OpenDART available" : "OpenDART unavailable"}</Badge>
          <Badge>{result.documents.length} disclosures</Badge>
          <Badge>{graphStatus.counts.event} extracted events</Badge>
          <Badge>{ontologyPack.qualityReport.totalPromoted} promoted claims</Badge>
        </div>
      </section>

      {result.warnings.length > 0 || graphStatus.warnings.length > 0 ? (
        <section className="panel warning-panel">
          <div className="section-heading">
            <p className="eyebrow">Warnings</p>
            <h2>Runtime status</h2>
          </div>
          <ul className="boundary-list">
            {[...result.warnings, ...graphStatus.warnings].map((warning) => <li key={warning}>{warning}</li>)}
            {!result.availability.ok && result.availability.reason ? <li>{result.availability.reason}</li> : null}
          </ul>
        </section>
      ) : null}


      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Ontology factory</p>
          <h2>Candidate → validated → promoted lifecycle</h2>
        </div>
        <div className="tag-row">
          <Badge>{ontologyPack.manifest.version}</Badge>
          <Badge>evidence {ontologyPack.qualityReport.totalEvidence}</Badge>
          <Badge>claims {ontologyPack.qualityReport.totalClaims}</Badge>
          <Badge>promoted {ontologyPack.qualityReport.totalPromoted}</Badge>
          <Badge>rejected {ontologyPack.qualityReport.totalRejected}</Badge>
          <Badge>gate pass {Math.round(ontologyPack.qualityReport.gatePassRate * 100)}%</Badge>
        </div>
        <p className="muted">
          <a href="/api/dart/ontology-pack">Download ontology pack JSON</a> · {" "}
          <a href="/api/dart/ontology-pack?format=jsonl">Download nodes JSONL</a>
        </p>
      </section>

      <section className="grid two-col">
        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">Disclosures</p>
            <h2>Latest documents</h2>
          </div>
          <div className="event-list">
            {result.documents.map((document) => (
              <a className="event-card" href={document.url} key={document.id} target="_blank" rel="noreferrer">
                <div>
                  <p className="event-source">{document.sourceId} · {new Date(document.publishedAt).toLocaleDateString("en")}</p>
                  <h3>{document.title}</h3>
                  <p>{document.summary}</p>
                  <p className="muted">{document.citation}</p>
                </div>
              </a>
            ))}
            {result.documents.length === 0 ? <p className="muted">No live DART disclosures were returned for this query.</p> : null}
          </div>
        </div>

        <aside className="panel">
          <div className="section-heading">
            <p className="eyebrow">KG ingestion</p>
            <h2>Live graph counts</h2>
          </div>
          <ul className="boundary-list">
            {Object.entries(graphStatus.counts).filter(([, count]) => count > 0).map(([kind, count]) => (
              <li key={kind}>{kind}: {count}</li>
            ))}
          </ul>
          <div className="section-heading" style={{ marginTop: 24 }}>
            <p className="eyebrow">Promotion decisions</p>
            <h2>Quality gates</h2>
          </div>
          <ul className="boundary-list">
            {ontologyPack.promotions.slice(0, 8).map((promotion) => (
              <li key={promotion.id}>
                {promotion.status}: {promotion.claimId.replace("ontology-claim:", "")}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
