import Link from "next/link";
import { Badge } from "@/components/Badge";
import { calibrateBacktestWeights } from "@/lib/backtesting/calibrate-weights";

export default function BacktestsPage() {
  const { backtestRun, weightNodes } = calibrateBacktestWeights();

  return (
    <main className="shell">
      <Link className="back-link" href="/">← Dashboard</Link>
      <section className="hero detail-hero">
        <p className="eyebrow">Backtest-calibrated weights</p>
        <h1>Estimate signed magnitude with explicit error metrics.</h1>
        <p>
          Fixture historical windows calibrate event-to-indicator weights with MAE, RMSE, and zero-safe sMAPE.
          Live historical backfills can replace these fixtures without changing the forecast UI contract.
        </p>
        <div className="tag-row">
          <Badge>{backtestRun.weightVersion}</Badge>
          <Badge>{backtestRun.metricSummary.sampleSize} examples</Badge>
          <Badge>cutoff {backtestRun.dataCutoff}</Badge>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Weights</p>
          <h2>Calibration output</h2>
        </div>
        <table className="horizon-table">
          <thead>
            <tr>
              <th>Event kind</th>
              <th>Indicator</th>
              <th>Horizon</th>
              <th>Weight</th>
              <th>Samples</th>
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
