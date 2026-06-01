import Link from "next/link";
import { Badge } from "@/components/Badge";
import { calibrateBacktestWeights } from "@/lib/backtesting/calibrate-weights";

export default function BacktestsPage() {
  const { backtestRun, weightNodes } = calibrateBacktestWeights();

  return (
    <main className="shell">
      <Link className="back-link" href="/">← 대시보드</Link>
      <section className="hero detail-hero">
        <p className="eyebrow">백테스트 보정 가중치</p>
        <h1>명시적인 오차 지표로 signed magnitude를 보정합니다.</h1>
        <p>
          fixture 과거 구간으로 이벤트-지표 가중치를 MAE, RMSE, zero-safe sMAPE 기준으로 보정합니다. 이후 실시간 과거 데이터 backfill이 붙어도 예측 UI 계약은 유지됩니다.
        </p>
        <div className="tag-row">
          <Badge>{backtestRun.weightVersion}</Badge>
          <Badge>{backtestRun.metricSummary.sampleSize}개 예시</Badge>
          <Badge>cutoff {backtestRun.dataCutoff}</Badge>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">가중치</p>
          <h2>보정 결과</h2>
        </div>
        <table className="horizon-table">
          <thead>
            <tr>
              <th>이벤트 종류</th>
              <th>지표</th>
              <th>기간</th>
              <th>가중치</th>
              <th>샘플</th>
              <th>MAE/RMSE/sMAPE</th>
            </tr>
          </thead>
          <tbody>
            {weightNodes.map((weight) => (
              <tr key={weight.id}>
                <td>{weight.fromId.replace("event-kind:", "")}</td>
                <td>{weight.indicatorId}</td>
                <td>{weight.horizon}</td>
                <td>{weight.weight.toFixed(3)}</td>
                <td>{weight.sampleSize}</td>
                <td>{weight.mae} / {weight.rmse} / {weight.smape}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
