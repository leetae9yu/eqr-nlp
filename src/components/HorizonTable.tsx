import type { HorizonForecast } from "@/lib/types";

export function HorizonTable({ forecasts }: { forecasts: HorizonForecast[] }) {
  return (
    <table className="horizon-table">
      <thead>
        <tr>
          <th>Horizon</th>
          <th>Direction</th>
          <th>Impact</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>
        {forecasts.map((forecast) => (
          <tr key={forecast.horizon}>
            <td>{forecast.horizon}</td>
            <td>{forecast.direction}</td>
            <td>{forecast.impact > 0 ? "+" : ""}{forecast.impact.toFixed(1)}</td>
            <td>{Math.round(forecast.confidence * 100)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
