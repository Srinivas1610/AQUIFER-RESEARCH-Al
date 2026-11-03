"""Student model training with Teacher-Student Distillation and Alpha Sweep.

Implements Methodology Section C, Section D, Section 5:
- Compact Student Architecture: GRU hidden 64, 2 GATv2 heads, 32-unit MLP head.
- 20% Pseudo-Query Training: in each training snapshot, 20% of training wells
  have their groundwater input history zeroed out before graph construction.
- Distillation Loss on observed target locations:
    L = (1 - alpha) * L_NLL(y, mu_s, v_s) + alpha * D_KL(N_t || N_s)
  using out-of-fold teacher predictions (results/predictions/teacher_oof.parquet).
- Grid sweep over alpha in {0.0, 0.3, 0.5, 0.7}.
- Selection of best alpha on validation set (MAE on spatial-val + temporal-val).
- Export of results/models/student_best.pt, results/tables/student_alpha_sweep.csv,
  results/tables/student_performance.csv, and results/figures/student_alpha_sweep.png.
"""
from pathlib import Path
import time
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F

from gwml.graph.graph_builder import SpatiotemporalGraphBuilder
from gwml.models.st_gnn import SpatiotemporalGNN, gaussian_nll_loss
from gwml.evaluation.metrics import evaluate_predictions_df
from gwml.utils.seed import set_seed


def distillation_loss_batch(y_true, mu_s, v_s, mu_t, v_t, alpha, mask):
    """
    Methodology Section 5 Distillation Loss:
    L = (1 - alpha) * L_NLL(y, mu_s, v_s) + alpha * D_KL(N_t || N_s)
    D_KL(N_0 || N_1) = 0.5 * [log(v_1 / v_0) + (v_0 + (mu_0 - mu_1)^2) / v_1 - 1]
    where N_0 is teacher (mu_t, v_t) and N_1 is student (mu_s, v_s).
    """
    # 1. NLL on observed target
    nll = 0.5 * torch.log(v_s) + (y_true - mu_s) ** 2 / (2.0 * v_s)

    if alpha > 0.0:
        # 2. KL divergence D_KL(N_t || N_s)
        v_s_safe = torch.clamp(v_s, min=1e-6)
        v_t_safe = torch.clamp(v_t, min=1e-6)
        kl = 0.5 * (torch.log(v_s_safe / v_t_safe) + (v_t_safe + (mu_t - mu_s) ** 2) / v_s_safe - 1.0)
        kl = torch.clamp(kl, min=0.0)
        loss = (1.0 - alpha) * nll + alpha * kl
    else:
        loss = nll

    return torch.sum(loss * mask) / torch.clamp(mask.sum(), min=1.0)


