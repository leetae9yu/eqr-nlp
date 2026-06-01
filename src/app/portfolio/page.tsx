import Link from "next/link";
import { Badge } from "@/components/Badge";
import { sampleEvents } from "@/lib/events";
import { analyzeEvent } from "@/lib/forecast";
import { simulateHypotheticalPortfolio } from "@/lib/portfolio/simulator";

export default async function PortfolioSimulationPage() {
  const analysis = await analyzeEvent(sampleEvents[0]);
  const scenario = simulateHypotheticalPortfolio(analysis);

  return (
    <main className="shell">
      <Link className="back-link" href="/">← 대시보드</Link>
      <section className="hero detail-hero">
        <p className="eyebrow">가상 포트폴리오 시뮬레이션</p>
        <h1>매매 워크플로 없이 시나리오 노출만 추정합니다.</h1>
        <p>
          리서치 전용 basket이 매크로 영향 예측을 가상 exposure delta로 변환합니다. 브로커 연결, 주문, 개인화 추천, 목표주가는 제공하지 않습니다.
        </p>
        <div className="tag-row">
          <Badge>{scenario.simulationResult.horizon}</Badge>
          <Badge>신뢰도 {Math.round(scenario.simulationResult.confidence * 100)}%</Badge>
          <Badge>시뮬레이션 전용</Badge>
        </div>
      </section>

      <section className="grid two-col">
        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">시나리오 결과</p>
            <h2>{scenario.name}</h2>
          </div>
          <div className="score score-mixed">
            <span>추정 delta</span>
            <strong>{scenario.simulationResult.estimatedDelta.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}</strong>
          </div>
          <p className="muted">{scenario.disclaimer}</p>
        </div>

        <aside className="panel">
          <div className="section-heading">
            <p className="eyebrow">가정</p>
            <h2>시뮬레이션 전용 통제</h2>
          </div>
          <ul className="boundary-list">
            {scenario.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
          </ul>
        </aside>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">가상 포지션</p>
          <h2>리서치 basket 입력값</h2>
        </div>
        <table className="horizon-table">
          <thead>
            <tr>
              <th>라벨</th>
              <th>자산군</th>
              <th>명목금액</th>
              <th>민감도</th>
            </tr>
          </thead>
          <tbody>
            {scenario.positions.map((position) => (
              <tr key={position.label}>
                <td>{position.label}</td>
                <td>{position.assetClass}</td>
                <td>{position.notional.toLocaleString("ko-KR")}</td>
                <td>{position.sensitivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
