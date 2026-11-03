# Experiment Configuration Specifications

[![Config Format](https://img.shields.io/badge/format-YAML-yellow.svg)](https://yaml.org/)
[![Reproducibility](https://img.shields.io/badge/configuration-frozen%20reproducible-brightgreen.svg)]()

This directory contains the declarative YAML configuration files governing the experimental pipelines for:
> **"Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring in Karnataka, India"**

The configuration system enforces strict reproducibility, modular parameter inheritance via an `_base_` directive, and parameter isolation across experimental baselines, teacher cross-fitting, student distillation, and smoke testing.

---

## Configuration Hierarchy & Loading

All configurations are parsed and validated via the `src/gwml/utils/config.py` loader (`load_config`), which handles recursive base merging and type resolution:

```
configs/
├── base.yaml           # Master baseline configuration (frozen hyperparameters & shared paths)
├── smoke.yaml          # Rapid integration & smoke testing configuration (reduced scope)
├── teacher.yaml        # Over-parameterized Teacher GNN specification & cross-fitting
├── student.yaml        # Lightweight Student GNN with knowledge distillation & pseudo-queries
└── baselines.yaml      # Environmental benchmark regressors configuration
```

### Loading Example in Python
```python
from gwml.utils.config import load_config

# Recursively resolves '_base_: base.yaml' and overrides specified parameters
cfg = load_config("configs/student.yaml")
print(f"GRU Hidden: {cfg['model']['gru_hidden']}, GAT Heads: {cfg['model']['gat_heads']}")
```

---

## Configuration Files Detailed Specification

### 1. Master Configuration: `base.yaml`
Defines project-wide defaults, spatial/temporal split parameters, and core model hyperparameters:

| Parameter Group | Key Parameters | Default Setting | Hydrological / Architectural Significance |
| :--- | :--- | :--- | :--- |
| **`project`** | `name`<br>`seed`<br>`seeds_final`<br>`timezone` | `groundwater-ml-karnataka`<br>`42`<br>`[42, 43, 44]`<br>`Asia/Kolkata` | Seed management across Python, NumPy, and PyTorch for deterministic multi-seed runs. |
| **`data`** | `study_period`<br>`min_days_per_month`<br>`core_cohort_min_coverage` | `2021-01` to `2025-12`<br>`10`<br>`0.70` | Enforces minimum data completeness: $\ge 10$ daily telemetry observations/month, $\ge 70\%$ valid monthly targets during initial fit (2021–2023). |
| **`features`** | `idw.max_stations`<br>`idw.power`<br>`trailing_rain_months`<br>`lookback`<br>`horizon` | `5`<br>`2`<br>`[3, 6]`<br>`[6, 12]`<br>`[1, 3, 6]` | Inverse distance weighting parameters for meteorology; trailing antecedent rainfall accumulations; historical sequence lookback ($T=12$ months) and prediction horizons. |
| **`spatial_split`** | `cell_size_m`<br>`crs`<br>`test_frac`<br>`val_frac`<br>`train_frac` | `25000`<br>`EPSG:32643`<br>`0.20`<br>`0.16`<br>`0.64` | 25-km UTM grid blocks ensuring strict geographic separation without spatial autocorrelation leakage. |
| **`temporal_split`** | `initial_fit`<br>`validation`<br>`refit`<br>`calibration`<br>`test` | `2021-01` to `2023-12`<br>`2024-01` to `2024-06`<br>`2021-01` to `2024-06`<br>`2024-07` to `2024-12`<br>`2025-01` to `2025-12` | Non-overlapping chronological partitions isolating model tuning, split-conformal calibration, and final test evaluation. |
| **`model` (Student)** | `gru_hidden`<br>`gat_heads`<br>`gat_layers`<br>`mlp_hidden`<br>`dropout`<br>`variance_floor` | `64`<br>`2`<br>`2`<br>`32`<br>`0.1`<br>`1.0e-4` | Lightweight student topology; MLP outputs parameterized Gaussian distribution $\mathcal{N}(\mu, \sigma^2)$ with softplus variance floor. |
| **`graph`** | `k_neighbours`<br>`self_loop` | `5`<br>`true` | $k=5$ nearest neighbors with self-loops; geodesic exponential decay length scale $\ell$ derived dynamically from median neighbor distance. |
| **`training`** | `optimizer`<br>`lr`<br>`weight_decay`<br>`batch_size`<br>`max_epochs`<br>`patience`<br>`pseudo_query_frac` | `adam`<br>`1.0e-3`<br>`1.0e-4`<br>`4`<br>`200`<br>`20`<br>`0.20` | Optimization schedule with early stopping and 20% random history masking for pseudo-query training. |
| **`imputation`** | `n_samples`<br>`internal_mask_frac` | `20`<br>`0.10` | DeepMVI stochastic sampling ($M=20$) over internal 10% masking validation. |
| **`calibration`** | `nominal_coverage` | `0.90` | Split-conformal calibration target interval coverage ($90\%$). |

---

### 2. Teacher GNN Configuration: `teacher.yaml`
Overrides base parameters to configure the over-parameterized Teacher model used for soft-target generation:
- `gru_hidden`: `128` (doubled capacity relative to student)
- `gat_heads`: `4` (expanded multi-head attention capacity)
- `oof_k_folds`: `5` (5-fold spatially blocked out-of-fold cross-fitting)
- `pseudo_query_frac`: `0.0` (Teacher observes complete unmasked historical telemetry)

---

### 3. Student GNN Configuration: `student.yaml`
Configures the lightweight deployable Student model and knowledge distillation loss:
- Inherits baseline student topology (64-dim GRU, 2 GAT heads).
- `distillation.alpha`: `0.3` (optimal interpolation weight: $\mathcal{L}_{\text{total}} = (1 - \alpha)\mathcal{L}_{\text{NLL}} + \alpha \mathcal{L}_{\text{KL}}$).
- `training.pseudo_query_frac`: `0.20` (20% history masking enforcing zero-history inference robustness).
- `distillation.warmup_epochs`: `10` (linear transition from ground truth to joint distillation).

---

### 4. Environmental Baselines Configuration: `baselines.yaml`
Configures standard non-graph and tabular regression benchmarks:
- Models evaluated: `persistence` (lag-1 baseline), `seasonal_naive` (12-month lag), `ridge` (Environmental Ridge), `random_forest` (Environmental RF), `xgboost` (Gradient Boosted Trees), and `gru_no_graph` (Ablated temporal GRU without spatial message passing).

---

### 5. Smoke Testing Configuration: `smoke.yaml`
Provides lightweight settings for fast continuous integration, synthetic pipeline validation, and sanity checks:
- `data.max_wells`: `20` (restricted to 20 well subsets)
- `data.study_period`: `2023-01` to `2024-06` (18 months)
- `training.max_epochs`: `3`, `batch_size`: `2`
- `imputation.n_samples`: `2`
- `teacher.oof_k_folds`: `2`
- `seeds_final`: `[42]`
