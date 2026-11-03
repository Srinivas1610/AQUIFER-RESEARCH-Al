"""Optimized, fully in-memory baseline benchmark models.

Implements Methodology Section D:
- Monitored: Persistence, Seasonal Naive, Ridge, Random Forest, XGBoost, GRU-no-graph.
- No-history: Environmental Ridge, RF, XGBoost, Neighbour-persistence, Contemporaneous IDW.
- Fully in-memory numpy buffers with zero disk decompression overhead.
"""
from pathlib import Path
import time
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

from gwml.data.idw import haversine_distance_matrix
from gwml.evaluation.metrics import evaluate_predictions_df

class GRUNoGraphModel(nn.Module):
    """Temporal GRU encoder without graph message passing."""
    def __init__(self, in_dim=4, static_dim=4, hidden_dim=64, mlp_dim=32, dropout=0.1):
        super().__init__()
        self.gru = nn.GRU(in_dim, hidden_dim, batch_first=True)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim + static_dim + 2, mlp_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_dim, 2)
        )

    def forward(self, x_seq, static_feat, target_harmonic):
        _, h_n = self.gru(x_seq)
        h_last = h_n.squeeze(0)
        combined = torch.cat([h_last, static_feat, target_harmonic], dim=-1)
        out = self.fc(combined)
        mu = out[:, 0]
        v = torch.nn.functional.softplus(out[:, 1]) + 1e-4
        return mu, v

