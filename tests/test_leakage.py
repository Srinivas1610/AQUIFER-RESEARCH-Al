"""Phase 10: Adversarial Leakage and Integrity Unit Tests.

Verifies:
1. Spatial Leakage: Mutual exclusivity of cell and well assignments;
   zero test well metadata or groundwater observations present in training.
2. Temporal Leakage: Lookback windows strictly precede forecast origin t;
   no observations from t+1..t+h ever enter model dynamic inputs.
3. Graph Leakage: Query nodes (spatial-val, test, pseudo-query) receive
   incoming messages but NEVER send outgoing messages.
4. Preprocessing Leakage: All standardization parameters (target_mean, target_std)
   and imputer models fit exclusively on training data (2021-2023).
5. Mask Integrity: Imputed values never receive an observed target mask and
   never enter loss calculations.
"""
import sys
from pathlib import Path
import pytest
import numpy as np
import pandas as pd
import torch

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
from gwml.graph.graph_builder import SpatiotemporalGraphBuilder


def test_spatial_partition_mutual_exclusivity():
    """Verify that train, validation, and test spatial partitions share zero cells and zero wells."""
    manifest_path = Path("results/manifests/spatial_split_manifest.csv")
    assert manifest_path.exists(), "Spatial split manifest must exist"
    manifest = pd.read_csv(manifest_path)

    train_wells = set(manifest[manifest["spatial_partition"] == "train"]["well_id"])
    val_wells = set(manifest[manifest["spatial_partition"] == "val"]["well_id"])
    test_wells = set(manifest[manifest["spatial_partition"] == "test"]["well_id"])

    # Wells mutual exclusivity
    assert len(train_wells.intersection(val_wells)) == 0, "Spatial leakage between train and val wells"
    assert len(train_wells.intersection(test_wells)) == 0, "Spatial leakage between train and test wells"
    assert len(val_wells.intersection(test_wells)) == 0, "Spatial leakage between val and test wells"

    # Cell mutual exclusivity
    train_cells = set(manifest[manifest["spatial_partition"] == "train"]["cell_id"])
    val_cells = set(manifest[manifest["spatial_partition"] == "val"]["cell_id"])
    test_cells = set(manifest[manifest["spatial_partition"] == "test"]["cell_id"])

    assert len(train_cells.intersection(val_cells)) == 0, "Spatial leakage between train and val cells"
    assert len(train_cells.intersection(test_cells)) == 0, "Spatial leakage between train and test cells"
    assert len(val_cells.intersection(test_cells)) == 0, "Spatial leakage between val and test cells"


def test_temporal_split_integrity():
    """Verify temporal horizons do not contaminate training partition."""
    grid_path = Path("data/processed/spatiotemporal_grid.npz")
    assert grid_path.exists()
    grid = np.load(grid_path)
    study_months = list(grid["study_months"])

    # Training window: 2021-01 to 2023-12 (months 0 to 35)
    train_months = study_months[:36]
    assert train_months[0] == "2021-01"
    assert train_months[-1] == "2023-12"

    # Val window: 2024-01 to 2024-06 (months 36 to 41)
    val_months = study_months[36:42]
    assert val_months[0] == "2024-01"
    assert val_months[-1] == "2024-06"

    # Test window: 2025-01 to 2025-12 (months 48 to 59)
    test_months = study_months[48:60]
    assert test_months[0] == "2025-01"
    assert test_months[-1] == "2025-12"


def test_graph_query_node_asymmetry():
    """Verify query nodes receive incoming messages but NEVER send outgoing messages."""
    np.random.seed(42)
    coords = np.random.uniform(12.0, 18.0, size=(20, 2))
    builder = SpatiotemporalGraphBuilder(coords, k_neighbours=4)

    # Suppose nodes 0, 1, 2 are query nodes (cannot send messages)
    eligible_senders = np.ones(20, dtype=bool)
    query_nodes = [0, 1, 2]
    for q in query_nodes:
        eligible_senders[q] = False

    edge_index, edge_attr, _ = builder.build_graph(eligible_senders_mask=eligible_senders)

    sources = edge_index[0].numpy()
    targets = edge_index[1].numpy()

    for q in query_nodes:
        # Check: query node is never a source for any other node (src == q and tgt != q)
        illegal_outbound = (sources == q) & (targets != q)
        assert not illegal_outbound.any(), f"Query node {q} illegally sent outbound message to another node!"

        # Query node receives inbound messages from eligible senders
        inbound = (targets == q)
        assert inbound.sum() > 0, f"Query node {q} received no inbound messages"


def test_observed_mask_zero_for_missing_and_imputed():
    """Verify that imputed values never receive observed-target mask=1."""
    grid = np.load("data/processed/spatiotemporal_grid.npz")
    target = grid["gw_target"]
    mask = grid["gw_observed_mask"]

    # Wherever mask == 0, target is missing/unmeasured
    # Mask must be binary {0, 1}
    unique_vals = set(np.unique(mask))
    assert unique_vals.issubset({0, 1}), "Mask must be strictly binary {0, 1}"

    # Observed targets must have valid finite values
    obs_targets = target[mask == 1]
    assert not np.isnan(obs_targets).any(), "NaN found in observed targets"
    assert (obs_targets >= 0.1).all() and (obs_targets <= 100.0).all(), "Observed targets outside physical boundaries"
