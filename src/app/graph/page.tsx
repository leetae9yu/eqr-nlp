import Link from "next/link";
import { Badge } from "@/components/Badge";
import { hasDartApiKey } from "@/lib/env";
import { getGraphStatusFromSource } from "@/lib/kg/graph-provenance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GraphPage() {
  const sourceMode = hasDartApiKey() ? "dart-live" : "fixture";
  const status = await getGraphStatusFromSource(sourceMode, 10);
  const countEntries = Object.entries(status.counts).filter(([, value]) => value > 0);

  return (
    <main className="shell">
      <Link className="back-link" href="/">← Dashboard</Link>
      <section className="hero detail-hero">
        <p className="eyebrow">Knowledge graph provenance</p>
        <h1>Trace source documents into macro indicator hypotheses.</h1>
        <p>
          This view uses live OpenDART ingestion when DART_API_KEY is configured in the server environment; otherwise it falls back to fixtures.
          Storage is currently memory-only and non-durable until a free-tier graph database is configured.
        </p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Graph status</p>
          <h2>Node coverage</h2>
        </div>
        <div className="tag-row">
          <Badge>{status.sourceMode}</Badge>
          <Badge>{status.storageMode}</Badge>
          <Badge>generated {new Date(status.generatedAt).toLocaleDateString("en")}</Badge>
          {countEntries.map(([kind, count]) => <Badge key={kind}>{kind}: {count}</Badge>)}
        </div>
      </section>

      <section className="grid two-col">
        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">Evidence paths</p>
            <h2>Source → document → event → indicator</h2>
          </div>
          <div className="event-list">
            {status.indicatorPaths.slice(0, 8).map((path) => (
              <article className="event-card" key={`${path.indicatorId}-${path.documentTitle}-${path.eventLabel}`}>
                <div>
                  <p className="event-source">{path.sourceName} · {path.indicatorLabel}</p>
                  <h3>{path.documentTitle}</h3>
                  <p>{path.eventLabel}</p>
                  <p className="muted">Citation: {path.citation}</p>
                </div>
                <div className="tag-row">
                  {path.relationshipIds.map((id) => <Badge key={id}>{id.split(":")[0]}</Badge>)}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel">
          <div className="section-heading">
            <p className="eyebrow">Sources</p>
            <h2>Coverage</h2>
          </div>
          <ul className="boundary-list">
            {status.sourceCoverage.map((coverage) => (
              <li key={coverage.source.id}>
                {coverage.source.name}: {coverage.documentCount} documents, {coverage.eventCount} events,
                {" "}{coverage.entityCount} entities.
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