def build_datasets_in_memory(L=12, h=1):
    """Load NPZ into pure RAM and construct tabular datasets in seconds."""
    print("Loading cached spatiotemporal grid entirely into RAM...", flush=True)
    with np.load("data/processed/spatiotemporal_grid.npz") as loaded:
        grid = {k: loaded[k] for k in loaded.files}

    splits_df = pd.read_csv("results/manifests/spatial_split_manifest.csv")
    study_months = list(grid['study_months'])
    well_ids = list(grid['well_ids'])
    T, N = grid['gw_target'].shape

    well_partition = np.array([splits_df.loc[splits_df['well_id'] == w, 'spatial_partition'].values[0] for w in well_ids])

    # Pre-impute groundwater inputs for missing history using training-only calendar medians
    train_well_mask = (well_partition == 'train')
    train_gw_subset = grid['gw_target'][:36, train_well_mask]
    
    cal_medians = {}
    for m in range(1, 13):
        m_idxs = [t for t, ym in enumerate(study_months[:36]) if int(ym.split('-')[1]) == m]
        vals = train_gw_subset[m_idxs, :].flatten()
        valid_vals = vals[~np.isnan(vals)]
        cal_medians[m] = float(np.median(valid_vals)) if len(valid_vals) > 0 else 10.0

    print("Pre-filling groundwater history for input representations...", flush=True)
    gw_filled = grid['gw_target'].copy()
    for t in range(T):
        m = int(study_months[t].split('-')[1])
        for i in range(N):
            if np.isnan(gw_filled[t, i]):
                if t > 0 and not np.isnan(grid['gw_target'][t - 1, i]):
                    gw_filled[t, i] = grid['gw_target'][t - 1, i]
                else:
                    gw_filled[t, i] = cal_medians[m]

    # Find valid target pairs
    valid_t_orig = []
    valid_w_idx = []
    y_true_list = []
    for t in range(L - 1, T - h):
        obs_idx = np.where(grid['gw_observed_mask'][t + h] == 1)[0]
        for i in obs_idx:
            valid_t_orig.append(t)
            valid_w_idx.append(i)
            y_true_list.append(grid['gw_target'][t + h, i])

    valid_t_orig = np.array(valid_t_orig, dtype=np.int32)
    valid_w_idx = np.array(valid_w_idx, dtype=np.int32)
    y_true = np.array(y_true_list, dtype=np.float32)
    n_samples = len(valid_t_orig)
    print(f"Total valid sliding window instances: {n_samples:,}", flush=True)

    print("Constructing 2D feature matrices in RAM...", flush=True)
    X_mon = np.zeros((n_samples, 4 * L + 8), dtype=np.float32)
    X_env = np.zeros((n_samples, 2 * L + 8), dtype=np.float32)
    X_seq_mon = np.zeros((n_samples, L, 4), dtype=np.float32)
    X_static = np.zeros((n_samples, 4), dtype=np.float32)
    X_harm = np.zeros((n_samples, 2), dtype=np.float32)

    persistence_preds = np.zeros(n_samples, dtype=np.float32)
    s_naive_preds = np.zeros(n_samples, dtype=np.float32)

    # Pre-extract static coordinates
    all_ux = grid['utm_x'] / 1e6
    all_uy = grid['utm_y'] / 1e6
    all_lat = grid['latitude'] / 10.0
    all_lon = grid['longitude'] / 10.0

    t0 = time.time()
    for idx in range(n_samples):
        t = valid_t_orig[idx]
        i = valid_w_idx[idx]

        gw_f = gw_filled[t - L + 1 : t + 1, i]
        gw_m = grid['gw_observed_mask'][t - L + 1 : t + 1, i]
        rain = grid['rainfall'][t - L + 1 : t + 1, i]
        temp = grid['temperature'][t - L + 1 : t + 1, i]
        r3 = grid['rainfall_3m'][t, i]
        r6 = grid['rainfall_6m'][t, i]
        tsin = grid['sin_month'][t + h, 0]
        tcos = grid['cos_month'][t + h, 0]
        ux = all_ux[i]
        uy = all_uy[i]
        lat = all_lat[i]
        lon = all_lon[i]

        X_mon[idx, 0:L] = gw_f
        X_mon[idx, L:2*L] = gw_m
        X_mon[idx, 2*L:3*L] = rain
        X_mon[idx, 3*L:4*L] = temp
        X_mon[idx, 4*L:] = [r3, r6, tsin, tcos, ux, uy, lat, lon]

        X_env[idx, 0:L] = rain
        X_env[idx, L:2*L] = temp
        X_env[idx, 2*L:] = [r3, r6, tsin, tcos, ux, uy, lat, lon]

        X_seq_mon[idx, :, 0] = gw_f
        X_seq_mon[idx, :, 1] = gw_m
        X_seq_mon[idx, :, 2] = rain
        X_seq_mon[idx, :, 3] = temp

        X_static[idx] = [ux, uy, lat, lon]
        X_harm[idx] = [tsin, tcos]

        latest_val = grid['gw_target'][t, i]
        persistence_preds[idx] = latest_val if not np.isnan(latest_val) else gw_f[-1]

        if t >= 12 and not np.isnan(grid['gw_target'][t + h - 12, i]):
            s_naive_preds[idx] = grid['gw_target'][t + h - 12, i]
        else:
            s_naive_preds[idx] = persistence_preds[idx]

    print(f"Matrix construction completed in {time.time() - t0:.2f}s", flush=True)

    sample_partitions = well_partition[valid_w_idx]
    target_months = np.array([study_months[t + h] for t in valid_t_orig])
    origin_months = np.array([study_months[t] for t in valid_t_orig])

    train_mask = (sample_partitions == 'train') & (origin_months <= '2023-12')
    val_mon_mask = (sample_partitions == 'train') & (target_months >= '2024-01') & (target_months <= '2024-06')
    val_query_mask = (sample_partitions == 'val') & (target_months >= '2024-01') & (target_months <= '2024-06')
    test_mon_mask = (sample_partitions == 'train') & (target_months >= '2025-01') & (target_months <= '2025-12')
    test_query_mask = (sample_partitions == 'test') & (target_months >= '2025-01') & (target_months <= '2025-12')

    sample_well_ids = np.array([well_ids[i] for i in valid_w_idx])

    meta = {
        'well_ids': sample_well_ids,
        'valid_w_idx': valid_w_idx,
        'valid_t_orig': valid_t_orig,
        'target_months': target_months,
        'origin_months': origin_months,
        'y_true': y_true,
        'persistence_preds': persistence_preds,
        's_naive_preds': s_naive_preds,
        'train_mask': train_mask,
        'val_mon_mask': val_mon_mask,
        'val_query_mask': val_query_mask,
        'test_mon_mask': test_mon_mask,
        'test_query_mask': test_query_mask,
        'grid': grid,
        'well_partition': well_partition,
        'cal_medians': cal_medians,
        'study_months': study_months
    }
    return X_mon, X_env, X_seq_mon, X_static, X_harm, y_true, meta

