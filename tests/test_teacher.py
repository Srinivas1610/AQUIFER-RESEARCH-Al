"""Tests for Teacher GNN model and Out-Of-Fold predictions."""
import sys
from pathlib import Path
import pytest
import pandas as pd
import numpy as np
import torch

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
from gwml.models.st_gnn import SpatiotemporalGNN, gaussian_nll_loss


def test_st_gnn_architecture():
    """Verify SpatiotemporalGNN output shapes and positive variance."""
    N = 10
    L = 12
    model = SpatiotemporalGNN(
        in_dynamic_dim=4,
        static_dim=4,
        harmonic_dim=2,
        gru_hidden=128,
        gat_heads=4,
        mlp_hidden=32,
        dropout=0.1
    )
    model.eval()

    # Synthetic snapshot
    x_dyn = torch.randn(N, L, 4)
    x_static = torch.randn(N, 4)
    x_harm = torch.randn(N, 2)
    edge_index = torch.tensor([[0, 1, 2, 3], [1, 2, 3, 0]], dtype=torch.long)
    edge_attr = torch.randn(4, 1)

    with torch.no_grad():
        mu, var = model(x_dyn, x_static, x_harm, edge_index, edge_attr)

    assert mu.shape == (N,)
    assert var.shape == (N,)
    assert (var > 0).all(), "Variance must be strictly positive"
    assert not torch.isnan(mu).any()
    assert not torch.isnan(var).any()


def test_teacher_oof_archive_validity():
    """Verify OOF predictions integrity: non-empty, positive variances, zero test-well leakage."""
    oof_path = Path("results/predictions/teacher_oof.parquet")
    if not oof_path.exists():
        pytest.skip("teacher_oof.parquet not yet generated.")

    oof_df = pd.read_parquet(oof_path)
    assert len(oof_df) > 0, "OOF predictions archive must not be empty"

    manifest_path = Path("results/manifests/spatial_split_manifest.csv")
    assert manifest_path.exists(), "Spatial split manifest must exist"
    manifest = pd.read_csv(manifest_path)

    train_wells = set(manifest[manifest["spatial_partition"] == "train"]["well_id"])
    test_wells = set(manifest[manifest["spatial_partition"] == "test"]["well_id"])
    val_wells = set(manifest[manifest["spatial_partition"] == "val"]["well_id"])

    oof_wells = set(oof_df["well_id"].unique())

    # All OOF wells must be train wells
    assert oof_wells.issubset(train_wells), "OOF predictions must only contain training wells"
    # Zero test or val wells present
    assert len(oof_wells.intersection(test_wells)) == 0, "Leakage: test wells found in OOF soft targets!"
    assert len(oof_wells.intersection(val_wells)) == 0, "Leakage: val wells found in OOF soft targets!"

    # Variances must be strictly positive
    assert (oof_df["teacher_var"] > 0).all(), "All teacher variances must be strictly positive"
    assert not oof_df["teacher_mu"].isna().any(), "No NaN in teacher means"
    assert not oof_df["teacher_var"].isna().any(), "No NaN in teacher variances"
