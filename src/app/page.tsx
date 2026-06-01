import Link from "next/link";
import { Badge } from "@/components/Badge";
import { sampleEvents } from "@/lib/events";

const proofCards = [
  { label: "실시간 입력", value: "DART + ECOS", detail: "공시·거시지표를 매일 갱신" },
  { label: "예측 바스켓", value: "4 indicators", detail: "환율·금리·국고채·M2" },
  { label: "검증 방식", value: "Walk-forward", detail: "Neon ledger에 평가 누적" },
] as const;

const graphNodes = [
  { name: "DART 공시", className: "node-source", style: { left: "9%", top: "18%" } },
  { name: "뉴스 이벤트", className: "node-source", style: { left: "8%", top: "64%" } },
  { name: "기업/섹터", className: "node-entity", style: { left: "36%", top: "13%" } },
  { name: "거시 변수", className: "node-macro", style: { left: "38%", top: "58%" } },
  { name: "예측 점수", className: "node-score", style: { left: "68%", top: "25%" } },
  { name: "근거·정확도", className: "node-proof", style: { left: "67%", top: "68%" } },
] as const;

const journey = [
  {
    title: "공시와 이벤트를 수집",
    detail: "DART 공시, 공개 뉴스, ECOS 지표를 하나의 리서치 입력으로 정리합니다.",
    href: "/dart",
    cta: "수집 상태 보기",
  },
  {
    title: "온톨로지로 맥락 연결",
    detail: "기업·섹터·이벤트·거시 변수를 노드와 엣지로 묶어 영향 경로를 추적합니다.",
    href: "/graph",
    cta: "그래프 보기",
  },
  {
    title: "예측과 검증을 함께 표시",
    detail: "방향성, 신뢰도, 불확실성, walk-forward 검증 신호를 같은 화면에서 확인합니다.",
    href: "/accuracy",
    cta: "검증 보기",
  },
] as const;

export default function HomePage() {
  const featuredEvent = sampleEvents[0];

  return (
    <main className="shell landing-shell">
      <section className="hero landing-hero">
        <div className="landing-hero-copy">
          <p className="eyebrow">EQR NLP · 한국 매크로 예측 리서치</p>
          <h1>공시·뉴스·거시지표를 연결해 예측 근거와 정확도까지 보여줍니다.</h1>
          <p>
            DART 이벤트와 공개 지표를 온톨로지로 묶고, USD/KRW·기준금리 기대·국고채 3년·M2 유동성 영향도를 설명 가능한 리서치 화면으로 정리합니다.
          </p>
          <div className="hero-actions landing-primary-actions" aria-label="핵심 행동">
            <Link className="primary-link" href="/dart/forecasts">예측 결과 보기</Link>
            <Link className="secondary-link" href="/accuracy">정확도 보기</Link>
          </div>
        </div>

        <div className="landing-hero-visual" aria-label="제품 핵심 신호">
          <div className="signal-card signal-card-main">
            <span>오늘의 리서치 큐</span>
            <strong>{featuredEvent.title}</strong>
            <p>{featuredEvent.summary}</p>
            <div className="tag-row">
              {featuredEvent.tags.slice(0, 4).map((tag) => <Badge key={tag}>{tag}</Badge>)}
            </div>
          </div>
          <div className="signal-strip">
            <div>
              <span>USD/KRW</span>
              <strong>상방 압력</strong>
            </div>
            <div>
              <span>신뢰도</span>
              <strong>근거 표시</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-proof-grid" aria-label="제품 신뢰 신호">
        {proofCards.map((card) => (
          <article className="proof-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel graph-showcase">
        <div className="section-heading">
          <p className="eyebrow">Ontology Graph</p>
          <h2>Obsidian처럼 연결을 먼저 보여줍니다.</h2>
          <p className="muted">
            긴 표를 먼저 펼치지 않고, 공시·이벤트·기업·거시 변수·예측 근거가 어떤 경로로 연결되는지 노드 그래프로 요약합니다.
          </p>
        </div>
        <div className="knowledge-map" aria-label="온톨로지 지식그래프 예시">
          <svg className="knowledge-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M18 26 C28 20, 32 19, 42 21" />
            <path d="M18 70 C29 61, 33 61, 43 66" />
            <path d="M45 24 C54 25, 61 28, 71 34" />
            <path d="M47 65 C56 58, 62 50, 72 36" />
            <path d="M73 38 C80 47, 80 58, 73 72" />
            <path d="M43 25 C39 36, 39 48, 44 62" />
          </svg>
          {graphNodes.map((node) => (
            <span className={`knowledge-node ${node.className}`} style={node.style} key={node.name}>
              {node.name}
            </span>
          ))}
        </div>
      </section>

      <section className="grid three-col landing-journey" aria-label="제품 흐름">
        {journey.map((item) => (
          <article className="panel journey-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            <Link className="text-link" href={item.href}>{item.cta} →</Link>
          </article>
        ))}
      </section>

      <section className="panel landing-depth">
        <div className="page-link-row">
          <div className="section-heading">
            <p className="eyebrow">Analyst workspace</p>
            <h2>깊은 분석은 유지하고, 첫 인상은 가볍게.</h2>
          </div>
          <Link className="secondary-link" href="/portfolio">포트폴리오 시뮬레이션</Link>
        </div>
        <div className="landing-depth-grid">
          <Link href="/backtests" className="event-card">
            <span className="event-source">Calibration</span>
            <h3>백테스트 가중치</h3>
            <p>모델 가중치와 오차 신호는 별도 리서치 화면에서 확인합니다.</p>
          </Link>
          <Link href={`/events/${featuredEvent.id}`} className="event-card">
            <span className="event-source">Evidence detail</span>
            <h3>이벤트별 근거</h3>
            <p>샘플 이벤트의 증거, horizon별 영향, 애널리스트 노트를 확인합니다.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
