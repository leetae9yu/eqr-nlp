# Backtesting and Weight Calibration

The forecasting pipeline calibrates relationship weights against realized indicator movement magnitude.

## Primary metrics

- MAE: mean absolute error.
- RMSE: root mean squared error.
- sMAPE: zero-safe percentage-style magnitude error.

Directional hit rate can be shown as secondary context, but magnitude error is the primary label for calibration.

## First implementation

The initial implementation uses frozen fixture windows so tests are deterministic and do not require live data. Each calibrated `Weight` should record its `BacktestRun`, sample size, horizon, target indicator, and metric summary.
