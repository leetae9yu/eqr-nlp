import Link from "next/link";
import { Badge } from "@/components/Badge";
import { sampleEvents } from "@/lib/events";
import { productBoundaries } from "@/lib/product-copy";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">EQR NLP · Korea macro research demo</p>
        <h1>Turn low-friction news events into explainable macro-impact forecasts.</h1>
        <p>
          A Vercel-ready analyst dashboard for scenario-style impact scoring across USD/KRW,
          base-rate expectations, treasury yields, and M2 liquidity.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" href={`/events/${sampleEvents[0].id}`}>Open sample analysis</Link>
          <Link className="secondary-link" href="/graph">View knowledge graph</Link>
          <Link className="secondary-link" href="/dart">Live DART</Link>
          <Link className="secondary-link" href="/backtests">Backtest weights</Link>
          <Link className="secondary-link" href="/portfolio">Portfolio simulation</Link>
          <a className="secondary-link" href="https://github.com/emceeKim/korea-finance-mcp" target="_blank" rel="noreferrer">korea-finance-mcp</a>
        </div>
      </section>

      <section className="grid two-col">
        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">Low-friction feed</p>
            <h2>Event queue</h2>
          </div>
          <div className="event-list">
            {sampleEvents.map((event) => (
              <Link href={`/events/${event.id}`} className="event-card" key={event.id}>
                <div>
                  <p className="event-source">{event.source} · {new Date(event.publishedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</p>
                  <h3>{event.title}</h3>
                  <p>{event.summary}</p>
                </div>
                <div className="tag-row">{event.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="panel">
          <div className="section-heading">
            <p className="eyebrow">Research boundaries</p>
            <h2>v0 constraints</h2>
          </div>
          <ul className="boundary-list">
            {productBoundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}
          </ul>
        </aside>
      </section>
    </main>
  );
}
