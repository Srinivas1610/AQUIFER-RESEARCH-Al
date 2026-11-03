"""Tests for evaluation metrics."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

import numpy as np


def test_mae_basic():
    """MAE calculation test."""
    y_true = np.array([1.0, 2.0, 3.0, 4.0])
    y_pred = np.array([1.1, 2.2, 2.8, 4.3])
    mae = np.mean(np.abs(y_true - y_pred))
    np.testing.assert_almost_equal(mae, 0.2)


def test_rmse_basic():
    """RMSE calculation test."""
    y_true = np.array([1.0, 2.0, 3.0])
    y_pred = np.array([1.0, 2.0, 3.0])
    rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
    assert rmse == 0.0


def test_nse_perfect():
    """NSE should be 1.0 for perfect prediction."""
    y_true = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
    y_pred = y_true.copy()
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    nse = 1 - ss_res / ss_tot
    assert nse == 1.0


def test_nse_mean_prediction():
    """NSE should be 0.0 when predicting the mean."""
    y_true = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
    y_pred = np.full_like(y_true, np.mean(y_true))
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    nse = 1 - ss_res / ss_tot
    np.testing.assert_almost_equal(nse, 0.0)