def train_student_epoch(
    model,
    optimizer,
    grid,
    builder,
    static_feats,
    t_indices,
    train_wells_mask,
    target_mean,
    target_std,
    teacher_mu_norm_grid,
    teacher_var_norm_grid,
    alpha=0.5,
    pseudo_query_frac=0.20,
    L=12,
    h=1,
    seed_offset=0
):
    model.train()
    total_loss = 0.0
    n_targets_total = 0
    N = grid['gw_target'].shape[1]

    train_indices = np.where(train_wells_mask)[0]
    n_train = len(train_indices)
    n_pseudo = int(pseudo_query_frac * n_train)

    for step_idx, t in enumerate(t_indices):
        # 1. Sample 20% pseudo-queries from training wells
        np.random.seed(42 + seed_offset * 100 + step_idx)
        perm = np.random.permutation(n_train)
        pseudo_indices = set(train_indices[perm[:n_pseudo]])

        # 2. Prepare dynamic features
        gw_slice = grid['gw_target'][t - L + 1 : t + 1].T.copy()  # (N, L)
        mask_slice = grid['gw_observed_mask'][t - L + 1 : t + 1].T.copy()
        rain_slice = grid['rainfall'][t - L + 1 : t + 1].T
        temp_slice = grid['temperature'][t - L + 1 : t + 1].T

        # Hide groundwater history for pseudo-queries
        for p_idx in pseudo_indices:
            gw_slice[p_idx, :] = 0.0
            mask_slice[p_idx, :] = 0

        # Normalize groundwater history
        gw_norm = np.where(mask_slice == 1, (gw_slice - target_mean) / target_std, 0.0)
        x_seq = np.stack([gw_norm, mask_slice.astype(np.float32), rain_slice / 100.0, temp_slice / 30.0], axis=-1)
        x_seq_t = torch.tensor(x_seq, dtype=torch.float32)

        # Harmonics of target month t+h
        harm_t = torch.tensor([grid['sin_month'][t + h, 0], grid['cos_month'][t + h, 0]], dtype=torch.float32).unsqueeze(0).repeat(N, 1)

        # 3. Dynamic Graph: only non-pseudo-query training wells with valid history can send messages
        has_history = (mask_slice.sum(axis=1) > 0)
        eligible_senders = train_wells_mask & has_history
        for p_idx in pseudo_indices:
            eligible_senders[p_idx] = False

        edge_index, edge_attr, _ = builder.build_graph(eligible_senders_mask=eligible_senders)

        # 4. Target and Evaluation Mask (observed targets among ALL training wells, including pseudo-queries)
        y_raw = grid['gw_target'][t + h]
        y_obs = grid['gw_observed_mask'][t + h]
        eval_mask = (y_obs == 1) & train_wells_mask
        if eval_mask.sum() == 0:
            continue

        y_norm_target = torch.tensor(np.where(eval_mask, (y_raw - target_mean) / target_std, 0.0), dtype=torch.float32)
        eval_mask_t = torch.tensor(eval_mask, dtype=torch.float32)

        # Teacher OOF soft targets
        mu_t_t = torch.tensor(teacher_mu_norm_grid[t + h], dtype=torch.float32)
        v_t_t = torch.tensor(teacher_var_norm_grid[t + h], dtype=torch.float32)

        # 5. Forward & Loss
        optimizer.zero_grad()
        mu_s, v_s = model(x_seq_t, static_feats, harm_t, edge_index, edge_attr)

        loss = distillation_loss_batch(
            y_norm_target, mu_s, v_s, mu_t_t, v_t_t, alpha=alpha, mask=eval_mask_t
        )
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        total_loss += loss.item() * eval_mask.sum()
        n_targets_total += eval_mask.sum()

    return total_loss / max(1, n_targets_total)


def evaluate_student(
    model,
    grid,
    builder,
    static_feats,
    t_indices,
    eval_wells_mask,
    target_mean,
    target_std,
    is_query_mode=False,
    L=12,
    h=1
):
    """
    Evaluate student on a partition of snapshots.
    If is_query_mode is True, evaluation wells have no groundwater history and send no messages.
    """
    model.eval()
    N = grid['gw_target'].shape[1]
    predictions = []

    # Eligible senders in evaluation are all training wells with history
    with torch.no_grad():
        for t in t_indices:
            gw_slice = grid['gw_target'][t - L + 1 : t + 1].T.copy()
            mask_slice = grid['gw_observed_mask'][t - L + 1 : t + 1].T.copy()
            rain_slice = grid['rainfall'][t - L + 1 : t + 1].T
            temp_slice = grid['temperature'][t - L + 1 : t + 1].T

            if is_query_mode:
                # Query wells have zero groundwater history
                eval_idx = np.where(eval_wells_mask)[0]
                for q_i in eval_idx:
                    gw_slice[q_i, :] = 0.0
                    mask_slice[q_i, :] = 0

            gw_norm = np.where(mask_slice == 1, (gw_slice - target_mean) / target_std, 0.0)
            x_seq = np.stack([gw_norm, mask_slice.astype(np.float32), rain_slice / 100.0, temp_slice / 30.0], axis=-1)
            x_seq_t = torch.tensor(x_seq, dtype=torch.float32)

            harm_t = torch.tensor([grid['sin_month'][t + h, 0], grid['cos_month'][t + h, 0]], dtype=torch.float32).unsqueeze(0).repeat(N, 1)

            # Query wells send no messages; eligible senders are other non-query monitored wells
            if is_query_mode:
                eligible_senders = ~eval_wells_mask & (mask_slice.sum(axis=1) > 0)
            else:
                eligible_senders = (mask_slice.sum(axis=1) > 0)

            edge_index, edge_attr, _ = builder.build_graph(eligible_senders_mask=eligible_senders)

            mu_norm, v_norm = model(x_seq_t, static_feats, harm_t, edge_index, edge_attr)
            mu_m = (mu_norm.numpy() * target_std) + target_mean
            v_m = v_norm.numpy() * (target_std ** 2)

            # Record predictions for observed targets in eval_wells_mask
            obs_mask = (grid['gw_observed_mask'][t + h] == 1) & eval_wells_mask
            for i in np.where(obs_mask)[0]:
                predictions.append({
                    'well_id': grid['well_ids'][i],
                    'y_true': float(grid['gw_target'][t + h, i]),
                    'y_pred': float(mu_m[i]),
                    'variance': float(v_m[i])
                })

    if len(predictions) == 0:
        return {'pooled_mae': 999.0, 'pooled_rmse': 999.0, 'pooled_nse': -999.0, 'n_targets': 0}

    pred_df = pd.DataFrame(predictions)
    metrics = evaluate_predictions_df(pred_df)
    return metrics, pred_df


