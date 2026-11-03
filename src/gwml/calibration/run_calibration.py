"""Phase 8: DeepMVI Mixture Uncertainty and Split-Conformal Calibration.

Implements Methodology Section C, Section D, Section 5:
1. DeepMVI Imputation Sampling:
   - For monitored wells with intermittent missingness in the lookback window,
     sample S=20 complete histories using DeepMVI with residual variance sigma^2_resid = 44.74 m^2.
   - For fully unmonitored query wells, no imputation is performed (zero history + mask 0).
2. Gaussian Mixture Combination (Eq. 5):
   - mu_mix = 1/S * sum(mu_s)
   - v_mix = 1/S * sum(v_s) + 1/S * sum((mu_s - mu_mix)^2)
   - Initial 90% interval: [mu_mix - 1.6449 * sqrt(v_mix), mu_mix + 1.6449 * sqrt(v_mix)]
3. Split-Conformal Calibration on July-Dec 2024:
   - Conformity score: s_i = max(L_i - y_i, y_i - U_i, 0)
   - s_hat = ceil((n_cal + 1) * 0.90)-th ordered score
4. Evaluation on 2025 Test Partition:
   - Reports PICP (empirical coverage) and MPIW before and after calibration.
   - Evaluates both Monitored Test Wells and No-History Query Wells.
   - Exports results/tables/uncertainty_calibration.csv and results/figures/uncertainty_intervals.png.
"""
from pathlib import Path
import time
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch

from gwml.graph.graph_builder import SpatiotemporalGraphBuilder
from gwml.models.st_gnn import SpatiotemporalGNN
from gwml.imputation.deepmvi import DeepMVIModel
from gwml.calibration.conformal import (
    compute_conformity_scores,
    fit_split_conformal,
    expand_prediction_intervals,
    evaluate_prediction_intervals
)
from gwml.utils.seed import set_seed


def sample_deepmvi_inputs(imputer, gw_raw, mask_raw, rain_slice, temp_slice, sin_slice, cos_slice, target_mean, target_std, sigma_resid, n_samples=20, seed=42):
    """
    Sample n_samples completed groundwater histories using DeepMVI.
    gw_raw: (N, L) raw meters
    mask_raw: (N, L) {0, 1}
    Returns: (S, N, L) completed normalized histories
    """
    set_seed(seed)
    N, L = gw_raw.shape
    gw_norm = np.where(mask_raw == 1, (gw_raw - target_mean) / target_std, 0.0)

    # 6 feature channels: [gw_norm * mask, mask, rain/100, temp/30, sin, cos]
    x_in = np.stack([
        gw_norm * mask_raw,
        mask_raw.astype(np.float32),
        (rain_slice / 100.0).astype(np.float32),
        (temp_slice / 30.0).astype(np.float32),
        np.broadcast_to(sin_slice, (N, L)).astype(np.float32),
        np.broadcast_to(cos_slice, (N, L)).astype(np.float32)
    ], axis=-1)  # (N, L, 6)

    imputer.eval()
    with torch.no_grad():
        preds_norm = imputer(torch.tensor(x_in, dtype=torch.float32)).numpy()  # (N, L)

    preds_meters = preds_norm * target_std + target_mean

    sampled_histories = []
    for s in range(n_samples):
        noise = np.random.normal(0, sigma_resid, size=(N, L))
        # Impute missing entries with sampled Gaussian, keep observed fixed
        completed_m = np.where(mask_raw == 1, gw_raw, preds_meters + noise)
        completed_m = np.maximum(0.1, completed_m)  # physical depth >= 0.1m
        completed_norm = (completed_m - target_mean) / target_std
        sampled_histories.append(completed_norm)

    return np.array(sampled_histories, dtype=np.float32)  # (S, N, L)


