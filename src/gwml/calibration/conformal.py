"""Split-conformal prediction interval calibration and uncertainty evaluation.

Implements Methodology Section C & Section D:
- Split-conformal calibration on the July 2024 - December 2024 partition.
- Conformity score: s_i = max(L_i - y_i, y_i - U_i, 0).
- Expanded prediction intervals: [L_i - s_hat, U_i + s_hat] where
  s_hat is the ceil((n_cal + 1) * nominal_coverage)-th ordered score.
- Reports PICP (Prediction Interval Coverage Probability) and MPIW
  (Mean Prediction Interval Width) before and after calibration.
- Explicit non-exchangeability warning:Karnataka spatiotemporal groundwater
  dynamics experience monsoon shifts and spatial autocorrelation; no
  unconditional coverage guarantees are claimed.
"""
from typing import Dict, Tuple, Union
import numpy as np
import pandas as pd


def compute_conformity_scores(
    y_true: Union[np.ndarray, pd.Series],
    L: Union[np.ndarray, pd.Series],
    U: Union[np.ndarray, pd.Series]
) -> np.ndarray:
    """
    Compute conformity error score:
    s_i = max(L_i - y_i, y_i - U_i, 0)
    """
    y_arr = np.asarray(y_true)
    L_arr = np.asarray(L)
    U_arr = np.asarray(U)

    underflow = L_arr - y_arr
    overflow = y_arr - U_arr
    return np.maximum(0.0, np.maximum(underflow, overflow))


def fit_split_conformal(
    y_cal: Union[np.ndarray, pd.Series],
    L_cal: Union[np.ndarray, pd.Series],
    U_cal: Union[np.ndarray, pd.Series],
    nominal_coverage: float = 0.90
) -> Tuple[float, np.ndarray]:
    """
    Fit conformal expansion factor s_hat on calibration partition.
    s_hat = ceil((n_cal + 1) * nominal_coverage)-th ordered score.
    """
    scores = compute_conformity_scores(y_cal, L_cal, U_cal)
    n_cal = len(scores)
    if n_cal == 0:
        return 0.0, scores

    sorted_scores = np.sort(scores)
    # ceil((n + 1) * alpha) - 1 for 0-indexed array
    rank = int(np.ceil((n_cal + 1) * nominal_coverage)) - 1
    rank = min(max(0, rank), n_cal - 1)
    s_hat = float(sorted_scores[rank])

    return s_hat, sorted_scores


def expand_prediction_intervals(
    L: Union[np.ndarray, pd.Series],
    U: Union[np.ndarray, pd.Series],
    s_hat: float
) -> Tuple[np.ndarray, np.ndarray]:
    """Expand prediction intervals by additive conformal factor s_hat."""
    L_exp = np.asarray(L) - s_hat
    U_exp = np.asarray(U) + s_hat
    return L_exp, U_exp


def evaluate_prediction_intervals(
    y_true: Union[np.ndarray, pd.Series],
    L: Union[np.ndarray, pd.Series],
    U: Union[np.ndarray, pd.Series]
) -> Dict[str, float]:
    """
    Calculate PICP (empirical coverage) and MPIW (mean interval width).
    """
    y_arr = np.asarray(y_true)
    L_arr = np.asarray(L)
    U_arr = np.asarray(U)

    valid = ~np.isnan(y_arr) & ~np.isnan(L_arr) & ~np.isnan(U_arr)
    y_v = y_arr[valid]
    L_v = L_arr[valid]
    U_v = U_arr[valid]

    if len(y_v) == 0:
        return {'picp': 0.0, 'mpiw': 0.0, 'n_samples': 0}

    covered = (y_v >= L_v) & (y_v <= U_v)
    picp = float(np.mean(covered))
    mpiw = float(np.mean(U_v - L_v))

    return {
        'picp': picp,
        'mpiw': mpiw,
        'n_samples': int(len(y_v))
    }
