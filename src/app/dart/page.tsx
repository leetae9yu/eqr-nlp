import Link from "next/link";
import { Badge } from "@/components/Badge";
import { hasDartApiKey } from "@/lib/env";
import { getDartGraphStatus } from "@/lib/kg/graph-provenance";
import { promotionStatusLabelKo } from "@/lib/korean-labels";
import { buildOntologyPromotionPackage } from "@/lib/ontology/ontology-factory";
import { OpenDartAdapter } from "@/lib/sources/dart-adapter";
import { parseLimit } from "@/lib/sources/source-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const item = params[key];
  return Array.isArray(item) ? item[0] : item;
}

export default async function DartPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const limit = parseLimit(value(params, "limit"), 20, 100);
  const input = {
    corpCode: value(params, "corpCode"),
    startDate: value(params, "startDate"),
    endDate: value(params, "endDate"),
    limit,
  };
  const adapter = new OpenDartAdapter();
  const result = await adapter.fetchDocuments(input);
  const graphStatus = await getDartGraphStatus(Math.min(limit, 20));
  const ontologyPack = await buildOntologyPromotionPackage(result.documents, "eqr-dart-live-request-pack");
  const keyConfigured = hasDartApiKey();

  return (
    <main className="shell">
      <Link className="back-link" href="/">← 대시보드</Link>
      <section className="hero detail-hero">
        <p className="eyebrow">OpenDART 실시간 수집</p>
        <h1>Vercel 서버 환경 변수에서 DART 공시를 읽습니다.</h1>
        <p>
          서버 측 <code>DART_API_KEY</code>를 우선 사용하고, 없으면 <code>OPENDART_API_KEY</code>를 사용합니다. 공시를 문서로 변환한 뒤 동일한 지식그래프 추출 파이프라인과 온톨로지 품질 게이트를 실행합니다.
        </p>
        <div className="tag-row">
          <Badge>{keyConfigured ? "DART 키 설정됨" : "DART 키 없음"}</Badge>
          <Badge>{result.availability.ok ? "OpenDART 연결됨" : "OpenDART 미연결"}</Badge>
          <Badge>{result.documents.length}개 공시</Badge>
          <Badge>{graphStatus.counts.event}개 이벤트 추출</Badge>
          <Badge>{ontologyPack.qualityReport.totalPromoted}개 claim 승격</Badge>
        </div>
        <div className="hero-actions">
          <Link className="primary-link" href="/dart/forecasts">DART 예측 결과 보기</Link>
          <a className="secondary-link" href="/api/dart/ontology-pack">온톨로지 팩 JSON</a>
        </div>
      </section>

      {result.warnings.length > 0 || graphStatus.warnings.length > 0 ? (
        <section className="panel warning-panel">
          <div className="section-heading">
            <p className="eyebrow">알림</p>
            <h2>런타임 상태</h2>
          </div>
          <ul className="boundary-list">
            {[...result.warnings, ...graphStatus.warnings].map((warning) => <li key={warning}>{warning}</li>)}
            {!result.availability.ok && result.availability.reason ? <li>{result.availability.reason}</li> : null}
          </ul>
        </section>
      ) : null}

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">온톨로지 팩토리</p>
          <h2>후보 → 검증 → 승격 수명주기</h2>
        </div>
        <div className="tag-row">
          <Badge>{ontologyPack.manifest.version}</Badge>
          <Badge>근거 {ontologyPack.qualityReport.totalEvidence}</Badge>
          <Badge>가설 {ontologyPack.qualityReport.totalClaims}</Badge>
          <Badge>승격 {ontologyPack.qualityReport.totalPromoted}</Badge>
          <Badge>거절 {ontologyPack.qualityReport.totalRejected}</Badge>
          <Badge>게이트 통과 {Math.round(ontologyPack.qualityReport.gatePassRate * 100)}%</Badge>
        </div>
        <p className="muted">
          <a href="/api/dart/ontology-pack">온톨로지 팩 JSON 다운로드</a> ·{" "}
          <a href="/api/dart/ontology-pack?format=jsonl">노드 JSONL 다운로드</a>
        </p>
      </section>

      <section className="grid two-col">
        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">공시 문서</p>
            <h2>최근 DART 문서</h2>
          </div>
          <div className="event-list">
            {result.documents.map((document) => (
              <a className="event-card" href={document.url} key={document.id} target="_blank" rel="noreferrer">
                <div>
                  <p className="event-source">{document.sourceId} · {new Date(document.publishedAt).toLocaleDateString("ko-KR")}</p>
                  <h3>{document.title}</h3>
                  <p>{document.summary}</p>
                  <p className="muted">{document.citation}</p>
                </div>
              </a>
            ))}
            {result.documents.length === 0 ? <p className="muted">이 쿼리에서 반환된 실시간 DART 공시가 없습니다.</p> : null}
          </div>
        </div>

        <aside className="panel">
          <div className="section-heading">
            <p className="eyebrow">지식그래프 수집</p>
            <h2>실시간 그래프 개수</h2>
          </div>
          <ul className="boundary-list">
            {Object.entries(graphStatus.counts).filter(([, count]) => count > 0).map(([kind, count]) => (
              <li key={kind}>{kind}: {count}</li>
            ))}
          </ul>
          <div className="section-heading" style={{ marginTop: 24 }}>
            <p className="eyebrow">승격 결정</p>
            <h2>품질 게이트</h2>
          </div>
          <ul className="boundary-list">
            {ontologyPack.promotions.slice(0, 8).map((promotion) => (
              <li key={promotion.id}>
                {promotionStatusLabelKo(promotion.status)}: {promotion.claimId.replace("ontology-claim:", "")}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
