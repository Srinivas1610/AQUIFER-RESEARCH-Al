"""Unit tests for Phase 3: Spatial and Temporal Splits."""
import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

import numpy as np
import pandas as pd
import pytest

def test_spatial_split_manifest_exists():
    """Verify spatial manifest exists and has expected columns."""
    manifest_path = Path("results/manifests/spatial_split_manifest.csv")
    assert manifest_path.exists(), "spatial_split_manifest.csv must exist"
    
    df = pd.read_csv(manifest_path)
    assert len(df) == 1658
    for col in ['well_id', 'cell_id', 'spatial_partition', 'is_core_cohort', 'latitude', 'longitude', 'utm_x', 'utm_y']:
        assert col in df.columns

def test_no_cell_appears_in_multiple_partitions():
    """CRITICAL GATE TEST: No 25-km cell appears in more than one partition."""
    manifest_path = Path("results/manifests/spatial_split_manifest.csv")
    df = pd.read_csv(manifest_path)

    # Check cell-to-partition mapping
    cell_partitions = df.groupby('cell_id')['spatial_partition'].nunique()
    multi_partition_cells = cell_partitions[cell_partitions > 1]
    assert len(multi_partition_cells) == 0, f"Cells spanning multiple partitions found: {multi_partition_cells}"

    train_cells = set(df[df['spatial_partition'] == 'train']['cell_id'])
    val_cells = set(df[df['spatial_partition'] == 'val']['cell_id'])
    test_cells = set(df[df['spatial_partition'] == 'test']['cell_id'])

    assert len(train_cells & val_cells) == 0, "Overlap between train and val cells"
    assert len(train_cells & test_cells) == 0, "Overlap between train and test cells"
    assert len(val_cells & test_cells) == 0, "Overlap between val and test cells"

def test_partition_percentages():
    """Verify well partitions closely match the target ratios (64/16/20%)."""
    manifest_path = Path("results/manifests/spatial_split_manifest.csv")
    df = pd.read_csv(manifest_path)

    total = len(df)
    train_pct = (df['spatial_partition'] == 'train').sum() / total
    val_pct = (df['spatial_partition'] == 'val').sum() / total
    test_pct = (df['spatial_partition'] == 'test').sum() / total

    assert 0.60 <= train_pct <= 0.68, f"Train percentage {train_pct:.2f} outside expected [0.60, 0.68]"
    assert 0.13 <= val_pct <= 0.19, f"Val percentage {val_pct:.2f} outside expected [0.13, 0.19]"
    assert 0.17 <= test_pct <= 0.23, f"Test percentage {test_pct:.2f} outside expected [0.17, 0.23]"

def test_temporal_split_manifest():
    """Verify temporal manifest covers all phases from Table 2."""
    temp_path = Path("results/manifests/temporal_split_manifest.json")
    assert temp_path.exists()
    
    with open(temp_path) as f:
        data = json.load(f)
    
    assert data['initial_fit_train']['start'] == "2021-01"
    assert data['initial_fit_train']['end'] == "2023-12"
    assert data['temporal_val']['start'] == "2024-01"
    assert data['temporal_val']['end'] == "2024-06"
    assert data['calibration']['start'] == "2024-07"
    assert data['calibration']['end'] == "2024-12"
    assert data['final_test']['start'] == "2025-01"
    assert data['final_test']['end'] == "2025-12"
