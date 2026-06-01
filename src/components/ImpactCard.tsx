import { HorizonTable } from "./HorizonTable";
import { MiniChart } from "./MiniChart";
import { directionLabelKo, indicatorLabelKo } from "@/lib/korean-labels";
import type { IndicatorForecast } from "@/lib/types";

function directionSymbol(direction: IndicatorForecast["direction"]) {
  if (direction === "up") return "↗";
  if (direction === "down") return "↘";
  if (direction === "flat") return "→";
  return "↔";
}

export function ImpactCard({ forecast }: { forecast: IndicatorForecast }) {
  return (
    <article className="impact-card">
      <div className="impact-card-header">
        <div>
          <p className="eyebrow">{forecast.indicator}</p>
          <h3>{indicatorLabelKo(forecast.indicator)}</h3>
        </div>
        <div className={`score score-${forecast.direction}`}>
          <span>{directionSymbol(forecast.direction)}</span>
          <strong>{forecast.impactScore > 0 ? "+" : ""}{forecast.impactScore.toFixed(1)}</strong>
        </div>
      </div>
      <p className="muted">기준값: {forecast.baseline} {forecast.unit} · 기준일 {forecast.series.at(-1)?.date ?? "미상"} · 출처 {forecast.evidence.find((item) => item.label === forecast.label)?.source ?? "미상"} · 신뢰도 {Math.round(forecast.confidence * 100)}% · 방향 {directionLabelKo(forecast.direction)}</p>
      <HorizonTable forecasts={forecast.forecasts} />
      <MiniChart series={forecast.series} label={forecast.label} />
      <details>
        <summary>근거 로직과 불확실성</summary>
        <ul>
          {forecast.forecasts.map((item) => <li key={item.horizon}>{item.rationale}</li>)}
          {forecast.uncertainty.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>
    </article>
  );
}
