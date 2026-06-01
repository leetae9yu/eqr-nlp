import Link from "next/link";
import { Badge } from "@/components/Badge";
import { buildAccuracyScorecard } from "@/lib/accuracy/evaluate";
import type { AccuracyGateState, IndicatorScorecard, MetricGateResult } from "@/lib/accuracy/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const stateCopy: Record<AccuracyGateState, { label: string; tone: string; description: string }> = {
  PASS: { label: "통과", tone: "pass", description: "Pragmatic 기준을 충족했습니다." },
  FAIL: { label: "실패", tone: "fail", description: "필수 지표가 Pragmatic 기준에 미달했습니다." },
  INSUFFICIENT_COVERAGE: { label: "커버리지 부족", tone: "gap", description: "무료/공식 소스 이력 또는 만기 표본이 부족합니다." },
  PENDING: { label: "대기", tone: "pending", description: "예측은 발행됐지만 목표 관측일이 아직 도래하지 않았습니다." },
};

function formatMetric(result: MetricGateResult) {
  if (typeof result.actual !== "number") return "없음";
  const suffix = result.unit === "pct" ? "%" : "";
  return `${result.actual.toFixed(result.unit === "pct" ? 2 : 4)}${suffix}`;
}

function formatWindow(indicator: IndicatorScorecard) {
  if (!indicator.coverage.windowStart || !indicator.coverage.windowEnd) return "수집 이력 없음";
  return `${indicator.coverage.windowStart} → ${indicator.coverage.windowEnd}`;
}

function StateBadge({ state }: { state: AccuracyGateState }) {
  const copy = stateCopy[state];
  return <span className={`state-badge state-${copy.tone}`}>{copy.label}</span>;
}

function IndicatorCard({ indicator }: { indicator: IndicatorScorecard }) {
  const copy = stateCopy[indicator.state];
  return (
    <article className="accuracy-card">
      <div className="accuracy-card-head">
        <div>
          <p className="eyebrow">{indicator.indicatorId}</p>
          <h3>{indicator.label}</h3>
        </div>
        <StateBadge state={indicator.state} />
      </div>
      <p className="muted">{copy.description}</p>
      {indicator.policyNote ? <p className="policy-note">{indicator.policyNote}</p> : null}
      <dl className="metric-list">
        <div><dt>커버리지</dt><dd>{formatWindow(indicator)}</dd></div>
        <div><dt>관측치 / 만기 예측</dt><dd>{indicator.coverage.observationCount}개 / {indicator.coverage.maturedForecastCount}개</dd></div>
        <div><dt>기준선</dt><dd>{indicator.baselineType}</dd></div>
        <div><dt>버전</dt><dd>{indicator.modelVersion} · {indicator.metricVersion}</dd></div>
      </dl>
      <div className="gate-table" role="table" aria-label={`${indicator.label} gate metrics`}>
        <div className="gate-row gate-row-head" role="row">
          <span role="columnheader">지표</span>
          <span role="columnheader">실제</span>
          <span role="columnheader">Pragmatic</span>
          <span role="columnheader">Balanced gap</span>
        </div>
        {indicator.gate.metricResults.length > 0 ? indicator.gate.metricResults.map((metric) => (
          <div className="gate-row" role="row" key={metric.metric}>
            <span role="cell">{metric.metric}</span>
            <span role="cell">{formatMetric(metric)}</span>
            <span role="cell">{metric.comparator === "gte" ? "≥" : "≤"} {metric.pragmatic}{metric.unit === "pct" ? "%" : ""}</span>
            <span role="cell">{metric.balancedGap.toFixed(2)}{metric.unit === "pct" ? "%p" : ""}</span>
          </div>
        )) : <p className="muted">필수 지표를 계산할 표본이 아직 없습니다.</p>}
      </div>
      {indicator.gate.failureReasons.length > 0 || indicator.coverage.warnings.length > 0 ? (
        <ul className="accuracy-warnings">
          {[...indicator.gate.failureReasons, ...indicator.coverage.warnings].map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      ) : null}
    </article>
  );
}

export default async function AccuracyPage() {
  const scorecard = await buildAccuracyScorecard();
  const generatedAt = new Date(scorecard.generatedAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });

  return (
    <main className="shell accuracy-shell">
      <Link className="back-link" href="/dart/forecasts">← DART 예측 결과</Link>
      <section className="hero detail-hero accuracy-hero">
        <p className="eyebrow">Forecast Accuracy Scorecard</p>
        <h1>매크로 바스켓 예측이 기준선보다 나은지 검증합니다.</h1>
        <p>
          Frankfurter와 한국은행 ECOS 이력을 기반으로 walk-forward 기준선 대비 개선율, 방향 정확도, 커버리지 갭을 계산합니다. 전체 통과는 모든 지표가 개별 hard gate를 통과할 때만 가능합니다.
        </p>
        <div className="tag-row">
          <Badge>생성 {generatedAt}</Badge>
          <Badge>모델 {scorecard.modelVersion}</Badge>
          <Badge>임계값 {scorecard.thresholdVersion}</Badge>
        </div>
        <div className="accuracy-summary-card">
          <span>바스켓 상태</span>
          <StateBadge state={scorecard.state} />
          <strong>{stateCopy[scorecard.state].description}</strong>
        </div>
      </section>

      {scorecard.warnings.length > 0 ? (
        <section className="panel warning-panel">
          <div className="section-heading">
            <p className="eyebrow">커버리지 알림</p>
            <h2>운영 정확도 증거로 쓰기 전 해결할 항목</h2>
          </div>
          <ul className="boundary-list">
            {Array.from(new Set(scorecard.warnings)).map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </section>
      ) : null}

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Macro basket scorecard</p>
          <h2>지표별 hard gate</h2>
        </div>
        <div className="accuracy-grid">
          {scorecard.indicators.map((indicator) => <IndicatorCard key={indicator.indicatorId} indicator={indicator} />)}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">해석 경계</p>
          <h2>리서치 검증용 화면입니다</h2>
        </div>
        <p className="muted">
          이 화면은 예측 품질과 데이터 커버리지를 검증하기 위한 리서치 대시보드입니다. 매수/매도 신호, 목표가, 개인화 투자자문, 주문 실행을 제공하지 않습니다.
        </p>
      </section>
    </main>
  );
}
