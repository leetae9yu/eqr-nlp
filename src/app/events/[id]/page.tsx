import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalystNotes } from "@/components/AnalystNotes";
import { EvidencePanel } from "@/components/EvidencePanel";
import { ImpactCard } from "@/components/ImpactCard";
import { getEventById, sampleEvents } from "@/lib/events";
import { analyzeEvent } from "@/lib/forecast";

export function generateStaticParams() {
  return sampleEvents.map((event) => ({ id: event.id }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();

  const analysis = await analyzeEvent(event);
  const evidence = analysis.forecasts.flatMap((forecast) => forecast.evidence);

  return (
    <main className="shell">
      <Link className="back-link" href="/">← Event queue</Link>
      <section className="hero detail-hero">
        <p className="eyebrow">{event.source} · {new Date(event.publishedAt).toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}</p>
        <h1>{event.title}</h1>
        <p>{event.summary}</p>
        <a className="secondary-link" href={event.url} target="_blank" rel="noreferrer">Open source event</a>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Macro basket</p>
          <h2>Multi-horizon impact scores</h2>
        </div>
        <div className="impact-grid">
          {analysis.forecasts.map((forecast) => <ImpactCard key={forecast.indicator} forecast={forecast} />)}
        </div>
      </section>

      <EvidencePanel evidence={evidence} />
      <AnalystNotes eventId={event.id} />

      <section className="panel warning-panel">
        <div className="section-heading">
          <p className="eyebrow">Limitations</p>
          <h2>Uncertainty and review flags</h2>
        </div>
        <ul>
          {analysis.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
        </ul>
      </section>
    </main>
  );
}
