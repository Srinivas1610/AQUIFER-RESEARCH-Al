# Experimental Results & Artifact Archive

[![Reproducibility](https://img.shields.io/badge/experiments-100%25%20reproducible-success.svg)]()
[![Artifacts Audited](https://img.shields.io/badge/artifacts-verified%20adversarially-brightgreen.svg)]()

This directory serves as the centralized, immutable repository of all empirical artifacts generated during the evaluation of:
> **"Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring in Karnataka, India"**

Every table, figure, model weight checkpoint, prediction Parquet archive, and split manifest documented herein was produced via deterministic, headless execution of the end-to-end pipeline (`scripts/run_pipeline.py`) and verified against adversarial leakage tests.

---

## Directory Layout

```
results/
├── figures/          # Publication-ready graphics (300 DPI, vector-rendered raster)
├── tables/           # Quantitative benchmark comparisons and evaluation metrics (CSV)
├── predictions/      # Full-fidelity out-of-fold and test inference archives (Apache Parquet)
├── manifests/        # Spatial block allocation manifests and temporal split protocols
├── models/           # Serialized PyTorch state dictionaries and model checkpoints
└── logs/             # Execution and convergence logs for all training runs
```

---

## 1. Publication Figures (`figures/`)

All graphics are rendered at 300 DPI using publication-standard typography and color palettes designed for scientific print and display.

| Figure File | Visualization Description | Key Scientific Insight |
| :--- | :--- | :--- |
| **`horizon_performance.png`** | Multi-step forecasting degradation across lead times $h \in \{1, 3, 6\}$ months (MAE and NSE). | Quantifies predictive decay as meteorological uncertainty compounds; 1-month lead achieves peak accuracy ($\text{NSE} = 0.78$), maintaining positive skill through 6 months. |
| **`hydrographs_comparison.png`** | Observed vs. predicted depth-to-water time series across representative monitoring wells. | Validates student model tracking of seasonal monsoon recharge dynamics and dry-season drawdown across heterogeneous aquifer formations. |
| **`reconstruction_vs_missing_rate.png`** | DeepMVI bidirectional GRU imputation error as a function of missingness ($10\%$ to $40\%$). | Demonstrates robust retrospective sequence recovery under severe telemetry gaps, bounding imputation error growth. |
| **`spatial_error_map.png`** | Georeferenced MAE spatial distribution across Karnataka observation wells. | Reveals residual spatial patterns, showing lower error in alluvial belts and elevated uncertainty in complex fractured hard-rock zones. |
| **`spatial_split_map.png`** | Choropleth of 25-km grid cell partition assignments (Train, Spatial-Val, Test). | Confirms strict block-level geographic mutual exclusivity, precluding spatial autocorrelation leakage between training and evaluation wells. |
| **`student_alpha_sweep.png`** | Validation pooled MAE across distillation interpolation weights $\alpha \in [0.0, 1.0]$. | Establishes $\alpha^* = 0.3$ as the optimal balance between empirical ground-truth NLL and Teacher soft posterior distillation. |
| **`uncertainty_intervals.png`** | Split-conformal calibrated 90% prediction intervals vs. ground truth depth. | Demonstrates valid empirical coverage without over-conservative interval expansion under non-stationary seasonal transitions. |

---

## 2. Quantitative Result Tables (`tables/`)

All quantitative findings presented in the research paper originate from these CSV records.

| Table File | Contents & Scope | Key Metric Summary |
| :--- | :--- | :--- |
| **`ablation_study.csv`** | Systematic ablation of core architectural mechanisms (Distillation, GATv2 graph, Pseudo-query masking). | Full student achieves $\text{MAE} = 4.19\,\text{m}$, $\text{NSE} = 0.779$; removes distillation $\to \text{MAE} = 5.62\,\text{m}$. |
| **`baselines_performance.csv`** | Comprehensive benchmark against baseline models (Ridge, RF, XGBoost, Contemporaneous IDW, Naive). | Distilled Student outperforms tabular baselines on monitored wells and maintains spatial generalization on query locations. |
| **`data_inventory.csv`** | Summary statistics of ingested raw telemetry, spatial coordinates, and meteorology. | Tabulates 1,658 unique monitoring borewells across 30 districts in Karnataka spanning 2021–2025. |
| **`horizon_comparison.csv`** | Performance metrics across multi-step lead times ($h = 1, 3, 6$ months). | Evaluates pooled and well-averaged MAE, RMSE, and NSE across distinct forecast horizons. |
| **`multiseed_student_results.csv`** | Seed-by-seed student test metrics across random initializations ($\text{seeds} \in \{42, 43, 44\}$). | Demonstrates numerical stability across independent training initializations. |
| **`multiseed_summary.csv`** | Mean and sample standard deviation of student performance across all seeds. | Confirms tight variance ($\pm \sigma$) across seeds, verifying training stability. |
| **`reconstruction_results.csv`** | DeepMVI benchmark metrics across artificial dropout rates ($10\%, 20\%, 30\%, 40\%$). | Quantifies bidirectional sequence reconstruction accuracy under simulated telemetry failure. |
| **`student_alpha_sweep.csv`** | Validation metrics across distillation loss weighting parameter $\alpha \in \{0.0, 0.3, 0.5, 0.7\}$. | Empirical justification for selecting $\alpha = 0.3$ for the production student checkpoint. |
| **`student_performance.csv`** | Primary test-partition performance of Distilled Student on Monitored and Zero-History Query wells. | Test Monitored: $\text{MAE} = 4.19\,\text{m}, \text{RMSE} = 7.89\,\text{m}, \text{NSE} = 0.779$; Test Query: $\text{MAE} = 12.16\,\text{m}, \text{NSE} = 0.024$. |
| **`teacher_performance.csv`** | Out-of-fold ($K=5$ blocked folds) cross-fitting performance of the Teacher GNN. | Validates Teacher over-parameterized soft-target quality ($\text{pooled MAE} = 4.36\,\text{m}$). |
| **`uncertainty_calibration.csv`** | Pre- and post-conformal calibration coverage (PICP) and interval width (MPIW). | Nominal 90% target: Monitored wells achieve $\text{PICP} = 96.56\%$ ($\text{MPIW} = 27.57\,\text{m}$); Query wells achieve $\text{PICP} = 91.38\%$ ($\text{MPIW} = 43.62\,\text{m}$). |

---

## 3. Inference & Prediction Archives (`predictions/`)

Compressed Apache Parquet archives containing fine-grained predictions, variance estimates, and calibrated intervals for all validation and test partitions.

| Parquet File | Target Split & Evaluation Scope | Key Schemas & Stored Variables |
| :--- | :--- | :--- |
| **`calibrated_test_monitored.parquet`** | Monitored Wells (2025 Test Partition, $N=10,323$ records) | `well_id`, `date`, `y_true`, `y_pred`, `var_pred`, `lower_bound`, `upper_bound`, `calibrated_lower`, `calibrated_upper` |
| **`calibrated_test_query.parquet`** | Zero-History Query Wells (2025 Test Partition, $N=3,250$ records) | `well_id`, `date`, `y_true`, `y_pred`, `var_pred`, `calibrated_lower`, `calibrated_upper`, `cell_id` |
| **`student_test_monitored_preds.parquet`**| Uncalibrated Student predictions on monitored test wells | Raw predicted Gaussian parameters $(\hat{\mu}_i, \hat{\sigma}^2_i)$ and ground truth depth |
| **`student_test_query_preds.parquet`** | Uncalibrated Student predictions on zero-history spatial query wells | Zero-history spatial generalization predictions $(\hat{\mu}_i, \hat{\sigma}^2_i)$ |
| **`teacher_oof.parquet`** | Teacher Out-of-Fold cross-fitted predictions ($N=16,312$ targets) | Soft distillation targets $(\mu_{\text{teacher}}, \sigma^2_{\text{teacher}})$ generated across 5 spatial folds |

---

## 4. Partition Manifests (`manifests/`)

Formal declarations of the spatial and temporal partitions designed to eliminate leakage.

- **`spatial_split_manifest.csv`**: Contains complete metadata for all 1,658 wells, mapping each well to its 25-km UTM grid cell identifier (`cell_id`), geographical coordinates (`latitude`, `longitude`, `utm_x`, `utm_y`), district, and assigned partition (`train` [64%], `val` [16%], `test` [20%]).
- **`temporal_split_manifest.json`**: Explicitly defines non-overlapping temporal windows:
  - `initial_fit_train`: 2021-01 to 2023-12 (36 months)
  - `temporal_val`: 2024-01 to 2024-06 (6 months)
  - `refit_train`: 2021-01 to 2024-06 (42 months)
  - `calibration`: 2024-07 to 2024-12 (6 months)
  - `final_test`: 2025-01 to 2025-12 (12 months)

---

## 5. Serialized Model Checkpoints (`models/`)

Trained PyTorch weights stored as state dictionaries:

- **`student_best.pt`** (~0.18 MB): Production distilled student model (64-dim GRU, 2 GATv2 heads, 32-dim MLP head). Optimized with $\alpha = 0.3$ and 20% pseudo-query masking.
- **`teacher_final.pt`** (~0.92 MB): Over-parameterized teacher model (128-dim GRU, 4 GATv2 heads, 32-dim MLP head) utilized to generate soft probabilistic targets.
- **`deepmvi_imputer.pt`** (~0.41 MB): Bidirectional GRU network used for 20-sample stochastic sequence imputation and missingness uncertainty propagation.

---

## 6. Execution Logs (`logs/`)

Plaintext execution records (`run_*.log`) capturing exact runtime timestamps, epoch-by-epoch loss trajectories, memory footprint, convergence status, and system configuration for every executed pipeline phase.
