import type { CalibrationContext } from "@/lib/types";

type CalibrationPanelProps = {
  calibrations: CalibrationContext[];
};

export function CalibrationPanel({ calibrations }: CalibrationPanelProps) {
  if (calibrations.length === 0) return null;

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">백테스트 보정</p>
        <h2>Magnitude-error 맥락</h2>
      </div>
      <table className="horizon-table">
        <thead>
          <tr>
            <th>가중치</th>
            <th>샘플</th>
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
      <p className="muted">Run: {calibrations[0].runId}. 이 값은 리서치용 보정 인프라이며 매매 신호가 아닙니다.</p>
    </section>
  );
}
