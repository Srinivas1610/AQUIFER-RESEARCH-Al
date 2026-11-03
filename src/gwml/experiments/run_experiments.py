"""Phase 9: Full Experiments, Ablations, Multi-Seed Fits, and Publication Visualizations.

Implements Methodology Section C, Section D, Section 5:
1. Multi-Seed Training (Seeds 42, 43, 44) for Best Student Model.
2. Lead-Time Horizon Comparison (h in {1, 3, 6} months, Lookback L=12).
3. Ablation Study:
   - Full Distilled Student (alpha*)
   - No-Distillation Student (alpha=0.0)
   - No-Graph GRU
   - Environmental Models (XGBoost, RF, Ridge)
   - Heuristic Baselines (Persistence, Seasonal Naive, Neighbour Persistence, IDW)
4. Publication Figures:
   - Figure 3: Hydrographs (Observed vs Predicted + 90% Conformal Prediction Intervals)
   - Figure 4: Performance vs Lead-Time Horizon h in {1, 3, 6}
   - Figure 5: Spatial Error Distribution Map across Karnataka
"""
from pathlib import Path
import time
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch

from gwml.graph.graph_builder import SpatiotemporalGraphBuilder
from gwml.models.st_gnn import SpatiotemporalGNN
from gwml.training.train_student import train_student_epoch, evaluate_student
from gwml.evaluation.metrics import evaluate_predictions_df
from gwml.utils.seed import set_seed


def train_single_student_fit(
    grid,
    builder,
    static_feats_t,
    t_train_range,
    train_wells_mask,
    target_mean,
    target_std,
    teacher_mu_norm_grid,
    teacher_var_norm_grid,
    alpha=0.5,
    L=12,
    h=1,
    n_epochs=25,
    seed=42
):
    set_seed(seed)
    model = SpatiotemporalGNN(
        in_dynamic_dim=4, static_dim=4, harmonic_dim=2,
        gru_hidden=64, gat_heads=2, mlp_hidden=32, dropout=0.1
    )
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)

    for ep in range(n_epochs):
        train_student_epoch(
            model, optimizer, grid, builder, static_feats_t,
            t_train_range, train_wells_mask, target_mean, target_std,
            teacher_mu_norm_grid, teacher_var_norm_grid,
            alpha=alpha, pseudo_query_frac=0.20, L=L, h=h, seed_offset=ep
        )
    return model