def run_mixture_inference(
    student_model,
    imputer,
    grid,
    builder,
    static_feats_t,
    t,
    target_mean,
    target_std,
    sigma_resid,
    n_samples=20,
    is_query_mode=False,
    query_mask=None,
    L=12,
    h=1
):
    """
    Run S-sample mixture inference for snapshot t.
    Returns mu_mix (N,), v_mix (N,) in raw meters.
    """
    N = grid['gw_target'].shape[1]
    gw_slice = grid['gw_target'][t - L + 1 : t + 1].T.copy()  # (N, L)
    mask_slice = grid['gw_observed_mask'][t - L + 1 : t + 1].T.copy()
    rain_slice = grid['rainfall'][t - L + 1 : t + 1].T
    temp_slice = grid['temperature'][t - L + 1 : t + 1].T

    harm_t = torch.tensor([grid['sin_month'][t + h, 0], grid['cos_month'][t + h, 0]], dtype=torch.float32).unsqueeze(0).repeat(N, 1)

    if is_query_mode:
        # Fully unmonitored query wells: NO imputation, history=0, mask=0
        q_idx = np.where(query_mask)[0]
        gw_slice[q_idx, :] = 0.0
        mask_slice[q_idx, :] = 0
        gw_norm = np.where(mask_slice == 1, (gw_slice - target_mean) / target_std, 0.0)

        x_seq = np.stack([gw_norm, mask_slice.astype(np.float32), rain_slice / 100.0, temp_slice / 30.0], axis=-1)
        x_seq_t = torch.tensor(x_seq, dtype=torch.float32)

        # Graph: query wells receive messages only
        eligible_senders = ~query_mask & (mask_slice.sum(axis=1) > 0)
        edge_index, edge_attr, _ = builder.build_graph(eligible_senders_mask=eligible_senders)

        student_model.eval()
        with torch.no_grad():
            mu_norm, v_norm = student_model(x_seq_t, static_feats_t, harm_t, edge_index, edge_attr)

        mu_m = (mu_norm.numpy() * target_std) + target_mean
        v_m = v_norm.numpy() * (target_std ** 2)
        return mu_m, v_m

    # Monitored wells: DeepMVI S-sample imputation
    sin_slice = grid['sin_month'][t - L + 1 : t + 1, 0]
    cos_slice = grid['cos_month'][t - L + 1 : t + 1, 0]
    sampled_norm_histories = sample_deepmvi_inputs(
        imputer, gw_slice, mask_slice, rain_slice, temp_slice, sin_slice, cos_slice,
        target_mean, target_std, sigma_resid, n_samples=n_samples, seed=42 + t
    )

    eligible_senders = (mask_slice.sum(axis=1) > 0)
    edge_index, edge_attr, _ = builder.build_graph(eligible_senders_mask=eligible_senders)

    sample_mus = []
    sample_vars = []

    student_model.eval()
    with torch.no_grad():
        for s in range(n_samples):
            # Input sequence with s-th completed history
            # Completed mask has 1 for all monitored timesteps
            s_mask = np.ones_like(mask_slice, dtype=np.float32)
            x_seq = np.stack([sampled_norm_histories[s], s_mask, rain_slice / 100.0, temp_slice / 30.0], axis=-1)
            x_seq_t = torch.tensor(x_seq, dtype=torch.float32)

            mu_n, v_n = student_model(x_seq_t, static_feats_t, harm_t, edge_index, edge_attr)
            mu_s_m = (mu_n.numpy() * target_std) + target_mean
            v_s_m = v_n.numpy() * (target_std ** 2)

            sample_mus.append(mu_s_m)
            sample_vars.append(v_s_m)

    sample_mus = np.array(sample_mus)    # (S, N)
    sample_vars = np.array(sample_vars)  # (S, N)

    # Law of Total Variance (Eq. 5)
    mu_mix = np.mean(sample_mus, axis=0)  # (N,)
    v_mix = np.mean(sample_vars, axis=0) + np.mean((sample_mus - mu_mix[None, :]) ** 2, axis=0)

    return mu_mix, v_mix


