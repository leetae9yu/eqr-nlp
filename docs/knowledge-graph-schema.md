# Knowledge Graph Schema

EQR NLP's next MVP models public evidence as a hybrid knowledge graph while keeping the default implementation free-tier and deterministic.

## Nodes

- `Source`: RSS, GDELT-like, DART, fixture, or manual provider. Paid sources require explicit approval.
- `Document`: article, feed item, filing, or disclosure with URL, citation, hash, and retrieval timestamp.
- `Entity`: company, country, sector, commodity, institution, policy body, or macro indicator mention.
- `Event`: normalized disclosure, policy, trade, inflation, liquidity, rates, FX, or macro event.
- `Indicator`: forecast target such as USD/KRW, base-rate expectation, treasury yield, or M2/liquidity.
- `Observation`: dated time-series value for an indicator.
- `Weight`: calibrated relationship weight linked to a backtest run and magnitude-error metrics.
- `Forecast`: generated indicator forecast with horizon, predicted magnitude, confidence, limitations, and evidence path.
- `BacktestRun`: historical calibration/evaluation window and metric summary.
- `PortfolioScenario`: hypothetical scenario simulation only; never order execution or personalized advice.

## Relationships

```text
(Source)-[:PUBLISHED]->(Document)
(Document)-[:MENTIONS]->(Entity)
(Document)-[:EVIDENCES]->(Event)
(Event)-[:AFFECTS]->(Indicator)
(Indicator)-[:HAS_OBSERVATION]->(Observation)
(Forecast)-[:PREDICTS]->(Indicator)
(Forecast)-[:USES_EVENT]->(Event)
(Forecast)-[:USES_WEIGHT]->(Weight)
(Forecast)-[:CITES]->(Document)
(BacktestRun)-[:CALIBRATED]->(Weight)
(BacktestRun)-[:EVALUATED]->(Forecast)
(PortfolioScenario)-[:USES_FORECAST]->(Forecast)
```

## Storage stance

The first implementation uses `MemoryGraphStore` for deterministic local development and tests. It is non-durable and must not be represented as production persistence. Neo4j Aura Free or another free graph service can be evaluated later through the same `GraphStore` contract, but paid graph services require explicit approval.