def run_multi_seed_fits(best_alpha=0.5, seeds=[42, 43, 44], L=12, h=1, n_epochs=25):
    print("=" * 60, flush=True)
    print(f"RUNNING MULTI-SEED STUDENT FITS: Seeds {seeds} (alpha={best_alpha})", flush=True)
    print("=" * 60, flush=True)

    with np.load("data/processed/spatiotemporal_grid.npz") as loaded:
        grid = {k: loaded[k] for k in loaded.files}

    manifest_df = pd.read_csv("results/manifests/spatial_split_manifest.csv")
    well_ids = list(grid['well_ids'])
    N = len(well_ids)
    study_months = list(grid['study_months'])

    train_wells_set = set(manifest_df[manifest_df['spatial_partition'] == 'train']['well_id'])
    test_wells_set = set(manifest_df[manifest_df['spatial_partition'] == 'test']['well_id'])

    train_wells_mask = np.array([w in train_wells_set for w in well_ids])
    test_wells_mask = np.array([w in test_wells_set for w in well_ids])

    # Normalization
    train_obs = (grid['gw_observed_mask'][:36] == 1) & train_wells_mask[None, :]
    train_values = grid['gw_target'][:36][train_obs]
    target_mean = float(np.mean(train_values))
    target_std = float(np.std(train_values))

    static_feats = np.stack([
        grid['utm_x'] / 1e6, grid['utm_y'] / 1e6,
        grid['latitude'] / 10.0, grid['longitude'] / 10.0
    ], axis=-1).astype(np.float32)
    static_feats_t = torch.tensor(static_feats, dtype=torch.float32)

    coords = np.stack([grid['latitude'], grid['longitude']], axis=-1)
    builder = SpatiotemporalGraphBuilder(coords, k_neighbours=5)

    oof_df = pd.read_parquet("results/predictions/teacher_oof.parquet")
    T = len(study_months)
    teacher_mu_norm_grid = np.zeros((T, N), dtype=np.float32)
    teacher_var_norm_grid = np.ones((T, N), dtype=np.float32)

    well_to_idx = {w: i for i, w in enumerate(well_ids)}
    month_to_t = {m: t for t, m in enumerate(study_months)}

    for _, row in oof_df.iterrows():
        t_tgt = month_to_t.get(row['target_month'])
        w_i = well_to_idx.get(row['well_id'])
        if t_tgt is not None and w_i is not None:
            teacher_mu_norm_grid[t_tgt, w_i] = (row['teacher_mu'] - target_mean) / target_std
            teacher_var_norm_grid[t_tgt, w_i] = row['teacher_var'] / (target_std ** 2)

    t_train_range = list(range(L - 1, 36 - h))
    t_test_range = [t for t, ym in enumerate(study_months[:-h]) if '2025-01' <= study_months[t + h] <= '2025-12']

    seed_results = []
    models = {}

    for s in seeds:
        print(f"Training Seed {s}...", flush=True)
        m = train_single_student_fit(
            grid, builder, static_feats_t, t_train_range, train_wells_mask,
            target_mean, target_std, teacher_mu_norm_grid, teacher_var_norm_grid,
            alpha=best_alpha, L=L, h=h, n_epochs=n_epochs, seed=s
        )
        models[s] = m

        # Monitored Test
        ev_m, _ = evaluate_student(m, grid, builder, static_feats_t, t_test_range, train_wells_mask, target_mean, target_std, is_query_mode=False, L=L, h=h)
        # Query Test
        ev_q, _ = evaluate_student(m, grid, builder, static_feats_t, t_test_range, test_wells_mask, target_mean, target_std, is_query_mode=True, L=L, h=h)

        seed_results.append({
            'seed': s,
            'monitored_mae': ev_m['pooled_mae'],
            'monitored_rmse': ev_m['pooled_rmse'],
            'monitored_nse': ev_m['pooled_nse'],
            'query_mae': ev_q['pooled_mae'],
            'query_rmse': ev_q['pooled_rmse'],
            'query_nse': ev_q['pooled_nse']
        })
        print(f"  Seed {s} -> Monitored MAE: {ev_m['pooled_mae']:.3f}m (NSE: {ev_m['pooled_nse']:.3f}) | Query MAE: {ev_q['pooled_mae']:.3f}m (NSE: {ev_q['pooled_nse']:.3f})", flush=True)

    df_seeds = pd.DataFrame(seed_results)
    tables_dir = Path("results/tables")
    tables_dir.mkdir(parents=True, exist_ok=True)
    df_seeds.to_csv(tables_dir / "multiseed_student_results.csv", index=False)

    summary_rows = [
        {
            'metric': 'monitored_mae',
            'mean': df_seeds['monitored_mae'].mean(),
            'std': df_seeds['monitored_mae'].std()
        },
        {
            'metric': 'monitored_nse',
            'mean': df_seeds['monitored_nse'].mean(),
            'std': df_seeds['monitored_nse'].std()
        },
        {
            'metric': 'query_mae',
            'mean': df_seeds['query_mae'].mean(),
            'std': df_seeds['query_mae'].std()
        },
        {
            'metric': 'query_nse',
            'mean': df_seeds['query_nse'].mean(),
            'std': df_seeds['query_nse'].std()
        }
    ]
    summary_df = pd.DataFrame(summary_rows)
    summary_df.to_csv(tables_dir / "multiseed_summary.csv", index=False)
    print(f"\nMulti-Seed Summary:\n{summary_df}", flush=True)

    return df_seeds, summary_df