def run_calibration_pipeline(n_samples=20, nominal_coverage=0.90, seed=42):
    print("=" * 60, flush=True)
    print("PHASE 8: UNCERTAINTY ESTIMATION AND CONFORMAL CALIBRATION", flush=True)
    print("=" * 60, flush=True)

    set_seed(seed)

    # 1. Load Data Grid and Manifests
    with np.load("data/processed/spatiotemporal_grid.npz") as loaded:
        grid = {k: loaded[k] for k in loaded.files}

    manifest_df = pd.read_csv("results/manifests/spatial_split_manifest.csv")
    well_ids = list(grid['well_ids'])
    N = len(well_ids)
    study_months = list(grid['study_months'])

    train_wells_set = set(manifest_df[manifest_df['spatial_partition'] == 'train']['well_id'])
    val_wells_set = set(manifest_df[manifest_df['spatial_partition'] == 'val']['well_id'])
    test_wells_set = set(manifest_df[manifest_df['spatial_partition'] == 'test']['well_id'])

    train_wells_mask = np.array([w in train_wells_set for w in well_ids])
    val_wells_mask = np.array([w in val_wells_set for w in well_ids])
    test_wells_mask = np.array([w in test_wells_set for w in well_ids])

    # 2. Load Checkpoints
    student_ckpt = torch.load("results/models/student_best.pt", map_location="cpu")
    target_mean = float(student_ckpt['target_mean'])
    target_std = float(student_ckpt['target_std'])
    L = int(student_ckpt['L'])
    h = int(student_ckpt['h'])
    best_alpha = float(student_ckpt.get('best_alpha', 0.5))

    student_model = SpatiotemporalGNN(
        in_dynamic_dim=4, static_dim=4, harmonic_dim=2,
        gru_hidden=int(student_ckpt['gru_hidden']),
        gat_heads=int(student_ckpt['gat_heads']),
        mlp_hidden=int(student_ckpt['mlp_hidden']),
        dropout=0.1
    )
    student_model.load_state_dict(student_ckpt['state_dict'])
    student_model.eval()

    imputer_ckpt = torch.load("results/models/deepmvi_imputer.pt", map_location="cpu")
    imputer = DeepMVIModel(in_dim=6, hidden_dim=64, num_layers=2)
    imputer.load_state_dict(imputer_ckpt['state_dict'])
    imputer.eval()
    sigma_resid = np.sqrt(float(imputer_ckpt.get('res_var_meters', 44.74)))

    # Graph builder and Static features
    coords = np.stack([grid['latitude'], grid['longitude']], axis=-1)
    builder = SpatiotemporalGraphBuilder(coords, k_neighbours=5, ell=student_ckpt.get('ell', 6.47))

    static_feats = np.stack([
        grid['utm_x'] / 1e6, grid['utm_y'] / 1e6,
        grid['latitude'] / 10.0, grid['longitude'] / 10.0
    ], axis=-1).astype(np.float32)
    static_feats_t = torch.tensor(static_feats, dtype=torch.float32)

    # Time ranges
    # Calibration partition: Jul 2024 to Dec 2024 (6 months)
    t_cal_range = [t for t, ym in enumerate(study_months[:-h]) if '2024-07' <= study_months[t + h] <= '2024-12']
    # Test partition: Jan 2025 to Dec 2025 (12 months)
    t_test_range = [t for t, ym in enumerate(study_months[:-h]) if '2025-01' <= study_months[t + h] <= '2025-12']

    # 3. Calibration Phase: Fit Conformal Expansion on July-Dec 2024 (Training Wells)
    print("\nFitting Split-Conformal Calibration on Jul-Dec 2024 (Monitored Training Wells)...", flush=True)
    cal_records = []
    z_nominal = 1.6449  # 90% Gaussian interval quantile

    for t in t_cal_range:
        mu_mix, v_mix = run_mixture_inference(
            student_model, imputer, grid, builder, static_feats_t, t,
            target_mean, target_std, sigma_resid, n_samples=n_samples,
            is_query_mode=False, L=L, h=h
        )
        std_mix = np.sqrt(v_mix)
        L_uncal = mu_mix - z_nominal * std_mix
        U_uncal = mu_mix + z_nominal * std_mix

        obs_mask = (grid['gw_observed_mask'][t + h] == 1) & train_wells_mask
        for i in np.where(obs_mask)[0]:
            cal_records.append({
                'well_id': well_ids[i],
                'y_true': float(grid['gw_target'][t + h, i]),
                'mu': float(mu_mix[i]),
                'L': float(L_uncal[i]),
                'U': float(U_uncal[i])
            })

    cal_df = pd.DataFrame(cal_records)
    pre_cal_metrics = evaluate_prediction_intervals(cal_df['y_true'], cal_df['L'], cal_df['U'])
    print(f"Calibration Partition Pre-Cal: PICP={pre_cal_metrics['picp'] * 100:.1f}%, MPIW={pre_cal_metrics['mpiw']:.2f}m (n={len(cal_df)})", flush=True)

    s_hat, _ = fit_split_conformal(cal_df['y_true'], cal_df['L'], cal_df['U'], nominal_coverage=nominal_coverage)
    print(f"Computed Conformal Expansion Factor s_hat = {s_hat:.3f}m", flush=True)

    L_cal_exp, U_cal_exp = expand_prediction_intervals(cal_df['L'], cal_df['U'], s_hat)
    post_cal_metrics = evaluate_prediction_intervals(cal_df['y_true'], L_cal_exp, U_cal_exp)
    print(f"Calibration Partition Post-Cal: PICP={post_cal_metrics['picp'] * 100:.1f}%, MPIW={post_cal_metrics['mpiw']:.2f}m", flush=True)

    # 4. Evaluation on 2025 Test Partition
    print("\n--- Evaluating Conformal Uncertainty on 2025 Test Partition ---", flush=True)
    calibration_results = []

    # 4a. Monitored Test Wells (2025)
    print("Evaluating Monitored Test Wells (2025, 20-sample DeepMVI mixture)...", flush=True)
    m_test_records = []
    for t in t_test_range:
        mu_mix, v_mix = run_mixture_inference(
            student_model, imputer, grid, builder, static_feats_t, t,
            target_mean, target_std, sigma_resid, n_samples=n_samples,
            is_query_mode=False, L=L, h=h
        )
        std_mix = np.sqrt(v_mix)
        L_uncal = mu_mix - z_nominal * std_mix
        U_uncal = mu_mix + z_nominal * std_mix

        obs_mask = (grid['gw_observed_mask'][t + h] == 1) & train_wells_mask
        for i in np.where(obs_mask)[0]:
            m_test_records.append({
                'month': study_months[t + h],
                'well_id': well_ids[i],
                'y_true': float(grid['gw_target'][t + h, i]),
                'mu': float(mu_mix[i]),
                'var': float(v_mix[i]),
                'L_uncal': float(L_uncal[i]),
                'U_uncal': float(U_uncal[i])
            })

    m_test_df = pd.DataFrame(m_test_records)
    L_m_exp, U_m_exp = expand_prediction_intervals(m_test_df['L_uncal'], m_test_df['U_uncal'], s_hat)
    m_test_df['L_cal'] = L_m_exp
    m_test_df['U_cal'] = U_m_exp

    m_pre = evaluate_prediction_intervals(m_test_df['y_true'], m_test_df['L_uncal'], m_test_df['U_uncal'])
    m_post = evaluate_prediction_intervals(m_test_df['y_true'], m_test_df['L_cal'], m_test_df['U_cal'])

    calibration_results.append({
        'Task': 'Monitored',
        'Model': f'Student GNN (alpha={best_alpha})',
        'Split': 'Test Monitored (2025)',
        'Nominal_Target': nominal_coverage,
        's_hat_m': s_hat,
        'Pre_Cal_PICP': m_pre['picp'],
        'Pre_Cal_MPIW': m_pre['mpiw'],
        'Post_Cal_PICP': m_post['picp'],
        'Post_Cal_MPIW': m_post['mpiw'],
        'N_Samples': m_pre['n_samples']
    })
    print(f"Monitored Test: Pre-Cal PICP={m_pre['picp']*100:.1f}%, MPIW={m_pre['mpiw']:.2f}m | Post-Cal PICP={m_post['picp']*100:.1f}%, MPIW={m_post['mpiw']:.2f}m", flush=True)

    # 4b. No-History Query Test Wells (2025)
    print("Evaluating No-History Query Test Wells (2025, unmonitored)...", flush=True)
    q_test_records = []
    for t in t_test_range:
        mu_q, v_q = run_mixture_inference(
            student_model, imputer, grid, builder, static_feats_t, t,
            target_mean, target_std, sigma_resid, n_samples=1,
            is_query_mode=True, query_mask=test_wells_mask, L=L, h=h
        )
        std_q = np.sqrt(v_q)
        L_uncal = mu_q - z_nominal * std_q
        U_uncal = mu_q + z_nominal * std_q

        obs_mask = (grid['gw_observed_mask'][t + h] == 1) & test_wells_mask
        for i in np.where(obs_mask)[0]:
            q_test_records.append({
                'month': study_months[t + h],
                'well_id': well_ids[i],
                'y_true': float(grid['gw_target'][t + h, i]),
                'mu': float(mu_q[i]),
                'var': float(v_q[i]),
                'L_uncal': float(L_uncal[i]),
                'U_uncal': float(U_uncal[i])
            })

    q_test_df = pd.DataFrame(q_test_records)
    L_q_exp, U_q_exp = expand_prediction_intervals(q_test_df['L_uncal'], q_test_df['U_uncal'], s_hat)
    q_test_df['L_cal'] = L_q_exp
    q_test_df['U_cal'] = U_q_exp

    q_pre = evaluate_prediction_intervals(q_test_df['y_true'], q_test_df['L_uncal'], q_test_df['U_uncal'])
    q_post = evaluate_prediction_intervals(q_test_df['y_true'], q_test_df['L_cal'], q_test_df['U_cal'])

    calibration_results.append({
        'Task': 'No-History Query',
        'Model': f'Student GNN (alpha={best_alpha})',
        'Split': 'Test Query (2025)',
        'Nominal_Target': nominal_coverage,
        's_hat_m': s_hat,
        'Pre_Cal_PICP': q_pre['picp'],
        'Pre_Cal_MPIW': q_pre['mpiw'],
        'Post_Cal_PICP': q_post['picp'],
        'Post_Cal_MPIW': q_post['mpiw'],
        'N_Samples': q_pre['n_samples']
    })
    print(f"Query Test:     Pre-Cal PICP={q_pre['picp']*100:.1f}%, MPIW={q_pre['mpiw']:.2f}m | Post-Cal PICP={q_post['picp']*100:.1f}%, MPIW={q_post['mpiw']:.2f}m", flush=True)

    # Save Tables & Predictions
    tables_dir = Path("results/tables")
    tables_dir.mkdir(parents=True, exist_ok=True)
    res_df = pd.DataFrame(calibration_results)
    res_df.to_csv(tables_dir / "uncertainty_calibration.csv", index=False)
    print(f"\nSaved calibration summary table to {tables_dir / 'uncertainty_calibration.csv'}", flush=True)

    preds_dir = Path("results/predictions")
    preds_dir.mkdir(parents=True, exist_ok=True)
    m_test_df.to_parquet(preds_dir / "calibrated_test_monitored.parquet", index=False)
    q_test_df.to_parquet(preds_dir / "calibrated_test_query.parquet", index=False)

    # Plot Uncertainty Coverage Figure
    figs_dir = Path("results/figures")
    figs_dir.mkdir(parents=True, exist_ok=True)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

    # Coverage bar chart
    tasks = ['Monitored Test', 'No-History Query']
    pre_cov = [m_pre['picp'] * 100, q_pre['picp'] * 100]
    post_cov = [m_post['picp'] * 100, q_post['picp'] * 100]

    x = np.arange(len(tasks))
    width = 0.35

    ax1.bar(x - width/2, pre_cov, width, label='Uncalibrated (90% Gaussian)', color='#7293CB', edgecolor='black')
    ax1.bar(x + width/2, post_cov, width, label='Split-Conformal Calibrated', color='#E1974C', edgecolor='black')
    ax1.axhline(90.0, color='red', linestyle='--', lw=1.5, label='Nominal Target (90%)')
    ax1.set_ylabel('Empirical Coverage (PICP %)', fontsize=12)
    ax1.set_xticks(x)
    ax1.set_xticklabels(tasks, fontsize=11)
    ax1.set_ylim(0, 105)
    ax1.grid(True, axis='y', linestyle='--', alpha=0.5)
    ax1.set_title('(a) Empirical Prediction Interval Coverage', fontsize=12)
    ax1.legend(loc='lower right', frameon=True)

    # Interval width comparison
    pre_width = [m_pre['mpiw'], q_pre['mpiw']]
    post_width = [m_post['mpiw'], q_post['mpiw']]

    ax2.bar(x - width/2, pre_width, width, label='Uncalibrated MPIW', color='#7293CB', edgecolor='black')
    ax2.bar(x + width/2, post_width, width, label='Calibrated MPIW', color='#E1974C', edgecolor='black')
    ax2.set_ylabel('Mean Interval Width (MPIW, meters)', fontsize=12)
    ax2.set_xticks(x)
    ax2.set_xticklabels(tasks, fontsize=11)
    ax2.grid(True, axis='y', linestyle='--', alpha=0.5)
    ax2.set_title('(b) Prediction Interval Width (MPIW)', fontsize=12)
    ax2.legend(loc='upper left', frameon=True)

    plt.suptitle('Groundwater Uncertainty Quantification: Conformal Calibration on Karnataka Aquifers', fontsize=13, y=1.02)
    plt.tight_layout()
    fig_path = figs_dir / "uncertainty_intervals.png"
    plt.savefig(fig_path, dpi=300)
    plt.close()
    print(f"Saved calibration figure to {fig_path}", flush=True)

    return res_df


if __name__ == '__main__':
    run_calibration_pipeline()
