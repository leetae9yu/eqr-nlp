import Link from "next/link";
import { Badge } from "@/components/Badge";
import { sampleEvents } from "@/lib/events";
import { productBoundaries } from "@/lib/product-copy";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">EQR NLP · 한국 매크로 리서치</p>
        <h1>DART 공시와 뉴스 이벤트를 설명 가능한 매크로 예측으로 전환합니다.</h1>
        <p>
          USD/KRW, 기준금리 기대, 국고채 금리, M2 유동성에 대해 근거·불확실성·백테스트 보정 정보를 함께 보여주는 Vercel-ready 분석 대시보드입니다.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" href="/dart/forecasts">DART 예측 결과 보기</Link>
          <Link className="secondary-link" href="/dart">DART 실시간 수집</Link>
          <Link className="secondary-link" href={`/events/${sampleEvents[0].id}`}>샘플 예측</Link>
          <Link className="secondary-link" href="/graph">지식그래프</Link>
          <Link className="secondary-link" href="/backtests">백테스트 가중치</Link>
          <Link className="secondary-link" href="/portfolio">포트폴리오 시뮬레이션</Link>
        </div>
      </section>

      <section className="grid two-col">
        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">샘플 이벤트</p>
            <h2>데모 이벤트 큐</h2>
          </div>
          <div className="event-list">
            {sampleEvents.map((event) => (
              <Link href={`/events/${event.id}`} className="event-card" key={event.id}>
                <div>
                  <p className="event-source">{event.source} · {new Date(event.publishedAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}</p>
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
            <p className="eyebrow">리서치 경계</p>
            <h2>MVP 제약</h2>
          </div>
          <ul className="boundary-list">
            {productBoundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}
          </ul>
        </aside>
      </section>
    </main>
  );
}