def run_horizon_comparison(best_alpha=0.5, horizons=[1, 3, 6], L=12, n_epochs=20):
    print("\n" + "=" * 60, flush=True)
    print(f"RUNNING LEAD-TIME HORIZON COMPARISON: h in {horizons} months", flush=True)
    print("=" * 60, flush=True)

    with np.load("data/processed/spatiotemporal_grid.npz") as loaded:
        grid = {k: loaded[k] for k in loaded.files}

    manifest_df = pd.read_csv("results/manifests/spatial_split_manifest.csv")
    well_ids = list(grid['well_ids'])
    N = len(well_ids)
    study_months = list(grid['study_months'])

    train_wells_set = set(manifest_df[manifest_df['spatial_partition'] == 'train']['well_id'])
    test_wells_set = set(manifest_df[manifest_df['spatial_partition'] == 'test']['well_id'])

    train_wells_mask = np.array([w in train_wells_set for w in well_ids])
    test_wells_mask = np.array([w in test_wells_set for w in well_ids])

    train_obs = (grid['gw_observed_mask'][:36] == 1) & train_wells_mask[None, :]
    train_values = grid['gw_target'][:36][train_obs]
    target_mean = float(np.mean(train_values))
    target_std = float(np.std(train_values))

    static_feats = np.stack([
        grid['utm_x'] / 1e6, grid['utm_y'] / 1e6,
        grid['latitude'] / 10.0, grid['longitude'] / 10.0
    ], axis=-1).astype(np.float32)
    static_feats_t = torch.tensor(static_feats, dtype=torch.float32)

    coords = np.stack([grid['latitude'], grid['longitude']], axis=-1)
    builder = SpatiotemporalGraphBuilder(coords, k_neighbours=5)

    oof_df = pd.read_parquet("results/predictions/teacher_oof.parquet")
    T = len(study_months)
    teacher_mu_norm_grid = np.zeros((T, N), dtype=np.float32)
    teacher_var_norm_grid = np.ones((T, N), dtype=np.float32)

    well_to_idx = {w: i for i, w in enumerate(well_ids)}
    month_to_t = {m: t for t, m in enumerate(study_months)}

    for _, row in oof_df.iterrows():
        t_tgt = month_to_t.get(row['target_month'])
        w_i = well_to_idx.get(row['well_id'])
        if t_tgt is not None and w_i is not None:
            teacher_mu_norm_grid[t_tgt, w_i] = (row['teacher_mu'] - target_mean) / target_std
            teacher_var_norm_grid[t_tgt, w_i] = row['teacher_var'] / (target_std ** 2)

    horizon_records = []

    for h in horizons:
        print(f"\nEvaluating Lead-Time Horizon h = {h} month(s)...", flush=True)
        t_train_range = list(range(L - 1, 36 - h))
        t_test_range = [t for t, ym in enumerate(study_months[:-h]) if '2025-01' <= study_months[t + h] <= '2025-12']

        # Train model for horizon h
        m = train_single_student_fit(
            grid, builder, static_feats_t, t_train_range, train_wells_mask,
            target_mean, target_std, teacher_mu_norm_grid, teacher_var_norm_grid,
            alpha=best_alpha if h == 1 else 0.0,  # OOF teacher targets exist for h=1; direct h>1 uses NLL
            L=L, h=h, n_epochs=n_epochs, seed=42
        )

        # Monitored Test
        ev_m, _ = evaluate_student(m, grid, builder, static_feats_t, t_test_range, train_wells_mask, target_mean, target_std, is_query_mode=False, L=L, h=h)
        # Query Test
        ev_q, _ = evaluate_student(m, grid, builder, static_feats_t, t_test_range, test_wells_mask, target_mean, target_std, is_query_mode=True, L=L, h=h)

        horizon_records.append({
            'horizon_months': h,
            'monitored_mae': ev_m['pooled_mae'],
            'monitored_rmse': ev_m['pooled_rmse'],
            'monitored_nse': ev_m['pooled_nse'],
            'query_mae': ev_q['pooled_mae'],
            'query_rmse': ev_q['pooled_rmse'],
            'query_nse': ev_q['pooled_nse'],
            'n_monitored_targets': ev_m['n_targets'],
            'n_query_targets': ev_q['n_targets']
        })
        print(f"  h={h} -> Monitored MAE: {ev_m['pooled_mae']:.3f}m, NSE: {ev_m['pooled_nse']:.3f} | Query MAE: {ev_q['pooled_mae']:.3f}m, NSE: {ev_q['pooled_nse']:.3f}", flush=True)

    df_horizons = pd.DataFrame(horizon_records)
    tables_dir = Path("results/tables")
    tables_dir.mkdir(parents=True, exist_ok=True)
    df_horizons.to_csv(tables_dir / "horizon_comparison.csv", index=False)
    print(f"\nSaved horizon comparison table to {tables_dir / 'horizon_comparison.csv'}", flush=True)

    # Plot Horizon Comparison Figure
    figs_dir = Path("results/figures")
    figs_dir.mkdir(parents=True, exist_ok=True)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5))

    ax1.plot(df_horizons['horizon_months'], df_horizons['monitored_mae'], 'o-', color='#1f77b4', lw=2, label='Monitored Wells')
    ax1.plot(df_horizons['horizon_months'], df_horizons['query_mae'], 's--', color='#d62728', lw=2, label='No-History Query Wells')
    ax1.set_xlabel('Lead Time Horizon (Months)', fontsize=12)
    ax1.set_ylabel('MAE (m)', fontsize=12)
    ax1.set_xticks(horizons)
    ax1.grid(True, linestyle='--', alpha=0.5)
    ax1.set_title('(a) Mean Absolute Error vs. Horizon', fontsize=12)
    ax1.legend(frameon=True)

    ax2.plot(df_horizons['horizon_months'], df_horizons['monitored_nse'], 'o-', color='#1f77b4', lw=2, label='Monitored Wells')
    ax2.plot(df_horizons['horizon_months'], df_horizons['query_nse'], 's--', color='#d62728', lw=2, label='No-History Query Wells')
    ax2.set_xlabel('Lead Time Horizon (Months)', fontsize=12)
    ax2.set_ylabel('Nash-Sutcliffe Efficiency (NSE)', fontsize=12)
    ax2.set_xticks(horizons)
    ax2.grid(True, linestyle='--', alpha=0.5)
    ax2.set_title('(b) NSE vs. Horizon', fontsize=12)
    ax2.legend(frameon=True)

    plt.suptitle('Prediction Degradation across Forecasting Horizons (h = 1, 3, 6 Months)', fontsize=13, y=1.02)
    plt.tight_layout()
    plt.savefig(figs_dir / "horizon_performance.png", dpi=300)
    plt.close()
    print(f"Saved horizon performance figure to {figs_dir / 'horizon_performance.png'}", flush=True)

    return df_horizons


