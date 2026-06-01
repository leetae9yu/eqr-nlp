create table if not exists accuracy_source_runs (
  source_run_id text primary key,
  source_id text not null,
  source_version text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  status text not null check (status in ('ok', 'coverage_gap', 'error')),
  warnings jsonb not null default '[]'::jsonb
);

create table if not exists accuracy_observations (
  observation_id text primary key,
  indicator_id text not null,
  observed_at text not null,
  value double precision not null,
  source_id text not null,
  source_version text not null,
  retrieved_at timestamptz not null,
  unit text not null
);

create index if not exists accuracy_observations_indicator_date_idx
  on accuracy_observations (indicator_id, observed_at);

create table if not exists accuracy_forecast_targets (
  forecast_id text primary key,
  issued_at timestamptz not null,
  source_run_id text not null references accuracy_source_runs(source_run_id),
  event_id text,
  document_id text,
  indicator_id text not null,
  horizon text not null,
  target_date text not null,
  baseline_value double precision not null,
  predicted_value double precision,
  predicted_delta double precision,
  predicted_direction text not null,
  confidence double precision not null,
  model_version text not null,
  metric_version text not null,
  source_version text not null
);

create index if not exists accuracy_forecast_targets_indicator_target_idx
  on accuracy_forecast_targets (indicator_id, target_date);

create table if not exists accuracy_matched_observations (
  forecast_id text primary key references accuracy_forecast_targets(forecast_id),
  matched_observation_id text references accuracy_observations(observation_id),
  observed_value double precision,
  observed_direction text,
  evaluation_state text not null check (evaluation_state in ('PASS', 'FAIL', 'INSUFFICIENT_COVERAGE', 'PENDING')),
  evaluated_at timestamptz
);

create table if not exists accuracy_evaluation_runs (
  evaluation_run_id text primary key,
  run_at timestamptz not null,
  metric_version text not null,
  model_version text not null,
  source_run_ids jsonb not null default '[]'::jsonb,
  window_start text,
  window_end text
);

create table if not exists accuracy_metric_results (
  id bigserial primary key,
  evaluation_run_id text not null references accuracy_evaluation_runs(evaluation_run_id),
  indicator_id text not null,
  horizon text not null default '',
  metric text not null,
  value double precision not null,
  baseline_value double precision,
  sample_size integer not null,
  unique (evaluation_run_id, indicator_id, horizon, metric)
);
