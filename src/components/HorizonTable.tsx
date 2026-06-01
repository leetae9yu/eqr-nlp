import { directionLabelKo, horizonLabelKo } from "@/lib/korean-labels";
import type { HorizonForecast } from "@/lib/types";

export function HorizonTable({ forecasts }: { forecasts: HorizonForecast[] }) {
  return (
    <table className="horizon-table">
      <thead>
        <tr>
          <th>기간</th>
          <th>방향</th>
          <th>영향</th>
          <th>신뢰도</th>
        </tr>
      </thead>
      <tbody>
        {forecasts.map((forecast) => (
          <tr key={forecast.horizon}>
            <td>{horizonLabelKo(forecast.horizon)}</td>
            <td>{directionLabelKo(forecast.direction)}</td>
            <td>{forecast.impact > 0 ? "+" : ""}{forecast.impact.toFixed(1)}</td>
            <td>{Math.round(forecast.confidence * 100)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
