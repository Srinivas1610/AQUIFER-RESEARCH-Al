"""Tests for Student Model, Distillation Loss, and Alpha Sweep."""
import sys
from pathlib import Path
import pytest
import numpy as np
import pandas as pd
import torch

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
from gwml.models.st_gnn import SpatiotemporalGNN
from gwml.training.train_student import distillation_loss_batch


def test_distillation_loss_identical_distributions():
    """Verify KL divergence component is zero when student matches teacher exactly."""
    N = 5
    y_true = torch.randn(N)
    mu = torch.randn(N)
    v = torch.ones(N) * 2.0
    mask = torch.ones(N)

    # When student equals teacher (mu_s = mu_t, v_s = v_t), KL = 0
    # For alpha = 0.5: loss should equal 0.5 * NLL
    loss_alpha_0 = distillation_loss_batch(y_true, mu, v, mu, v, alpha=0.0, mask=mask)
    loss_alpha_5 = distillation_loss_batch(y_true, mu, v, mu, v, alpha=0.5, mask=mask)

    # Since KL = 0, (1 - 0.5) * NLL = 0.5 * NLL
    np.testing.assert_almost_equal(loss_alpha_5.item(), 0.5 * loss_alpha_0.item(), decimal=5)


def test_student_architecture_dimensions():
    """Verify Student SpatiotemporalGNN conforms to frozen student dimensions."""
    N = 10
    L = 12
    student = SpatiotemporalGNN(
        in_dynamic_dim=4,
        static_dim=4,
        harmonic_dim=2,
        gru_hidden=64,
        gat_heads=2,
        mlp_hidden=32,
        dropout=0.1
    )
    student.eval()

    x_dyn = torch.randn(N, L, 4)
    x_static = torch.randn(N, 4)
    x_harm = torch.randn(N, 2)
    edge_index = torch.tensor([[0, 1, 2], [1, 2, 0]], dtype=torch.long)
    edge_attr = torch.randn(3, 1)

    with torch.no_grad():
        mu, v = student(x_dyn, x_static, x_harm, edge_index, edge_attr)

    assert mu.shape == (N,)
    assert v.shape == (N,)
    assert (v > 0).all()
    assert not torch.isnan(mu).any()


def test_alpha_sweep_results_exist():
    """Verify alpha sweep table exists and covers specified alphas {0.0, 0.3, 0.5, 0.7}."""
    table_path = Path("results/tables/student_alpha_sweep.csv")
    if not table_path.exists():
        pytest.skip("student_alpha_sweep.csv not yet generated.")

    df = pd.read_csv(table_path)
    assert len(df) == 4
    expected_alphas = {0.0, 0.3, 0.5, 0.7}
    actual_alphas = set(np.round(df["alpha"], 1))
    assert expected_alphas == actual_alphas

    # Metrics should be positive and finite
    assert (df["composite_val_mae"] > 0).all()
    assert not df["composite_val_mae"].isna().any()


def test_student_checkpoint_exists():
    """Verify best student checkpoint exists and contains valid model state."""
    ckpt_path = Path("results/models/student_best.pt")
    if not ckpt_path.exists():
        pytest.skip("student_best.pt not yet generated.")

    ckpt = torch.load(ckpt_path, map_location="cpu")
    assert "state_dict" in ckpt
    assert "best_alpha" in ckpt
    assert ckpt["gru_hidden"] == 64
    assert ckpt["gat_heads"] == 2
