export interface ProjectMeta {
  title: string;
  author: string;
  institution: string;
  academic_session: string;
  guide_name: string;
  total_wells: number;
  total_months: number;
  total_cells: number;
  total_records: number;
  observed_records: number;
  missing_records: number;
  raw_data_size_gb: number;
  test_suite_status: string;
  best_alpha: number;
  key_takeaways: string[];
}

export interface ScorecardItem {
  dimension: string;
  baseline_metric?: string;
  baseline_detail?: string;
  our_metric: string;
  our_detail: string;
  verdict: 'Better' | 'Comparable' | 'Worse';
  winner: string;
  delta: string;
}

export interface LeaderboardRow {
  model: string;
  model_type: string;
  is_proposed: boolean;
  mae: number;
  rmse: number;
  nse: number;
  picp: number | null;
  mpiw: number | null;
  n_samples: number;
}

export interface AblationRow {
  "Configuration / Model": string;
  Task: string;
  "MAE (m)": number;
  "RMSE (m)": number;
  NSE: number;
  "Delta MAE (m)": number;
  "Delta NSE": number;
}

export interface AlphaSweepRow {
  alpha: number;
  train_loss: number;
  temp_val_mae: number;
  temp_val_rmse: number;
  temp_val_nse: number;
  spat_val_mae: number;
  spat_val_rmse: number;
  spat_val_nse: number;
  composite_val_mae: number;
  composite_val_rmse: number;
  training_time_s: number;
}

export interface MultiSeedSummary {
  metric: string;
  mean: number;
  std: number;
}

export interface MultiSeedRun {
  seed: number;
  monitored_mae: number;
  monitored_rmse: number;
  monitored_nse: number;
  query_mae: number;
  query_rmse: number;
  query_nse: number;
}

export interface MultiSeedData {
  summary: MultiSeedSummary[];
  runs: MultiSeedRun[];
}

export interface HorizonRow {
  horizon_months: number;
  monitored_mae: number;
  monitored_rmse: number;
  monitored_nse: number;
  query_mae: number;
  query_rmse: number;
  query_nse: number;
  n_monitored_targets: number;
  n_query_targets: number;
}

export interface ReconstructionRow {
  missing_rate: number;
  missing_pct: string;
  n_realizations: number;
  mae_mean: number;
  mae_std: number;
  rmse_mean: number;
  rmse_std: number;
  nse_mean: number;
  nse_std: number;
}

export interface CalibrationRow {
  Task: string;
  Model: string;
  Split: string;
  Nominal_Target: number;
  s_hat_m: number;
  Pre_Cal_PICP: number;
  Pre_Cal_MPIW: number;
  Post_Cal_PICP: number;
  Post_Cal_MPIW: number;
  N_Samples: number;
}

export interface WellInfo {
  id: string;
  lat: number;
  lon: number;
  utm_x: number;
  utm_y: number;
  district: string;
  basin: string;
  split: 'train' | 'val' | 'test';
  is_core: boolean;
  cell_id: string;
  mean_depth: number | null;
  obs_months: number;
  test_mae: number | null;
}

export interface HydrographPoint {
  month: string;
  observed: number;
  student_mu: number;
  lower_90: number;
  upper_90: number;
  variance: number;
}

export interface SampleHydrograph {
  well_id: string;
  task: 'monitored' | 'query';
  n_obs: number;
  series: HydrographPoint[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  description: string;
}