def build_ablation_table():
    """Compile comprehensive ablation table comparing full student against all ablations and baselines."""
    print("\n" + "=" * 60, flush=True)
    print("COMPILING EXPERIMENT 2: COMPREHENSIVE ABLATION TABLE", flush=True)
    print("=" * 60, flush=True)

    tables_dir = Path("results/tables")
    perf_path = tables_dir / "student_performance.csv"
    sweep_path = tables_dir / "student_alpha_sweep.csv"
    base_path = tables_dir / "baselines_performance.csv"

    student_perf = pd.read_csv(perf_path)
    sweep_df = pd.read_csv(sweep_path)
    base_df = pd.read_csv(base_path)

    # 1. Full Distilled Student (Test Monitored)
    full_monitored = student_perf[(student_perf['Task'] == 'Monitored') & (student_perf['Split'] == 'Test Monitored')].iloc[0]
    base_mae = full_monitored['pooled_mae']
    base_nse = full_monitored['pooled_nse']

    # 2. No Distillation Student (alpha=0.0)
    alpha0_row = sweep_df[sweep_df['alpha'] == 0.0].iloc[0]
    val_monitored = student_perf[(student_perf['Task'] == 'Monitored') & (student_perf['Split'] == 'Val Monitored')].iloc[0]

    # 3. No Graph Baseline (GRU-no-graph)
    no_graph_row = base_df[(base_df['Model'].str.contains('GRU', case=False)) & (base_df['Split'] == 'Test Monitored')].iloc[0]

    # 4. Persistence
    pers_row = base_df[(base_df['Model'] == 'Persistence') & (base_df['Split'] == 'Test Monitored')].iloc[0]

    # 5. XGBoost
    xgb_row = base_df[(base_df['Model'] == 'XGBoost') & (base_df['Split'] == 'Test Monitored')].iloc[0]

    # 6. Full Student (Test Query)
    full_query = student_perf[(student_perf['Task'] == 'No-History Query') & (student_perf['Split'] == 'Test Query')].iloc[0]

    # 7. Query XGBoost
    q_xgb_row = base_df[(base_df['Model'] == 'Environmental XGBoost') & (base_df['Split'] == 'Test No-History')].iloc[0]

    # 8. Query IDW
    q_idw_row = base_df[(base_df['Model'] == 'Contemporaneous IDW') & (base_df['Split'] == 'Test No-History')].iloc[0]

    ablation_rows = [
        {
            'Configuration / Model': 'Full Distilled Student GNN (Proposed)',
            'Task': 'Monitored',
            'MAE (m)': round(full_monitored['pooled_mae'], 3),
            'RMSE (m)': round(full_monitored['pooled_rmse'], 3),
            'NSE': round(full_monitored['pooled_nse'], 3),
            'Delta MAE (m)': 0.0,
            'Delta NSE': 0.0
        },
        {
            'Configuration / Model': 'No-Distillation Student (alpha=0.0, Val)',
            'Task': 'Monitored',
            'MAE (m)': round(alpha0_row['temp_val_mae'], 3),
            'RMSE (m)': round(alpha0_row['temp_val_rmse'], 3),
            'NSE': round(alpha0_row['temp_val_nse'], 3),
            'Delta MAE (m)': round(alpha0_row['temp_val_mae'] - val_monitored['pooled_mae'], 3),
            'Delta NSE': round(alpha0_row['temp_val_nse'] - val_monitored['pooled_nse'], 3)
        },
        {
            'Configuration / Model': 'No-Graph Temporal Model (GRU Only)',
            'Task': 'Monitored',
            'MAE (m)': round(no_graph_row['pooled_mae'], 3),
            'RMSE (m)': round(no_graph_row['pooled_rmse'], 3),
            'NSE': round(no_graph_row['pooled_nse'], 3),
            'Delta MAE (m)': round(no_graph_row['pooled_mae'] - base_mae, 3),
            'Delta NSE': round(no_graph_row['pooled_nse'] - base_nse, 3)
        },
        {
            'Configuration / Model': 'Gradient Boosted Trees (XGBoost)',
            'Task': 'Monitored',
            'MAE (m)': round(xgb_row['pooled_mae'], 3),
            'RMSE (m)': round(xgb_row['pooled_rmse'], 3),
            'NSE': round(xgb_row['pooled_nse'], 3),
            'Delta MAE (m)': round(xgb_row['pooled_mae'] - base_mae, 3),
            'Delta NSE': round(xgb_row['pooled_nse'] - base_nse, 3)
        },
        {
            'Configuration / Model': 'Lag-1 Temporal Persistence',
            'Task': 'Monitored',
            'MAE (m)': round(pers_row['pooled_mae'], 3),
            'RMSE (m)': round(pers_row['pooled_rmse'], 3),
            'NSE': round(pers_row['pooled_nse'], 3),
            'Delta MAE (m)': round(pers_row['pooled_mae'] - base_mae, 3),
            'Delta NSE': round(pers_row['pooled_nse'] - base_nse, 3)
        },
        {
            'Configuration / Model': 'Full Student (Pseudo-Query Trained)',
            'Task': 'No-History Query',
            'MAE (m)': round(full_query['pooled_mae'], 3),
            'RMSE (m)': round(full_query['pooled_rmse'], 3),
            'NSE': round(full_query['pooled_nse'], 3),
            'Delta MAE (m)': 0.0,
            'Delta NSE': 0.0
        },
        {
            'Configuration / Model': 'Environmental XGBoost',
            'Task': 'No-History Query',
            'MAE (m)': round(q_xgb_row['pooled_mae'], 3),
            'RMSE (m)': round(q_xgb_row['pooled_rmse'], 3),
            'NSE': round(q_xgb_row['pooled_nse'], 3),
            'Delta MAE (m)': round(q_xgb_row['pooled_mae'] - full_query['pooled_mae'], 3),
            'Delta NSE': round(q_xgb_row['pooled_nse'] - full_query['pooled_nse'], 3)
        },
        {
            'Configuration / Model': 'Contemporaneous IDW',
            'Task': 'No-History Query',
            'MAE (m)': round(q_idw_row['pooled_mae'], 3),
            'RMSE (m)': round(q_idw_row['pooled_rmse'], 3),
            'NSE': round(q_idw_row['pooled_nse'], 3),
            'Delta MAE (m)': round(q_idw_row['pooled_mae'] - full_query['pooled_mae'], 3),
            'Delta NSE': round(q_idw_row['pooled_nse'] - full_query['pooled_nse'], 3)
        }
    ]

    ablation_df = pd.DataFrame(ablation_rows)
    ablation_df.to_csv(tables_dir / "ablation_study.csv", index=False)
    print(f"Saved ablation study table to {tables_dir / 'ablation_study.csv'}", flush=True)
    return ablation_df


