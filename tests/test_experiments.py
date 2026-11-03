"""Tests for Phase 9 Experiments, Multi-Seed Fits, and Ablations."""
import sys
from pathlib import Path
import pytest
import numpy as np
import pandas as pd


def test_multiseed_results_validity():
    """Verify multi-seed runs cover seeds [42, 43, 44] with finite metrics."""
    res_path = Path("results/tables/multiseed_student_results.csv")
    if not res_path.exists():
        pytest.skip("multiseed_student_results.csv not yet generated.")

    df = pd.read_csv(res_path)
    assert len(df) == 3
    assert set(df["seed"].values) == {42, 43, 44}
    assert (df["monitored_mae"] > 0).all()
    assert (df["query_mae"] > 0).all()
    assert not df["monitored_mae"].isna().any()

    sum_path = Path("results/tables/multiseed_summary.csv")
    assert sum_path.exists()
    df_sum = pd.read_csv(sum_path)
    assert len(df_sum) >= 4


def test_horizon_comparison_table():
    """Verify horizon comparison covers h in {1, 3, 6}."""
    h_path = Path("results/tables/horizon_comparison.csv")
    if not h_path.exists():
        pytest.skip("horizon_comparison.csv not yet generated.")

    df = pd.read_csv(h_path)
    assert len(df) == 3
    assert set(df["horizon_months"].values) == {1, 3, 6}
    assert (df["monitored_mae"] > 0).all()
    # Error generally increases or stays comparable with horizon
    assert not df["monitored_mae"].isna().any()


def test_ablation_study_table():
    """Verify ablation table includes full model, ablations, and delta metrics."""
    abl_path = Path("results/tables/ablation_study.csv")
    if not abl_path.exists():
        pytest.skip("ablation_study.csv not yet generated.")

    df = pd.read_csv(abl_path)
    assert len(df) >= 7
    expected_cols = {"Configuration / Model", "Task", "MAE (m)", "RMSE (m)", "NSE", "Delta MAE (m)", "Delta NSE"}
    assert expected_cols.issubset(set(df.columns))
    assert not df["MAE (m)"].isna().any()


def test_publication_figures_exist():
    """Verify all publication figures exist and are valid non-empty files."""
    figs = [
        Path("results/figures/horizon_performance.png"),
        Path("results/figures/hydrographs_comparison.png"),
        Path("results/figures/spatial_error_map.png")
    ]
    for fig in figs:
        if not fig.exists():
            pytest.skip(f"{fig.name} not yet generated.")
        assert fig.stat().st_size > 1000, f"{fig.name} is too small or corrupt"
