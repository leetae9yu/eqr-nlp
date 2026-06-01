import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalystNotes } from "@/components/AnalystNotes";
import { CalibrationPanel } from "@/components/CalibrationPanel";
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
  const calibrations = Array.from(
    new Map(
      analysis.forecasts
        .flatMap((forecast) => forecast.forecasts.flatMap((horizon) => horizon.calibration ? [horizon.calibration] : []))
        .map((item) => [item.weightId, item]),
    ).values(),
  );
  const evidence = Array.from(
    new Map(
      analysis.forecasts
        .flatMap((forecast) => forecast.evidence)
        .map((item) => [`${item.label}|${item.url}|${item.quote}`, item]),
    ).values(),
  );

  return (
    <main className="shell">
      <Link className="back-link" href="/">← 이벤트 큐</Link>
      <section className="hero detail-hero">
        <p className="eyebrow">{event.source} · {new Date(event.publishedAt).toLocaleString("ko-KR", { dateStyle: "full", timeStyle: "short" })}</p>
        <h1>{event.title}</h1>
        <p>{event.summary}</p>
        <a className="secondary-link" href={event.url} target="_blank" rel="noreferrer">원문 이벤트 열기</a>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">매크로 바스켓</p>
          <h2>다중 기간 영향 점수</h2>
        </div>
        <div className="impact-grid">
          {analysis.forecasts.map((forecast) => <ImpactCard key={forecast.indicator} forecast={forecast} />)}
        </div>
      </section>

      <EvidencePanel evidence={evidence} />
      <CalibrationPanel calibrations={calibrations} />
      <AnalystNotes eventId={event.id} />

      <section className="panel warning-panel">
        <div className="section-heading">
          <p className="eyebrow">한계</p>
          <h2>불확실성과 검토 플래그</h2>
        </div>
        <ul>
          {analysis.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
        </ul>
      </section>
    </main>
  );
}
