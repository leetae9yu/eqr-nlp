import Link from "next/link";
import { Badge } from "@/components/Badge";
import { hasDartApiKey } from "@/lib/env";
import { getGraphStatusFromSource } from "@/lib/kg/graph-provenance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GraphPage() {
  const sourceMode = hasDartApiKey() ? "dart-live" : "fixture";
  const status = await getGraphStatusFromSource(sourceMode, 10);
  const countEntries = Object.entries(status.counts).filter(([, value]) => value > 0);

  return (
    <main className="shell">
      <Link className="back-link" href="/">← 대시보드</Link>
      <section className="hero detail-hero">
        <p className="eyebrow">지식그래프 provenance</p>
        <h1>소스 문서가 매크로 지표 가설로 이어지는 경로를 추적합니다.</h1>
        <p>
          서버 환경에 DART_API_KEY가 있으면 실시간 OpenDART 수집을 사용하고, 없으면 fixture로 대체합니다.
          free-tier graph DB를 붙이기 전까지 저장소는 메모리 전용이며 영구 저장되지 않습니다.
        </p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">그래프 상태</p>
          <h2>노드 커버리지</h2>
        </div>
        <div className="tag-row">
          <Badge>{status.sourceMode}</Badge>
          <Badge>{status.storageMode}</Badge>
          <Badge>생성 {new Date(status.generatedAt).toLocaleDateString("ko-KR")}</Badge>
          {countEntries.map(([kind, count]) => <Badge key={kind}>{kind}: {count}</Badge>)}
        </div>
      </section>

      <section className="grid two-col">
        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">근거 경로</p>
            <h2>소스 → 문서 → 이벤트 → 지표</h2>
          </div>
          <div className="event-list">
            {status.indicatorPaths.slice(0, 8).map((path) => (
              <article className="event-card" key={`${path.indicatorId}-${path.documentTitle}-${path.eventLabel}`}>
                <div>
                  <p className="event-source">{path.sourceName} · {path.indicatorLabel}</p>
                  <h3>{path.documentTitle}</h3>
                  <p>{path.eventLabel}</p>
                  <p className="muted">인용: {path.citation}</p>
                </div>
                <div className="tag-row">
                  {path.relationshipIds.map((id) => <Badge key={id}>{id.split(":")[0]}</Badge>)}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel">
          <div className="section-heading">
            <p className="eyebrow">소스</p>
            <h2>커버리지</h2>
          </div>
          <ul className="boundary-list">
            {status.sourceCoverage.map((coverage) => (
              <li key={coverage.source.id}>
                {coverage.source.name}: 문서 {coverage.documentCount}개, 이벤트 {coverage.eventCount}개,
                {" "}엔티티 {coverage.entityCount}개.
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
