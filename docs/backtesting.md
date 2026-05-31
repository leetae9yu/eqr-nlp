# Backtesting and Weight Calibration

The forecasting pipeline calibrates relationship weights against realized indicator movement magnitude.

## Primary metrics

- MAE: mean absolute error.
- RMSE: root mean squared error.
- sMAPE: zero-safe percentage-style magnitude error.

Directional hit rate can be shown as secondary context, but magnitude error is the primary label for calibration.

## Current implementation

- `src/lib/backtesting/metrics.ts` implements MAE, RMSE, and zero-safe sMAPE.
- `src/lib/backtesting/historical-fixtures.ts` freezes deterministic examples for the MVP.
- `src/lib/backtesting/calibrate-weights.ts` creates a `BacktestRunNode` and `WeightNode` records.
- Forecast DTOs expose calibration context per horizon when a matching fixture-calibrated weight exists.

## Requirements for future live calibration

Each calibrated `Weight` must record its `BacktestRun`, sample size, horizon, target indicator, and metric summary. Future live backfills should keep deterministic test fixtures alongside real-data jobs so the Vercel demo remains reproducible without credentials.
