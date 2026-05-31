import type { CalibrationContext } from "@/lib/types";

type CalibrationPanelProps = {
  calibrations: CalibrationContext[];
};

export function CalibrationPanel({ calibrations }: CalibrationPanelProps) {
  if (calibrations.length === 0) return null;

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Backtest calibration</p>
        <h2>Magnitude-error context</h2>
      </div>
      <table className="horizon-table">
        <thead>
          <tr>
            <th>Weight</th>
            <th>Samples</th>
            <th>MAE</th>
            <th>RMSE</th>
            <th>sMAPE</th>
          </tr>
        </thead>
        <tbody>
          {calibrations.map((item) => (
            <tr key={item.weightId}>
              <td>{item.weight.toFixed(3)}</td>
              <td>{item.sampleSize}</td>
              <td>{item.mae}</td>
              <td>{item.rmse}</td>
              <td>{item.smape}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Run: {calibrations[0].runId}. This is fixture-calibrated research infrastructure, not a trading signal.</p>
    </section>
  );
}
