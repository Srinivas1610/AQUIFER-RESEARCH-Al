# `gwml`: Core Machine Learning & Hydrological Modeling Package

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![PyTorch 2.14](https://img.shields.io/badge/PyTorch-2.14-orange.svg)](https://pytorch.org/)
[![PyTorch Geometric 2.5](https://img.shields.io/badge/PyG-2.5-brightgreen.svg)](https://pyg.org/)

The `gwml` Python package implements the end-to-end spatiotemporal machine learning pipeline for **"Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring in Karnataka, India"**. It provides modular components for geodesic graph construction, bidirectional GRU missing-value imputation, GATv2 teacher–student distillation, spatial block partitioning, and split-conformal uncertainty calibration across fractured hard-rock aquifers.

---

## Package Architecture

```
src/
└── gwml/
    ├── __init__.py           # Package namespace initialization and version metadata
    ├── calibration/          # Split-conformal calibration & uncertainty quantification
    ├── data/                 # Raw telemetry ingestion, quality audit, and IDW interpolation
    ├── evaluation/           # Hydrological and probabilistic evaluation metrics
    ├── experiments/          # Multi-seed executions, ablation studies, and horizon evaluations
    ├── graph/                # Dynamic geodesic graph construction with exponential decay
    ├── imputation/           # DeepMVI bidirectional GRU imputer with stochastic sampling
    ├── models/               # Spatiotemporal GATv2 architectures and baseline regressors
    ├── splits/               # 25-km spatial grid cell partitioning and temporal splits
    ├── training/             # Teacher cross-fitting and student distillation training routines
    └── utils/                # Configuration management, reproducibility seeds, and logging
```

---

## Sub-Module Reference

| Sub-Module | Primary Source Files | Key Classes / Functions | Methodological Purpose |
| :--- | :--- | :--- | :--- |
| **`calibration/`** | `conformal.py`<br>`run_calibration.py` | `fit_split_conformal`, `compute_conformity_scores`, `run_calibration_pipeline` | Implements distribution-free split-conformal prediction on the calibration partition (Jul–Dec 2024). Computes non-conformity scores $s_i = \max(L_i - y_i, y_i - U_i, 0)$ to calibrate 90% empirical prediction intervals without assuming unconditional exchangeability under monsoon non-stationarity. |
| **`data/`** | `audit.py`<br>`idw.py`<br>`met_aggregation.py` | `run_data_audit`, `haversine_distance_matrix`, `compute_idw_weights`, `aggregate_met_monthly` | Ingests NWIC telemetry and IMD gridded meteorology. Executes quality control (depth bounds $[0.1, 100]\,\text{m}$, minimum 10 days/month coverage), UTM EPSG:32643 projection, inverse distance weighting (IDW, power $p=2$, max 5 stations), and antecedent rainfall accumulation ($3$- and $6$-month windows). |
| **`evaluation/`** | `metrics.py` | `compute_mae`, `compute_rmse`, `compute_nse`, `compute_r2`, `compute_picp`, `compute_mpiw` | Computes standardized deterministic performance metrics (Mean Absolute Error, Root Mean Squared Error, Nash–Sutcliffe Efficiency, Coefficient of Determination) alongside probabilistic uncertainty metrics (Prediction Interval Coverage Probability, Mean Prediction Interval Width). |
| **`experiments/`** | `run_experiments.py` | `run_all_experiments`, `evaluate_horizons`, `evaluate_ablations` | Manages experimental pipelines: multi-seed verification ($\text{seeds} \in \{42, 43, 44\}$), multi-step forecasting horizons ($h \in \{1, 3, 6\}$ months), and ablation studies isolating graph attention, meteorological forcing, and knowledge distillation components. |
| **`graph/`** | `graph_builder.py` | `SpatiotemporalGraphBuilder`, `build_graph` | Constructs dynamic monthly graph snapshots ($k=5$ nearest neighbors + self-loops) with geodesic distance edge weights: $w_{ij} = \exp(-d_{ij}^2 / (2\ell^2))$, where $\ell$ is the empirical median positive neighbor distance ($\ell \approx 6.47\,\text{km}$). Enforces asymmetric message passing for unmonitored query nodes (receive-only). |
| **`imputation/`** | `deepmvi.py` | `DeepMVIModel`, `sample_imputations`, `run_imputer_benchmark` | Bidirectional GRU trained strictly on training-partition internal missingness patterns. At inference time, draws $M=20$ stochastic Gaussian realizations ($\sigma^2_{\text{resid}} = 44.74\,\text{m}^2$) while holding observed telemetry values fixed, effectively propagating missing-data uncertainty into downstream models. |
| **`models/`** | `st_gnn.py`<br>`baselines.py` | `SpatiotemporalGNN`, `EnvironmentalRidge`, `EnvironmentalRF`, `ContemporaneousIDW` | Implements the core recurrent graph attention architecture: GRU temporal encoder + 2-layer GATv2 with edge features (`edge_dim=1`) + MLP parameterizing a continuous Gaussian likelihood $\mathcal{N}(\mu, \sigma^2)$. Houses benchmark models including Ridge, Random Forest, XGBoost, and Contemporaneous IDW. |
| **`splits/`** | `spatial_cells.py` | `compute_spatial_cells`, `partition_cells`, `export_split_manifests` | Partitions observation space into discrete 25-km grid blocks in EPSG:32643 UTM projection. Sequentially assigns whole cells to train (64%), validation (16%), and test (20%) partitions with zero spatial cell or well overlap, guaranteeing spatial independence. |
| **`training/`** | `train_teacher.py`<br>`train_student.py` | `train_teacher_oof`, `train_distilled_student`, `distillation_loss` | Orchestrates $K=5$ spatially blocked cross-fitting of the over-parameterized Teacher model (128-dim GRU, 4 GAT heads) to generate out-of-fold soft targets. Trains the lightweight Student model (64-dim GRU, 2 GAT heads) via joint Gaussian NLL and Kullback–Leibler divergence with 20% random history masking. |
| **`utils/`** | `config.py`<br>`seed.py`<br>`logging.py` | `load_config`, `set_seed`, `setup_logging` | Loads hierarchical YAML configurations with inheritance (`_base_`), enforces deterministic execution across Python, NumPy, and PyTorch backends, and configures standardized structured experiment logging. |
| **`__init__.py`** | `__init__.py` | `__version__ = "0.1.0"` | Root package initialisation exporting package version and public API boundaries. |

---

## Architectural Principles

1. **Strict Spatial and Temporal Isolation:** Preprocessing statistics, spatial graph topology, and imputation parameters are fit strictly on the training partition ($2021\text{--}2023$). No future observations ($t > t_0$) or test well metadata leak into model inputs.
2. **Asymmetric Graph Message Passing:** Query wells (unmonitored locations with zero historical telemetry) receive spatial context from neighboring monitored wells but do not propagate ungrounded messages back into the graph network.
3. **Probabilistic Uncertainty & Conformal Guarantees:** Predictions yield parameterized Gaussian distributions $\mathcal{N}(\mu, \sigma^2)$, which are post-processed via distribution-free split-conformal calibration on a dedicated buffer ($2024\text{H2}$) to ensure valid nominal empirical coverage on unseen temporal horizons ($2025$).

---

## Module Import & Quick Start

```python
import torch
from gwml.utils.config import load_config
from gwml.utils.seed import set_seed
from gwml.models.st_gnn import SpatiotemporalGNN
from gwml.graph.graph_builder import SpatiotemporalGraphBuilder
from gwml.calibration.conformal import fit_split_conformal

# 1. Initialize configuration and set deterministic seed
cfg = load_config("configs/student.yaml")
set_seed(cfg["project"]["seed"])

# 2. Instantiate Student GNN
model = SpatiotemporalGNN(
    in_dynamic_dim=4,
    static_dim=4,
    harmonic_dim=2,
    gru_hidden=cfg["model"]["gru_hidden"],
    gat_heads=cfg["model"]["gat_heads"],
    mlp_hidden=cfg["model"]["mlp_hidden"],
    dropout=cfg["model"]["dropout"]
)
```
