"""Unit tests for Phase 5: DeepMVI Imputer and Uncertainty Sampling."""
from pathlib import Path
import numpy as np
import pandas as pd
import torch
import pytest

from gwml.imputation.deepmvi import sample_imputed_histories

def test_imputer_checkpoint_exists():
    ckpt_path = Path("results/models/deepmvi_imputer.pt")
    assert ckpt_path.exists(), "deepmvi_imputer.pt checkpoint must exist"
    ckpt = torch.load(ckpt_path)
    assert 'state_dict' in ckpt
    assert 'res_var_meters' in ckpt
    assert ckpt['res_var_meters'] > 0.0
    assert 'gw_mean' in ckpt
    assert 'gw_std' in ckpt

def test_sampling_fixes_observed_values():
    """Verify that 20 sampled histories keep observed values strictly fixed."""
    L = 12
    seq_gw = np.array([5.0, 5.2, np.nan, 5.5, np.nan, np.nan, 6.0, 6.2, 6.1, np.nan, 5.9, 5.8], dtype=np.float32)
    seq_mask = np.array([1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1], dtype=np.int8)
    rain_seq = np.random.uniform(0, 50, size=L).astype(np.float32)
    temp_seq = np.random.uniform(20, 32, size=L).astype(np.float32)
    sin_m = np.sin(np.linspace(0, 2*np.pi, L)).astype(np.float32)
    cos_m = np.cos(np.linspace(0, 2*np.pi, L)).astype(np.float32)

    samples = sample_imputed_histories(
        seq_gw, seq_mask, rain_seq, temp_seq, sin_m, cos_m,
        model_ckpt_path="results/models/deepmvi_imputer.pt",
        n_samples=20, seed=42
    )

    assert samples.shape == (20, L)
    
    # At observed positions (mask == 1), all 20 samples MUST match seq_gw exactly
    for tau in np.where(seq_mask == 1)[0]:
        np.testing.assert_allclose(samples[:, tau], seq_gw[tau], rtol=1e-5)

    # At missing positions (mask == 0), samples should have non-zero variance across realizations
    for tau in np.where(seq_mask == 0)[0]:
        assert np.var(samples[:, tau]) > 0.1

def test_reconstruction_results_table():
    p = Path("results/tables/reconstruction_results.csv")
    assert p.exists()
    df = pd.read_csv(p)
    assert len(df) == 4  # 10%, 20%, 30%, 40%
    assert list(df['missing_rate']) == [0.10, 0.20, 0.30, 0.40]
    # Error should generally increase or stay robust as missingness increases
    assert (df['mae_mean'] > 0).all()
    assert (df['rmse_mean'] > df['mae_mean']).all()
