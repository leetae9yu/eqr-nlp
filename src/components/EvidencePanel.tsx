import type { Evidence } from "@/lib/types";

function evidenceKey(item: Evidence) {
  return `${item.label}|${item.url}|${item.quote}`;
}

export function EvidencePanel({ evidence }: { evidence: Evidence[] }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Evidence</p>
        <h2>Source-linked explanation</h2>
      </div>
      <div className="evidence-list">
        {evidence.map((item) => (
          <a className="evidence-item" key={evidenceKey(item)} href={item.url} target="_blank" rel="noreferrer">
            <strong>{item.label}</strong>
            <span>{item.source}</span>
            <p>{item.quote}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
