"""Spatial cell partitioning (25 km EPSG:32643) and temporal split manifests.

Implements Methodology Section D:
- 25-km cell indices (floor(x/25000), floor(y/25000)).
- Deterministic sorting followed by seed 42 shuffle.
- Whole-cell sequential allocation: ~20% test, ~16% spatial-val, ~64% train.
- Zero cell overlap across partitions.
- Saves manifests and spatial split map.
"""
import json
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

CELL_SIZE_METERS = 25000.0

def compute_spatial_cells(utm_x, utm_y):
    """Compute 25-km spatial grid cell identifiers from EPSG:32643 coordinates."""
    cell_x = np.floor(utm_x / CELL_SIZE_METERS).astype(int)
    cell_y = np.floor(utm_y / CELL_SIZE_METERS).astype(int)
    return [f"C_{cx}_{cy}" for cx, cy in zip(cell_x, cell_y)], cell_x, cell_y

def partition_cells(wells_df, seed=42, test_frac=0.20, val_frac=0.16):
    """Partition whole 25-km cells sequentially into test, spatial-val, and train."""
    cell_ids, cx, cy = compute_spatial_cells(wells_df['utm_x'].values, wells_df['utm_y'].values)
    wells_df = wells_df.copy()
    wells_df['cell_id'] = cell_ids
    wells_df['cell_x'] = cx
    wells_df['cell_y'] = cy

    # Count wells per cell
    cell_counts = wells_df.groupby('cell_id').size().to_dict()
    sorted_unique_cells = sorted(list(cell_counts.keys()))

    # Shuffle with seed 42
    rng = np.random.RandomState(seed)
    shuffled_cells = rng.permutation(sorted_unique_cells)

    total_wells = len(wells_df)
    target_test_wells = int(np.round(total_wells * test_frac))
    target_val_wells = int(np.round(total_wells * val_frac))

    test_cells = []
    val_cells = []
    train_cells = []

    test_count = 0
    val_count = 0

    for cell in shuffled_cells:
        c_wells = cell_counts[cell]
        if test_count + c_wells <= target_test_wells or len(test_cells) == 0:
            test_cells.append(cell)
            test_count += c_wells
        elif val_count + c_wells <= target_val_wells or len(val_cells) == 0:
            val_cells.append(cell)
            val_count += c_wells
        else:
            train_cells.append(cell)

    cell_to_partition = {}
    for c in test_cells: cell_to_partition[c] = 'test'
    for c in val_cells: cell_to_partition[c] = 'val'
    for c in train_cells: cell_to_partition[c] = 'train'

    wells_df['spatial_partition'] = wells_df['cell_id'].map(cell_to_partition)
    
    # Assert zero overlap
    assert len(set(test_cells) & set(val_cells)) == 0, "Overlap between test and val cells!"
    assert len(set(test_cells) & set(train_cells)) == 0, "Overlap between test and train cells!"
    assert len(set(val_cells) & set(train_cells)) == 0, "Overlap between val and train cells!"

    return wells_df, test_cells, val_cells, train_cells

