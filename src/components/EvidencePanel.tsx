import type { Evidence } from "@/lib/types";

function evidenceKey(item: Evidence) {
  return `${item.label}|${item.url}|${item.quote}`;
}

export function EvidencePanel({ evidence }: { evidence: Evidence[] }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">근거</p>
        <h2>출처 기반 설명</h2>
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