def run_student_pipeline(L=12, h=1, n_epochs=25, seed=42):
    print("=" * 60, flush=True)
    print(f"PHASE 7: STUDENT MODEL WITH TEACHER-STUDENT DISTILLATION (L={L}, h={h})", flush=True)
    print("=" * 60, flush=True)

    set_seed(seed)

    # 1. Load Data Grid
    with np.load("data/processed/spatiotemporal_grid.npz") as loaded:
        grid = {k: loaded[k] for k in loaded.files}

    manifest_df = pd.read_csv("results/manifests/spatial_split_manifest.csv")
    well_ids = list(grid['well_ids'])
    N = len(well_ids)
    study_months = list(grid['study_months'])

    # Well partition masks
    train_wells_set = set(manifest_df[manifest_df['spatial_partition'] == 'train']['well_id'])
    val_wells_set = set(manifest_df[manifest_df['spatial_partition'] == 'val']['well_id'])
    test_wells_set = set(manifest_df[manifest_df['spatial_partition'] == 'test']['well_id'])

    train_wells_mask = np.array([w in train_wells_set for w in well_ids])
    val_wells_mask = np.array([w in val_wells_set for w in well_ids])
    test_wells_mask = np.array([w in test_wells_set for w in well_ids])

    # 2. Normalization fit strictly on training targets (2021-2023)
    train_obs = (grid['gw_observed_mask'][:36] == 1) & train_wells_mask[None, :]
    train_values = grid['gw_target'][:36][train_obs]
    target_mean = float(np.mean(train_values))
    target_std = float(np.std(train_values))

    # Static features: (N, 4)
    static_feats = np.stack([
        grid['utm_x'] / 1e6,
        grid['utm_y'] / 1e6,
        grid['latitude'] / 10.0,
        grid['longitude'] / 10.0
    ], axis=-1).astype(np.float32)
    static_feats_t = torch.tensor(static_feats, dtype=torch.float32)

    # Graph builder
    coords = np.stack([grid['latitude'], grid['longitude']], axis=-1)
    builder = SpatiotemporalGraphBuilder(coords, k_neighbours=5)

    # 3. Load Teacher OOF Targets and map to (T, N) normalized grids
    print("Loading Teacher OOF soft targets...", flush=True)
    oof_df = pd.read_parquet("results/predictions/teacher_oof.parquet")
    print(f"Loaded {len(oof_df):,} teacher OOF targets.", flush=True)

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

    # Time ranges
    t_train_range = list(range(L - 1, 36 - h))  # 2021-12 to 2023-11 origins -> 2022-01 to 2023-12 targets
    t_val_range = [t for t, ym in enumerate(study_months[:-h]) if '2024-01' <= study_months[t + h] <= '2024-06']
    t_test_range = [t for t, ym in enumerate(study_months[:-h]) if '2025-01' <= study_months[t + h] <= '2025-12']

    # 4. Alpha Sweep: {0.0, 0.3, 0.5, 0.7}
    alphas = [0.0, 0.3, 0.5, 0.7]
    sweep_results = []
    models_by_alpha = {}
    history_by_alpha = {}

    print("\n" + "=" * 50, flush=True)
    print("RUNNING DISTILLATION ALPHA SWEEP: {0.0, 0.3, 0.5, 0.7}", flush=True)
    print("=" * 50, flush=True)

    for alpha in alphas:
        print(f"\n--- Training Student with alpha = {alpha:.1f} ---", flush=True)
        set_seed(seed)
        student_model = SpatiotemporalGNN(
            in_dynamic_dim=4,
            static_dim=4,
            harmonic_dim=2,
            gru_hidden=64,
            gat_heads=2,
            mlp_hidden=32,
            dropout=0.1
        )
        optimizer = torch.optim.Adam(student_model.parameters(), lr=1e-3, weight_decay=1e-4)

        t0 = time.time()
        train_losses = []
        val_records = []

        for ep in range(n_epochs):
            ep_loss = train_student_epoch(
                student_model, optimizer, grid, builder, static_feats_t,
                t_train_range, train_wells_mask, target_mean, target_std,
                teacher_mu_norm_grid, teacher_var_norm_grid,
                alpha=alpha, pseudo_query_frac=0.20, L=L, h=h, seed_offset=ep
            )
            train_losses.append(ep_loss)

        elapsed = time.time() - t0
        print(f"Alpha {alpha:.1f} trained in {elapsed:.1f}s. Final Train Loss: {train_losses[-1]:.4f}", flush=True)

        # Evaluate on Validation Partitions
        # 1. Temporal-Val (Monitored training wells, Jan-Jun 2024)
        m_temp_val, _ = evaluate_student(
            student_model, grid, builder, static_feats_t, t_val_range,
            train_wells_mask, target_mean, target_std, is_query_mode=False, L=L, h=h
        )
        # 2. Spatial-Val (Unmonitored Query wells, Jan-Jun 2024)
        m_spat_val, _ = evaluate_student(
            student_model, grid, builder, static_feats_t, t_val_range,
            val_wells_mask, target_mean, target_std, is_query_mode=True, L=L, h=h
        )

        composite_val_mae = 0.5 * (m_temp_val['pooled_mae'] + m_spat_val['pooled_mae'])
        composite_val_rmse = 0.5 * (m_temp_val['pooled_rmse'] + m_spat_val['pooled_rmse'])

        print(f"  Temporal-Val (Monitored): MAE={m_temp_val['pooled_mae']:.3f}m, NSE={m_temp_val['pooled_nse']:.3f}", flush=True)
        print(f"  Spatial-Val  (Query):     MAE={m_spat_val['pooled_mae']:.3f}m, NSE={m_spat_val['pooled_nse']:.3f}", flush=True)
        print(f"  --> Composite Val MAE:    {composite_val_mae:.3f}m", flush=True)

        sweep_results.append({
            'alpha': alpha,
            'train_loss': train_losses[-1],
            'temp_val_mae': m_temp_val['pooled_mae'],
            'temp_val_rmse': m_temp_val['pooled_rmse'],
            'temp_val_nse': m_temp_val['pooled_nse'],
            'spat_val_mae': m_spat_val['pooled_mae'],
            'spat_val_rmse': m_spat_val['pooled_rmse'],
            'spat_val_nse': m_spat_val['pooled_nse'],
            'composite_val_mae': composite_val_mae,
            'composite_val_rmse': composite_val_rmse,
            'training_time_s': elapsed
        })
        models_by_alpha[alpha] = student_model
        history_by_alpha[alpha] = train_losses

    # Save Sweep Table
    sweep_df = pd.DataFrame(sweep_results)
    tables_dir = Path("results/tables")
    tables_dir.mkdir(parents=True, exist_ok=True)
    sweep_df.to_csv(tables_dir / "student_alpha_sweep.csv", index=False)
    print(f"\nSaved alpha sweep table to {tables_dir / 'student_alpha_sweep.csv'}", flush=True)

    # Find best alpha
    best_row = sweep_df.loc[sweep_df['composite_val_mae'].idxmin()]
    best_alpha = float(best_row['alpha'])
    print("\n" + "=" * 50, flush=True)
    print(f"SELECTED OPTIMAL ALPHA: {best_alpha:.1f} (Composite Val MAE = {best_row['composite_val_mae']:.3f}m)", flush=True)
    print("=" * 50, flush=True)

    # Plot Alpha Sweep Figure
    fig, ax1 = plt.subplots(figsize=(8, 5))
    ax2 = ax1.twinx()

    alphas_arr = sweep_df['alpha'].values
    ax1.plot(alphas_arr, sweep_df['composite_val_mae'], 'o-', color='#1f77b4', lw=2, label='Composite Val MAE')
    ax1.plot(alphas_arr, sweep_df['temp_val_mae'], 's--', color='#2ca02c', lw=1.5, label='Temporal-Val MAE (Monitored)')
    ax1.plot(alphas_arr, sweep_df['spat_val_mae'], '^--', color='#d62728', lw=1.5, label='Spatial-Val MAE (Query)')

    ax1.set_xlabel('Distillation Weight ($\\alpha$)', fontsize=12)
    ax1.set_ylabel('Mean Absolute Error (m)', fontsize=12)
    ax1.grid(True, linestyle='--', alpha=0.5)

    ax1.axvline(best_alpha, color='black', linestyle=':', lw=1.5, label=f'Selected $\\alpha^* = {best_alpha}$')
    ax1.legend(loc='upper right', frameon=True)

    plt.title('Teacher-Student Distillation: Validation MAE vs. Distillation Weight $\\alpha$', fontsize=13, pad=12)
    plt.tight_layout()

    figs_dir = Path("results/figures")
    figs_dir.mkdir(parents=True, exist_ok=True)
    fig_path = figs_dir / "student_alpha_sweep.png"
    plt.savefig(fig_path, dpi=300)
    plt.close()
    print(f"Saved alpha sweep figure to {fig_path}", flush=True)

    # 5. Save Best Student Checkpoint
    best_student = models_by_alpha[best_alpha]
    models_dir = Path("results/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    torch.save({
        'state_dict': best_student.state_dict(),
        'best_alpha': best_alpha,
        'target_mean': target_mean,
        'target_std': target_std,
        'ell': builder.ell,
        'L': L,
        'h': h,
        'gru_hidden': 64,
        'gat_heads': 2,
        'mlp_hidden': 32
    }, models_dir / "student_best.pt")
    print(f"Saved best student checkpoint to {models_dir / 'student_best.pt'}", flush=True)

    # 6. Final Evaluation of Best Student on All Benchmarks
    print("\n--- Final Evaluation of Distilled Student (alpha*=" + str(best_alpha) + ") ---", flush=True)
    all_eval_results = []

    # 1. Monitored Val (2024 H1)
    ev_m_val, df_m_val = evaluate_student(
        best_student, grid, builder, static_feats_t, t_val_range,
        train_wells_mask, target_mean, target_std, is_query_mode=False, L=L, h=h
    )
    all_eval_results.append({'Task': 'Monitored', 'Model': f'Student GNN (alpha={best_alpha})', 'Split': 'Val Monitored', **ev_m_val})
    print(f"Student [Val Monitored]:  MAE={ev_m_val['pooled_mae']:.3f}m, RMSE={ev_m_val['pooled_rmse']:.3f}m, NSE={ev_m_val['pooled_nse']:.3f}", flush=True)

    # 2. Monitored Test (2025)
    ev_m_test, df_m_test = evaluate_student(
        best_student, grid, builder, static_feats_t, t_test_range,
        train_wells_mask, target_mean, target_std, is_query_mode=False, L=L, h=h
    )
    all_eval_results.append({'Task': 'Monitored', 'Model': f'Student GNN (alpha={best_alpha})', 'Split': 'Test Monitored', **ev_m_test})
    print(f"Student [Test Monitored]: MAE={ev_m_test['pooled_mae']:.3f}m, RMSE={ev_m_test['pooled_rmse']:.3f}m, NSE={ev_m_test['pooled_nse']:.3f}", flush=True)

    # 3. Spatial-Val Query (2024 H1)
    ev_q_val, df_q_val = evaluate_student(
        best_student, grid, builder, static_feats_t, t_val_range,
        val_wells_mask, target_mean, target_std, is_query_mode=True, L=L, h=h
    )
    all_eval_results.append({'Task': 'No-History Query', 'Model': f'Student GNN (alpha={best_alpha})', 'Split': 'Spatial-Val Query', **ev_q_val})
    print(f"Student [Val Query]:      MAE={ev_q_val['pooled_mae']:.3f}m, RMSE={ev_q_val['pooled_rmse']:.3f}m, NSE={ev_q_val['pooled_nse']:.3f}", flush=True)

    # 4. Spatial-Test Query (2025)
    ev_q_test, df_q_test = evaluate_student(
        best_student, grid, builder, static_feats_t, t_test_range,
        test_wells_mask, target_mean, target_std, is_query_mode=True, L=L, h=h
    )
    all_eval_results.append({'Task': 'No-History Query', 'Model': f'Student GNN (alpha={best_alpha})', 'Split': 'Test Query', **ev_q_test})
    print(f"Student [Test Query]:     MAE={ev_q_test['pooled_mae']:.3f}m, RMSE={ev_q_test['pooled_rmse']:.3f}m, NSE={ev_q_test['pooled_nse']:.3f}", flush=True)

    perf_df = pd.DataFrame(all_eval_results)
    perf_df.to_csv(tables_dir / "student_performance.csv", index=False)
    print(f"\nSaved student performance table to {tables_dir / 'student_performance.csv'}", flush=True)

    # Also save test predictions for calibration and subsequent analysis
    preds_dir = Path("results/predictions")
    preds_dir.mkdir(parents=True, exist_ok=True)
    df_m_test.to_parquet(preds_dir / "student_test_monitored_preds.parquet", index=False)
    df_q_test.to_parquet(preds_dir / "student_test_query_preds.parquet", index=False)
    print(f"Saved student test predictions to {preds_dir}", flush=True)

    return sweep_df, perf_df


if __name__ == '__main__':
    run_student_pipeline()
