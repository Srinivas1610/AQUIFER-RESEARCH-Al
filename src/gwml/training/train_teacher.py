"""Teacher model training and K=5 spatially blocked cross-fitting.

Implements Methodology Section C, Section D, Section 5:
- Full-capacity Teacher: GRU hidden 128, 4 GATv2 heads, sees full groundwater history.
- Global training-target standardization (fit on training partition only).
- K=5 spatially blocked cross-fitting to generate out-of-fold soft targets.
- Exports results/predictions/teacher_oof.parquet and results/models/teacher_final.pt.
"""
from pathlib import Path
import time
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch_geometric.data import Data

from gwml.graph.graph_builder import SpatiotemporalGraphBuilder
from gwml.models.st_gnn import SpatiotemporalGNN, gaussian_nll_loss
from gwml.evaluation.metrics import evaluate_predictions_df

def prepare_graph_data(grid, L=12, h=1):
    """Prepare graph inputs across all 60 months."""
    well_ids = list(grid['well_ids'])
    N = len(well_ids)
    T = len(grid['study_months'])
    study_months = list(grid['study_months'])

    coords = np.stack([grid['latitude'], grid['longitude']], axis=-1)
    builder = SpatiotemporalGraphBuilder(coords, k_neighbours=5)
    edge_index, edge_attr, ell = builder.build_graph()

    # Pre-extract static features: (N, 4)
    static_feats = np.stack([
        grid['utm_x'] / 1e6,
        grid['utm_y'] / 1e6,
        grid['latitude'] / 10.0,
        grid['longitude'] / 10.0
    ], axis=-1).astype(np.float32)

    return edge_index, edge_attr, ell, static_feats, builder

def train_teacher_epoch(model, optimizer, grid, edge_index, edge_attr, static_feats, t_indices, well_mask, target_mean, target_std, L=12, h=1):
    model.train()
    total_loss = 0.0
    n_targets_total = 0

    N = grid['gw_target'].shape[1]

    # Batch over monthly snapshots
    for t in t_indices:
        # Construct snapshot sequence: (N, L, 4) -> [gw, mask, rain, temp]
        gw_slice = grid['gw_target'][t - L + 1 : t + 1].T  # (N, L)
        mask_slice = grid['gw_observed_mask'][t - L + 1 : t + 1].T
        rain_slice = grid['rainfall'][t - L + 1 : t + 1].T
        temp_slice = grid['temperature'][t - L + 1 : t + 1].T

        # Normalize groundwater history using target_mean, target_std
        gw_norm = np.where(mask_slice == 1, (gw_slice - target_mean) / target_std, 0.0)

        x_seq = np.stack([gw_norm, mask_slice.astype(np.float32), rain_slice / 100.0, temp_slice / 30.0], axis=-1)
        x_seq_t = torch.tensor(x_seq, dtype=torch.float32)

        # Harmonics of target month t+h
        harm_t = torch.tensor([grid['sin_month'][t + h, 0], grid['cos_month'][t + h, 0]], dtype=torch.float32).unsqueeze(0).repeat(N, 1)

        # Targets at t+h
        y_raw = grid['gw_target'][t + h]
        y_obs = grid['gw_observed_mask'][t + h]

        # Valid targets in this batch: must be observed AND in well_mask
        eval_mask = (y_obs == 1) & well_mask
        if eval_mask.sum() == 0:
            continue

        y_norm_target = torch.tensor(np.where(eval_mask, (y_raw - target_mean) / target_std, 0.0), dtype=torch.float32)
        eval_mask_t = torch.tensor(eval_mask, dtype=torch.float32)

        optimizer.zero_grad()
        mu, v = model(x_seq_t, static_feats, harm_t, edge_index, edge_attr)
        
        loss = gaussian_nll_loss(y_norm_target, mu, v, mask=eval_mask_t)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        total_loss += loss.item() * eval_mask.sum()
        n_targets_total += eval_mask.sum()

    return total_loss / max(1, n_targets_total)

def predict_teacher_snapshot(model, grid, edge_index, edge_attr, static_feats, t, target_mean, target_std, L=12, h=1):
    model.eval()
    N = grid['gw_target'].shape[1]

    gw_slice = grid['gw_target'][t - L + 1 : t + 1].T
    mask_slice = grid['gw_observed_mask'][t - L + 1 : t + 1].T
    rain_slice = grid['rainfall'][t - L + 1 : t + 1].T
    temp_slice = grid['temperature'][t - L + 1 : t + 1].T

    gw_norm = np.where(mask_slice == 1, (gw_slice - target_mean) / target_std, 0.0)
    x_seq = np.stack([gw_norm, mask_slice.astype(np.float32), rain_slice / 100.0, temp_slice / 30.0], axis=-1)
    x_seq_t = torch.tensor(x_seq, dtype=torch.float32)
    harm_t = torch.tensor([grid['sin_month'][t + h, 0], grid['cos_month'][t + h, 0]], dtype=torch.float32).unsqueeze(0).repeat(N, 1)

    with torch.no_grad():
        mu_norm, v_norm = model(x_seq_t, static_feats, harm_t, edge_index, edge_attr)
        mu_norm = mu_norm.numpy()
        v_norm = v_norm.numpy()

    # Unnormalize to original meters
    mu_meters = mu_norm * target_std + target_mean
    v_meters = v_norm * (target_std ** 2)

    return mu_meters, v_meters

