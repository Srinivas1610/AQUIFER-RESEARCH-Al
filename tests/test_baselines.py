"""Unit tests for Phase 4: Baseline Models Performance."""
from pathlib import Path
import pandas as pd
import pytest

def test_baselines_performance_file_exists():
    p = Path("results/tables/baselines_performance.csv")
    assert p.exists(), "baselines_performance.csv must exist"
    df = pd.read_csv(p)
    assert len(df) >= 20  # 10+ models across 2 splits
    assert 'Model' in df.columns
    assert 'Task' in df.columns
    assert 'pooled_mae' in df.columns
    assert 'pooled_rmse' in df.columns

def test_baseline_models_coverage():
    df = pd.read_csv("results/tables/baselines_performance.csv")
    models = set(df['Model'].unique())
    expected = {
        'Persistence', 'Seasonal Naive', 'Ridge', 'Random Forest', 'XGBoost', 'GRU-no-graph',
        'Environmental Ridge', 'Environmental RF', 'Environmental XGBoost',
        'Neighbour-Persistence', 'Contemporaneous IDW'
    }
    for m in expected:
        assert m in models, f"Missing baseline model: {m}"

def test_physical_metric_ranges():
    df = pd.read_csv("results/tables/baselines_performance.csv")
    assert (df['pooled_mae'] > 0).all()
    assert (df['pooled_rmse'] > 0).all()
    assert (df['pooled_rmse'] >= df['pooled_mae']).all()  # RMSE >= MAE mathematically
