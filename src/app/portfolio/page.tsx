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
      <Link className="back-link" href="/">← Dashboard</Link>
      <section className="hero detail-hero">
        <p className="eyebrow">Hypothetical portfolio simulation</p>
        <h1>Estimate scenario exposure without trading workflows.</h1>
        <p>
          A research-only basket converts macro-impact forecasts into a hypothetical exposure delta.
          There are no broker connections, orders, personalized recommendations, or target prices.
        </p>
        <div className="tag-row">
          <Badge>{scenario.simulationResult.horizon}</Badge>
          <Badge>confidence {Math.round(scenario.simulationResult.confidence * 100)}%</Badge>
          <Badge>simulation only</Badge>
        </div>
      </section>

      <section className="grid two-col">
        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">Scenario result</p>
            <h2>{scenario.name}</h2>
          </div>
          <div className="score score-mixed">
            <span>estimated delta</span>
            <strong>{scenario.simulationResult.estimatedDelta.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong>
          </div>
          <p className="muted">{scenario.disclaimer}</p>
        </div>

        <aside className="panel">
          <div className="section-heading">
            <p className="eyebrow">Assumptions</p>
            <h2>Simulation-only controls</h2>
          </div>
          <ul className="boundary-list">
            {scenario.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
          </ul>
        </aside>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Hypothetical positions</p>
          <h2>Research basket inputs</h2>
        </div>
        <table className="horizon-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Asset class</th>
              <th>Notional</th>
              <th>Sensitivity</th>
            </tr>
          </thead>
          <tbody>
            {scenario.positions.map((position) => (
              <tr key={position.label}>
                <td>{position.label}</td>
                <td>{position.assetClass}</td>
                <td>{position.notional.toLocaleString("en-US")}</td>
                <td>{position.sensitivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