def generate_publication_figures():
    """Generate Figure 3 (Hydrographs with Prediction Intervals) and Figure 5 (Spatial Error Distribution)."""
    print("\n" + "=" * 60, flush=True)
    print("GENERATING PUBLICATION FIGURES: Figure 3 & Figure 5", flush=True)
    print("=" * 60, flush=True)

    figs_dir = Path("results/figures")
    figs_dir.mkdir(parents=True, exist_ok=True)

    # 1. Figure 3: Hydrographs
    preds_path = Path("results/predictions/calibrated_test_monitored.parquet")
    if preds_path.exists():
        df_cal = pd.read_parquet(preds_path)
        # Select 3 representative wells with rich test observations
        well_counts = df_cal['well_id'].value_counts()
        eligible_wells = well_counts[well_counts >= 10].index[:3]

        fig, axes = plt.subplots(len(eligible_wells), 1, figsize=(11, 3.5 * len(eligible_wells)), sharex=True)
        if len(eligible_wells) == 1:
            axes = [axes]

        for ax, wid in zip(axes, eligible_wells):
            w_df = df_cal[df_cal['well_id'] == wid].sort_values('month')
            months = w_df['month'].values

            ax.plot(months, w_df['y_true'], 'ko-', lw=2, ms=6, label='Observed (m bgl)')
            ax.plot(months, w_df['mu'], 'b--', lw=2, ms=5, label='Distilled Student Prediction')
            ax.fill_between(months, w_df['L_cal'], w_df['U_cal'], color='blue', alpha=0.18, label='90% Conformal Interval')

            ax.set_ylabel('Depth to Water (m bgl)', fontsize=11)
            ax.set_title(f'Monitoring Well: {wid}', fontsize=12, fontweight='bold')
            ax.grid(True, linestyle='--', alpha=0.5)
            ax.invert_yaxis()  # Water depth convention: deeper is lower on graph
            ax.legend(loc='lower left', frameon=True)

        axes[-1].set_xlabel('Month (2025 Test Partition)', fontsize=12)
        plt.suptitle('Figure 3: Test-Period Ground Truth vs. Distilled Student Forecasts with 90% Conformal Intervals', fontsize=13, y=1.01)
        plt.tight_layout()
        plt.savefig(figs_dir / "hydrographs_comparison.png", dpi=300)
        plt.close()
        print(f"Saved Figure 3 hydrographs to {figs_dir / 'hydrographs_comparison.png'}", flush=True)

    # 2. Figure 5: Spatial Error Distribution
    grid = np.load("data/processed/spatiotemporal_grid.npz")
    manifest = pd.read_csv("results/manifests/spatial_split_manifest.csv")
    if preds_path.exists():
        df_cal['abs_err'] = (df_cal['y_true'] - df_cal['mu']).abs()
        well_mae = df_cal.groupby('well_id')['abs_err'].mean().reset_index(name='mae')
        well_meta = manifest[['well_id', 'longitude', 'latitude', 'spatial_partition']].merge(well_mae, on='well_id', how='left')

        fig, ax = plt.subplots(figsize=(8, 10))
        # Plot all wells as background
        ax.scatter(well_meta['longitude'], well_meta['latitude'], color='#e0e0e0', s=15, alpha=0.5, label='Other Wells')

        # Plot evaluated test wells with MAE color scale
        test_eval = well_meta.dropna(subset=['mae'])
        sc = ax.scatter(test_eval['longitude'], test_eval['latitude'], c=test_eval['mae'], cmap='plasma', s=40, edgecolor='black', lw=0.5, label='Monitored Test Wells')

        cbar = plt.colorbar(sc, ax=ax, fraction=0.035, pad=0.04)
        cbar.set_label('Mean Absolute Error (m)', fontsize=12)

        ax.set_xlabel('Longitude (°E)', fontsize=12)
        ax.set_ylabel('Latitude (°N)', fontsize=12)
        ax.set_title('Figure 5: Spatial Distribution of Prediction Error Across Karnataka (2025 Test Partition)', fontsize=12, pad=12)
        ax.grid(True, linestyle='--', alpha=0.5)
        ax.legend(loc='lower left', frameon=True)

        plt.tight_layout()
        plt.savefig(figs_dir / "spatial_error_map.png", dpi=300)
        plt.close()
        print(f"Saved Figure 5 spatial error map to {figs_dir / 'spatial_error_map.png'}", flush=True)


def main():
    student_ckpt = torch.load("results/models/student_best.pt", map_location="cpu")
    best_alpha = float(student_ckpt.get("best_alpha", 0.3))
    print(f"Using empirically selected best_alpha = {best_alpha}")

    # 1. Multi-seed fits (skip if already generated)
    if not Path("results/tables/multiseed_summary.csv").exists():
        df_seeds, summary_df = run_multi_seed_fits(best_alpha=best_alpha, seeds=[42, 43, 44], L=12, h=1, n_epochs=20)
    else:
        print("Multi-seed results already exist, skipping re-training.")

    # 2. Horizon comparison (skip if already generated)
    if not Path("results/tables/horizon_comparison.csv").exists():
        df_horizons = run_horizon_comparison(best_alpha=best_alpha, horizons=[1, 3, 6], L=12, n_epochs=15)
    else:
        print("Horizon comparison already exists, skipping re-training.")

    # 3. Ablation table
    ablation_df = build_ablation_table()
    # 4. Figures
    generate_publication_figures()
    print("\nPhase 9 Experiment and Ablation suite completed successfully!", flush=True)


if __name__ == '__main__':
    main()
