"""Standard evaluation metrics for groundwater level regression.

Implements Methodology Section E:
- MAE (meters)
- RMSE (meters)
- NSE (Nash-Sutcliffe Efficiency, Eq. 7)
- PICP (Prediction Interval Coverage Probability)
- MPIW (Mean Prediction Interval Width)
- Pooled and equally-weighted per-well evaluations.
- Per-well NSE requires >= 6 targets and non-zero target variance.
"""
import numpy as np
import pandas as pd

def compute_mae(y_true, y_pred):
    """Mean Absolute Error in meters."""
    return float(np.mean(np.abs(y_true - y_pred)))

def compute_rmse(y_true, y_pred):
    """Root Mean Squared Error in meters."""
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

def compute_nse(y_true, y_pred):
    """Nash-Sutcliffe Efficiency (NSE = 1 - SS_res / SS_tot)."""
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    if ss_tot == 0.0:
        return np.nan
    return float(1.0 - ss_res / ss_tot)

def compute_picp(y_true, lower, upper):
    """Prediction Interval Coverage Probability (fraction of targets in [lower, upper])."""
    covered = (y_true >= lower) & (y_true <= upper)
    return float(np.mean(covered))

def compute_mpiw(lower, upper):
    """Mean Prediction Interval Width in meters."""
    return float(np.mean(upper - lower))

def evaluate_predictions_df(df, target_col='y_true', pred_col='y_pred', well_col='well_id', min_nse_targets=6):
    """Compute pooled and equally-weighted per-well metrics on a predictions dataframe."""
    valid_df = df.dropna(subset=[target_col, pred_col]).copy()
    if len(valid_df) == 0:
        return {
            'n_targets': 0, 'n_wells': 0,
            'pooled_mae': np.nan, 'pooled_rmse': np.nan, 'pooled_nse': np.nan,
            'well_mae': np.nan, 'well_rmse': np.nan, 'well_nse': np.nan
        }

    y_t = valid_df[target_col].values
    y_p = valid_df[pred_col].values

    # Pooled metrics
    pooled_mae = compute_mae(y_t, y_p)
    pooled_rmse = compute_rmse(y_t, y_p)
    pooled_nse = compute_nse(y_t, y_p)

    # Per-well metrics
    per_well = []
    for well, group in valid_df.groupby(well_col):
        n = len(group)
        w_yt = group[target_col].values
        w_yp = group[pred_col].values
        w_mae = compute_mae(w_yt, w_yp)
        w_rmse = compute_rmse(w_yt, w_yp)
        
        # Per-well NSE requires >= min_nse_targets and non-zero variance
        if n >= min_nse_targets and np.var(w_yt) > 1e-6:
            w_nse = compute_nse(w_yt, w_yp)
        else:
            w_nse = np.nan

        per_well.append({
            'well_id': well,
            'n_targets': n,
            'mae': w_mae,
            'rmse': w_rmse,
            'nse': w_nse
        })

    pw_df = pd.DataFrame(per_well)
    well_mae = float(pw_df['mae'].mean())
    well_rmse = float(pw_df['rmse'].mean())
    well_nse = float(pw_df['nse'].dropna().mean()) if pw_df['nse'].notna().sum() > 0 else np.nan

    result = {
        'n_targets': len(valid_df),
        'n_wells': valid_df[well_col].nunique(),
        'pooled_mae': round(pooled_mae, 4),
        'pooled_rmse': round(pooled_rmse, 4),
        'pooled_nse': round(pooled_nse, 4),
        'well_mae': round(well_mae, 4),
        'well_rmse': round(well_rmse, 4),
        'well_nse': round(well_nse, 4) if not np.isnan(well_nse) else np.nan
    }
    return result