def run_all_baselines(L=12, h=1):
    print("=" * 60, flush=True)
    print(f"RUNNING ALL BASELINES (L={L}, h={h})", flush=True)
    print("=" * 60, flush=True)

    X_mon, X_env, X_seq_mon, X_static, X_harm, y_true, m = build_datasets_in_memory(L=L, h=h)

    tr_idx = m['train_mask']
    val_mon_idx = m['val_mon_mask']
    val_query_idx = m['val_query_mask']
    test_mon_idx = m['test_mon_mask']
    test_query_idx = m['test_query_mask']

    print(f"Train samples:       {tr_idx.sum():,}", flush=True)
    print(f"Val Monitored:       {val_mon_idx.sum():,}", flush=True)
    print(f"Val No-History:      {val_query_idx.sum():,}", flush=True)
    print(f"Test Monitored:      {test_mon_idx.sum():,}", flush=True)
    print(f"Test No-History:     {test_query_idx.sum():,}", flush=True)

    results = []

    # 1. Monitored Baselines
    print("\n--- 1. Monitored Forecasting Baselines ---", flush=True)

    # Persistence
    for s_name, s_idx in [('Val Monitored', val_mon_idx), ('Test Monitored', test_mon_idx)]:
        ev = evaluate_predictions_df(pd.DataFrame({'well_id': m['well_ids'][s_idx], 'y_true': y_true[s_idx], 'y_pred': m['persistence_preds'][s_idx]}))
        results.append({'Task': 'Monitored', 'Model': 'Persistence', 'Split': s_name, **ev})
        print(f"Persistence [{s_name}]: MAE={ev['pooled_mae']:.3f}m, RMSE={ev['pooled_rmse']:.3f}m, NSE={ev['pooled_nse']:.3f}", flush=True)

    # Seasonal Naive
    for s_name, s_idx in [('Val Monitored', val_mon_idx), ('Test Monitored', test_mon_idx)]:
        ev = evaluate_predictions_df(pd.DataFrame({'well_id': m['well_ids'][s_idx], 'y_true': y_true[s_idx], 'y_pred': m['s_naive_preds'][s_idx]}))
        results.append({'Task': 'Monitored', 'Model': 'Seasonal Naive', 'Split': s_name, **ev})
        print(f"Seasonal Naive [{s_name}]: MAE={ev['pooled_mae']:.3f}m, RMSE={ev['pooled_rmse']:.3f}m, NSE={ev['pooled_nse']:.3f}", flush=True)

    # Ridge
    scaler_mon = StandardScaler()
    X_mon_tr_scaled = scaler_mon.fit_transform(X_mon[tr_idx])
    y_tr = y_true[tr_idx]

    print("Fitting Ridge (Monitored)...", flush=True)
    ridge_mon = Ridge(alpha=1.0)
    ridge_mon.fit(X_mon_tr_scaled, y_tr)
    for s_name, s_idx in [('Val Monitored', val_mon_idx), ('Test Monitored', test_mon_idx)]:
        preds = ridge_mon.predict(scaler_mon.transform(X_mon[s_idx]))
        ev = evaluate_predictions_df(pd.DataFrame({'well_id': m['well_ids'][s_idx], 'y_true': y_true[s_idx], 'y_pred': preds}))
        results.append({'Task': 'Monitored', 'Model': 'Ridge', 'Split': s_name, **ev})
        print(f"Ridge [{s_name}]: MAE={ev['pooled_mae']:.3f}m, RMSE={ev['pooled_rmse']:.3f}m, NSE={ev['pooled_nse']:.3f}", flush=True)

    # Random Forest
    print("Fitting Random Forest (Monitored, 80 trees)...", flush=True)
    rf_mon = RandomForestRegressor(n_estimators=80, max_depth=10, random_state=42, n_jobs=-1)
    rf_mon.fit(X_mon[tr_idx], y_tr)
    for s_name, s_idx in [('Val Monitored', val_mon_idx), ('Test Monitored', test_mon_idx)]:
        preds = rf_mon.predict(X_mon[s_idx])
        ev = evaluate_predictions_df(pd.DataFrame({'well_id': m['well_ids'][s_idx], 'y_true': y_true[s_idx], 'y_pred': preds}))
        results.append({'Task': 'Monitored', 'Model': 'Random Forest', 'Split': s_name, **ev})
        print(f"Random Forest [{s_name}]: MAE={ev['pooled_mae']:.3f}m, RMSE={ev['pooled_rmse']:.3f}m, NSE={ev['pooled_nse']:.3f}", flush=True)

    # XGBoost
    print("Fitting XGBoost (Monitored, 100 trees)...", flush=True)
    xgb_mon = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.08, random_state=42, n_jobs=-1)
    xgb_mon.fit(X_mon[tr_idx], y_tr)
    for s_name, s_idx in [('Val Monitored', val_mon_idx), ('Test Monitored', test_mon_idx)]:
        preds = xgb_mon.predict(X_mon[s_idx])
        ev = evaluate_predictions_df(pd.DataFrame({'well_id': m['well_ids'][s_idx], 'y_true': y_true[s_idx], 'y_pred': preds}))
        results.append({'Task': 'Monitored', 'Model': 'XGBoost', 'Split': s_name, **ev})
        print(f"XGBoost [{s_name}]: MAE={ev['pooled_mae']:.3f}m, RMSE={ev['pooled_rmse']:.3f}m, NSE={ev['pooled_nse']:.3f}", flush=True)

    # GRU-no-graph
    print("Fitting GRU-no-graph (Monitored, 8 epochs)...", flush=True)
    ds_tr = TensorDataset(torch.tensor(X_seq_mon[tr_idx]), torch.tensor(X_static[tr_idx]), torch.tensor(X_harm[tr_idx]), torch.tensor(y_tr))
    loader_tr = DataLoader(ds_tr, batch_size=256, shuffle=True)
    gru_model = GRUNoGraphModel(in_dim=4, static_dim=4, hidden_dim=64, mlp_dim=32, dropout=0.1)
    opt = torch.optim.Adam(gru_model.parameters(), lr=1e-3, weight_decay=1e-4)
    loss_fn = nn.MSELoss()

    gru_model.train()
    for ep in range(8):
        for b_seq, b_st, b_hm, b_y in loader_tr:
            opt.zero_grad()
            mu, _ = gru_model(b_seq, b_st, b_hm)
            loss = loss_fn(mu, b_y)
            loss.backward()
            opt.step()

    gru_model.eval()
    with torch.no_grad():
        for s_name, s_idx in [('Val Monitored', val_mon_idx), ('Test Monitored', test_mon_idx)]:
            mu, _ = gru_model(torch.tensor(X_seq_mon[s_idx]), torch.tensor(X_static[s_idx]), torch.tensor(X_harm[s_idx]))
            preds = mu.numpy()
            ev = evaluate_predictions_df(pd.DataFrame({'well_id': m['well_ids'][s_idx], 'y_true': y_true[s_idx], 'y_pred': preds}))
            results.append({'Task': 'Monitored', 'Model': 'GRU-no-graph', 'Split': s_name, **ev})
            print(f"GRU-no-graph [{s_name}]: MAE={ev['pooled_mae']:.3f}m, RMSE={ev['pooled_rmse']:.3f}m, NSE={ev['pooled_nse']:.3f}", flush=True)

    # 2. No-History (Spatial Query) Baselines
    print("\n--- 2. No-History (Spatial Query) Baselines ---", flush=True)

    scaler_env = StandardScaler()
    X_env_tr_scaled = scaler_env.fit_transform(X_env[tr_idx])

    # Environmental Ridge
    print("Fitting Environmental Ridge...", flush=True)
    ridge_env = Ridge(alpha=10.0)
    ridge_env.fit(X_env_tr_scaled, y_tr)

    # Environmental RF
    print("Fitting Environmental RF (80 trees)...", flush=True)
    rf_env = RandomForestRegressor(n_estimators=80, max_depth=10, random_state=42, n_jobs=-1)
    rf_env.fit(X_env[tr_idx], y_tr)

    # Environmental XGBoost
    print("Fitting Environmental XGBoost...", flush=True)
    xgb_env = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.08, random_state=42, n_jobs=-1)
    xgb_env.fit(X_env[tr_idx], y_tr)

    for s_name, s_idx in [('Val No-History', val_query_idx), ('Test No-History', test_query_idx)]:
        p_r = ridge_env.predict(scaler_env.transform(X_env[s_idx]))
        p_rf = rf_env.predict(X_env[s_idx])
        p_xgb = xgb_env.predict(X_env[s_idx])

        ev_r = evaluate_predictions_df(pd.DataFrame({'well_id': m['well_ids'][s_idx], 'y_true': y_true[s_idx], 'y_pred': p_r}))
        ev_rf = evaluate_predictions_df(pd.DataFrame({'well_id': m['well_ids'][s_idx], 'y_true': y_true[s_idx], 'y_pred': p_rf}))
        ev_xgb = evaluate_predictions_df(pd.DataFrame({'well_id': m['well_ids'][s_idx], 'y_true': y_true[s_idx], 'y_pred': p_xgb}))

        results.append({'Task': 'No-History', 'Model': 'Environmental Ridge', 'Split': s_name, **ev_r})
        results.append({'Task': 'No-History', 'Model': 'Environmental RF', 'Split': s_name, **ev_rf})
        results.append({'Task': 'No-History', 'Model': 'Environmental XGBoost', 'Split': s_name, **ev_xgb})

        print(f"Env Ridge [{s_name}]:   MAE={ev_r['pooled_mae']:.3f}m, RMSE={ev_r['pooled_rmse']:.3f}m, NSE={ev_r['pooled_nse']:.3f}", flush=True)
        print(f"Env RF [{s_name}]:      MAE={ev_rf['pooled_mae']:.3f}m, RMSE={ev_rf['pooled_rmse']:.3f}m, NSE={ev_rf['pooled_nse']:.3f}", flush=True)
        print(f"Env XGBoost [{s_name}]: MAE={ev_xgb['pooled_mae']:.3f}m, RMSE={ev_xgb['pooled_rmse']:.3f}m, NSE={ev_xgb['pooled_nse']:.3f}", flush=True)

    # Spatial Neighbour Benchmarks (Vectorized $O(1)$ lookup)
    print("Computing vectorized spatial neighbour benchmarks...", flush=True)
    grid = m['grid']
    manifest_df = pd.read_csv("results/manifests/spatial_split_manifest.csv")
    all_lats = manifest_df['latitude'].values
    all_lons = manifest_df['longitude'].values
    train_indices = manifest_df.index[manifest_df['spatial_partition'] == 'train'].values

    # Pre-compute distance matrix: (N_all, N_train)
    well_dist_to_train = haversine_distance_matrix(all_lats, all_lons, all_lats[train_indices], all_lons[train_indices])
    
    # Precompute 5 nearest training neighbours for all wells ONCE
    k_near_train_local = np.argsort(well_dist_to_train, axis=1)[:, :5]  # (N_all, 5)
    k_near_train_global = train_indices[k_near_train_local]              # (N_all, 5)
    k_near_dists = np.take_along_axis(well_dist_to_train, k_near_train_local, axis=1) # (N_all, 5)

    gw_targets_all = grid['gw_target']
    study_months = m['study_months']

    for s_name, s_idx in [('Val No-History', val_query_idx), ('Test No-History', test_query_idx)]:
        preds_np = []
        preds_idw = []

        sample_idxs = np.where(s_idx)[0]
        for idx in sample_idxs:
            w_i = m['valid_w_idx'][idx]
            t_orig = m['valid_t_orig'][idx]
            t_tgt = t_orig + h

            near_wells = k_near_train_global[w_i]
            near_d = k_near_dists[w_i]

            # Neighbour-persistence: average of k=5 nearest training wells at origin t_orig
            vals_orig = gw_targets_all[t_orig, near_wells]
            valid_o = vals_orig[~np.isnan(vals_orig)]
            p_np = float(np.mean(valid_o)) if len(valid_o) > 0 else m['cal_medians'][int(study_months[t_tgt].split('-')[1])]
            preds_np.append(p_np)

            # Contemporaneous IDW: target-date observations
            vals_tgt = gw_targets_all[t_tgt, near_wells]
            valid_t = ~np.isnan(vals_tgt)
            if valid_t.sum() > 0:
                v_t = vals_tgt[valid_t]
                d_t = np.maximum(near_d[valid_t], 1e-4)
                w_t = (1.0 / d_t**2) / np.sum(1.0 / d_t**2)
                p_idw = float(np.dot(v_t, w_t))
            else:
                p_idw = p_np
            preds_idw.append(p_idw)

        ev_np = evaluate_predictions_df(pd.DataFrame({'well_id': m['well_ids'][s_idx], 'y_true': y_true[s_idx], 'y_pred': preds_np}))
        ev_idw = evaluate_predictions_df(pd.DataFrame({'well_id': m['well_ids'][s_idx], 'y_true': y_true[s_idx], 'y_pred': preds_idw}))

        results.append({'Task': 'No-History', 'Model': 'Neighbour-Persistence', 'Split': s_name, **ev_np})
        results.append({'Task': 'No-History (Contemporaneous)', 'Model': 'Contemporaneous IDW', 'Split': s_name, **ev_idw})

        print(f"Neighbour-Persistence [{s_name}]: MAE={ev_np['pooled_mae']:.3f}m, RMSE={ev_np['pooled_rmse']:.3f}m, NSE={ev_np['pooled_nse']:.3f}", flush=True)
        print(f"Contemporaneous IDW [{s_name}]:   MAE={ev_idw['pooled_mae']:.3f}m, RMSE={ev_idw['pooled_rmse']:.3f}m, NSE={ev_idw['pooled_nse']:.3f}", flush=True)

    # Save results table
    res_df = pd.DataFrame(results)
    tables_dir = Path("results/tables")
    tables_dir.mkdir(parents=True, exist_ok=True)
    res_df.to_csv(tables_dir / "baselines_performance.csv", index=False)
    print(f"\nSaved all baseline benchmark results: {tables_dir / 'baselines_performance.csv'}", flush=True)
    return res_df

if __name__ == '__main__':
    run_all_baselines()
