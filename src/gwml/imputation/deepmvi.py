"""DeepMVI-style Missing Value Imputation and Uncertainty Sampler.

Implements Methodology Section C & Section D (Experiment 3):
- Bidirectional temporal network trained with artificial isolated and block masks (1-3 months).
- Fitted strictly on training-partition groundwater records.
- Residual variance estimated on internal 10% masked subset.
- Retrospective reconstruction uses bidirectional context.
- Forecast-time imputation strictly truncated at forecast origin.
- Generates 20 Gaussian sampling realizations at inference with observed values fixed.
- Benchmark reconstruction across 10%, 20%, 30%, 40% missingness rates.
"""
from pathlib import Path
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

from gwml.evaluation.metrics import compute_mae, compute_rmse, compute_nse

class DeepMVIModel(nn.Module):
    """Bidirectional GRU imputer for spatiotemporal sequence reconstruction."""
    def __init__(self, in_dim=6, hidden_dim=64, num_layers=2, dropout=0.1):
        super().__init__()
        self.bigru = nn.GRU(
            input_size=in_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0.0
        )
        self.head = nn.Sequential(
            nn.Linear(hidden_dim * 2, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        # x: (B, seq_len, in_dim)
        out, _ = self.bigru(x)
        y_recon = self.head(out).squeeze(-1)  # (B, seq_len)
        return y_recon

def apply_artificial_mask(y_true, orig_mask, mask_rate=0.20, rng=None):
    """Apply artificial isolated and 1-3 month block masks to observed values."""
    if rng is None:
        rng = np.random.RandomState(42)

    seq_len = len(y_true)
    art_mask = orig_mask.copy()  # 1 where available to model, 0 where hidden
    eval_mask = np.zeros(seq_len, dtype=np.int8)  # 1 where artificially masked and target is observed

    obs_indices = np.where(orig_mask == 1)[0]
    if len(obs_indices) == 0:
        return art_mask, eval_mask

    n_to_mask = int(np.round(len(obs_indices) * mask_rate))
    masked_count = 0

    while masked_count < n_to_mask:
        # 50% probability block mask (1-3 months), 50% isolated
        is_block = rng.rand() < 0.5
        block_len = rng.randint(1, 4) if is_block else 1
        
        start_idx = rng.choice(obs_indices)
        end_idx = min(seq_len, start_idx + block_len)

        for pos in range(start_idx, end_idx):
            if orig_mask[pos] == 1 and art_mask[pos] == 1:
                art_mask[pos] = 0
                eval_mask[pos] = 1
                masked_count += 1
                if masked_count >= n_to_mask:
                    break

    return art_mask, eval_mask

def train_deepmvi(grid_path="data/processed/spatiotemporal_grid.npz", epochs=20, lr=1e-3, seed=42):
    """Train DeepMVI imputer strictly on training-well records up to Dec 2023."""
    torch.manual_seed(seed)
    np.random.seed(seed)

    print("Loading training sequences for DeepMVI...", flush=True)
    with np.load(grid_path) as loaded:
        grid = {k: loaded[k] for k in loaded.files}

    manifest_df = pd.read_csv("results/manifests/spatial_split_manifest.csv")
    train_wells = manifest_df[manifest_df['spatial_partition'] == 'train']['well_id'].values
    train_indices = [list(grid['well_ids']).index(w) for w in train_wells]

    # Training window: 36 months (2021-01 to 2023-12)
    T_train = 36
    gw_train = grid['gw_target'][:T_train, train_indices]        # (36, N_train)
    mask_train = grid['gw_observed_mask'][:T_train, train_indices] # (36, N_train)
    rain_train = grid['rainfall'][:T_train, train_indices]
    temp_train = grid['temperature'][:T_train, train_indices]
    sin_m = grid['sin_month'][:T_train, :]  # (36, 1)
    cos_m = grid['cos_month'][:T_train, :]

    N_train = len(train_indices)

    # Calculate global target mean and std on training observed values for model normalization
    valid_gw = gw_train[mask_train == 1]
    gw_mean = float(np.mean(valid_gw))
    gw_std = float(np.std(valid_gw))

    # Build sequence training samples (each well's 36-month sequence)
    # Split training wells into 90% train, 10% internal validation for residual variance calibration
    rng = np.random.RandomState(seed)
    shuffled_idx = rng.permutation(N_train)
    n_internal_val = int(np.round(0.10 * N_train))
    val_subset_idx = shuffled_idx[:n_internal_val]
    train_subset_idx = shuffled_idx[n_internal_val:]

    print(f"DeepMVI fitting: {len(train_subset_idx)} wells fit, {len(val_subset_idx)} wells internal variance calibration", flush=True)

    def prepare_tensors(subset_wells):
        X_list = []
        Y_list = []
        EvalMask_list = []

        for w_i in subset_wells:
            y_raw = gw_train[:, w_i]
            o_mask = mask_train[:, w_i]
            r = rain_train[:, w_i]
            t = temp_train[:, w_i]

            # Standardize y
            y_norm = np.where(o_mask == 1, (y_raw - gw_mean) / gw_std, 0.0)

            # Apply artificial masking (20% masked for training)
            a_mask, e_mask = apply_artificial_mask(y_raw, o_mask, mask_rate=0.20, rng=rng)
            
            # Input features: [y_norm * a_mask, a_mask, rain/100, temp/30, sin_m, cos_m]
            x_in = np.stack([
                y_norm * a_mask,
                a_mask.astype(np.float32),
                (r / 100.0).astype(np.float32),
                (t / 30.0).astype(np.float32),
                sin_m[:, 0],
                cos_m[:, 0]
            ], axis=-1)

            X_list.append(x_in)
            Y_list.append(y_norm)
            EvalMask_list.append(e_mask)

        return (
            torch.tensor(np.array(X_list), dtype=torch.float32),
            torch.tensor(np.array(Y_list), dtype=torch.float32),
            torch.tensor(np.array(EvalMask_list), dtype=torch.float32)
        )

    X_tr, Y_tr, Mask_tr = prepare_tensors(train_subset_idx)
    X_val, Y_val, Mask_val = prepare_tensors(val_subset_idx)

    ds_tr = TensorDataset(X_tr, Y_tr, Mask_tr)
    loader_tr = DataLoader(ds_tr, batch_size=32, shuffle=True)

    model = DeepMVIModel(in_dim=6, hidden_dim=64, num_layers=2, dropout=0.1)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    print("Training DeepMVI model...", flush=True)
    t0 = time.time()
    for ep in range(epochs):
        model.train()
        total_loss = 0.0
        n_masked_total = 0
        for b_x, b_y, b_m in loader_tr:
            optimizer.zero_grad()
            preds = model(b_x)
            
            # Loss only at artificially masked positions
            loss = torch.sum((preds - b_y)**2 * b_m) / torch.clamp(b_m.sum(), min=1.0)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * b_m.sum().item()
            n_masked_total += b_m.sum().item()

    print(f"DeepMVI training completed in {time.time() - t0:.1f}s", flush=True)

    # Calibrate residual variance on internal 10% masked subset
    model.eval()
    with torch.no_grad():
        preds_val = model(X_val)
        residuals = ((preds_val - Y_val) * Mask_val).numpy()
        val_mask_np = Mask_val.numpy()
        valid_res = residuals[val_mask_np == 1]
        res_var_norm = float(np.mean(valid_res**2)) if len(valid_res) > 0 else 0.05
        res_var_meters = res_var_norm * (gw_std ** 2)

    print(f"Calibrated residual variance: sigma^2_resid = {res_var_meters:.4f} m^2 (std = {np.sqrt(res_var_meters):.3f} m)", flush=True)

    # Save model checkpoint
    model_dir = Path("results/models")
    model_dir.mkdir(parents=True, exist_ok=True)
    torch.save({
        'state_dict': model.state_dict(),
        'gw_mean': gw_mean,
        'gw_std': gw_std,
        'res_var_meters': res_var_meters,
        'res_var_norm': res_var_norm
    }, model_dir / "deepmvi_imputer.pt")
    print(f"Saved imputer to {model_dir / 'deepmvi_imputer.pt'}", flush=True)

    return model, gw_mean, gw_std, res_var_meters

def run_reconstruction_experiment(grid_path="data/processed/spatiotemporal_grid.npz", n_realizations=5):
    """Section 6 Experiment 3: Evaluate reconstruction across 10%, 20%, 30%, 40% missingness."""
    print("=" * 60, flush=True)
    print("RUNNING RECONSTRUCTION BENCHMARK (EXPERIMENT 3)", flush=True)
    print("=" * 60, flush=True)

    model_dir = Path("results/models")
    ckpt = torch.load(model_dir / "deepmvi_imputer.pt")
    model = DeepMVIModel(in_dim=6, hidden_dim=64, num_layers=2)
    model.load_state_dict(ckpt['state_dict'])
    model.eval()

    gw_mean = ckpt['gw_mean']
    gw_std = ckpt['gw_std']
    res_var = ckpt['res_var_meters']

    with np.load(grid_path) as loaded:
        grid = {k: loaded[k] for k in loaded.files}

    manifest_df = pd.read_csv("results/manifests/spatial_split_manifest.csv")
    test_wells = manifest_df[manifest_df['spatial_partition'] == 'test']['well_id'].values
    test_indices = [list(grid['well_ids']).index(w) for w in test_wells]

    T = len(grid['study_months'])
    gw_test = grid['gw_target'][:, test_indices]        # (60, N_test)
    mask_test = grid['gw_observed_mask'][:, test_indices] # (60, N_test)
    rain_test = grid['rainfall'][:, test_indices]
    temp_test = grid['temperature'][:, test_indices]
    sin_m = grid['sin_month']
    cos_m = grid['cos_month']

    missing_rates = [0.10, 0.20, 0.30, 0.40]
    results = []

    for rate in missing_rates:
        print(f"\nEvaluating artificial missingness rate: {rate*100:.0f}%...", flush=True)
        r_maes, r_rmses, r_nses = [], [], []

        for real_idx in range(n_realizations):
            rng = np.random.RandomState(42 + real_idx * 7)
            
            all_true = []
            all_recon = []

            for w_local, w_i in enumerate(test_indices):
                y_raw = gw_test[:, w_local]
                o_mask = mask_test[:, w_local]
                r = rain_test[:, w_local]
                t = temp_test[:, w_local]

                if o_mask.sum() < 6:
                    continue

                # Apply artificial masking
                a_mask, e_mask = apply_artificial_mask(y_raw, o_mask, mask_rate=rate, rng=rng)
                if e_mask.sum() == 0:
                    continue

                y_norm = np.where(a_mask == 1, (y_raw - gw_mean) / gw_std, 0.0)
                x_in = np.stack([
                    y_norm * a_mask,
                    a_mask.astype(np.float32),
                    (r / 100.0).astype(np.float32),
                    (t / 30.0).astype(np.float32),
                    sin_m[:, 0],
                    cos_m[:, 0]
                ], axis=-1)[np.newaxis, :]

                with torch.no_grad():
                    pred_norm = model(torch.tensor(x_in, dtype=torch.float32)).numpy()[0]
                
                # Unnormalize
                pred_meters = pred_norm * gw_std + gw_mean

                eval_pos = np.where(e_mask == 1)[0]
                for p in eval_pos:
                    all_true.append(y_raw[p])
                    all_recon.append(pred_meters[p])

            y_t_arr = np.array(all_true)
            y_r_arr = np.array(all_recon)

            mae = compute_mae(y_t_arr, y_r_arr)
            rmse = compute_rmse(y_t_arr, y_r_arr)
            nse = compute_nse(y_t_arr, y_r_arr)

            r_maes.append(mae)
            r_rmses.append(rmse)
            r_nses.append(nse)

        mean_mae = np.mean(r_maes)
        std_mae = np.std(r_maes)
        mean_rmse = np.mean(r_rmses)
        std_rmse = np.std(r_rmses)
        mean_nse = np.mean(r_nses)
        std_nse = np.std(r_nses)

        print(f"  Missing {rate*100:.0f}%: MAE={mean_mae:.3f}±{std_mae:.3f}m, RMSE={mean_rmse:.3f}±{std_rmse:.3f}m, NSE={mean_nse:.3f}±{std_nse:.3f}", flush=True)

        results.append({
            'missing_rate': rate,
            'missing_pct': f"{int(rate*100)}%",
            'n_realizations': n_realizations,
            'mae_mean': round(float(mean_mae), 3),
            'mae_std': round(float(std_mae), 3),
            'rmse_mean': round(float(mean_rmse), 3),
            'rmse_std': round(float(std_rmse), 3),
            'nse_mean': round(float(mean_nse), 3),
            'nse_std': round(float(std_nse), 3)
        })

    # Save results table
    recon_df = pd.DataFrame(results)
    tables_dir = Path("results/tables")
    tables_dir.mkdir(parents=True, exist_ok=True)
    recon_df.to_csv(tables_dir / "reconstruction_results.csv", index=False)
    print(f"\nSaved reconstruction results to {tables_dir / 'reconstruction_results.csv'}", flush=True)

    # Plot reconstruction vs missing rate
    fig_dir = Path("results/figures")
    fig_dir.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(7, 5), dpi=300)
    rates_pct = [r * 100 for r in missing_rates]
    maes = [r['mae_mean'] for r in results]
    mae_errs = [r['mae_std'] for r in results]
    rmses = [r['rmse_mean'] for r in results]
    rmse_errs = [r['rmse_std'] for r in results]

    plt.errorbar(rates_pct, maes, yerr=mae_errs, fmt='o-', color='#1f77b4', label='MAE (meters)', capsize=4, lw=2)
    plt.errorbar(rates_pct, rmses, yerr=rmse_errs, fmt='s--', color='#d62728', label='RMSE (meters)', capsize=4, lw=2)

    plt.title("Retrospective Reconstruction Degradation vs. Missingness Rate", fontsize=12, fontweight='bold', pad=10)
    plt.xlabel("Artificially Masked Observation Rate (%)", fontsize=11)
    plt.ylabel("Error at Hidden Ground Truth (m)", fontsize=11)
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.legend(frameon=True, fontsize=10)
    plt.tight_layout()

    fig_path = fig_dir / "reconstruction_vs_missing_rate.png"
    plt.savefig(fig_path)
    plt.close()
    print(f"Saved figure to {fig_path}", flush=True)

    return recon_df

def sample_imputed_histories(seq_gw, seq_mask, rain_seq, temp_seq, sin_m, cos_m, model_ckpt_path="results/models/deepmvi_imputer.pt", n_samples=20, seed=42):
    """Sample 20 reconstructed histories from DeepMVI with observed values fixed."""
    ckpt = torch.load(model_ckpt_path)
    model = DeepMVIModel(in_dim=6, hidden_dim=64, num_layers=2)
    model.load_state_dict(ckpt['state_dict'])
    model.eval()

    gw_mean = ckpt['gw_mean']
    gw_std = ckpt['gw_std']
    res_std = np.sqrt(ckpt['res_var_meters'])

    # Standardize input
    y_norm = np.where(seq_mask == 1, (seq_gw - gw_mean) / gw_std, 0.0)
    x_in = np.stack([
        y_norm * seq_mask,
        seq_mask.astype(np.float32),
        (rain_seq / 100.0).astype(np.float32),
        (temp_seq / 30.0).astype(np.float32),
        sin_m,
        cos_m
    ], axis=-1)[np.newaxis, :]

    with torch.no_grad():
        recon_norm = model(torch.tensor(x_in, dtype=torch.float32)).numpy()[0]
    
    recon_mean = recon_norm * gw_std + gw_mean

    rng = np.random.RandomState(seed)
    samples = np.zeros((n_samples, len(seq_gw)), dtype=np.float32)

    for b in range(n_samples):
        # Draw Gaussian perturbation for missing positions; measured values remain fixed
        noise = rng.normal(0, res_std, size=len(seq_gw))
        samples[b] = np.where(seq_mask == 1, seq_gw, recon_mean + noise)

    return samples

if __name__ == '__main__':
    train_deepmvi()
    run_reconstruction_experiment()
