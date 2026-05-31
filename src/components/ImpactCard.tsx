import { HorizonTable } from "./HorizonTable";
import { MiniChart } from "./MiniChart";
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
          <h3>{forecast.label}</h3>
        </div>
        <div className={`score score-${forecast.direction}`}>
          <span>{directionSymbol(forecast.direction)}</span>
          <strong>{forecast.impactScore > 0 ? "+" : ""}{forecast.impactScore.toFixed(1)}</strong>
        </div>
      </div>
      <p className="muted">Baseline: {forecast.baseline} {forecast.unit} · confidence {Math.round(forecast.confidence * 100)}%</p>
      <HorizonTable forecasts={forecast.forecasts} />
      <MiniChart series={forecast.series} label={forecast.label} />
      <details>
        <summary>Rationales and uncertainty</summary>
        <ul>
          {forecast.forecasts.map((item) => <li key={item.horizon}>{item.rationale}</li>)}
          {forecast.uncertainty.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>
    </article>
  );
}
