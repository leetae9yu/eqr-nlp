import Link from "next/link";
import { Badge } from "@/components/Badge";
import { CalibrationPanel } from "@/components/CalibrationPanel";
import { EvidencePanel } from "@/components/EvidencePanel";
import { ImpactCard } from "@/components/ImpactCard";
import { getDartForecastBundle } from "@/lib/dart/dart-forecast";
import { hasDartApiKey } from "@/lib/env";
import { parseLimit } from "@/lib/sources/source-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const item = params[key];
  return Array.isArray(item) ? item[0] : item;
}

export default async function DartForecastsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const limit = parseLimit(value(params, "limit"), 5, 25);
  const bundle = await getDartForecastBundle({
    corpCode: value(params, "corpCode"),
    startDate: value(params, "startDate"),
    endDate: value(params, "endDate"),
    limit,
  });
  const firstAnalysis = bundle.analyses[0];
  const calibrations = firstAnalysis ? Array.from(
    new Map(
      firstAnalysis.forecasts
        .flatMap((forecast) => forecast.forecasts.flatMap((horizon) => horizon.calibration ? [horizon.calibration] : []))
        .map((item) => [item.weightId, item]),
    ).values(),
  ) : [];
  const evidence = firstAnalysis ? Array.from(
    new Map(
      firstAnalysis.forecasts
        .flatMap((forecast) => forecast.evidence)
        .map((item) => [`${item.label}|${item.url}|${item.quote}`, item]),
    ).values(),
  ) : [];

  return (
    <main className="shell">
      <div className="page-link-row"><Link className="back-link" href="/dart">← DART 수집 화면</Link><Link className="secondary-link" href="/accuracy">정확도 검증 보기</Link></div>
      <section className="hero detail-hero">
        <p className="eyebrow">DART 기반 예측 결과</p>
        <h1>실시간 공시를 매크로 바스켓 예측으로 변환합니다.</h1>
        <p>
          Vercel 서버 환경의 <code>DART_API_KEY</code>로 공시를 가져오고, 온톨로지 품질 게이트를 통과한 문서를 예측용 이벤트로 변환한 뒤 USD/KRW, 기준금리 기대, 국고채 금리, M2 유동성 영향을 계산합니다.
        </p>
        <div className="tag-row">
          <Badge>{hasDartApiKey() ? "DART 키 설정됨" : "DART 키 없음"}</Badge>
          <Badge>{bundle.sourceResult.availability.ok ? "OpenDART 연결됨" : "OpenDART 미연결"}</Badge>
          <Badge>{bundle.sourceResult.documents.length}개 공시 수집</Badge>
          <Badge>{bundle.analyses.length}개 예측 생성</Badge>
        </div>
      </section>

      {bundle.warnings.length > 0 || !bundle.sourceResult.availability.ok ? (
        <section className="panel warning-panel">
          <div className="section-heading">
            <p className="eyebrow">상태</p>
            <h2>실시간 수집/승격 알림</h2>
          </div>
          <ul className="boundary-list">
            {!bundle.sourceResult.availability.ok && bundle.sourceResult.availability.reason ? <li>{bundle.sourceResult.availability.reason}</li> : null}
            {bundle.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </section>
      ) : null}

      {firstAnalysis ? (
        <>
          <section className="hero detail-hero">
            <p className="eyebrow">대표 공시 · {new Date(firstAnalysis.event.publishedAt).toLocaleDateString("ko-KR")}</p>
            <h1>{firstAnalysis.event.title}</h1>
            <p>{firstAnalysis.event.summary}</p>
            <a className="secondary-link" href={firstAnalysis.event.url} target="_blank" rel="noreferrer">DART 원문 열기</a>
          </section>

          <section className="panel">
            <div className="section-heading">
              <p className="eyebrow">매크로 바스켓</p>
              <h2>DART 공시 기반 다중 기간 영향 점수</h2>
            </div>
            <div className="impact-grid">
              {firstAnalysis.forecasts.map((forecast) => <ImpactCard key={forecast.indicator} forecast={forecast} />)}
            </div>
          </section>

          <EvidencePanel evidence={evidence} />
          <CalibrationPanel calibrations={calibrations} />
        </>
      ) : (
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">예측 없음</p>
            <h2>DART 공시 기반 예측을 아직 생성하지 못했습니다.</h2>
          </div>
          <p className="muted">DART_API_KEY 설정, 조회 기간, corpCode 조건을 확인하세요. 키가 없으면 배포는 성공하지만 실시간 예측은 생성되지 않습니다.</p>
        </section>
      )}

      {bundle.analyses.length > 1 ? (
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">추가 공시</p>
            <h2>같은 요청에서 생성된 다른 예측 후보</h2>
          </div>
          <div className="event-list">
            {bundle.analyses.slice(1).map((analysis) => (
              <a className="event-card" key={analysis.event.id} href={analysis.event.url} target="_blank" rel="noreferrer">
                <div>
                  <p className="event-source">{analysis.event.source} · {new Date(analysis.event.publishedAt).toLocaleDateString("ko-KR")}</p>
                  <h3>{analysis.event.title}</h3>
                  <p>{analysis.event.summary}</p>
                </div>
                <div className="tag-row">
                  {analysis.event.tags.slice(0, 6).map((tag) => <Badge key={`${analysis.event.id}-${tag}`}>{tag}</Badge>)}
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
