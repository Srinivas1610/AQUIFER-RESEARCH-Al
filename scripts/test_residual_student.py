"""Test Residual-Skip Student GNN with Teacher-Student Distillation.

Combines the residual skip formulation (anchoring predictions on latest observation y_t when available)
with our Teacher-Student Knowledge Distillation and pseudo-query training.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F

from gwml.utils.seed import set_seed
from gwml.graph.graph_builder import SpatiotemporalGraphBuilder
from gwml.evaluation.metrics import evaluate_predictions_df
from gwml.models.st_gnn import SpatiotemporalGNN

set_seed(42)

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

L = 12
h = 1
t_train_range = list(range(L - 1, 36 - h))
t_val_temp = list(range(36 - h, 42 - h))
t_test_range = [t for t, ym in enumerate(study_months[:-h]) if '2025-01' <= study_months[t + h] <= '2025-12']

class ResidualStudentGNN(nn.Module):
    def __init__(self, gru_hidden=64, gat_heads=2, mlp_hidden=32, dropout=0.1):
        super().__init__()
        self.base = SpatiotemporalGNN(
            in_dynamic_dim=4, static_dim=4, harmonic_dim=2,
            gru_hidden=gru_hidden, gat_heads=gat_heads, mlp_hidden=mlp_hidden,
            dropout=dropout
        )

    def forward(self, x_seq, static_feat, harmonic_feat, edge_index, edge_attr, latest_y_norm=None, has_anchor_mask=None):
        delta_mu, v = self.base(x_seq, static_feat, harmonic_feat, edge_index, edge_attr)
        if latest_y_norm is not None and has_anchor_mask is not None:
            # Predict residual increment over latest observation
            mu = torch.where(has_anchor_mask, latest_y_norm + delta_mu, delta_mu)
        else:
            mu = delta_mu
        return mu, v

model = ResidualStudentGNN(gru_hidden=64, gat_heads=2, mlp_hidden=32, dropout=0.1)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)

train_indices = np.where(train_wells_mask)[0]
n_train = len(train_indices)
n_pseudo = int(0.20 * n_train)

print("Training Residual Student with Teacher Distillation (alpha=0.3)...", flush=True)

for epoch in range(1, 26):
    model.train()
    epoch_loss = 0.0
    for step_idx, t in enumerate(t_train_range):
        np.random.seed(epoch * 100 + step_idx)
        perm = np.random.permutation(n_train)
        pseudo_indices = set(train_indices[perm[:n_pseudo]])

        gw_slice = grid['gw_target'][t - L + 1 : t + 1].T.copy()
        mask_slice = grid['gw_observed_mask'][t - L + 1 : t + 1].T.copy()
        rain_slice = grid['rainfall'][t - L + 1 : t + 1].T
        temp_slice = grid['temperature'][t - L + 1 : t + 1].T

        for p_idx in pseudo_indices:
            gw_slice[p_idx, :] = 0.0
            mask_slice[p_idx, :] = 0

        # Anchor is the latest observed groundwater level in lookback
        latest_y = gw_slice[:, -1]
        has_anchor = (mask_slice[:, -1] == 1)
        latest_y_norm = torch.tensor(np.where(has_anchor, (latest_y - target_mean) / target_std, 0.0), dtype=torch.float32)
        has_anchor_t = torch.tensor(has_anchor, dtype=torch.bool)

        gw_norm = np.where(mask_slice == 1, (gw_slice - target_mean) / target_std, 0.0)
        x_seq = np.stack([gw_norm, mask_slice.astype(np.float32), rain_slice / 100.0, temp_slice / 30.0], axis=-1)
        x_seq_t = torch.tensor(x_seq, dtype=torch.float32)

        harm_t = torch.tensor([grid['sin_month'][t + h, 0], grid['cos_month'][t + h, 0]], dtype=torch.float32).unsqueeze(0).repeat(N, 1)

        has_history = (mask_slice.sum(axis=1) > 0)
        eligible_senders = train_wells_mask & has_history
        for p_idx in pseudo_indices:
            eligible_senders[p_idx] = False

        edge_index, edge_attr, _ = builder.build_graph(eligible_senders_mask=eligible_senders)

        y_raw = grid['gw_target'][t + h]
        y_obs = grid['gw_observed_mask'][t + h]
        eval_mask = (y_obs == 1) & train_wells_mask
        if eval_mask.sum() == 0:
            continue

        y_norm_target = torch.tensor(np.where(eval_mask, (y_raw - target_mean) / target_std, 0.0), dtype=torch.float32)
        eval_mask_t = torch.tensor(eval_mask, dtype=torch.float32)

        mu_t_t = torch.tensor(teacher_mu_norm_grid[t + h], dtype=torch.float32)
        v_t_t = torch.tensor(teacher_var_norm_grid[t + h], dtype=torch.float32)

        optimizer.zero_grad()
        mu_s, v_s = model(x_seq_t, static_feats_t, harm_t, edge_index, edge_attr, latest_y_norm, has_anchor_t)

        # NLL loss
        nll = 0.5 * torch.log(v_s) + (y_norm_target - mu_s)**2 / (2.0 * v_s)
        # KL loss with teacher
        kl = 0.5 * (torch.log(v_s / v_t_t) + (v_t_t + (mu_t_t - mu_s)**2) / v_s - 1.0)
        
        # Pseudo-queries have no anchor, so teacher soft targets guide them; monitored wells use NLL + KL
        alpha = 0.3
        loss_pointwise = (1.0 - alpha) * nll + alpha * kl
        loss = torch.sum(loss_pointwise * eval_mask_t) / torch.clamp(eval_mask_t.sum(), min=1.0)

        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        epoch_loss += loss.item()

    if epoch % 5 == 0:
        print(f"Epoch {epoch:02d} complete. Loss: {epoch_loss:.4f}", flush=True)

# Evaluate on Monitored Test
print("\n--- Evaluating Monitored Test Partition (2025) ---", flush=True)
model.eval()
m_preds = []
with torch.no_grad():
    for t in t_test_range:
        gw_slice = grid['gw_target'][t - L + 1 : t + 1].T.copy()
        mask_slice = grid['gw_observed_mask'][t - L + 1 : t + 1].T.copy()
        rain_slice = grid['rainfall'][t - L + 1 : t + 1].T
        temp_slice = grid['temperature'][t - L + 1 : t + 1].T

        latest_y = gw_slice[:, -1]
        has_anchor = (mask_slice[:, -1] == 1)
        latest_y_norm = torch.tensor(np.where(has_anchor, (latest_y - target_mean) / target_std, 0.0), dtype=torch.float32)
        has_anchor_t = torch.tensor(has_anchor, dtype=torch.bool)

        gw_norm = np.where(mask_slice == 1, (gw_slice - target_mean) / target_std, 0.0)
        x_seq = np.stack([gw_norm, mask_slice.astype(np.float32), rain_slice / 100.0, temp_slice / 30.0], axis=-1)
        x_seq_t = torch.tensor(x_seq, dtype=torch.float32)

        harm_t = torch.tensor([grid['sin_month'][t + h, 0], grid['cos_month'][t + h, 0]], dtype=torch.float32).unsqueeze(0).repeat(N, 1)

        eligible_senders = (mask_slice.sum(axis=1) > 0)
        edge_index, edge_attr, _ = builder.build_graph(eligible_senders_mask=eligible_senders)

        mu_norm, v_norm = model(x_seq_t, static_feats_t, harm_t, edge_index, edge_attr, latest_y_norm, has_anchor_t)
        mu_m = (mu_norm.numpy() * target_std) + target_mean

        obs_mask = (grid['gw_observed_mask'][t + h] == 1) & train_wells_mask
        for i in np.where(obs_mask)[0]:
            m_preds.append({
                'well_id': grid['well_ids'][i],
                'y_true': float(grid['gw_target'][t + h, i]),
                'y_pred': float(mu_m[i])
            })

df_m = pd.DataFrame(m_preds)
res_m = evaluate_predictions_df(df_m)
print(f"Residual Student Monitored Test -> MAE: {res_m['pooled_mae']:.3f} m, RMSE: {res_m['pooled_rmse']:.3f} m, NSE: {res_m['pooled_nse']:.3f}")

# Evaluate on Query Test (No-History)
print("\n--- Evaluating Query Test Partition (No-History, 2025) ---", flush=True)
q_preds = []
with torch.no_grad():
    for t in t_test_range:
        gw_slice = grid['gw_target'][t - L + 1 : t + 1].T.copy()
        mask_slice = grid['gw_observed_mask'][t - L + 1 : t + 1].T.copy()
        rain_slice = grid['rainfall'][t - L + 1 : t + 1].T
        temp_slice = grid['temperature'][t - L + 1 : t + 1].T

        test_idx = np.where(test_wells_mask)[0]
        for q_i in test_idx:
            gw_slice[q_i, :] = 0.0
            mask_slice[q_i, :] = 0

        latest_y_norm = torch.zeros(N, dtype=torch.float32)
        has_anchor_t = torch.zeros(N, dtype=torch.bool)

        gw_norm = np.where(mask_slice == 1, (gw_slice - target_mean) / target_std, 0.0)
        x_seq = np.stack([gw_norm, mask_slice.astype(np.float32), rain_slice / 100.0, temp_slice / 30.0], axis=-1)
        x_seq_t = torch.tensor(x_seq, dtype=torch.float32)

        harm_t = torch.tensor([grid['sin_month'][t + h, 0], grid['cos_month'][t + h, 0]], dtype=torch.float32).unsqueeze(0).repeat(N, 1)

        eligible_senders = ~test_wells_mask & (mask_slice.sum(axis=1) > 0)
        edge_index, edge_attr, _ = builder.build_graph(eligible_senders_mask=eligible_senders)

        mu_norm, v_norm = model(x_seq_t, static_feats_t, harm_t, edge_index, edge_attr, latest_y_norm, has_anchor_t)
        mu_m = (mu_norm.numpy() * target_std) + target_mean

        obs_mask = (grid['gw_observed_mask'][t + h] == 1) & test_wells_mask
        for i in np.where(obs_mask)[0]:
            q_preds.append({
                'well_id': grid['well_ids'][i],
                'y_true': float(grid['gw_target'][t + h, i]),
                'y_pred': float(mu_m[i])
            })

df_q = pd.DataFrame(q_preds)
res_q = evaluate_predictions_df(df_q)
print(f"Residual Student Query Test -> MAE: {res_q['pooled_mae']:.3f} m, RMSE: {res_q['pooled_rmse']:.3f} m, NSE: {res_q['pooled_nse']:.3f}")