def generate_and_save_splits(seed=42):
    print("=" * 60)
    print("PHASE 3: SPATIAL AND TEMPORAL SPLITS")
    print("=" * 60)

    manifest_dir = Path("results/manifests")
    fig_dir = Path("results/figures")
    manifest_dir.mkdir(parents=True, exist_ok=True)
    fig_dir.mkdir(parents=True, exist_ok=True)

    grid_data = np.load("data/processed/spatiotemporal_grid.npz")
    wells_df = pd.read_parquet("data/processed/wells_annotated.parquet")

    # Perform spatial split
    annotated_wells, test_cells, val_cells, train_cells = partition_cells(wells_df, seed=seed)

    n_total = len(annotated_wells)
    n_train = (annotated_wells['spatial_partition'] == 'train').sum()
    n_val = (annotated_wells['spatial_partition'] == 'val').sum()
    n_test = (annotated_wells['spatial_partition'] == 'test').sum()

    print(f"\nTotal wells: {n_total:,} across {len(test_cells)+len(val_cells)+len(train_cells)} cells")
    print(f"Train wells: {n_train:,} ({n_train/n_total*100:.1f}%) in {len(train_cells)} cells")
    print(f"Val wells:   {n_val:,} ({n_val/n_total*100:.1f}%) in {len(val_cells)} cells")
    print(f"Test wells:  {n_test:,} ({n_test/n_total*100:.1f}%) in {len(test_cells)} cells")

    # Core cohort breakdown
    core_mask = annotated_wells['is_core_cohort']
    print(f"\nCore cohort (260 wells) partition breakdown:")
    print(f"Train core: {(annotated_wells[core_mask]['spatial_partition'] == 'train').sum():,}")
    print(f"Val core:   {(annotated_wells[core_mask]['spatial_partition'] == 'val').sum():,}")
    print(f"Test core:  {(annotated_wells[core_mask]['spatial_partition'] == 'test').sum():,}")

    # Save spatial manifest
    manifest_path = manifest_dir / "spatial_split_manifest.csv"
    annotated_wells[[
        'well_id', 'cell_id', 'spatial_partition', 'is_core_cohort',
        'latitude', 'longitude', 'utm_x', 'utm_y', 'district', 'basin'
    ]].to_csv(manifest_path, index=False)
    print(f"\nSaved spatial manifest: {manifest_path}")

    # Save temporal manifest
    temporal_manifest = {
        "initial_fit_train": {"start": "2021-01", "end": "2023-12", "months": 36, "role": "Model fitting, preprocessing, imputer"},
        "temporal_val": {"start": "2024-01", "end": "2024-06", "months": 6, "role": "Hyperparameter tuning and model selection"},
        "refit_train": {"start": "2021-01", "end": "2024-06", "months": 42, "role": "Final refitting with selected hyperparams"},
        "calibration": {"start": "2024-07", "end": "2024-12", "months": 6, "role": "Conformal interval expansion; no parameter updates"},
        "final_test": {"start": "2025-01", "end": "2025-12", "months": 12, "role": "Final evaluation of forecasts and unmonitored queries"},
        "rolling_origin_dev": [
            {"fit_end": "2022-12", "val_start": "2023-01", "val_end": "2023-06"},
            {"fit_end": "2023-06", "val_start": "2023-07", "val_end": "2023-12"}
        ]
    }
    temp_path = manifest_dir / "temporal_split_manifest.json"
    with open(temp_path, 'w') as f:
        json.dump(temporal_manifest, f, indent=2)
    print(f"Saved temporal manifest: {temp_path}")

    # Plot spatial split map
    plt.figure(figsize=(9, 10), dpi=300)
    colors = {'train': '#1f77b4', 'val': '#2ca02c', 'test': '#d62728'}
    labels = {
        'train': f'Train cells ({n_train} wells, {len(train_cells)} cells)',
        'val': f'Spatial-Val cells ({n_val} wells, {len(val_cells)} cells)',
        'test': f'Test cells ({n_test} wells, {len(test_cells)} cells)'
    }
    
    for part in ['train', 'val', 'test']:
        sub = annotated_wells[annotated_wells['spatial_partition'] == part]
        plt.scatter(
            sub['longitude'], sub['latitude'],
            c=colors[part], label=labels[part],
            alpha=0.6, s=18, edgecolors='none'
        )

    plt.title("Karnataka 25-km Spatial Block Partitioning (Seed 42)", fontsize=13, fontweight='bold', pad=12)
    plt.xlabel("Longitude (°E)", fontsize=11)
    plt.ylabel("Latitude (°N)", fontsize=11)
    plt.grid(True, linestyle='--', alpha=0.4)
    plt.legend(loc='lower right', frameon=True, fontsize=10)
    plt.tight_layout()

    map_path = fig_dir / "spatial_split_map.png"
    plt.savefig(map_path)
    plt.close()
    print(f"Saved map figure: {map_path}")

    return annotated_wells

if __name__ == '__main__':
    generate_and_save_splits()