def run_teacher_pipeline(L=12, h=1, n_epochs=25, seed=42):
    print("=" * 60, flush=True)
    print(f"PHASE 6: TEACHER MODEL TRAINING & OOF CROSS-FITTING (L={L}, h={h})", flush=True)
    print("=" * 60, flush=True)

    with np.load("data/processed/spatiotemporal_grid.npz") as loaded:
        grid = {k: loaded[k] for k in loaded.files}

    manifest_df = pd.read_csv("results/manifests/spatial_split_manifest.csv")
    well_ids = list(grid['well_ids'])
    N = len(well_ids)
    study_months = list(grid['study_months'])

    # Build Graph
    edge_index, edge_attr, ell, static_feats, builder = prepare_graph_data(grid, L=L, h=h)
    static_feats_t = torch.tensor(static_feats, dtype=torch.float32)
    print(f"Graph constructed: {N} nodes, {edge_index.shape[1]} edges, length-scale ell={ell:.2f} km", flush=True)

    train_wells_mask = (manifest_df['spatial_partition'] == 'train').values
    train_indices = np.where(train_wells_mask)[0]

    # Global target standardization (fit strictly on training targets in 2021-2023)
    train_targets_subset = grid['gw_target'][:36, train_indices]
    valid_targets = train_targets_subset[~np.isnan(train_targets_subset)]
    target_mean = float(np.mean(valid_targets))
    target_std = float(np.std(valid_targets))
    print(f"Training target normalization: mean={target_mean:.3f}m, std={target_std:.3f}m", flush=True)

    # 1. K=5 Spatially Blocked Cross-Fitting
    print("\n--- 1. K=5 Spatially Blocked OOF Cross-Fitting ---", flush=True)
    train_cells = manifest_df[manifest_df['spatial_partition'] == 'train']['cell_id'].unique()
    rng = np.random.RandomState(seed)
    shuffled_cells = rng.permutation(train_cells)
    
    # Partition training cells into 5 folds
    cell_folds = np.array_split(shuffled_cells, 5)
    well_to_fold = {}
    for f_idx, cells in enumerate(cell_folds):
        for c in cells:
            w_in_c = manifest_df[manifest_df['cell_id'] == c]['well_id'].values
            for w in w_in_c:
                well_to_fold[w] = f_idx

    oof_records = []
    t_train_range = list(range(L - 1, 36 - h))

    for fold_k in range(5):
        print(f"\nTraining Teacher on Fold {fold_k + 1}/5 (OOF evaluation)...", flush=True)
        # Training wells in this fold are held out
        fit_mask = np.array([train_wells_mask[i] and well_to_fold.get(w) != fold_k for i, w in enumerate(well_ids)])
        oof_mask = np.array([train_wells_mask[i] and well_to_fold.get(w) == fold_k for i, w in enumerate(well_ids)])

        model_k = SpatiotemporalGNN(
            in_dynamic_dim=4, static_dim=4, harmonic_dim=2,
            gru_hidden=128, gat_heads=4, mlp_hidden=32, dropout=0.1
        )
        opt_k = torch.optim.Adam(model_k.parameters(), lr=1e-3, weight_decay=1e-4)

        t0 = time.time()
        for ep in range(n_epochs):
            loss = train_teacher_epoch(
                model_k, opt_k, grid, edge_index, edge_attr, static_feats_t,
                t_train_range, fit_mask, target_mean, target_std, L=L, h=h
            )
        print(f"  Fold {fold_k + 1} trained in {time.time() - t0:.1f}s, final train NLL: {loss:.4f}", flush=True)

        # Predict OOF for each origin t in training window
        for t in t_train_range:
            mu_m, v_m = predict_teacher_snapshot(model_k, grid, edge_index, edge_attr, static_feats_t, t, target_mean, target_std, L=L, h=h)
            
            # Record OOF predictions for held-out wells where target is observed
            obs_tgt = np.where((grid['gw_observed_mask'][t + h] == 1) & oof_mask)[0]
            for i in obs_tgt:
                oof_records.append({
                    'origin_month': study_months[t],
                    'target_month': study_months[t + h],
                    'well_id': well_ids[i],
                    'fold_idx': fold_k,
                    'y_true': float(grid['gw_target'][t + h, i]),
                    'teacher_mu': float(mu_m[i]),
                    'teacher_var': float(v_m[i])
                })

    oof_df = pd.DataFrame(oof_records)
    preds_dir = Path("results/predictions")
    preds_dir.mkdir(parents=True, exist_ok=True)
    oof_df.to_parquet(preds_dir / "teacher_oof.parquet", index=False)
    print(f"\nSaved OOF teacher soft targets to {preds_dir / 'teacher_oof.parquet'} ({len(oof_df):,} targets)", flush=True)

    # Evaluate OOF Teacher Performance
    oof_metrics = evaluate_predictions_df(pd.DataFrame({'well_id': oof_df['well_id'], 'y_true': oof_df['y_true'], 'y_pred': oof_df['teacher_mu']}))
    print(f"Teacher OOF Performance (Cross-fitted): MAE={oof_metrics['pooled_mae']:.3f}m, RMSE={oof_metrics['pooled_rmse']:.3f}m, NSE={oof_metrics['pooled_nse']:.3f}", flush=True)

    # 2. Final Teacher Fit on all Training Data
    print("\n--- 2. Final Teacher Fit on All Training Wells ---", flush=True)
    final_teacher = SpatiotemporalGNN(
        in_dynamic_dim=4, static_dim=4, harmonic_dim=2,
        gru_hidden=128, gat_heads=4, mlp_hidden=32, dropout=0.1
    )
    final_opt = torch.optim.Adam(final_teacher.parameters(), lr=1e-3, weight_decay=1e-4)

    t0 = time.time()
    for ep in range(n_epochs):
        train_loss = train_teacher_epoch(
            final_teacher, final_opt, grid, edge_index, edge_attr, static_feats_t,
            t_train_range, train_wells_mask, target_mean, target_std, L=L, h=h
        )
    print(f"Final teacher trained in {time.time() - t0:.1f}s, final loss: {train_loss:.4f}", flush=True)

    # Save Teacher Weights
    models_dir = Path("results/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    torch.save({
        'state_dict': final_teacher.state_dict(),
        'target_mean': target_mean,
        'target_std': target_std,
        'ell': ell,
        'L': L,
        'h': h,
        'gru_hidden': 128,
        'gat_heads': 4
    }, models_dir / "teacher_final.pt")
    print(f"Saved final teacher checkpoint: {models_dir / 'teacher_final.pt'}", flush=True)

    # 3. Evaluate Final Teacher on Monitored Val (2024 H1) and Monitored Test (2025)
    print("\nEvaluating Final Teacher on Monitored Validation and Test partitions...", flush=True)
    t_val_range = [t for t, ym in enumerate(study_months[:-h]) if '2024-01' <= study_months[t + h] <= '2024-06']
    t_test_range = [t for t, ym in enumerate(study_months[:-h]) if '2025-01' <= study_months[t + h] <= '2025-12']

    eval_results = []
    
    # Val Monitored
    val_preds_list = []
    for t in t_val_range:
        mu_m, v_m = predict_teacher_snapshot(final_teacher, grid, edge_index, edge_attr, static_feats_t, t, target_mean, target_std, L=L, h=h)
        obs_idx = np.where((grid['gw_observed_mask'][t + h] == 1) & train_wells_mask)[0]
        for i in obs_idx:
            val_preds_list.append({
                'well_id': well_ids[i],
                'y_true': grid['gw_target'][t + h, i],
                'y_pred': mu_m[i]
            })
    val_ev = evaluate_predictions_df(pd.DataFrame(val_preds_list))
    eval_results.append({'Task': 'Monitored', 'Model': 'Teacher GNN (Full)', 'Split': 'Val Monitored', **val_ev})
    print(f"Teacher [Val Monitored]:  MAE={val_ev['pooled_mae']:.3f}m, RMSE={val_ev['pooled_rmse']:.3f}m, NSE={val_ev['pooled_nse']:.3f}", flush=True)

    # Test Monitored
    test_preds_list = []
    for t in t_test_range:
        mu_m, v_m = predict_teacher_snapshot(final_teacher, grid, edge_index, edge_attr, static_feats_t, t, target_mean, target_std, L=L, h=h)
        obs_idx = np.where((grid['gw_observed_mask'][t + h] == 1) & train_wells_mask)[0]
        for i in obs_idx:
            test_preds_list.append({
                'well_id': well_ids[i],
                'y_true': grid['gw_target'][t + h, i],
                'y_pred': mu_m[i]
            })
    test_ev = evaluate_predictions_df(pd.DataFrame(test_preds_list))
    eval_results.append({'Task': 'Monitored', 'Model': 'Teacher GNN (Full)', 'Split': 'Test Monitored', **test_ev})
    print(f"Teacher [Test Monitored]: MAE={test_ev['pooled_mae']:.3f}m, RMSE={test_ev['pooled_rmse']:.3f}m, NSE={test_ev['pooled_nse']:.3f}", flush=True)

    perf_df = pd.DataFrame(eval_results)
    tables_dir = Path("results/tables")
    tables_dir.mkdir(parents=True, exist_ok=True)
    perf_df.to_csv(tables_dir / "teacher_performance.csv", index=False)
    print(f"Saved teacher performance: {tables_dir / 'teacher_performance.csv'}", flush=True)

    return oof_df, perf_df

if __name__ == '__main__':
    run_teacher_pipeline()
