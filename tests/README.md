# Automated Test Suite & Adversarial Integrity Verification

[![Tests](https://img.shields.io/badge/tests-40%20passed-brightgreen.svg)]()
[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![Pytest](https://img.shields.io/badge/framework-pytest--9.1-orange.svg)](https://pytest.org/)

This directory houses the comprehensive test suite for the research repository **"Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring in Karnataka, India"**.

The suite contains **40 automated tests** distributed across **12 test modules**, systematically validating data integrity, mathematical correctness, architectural tensor dimensions, split-conformal calibration bounds, and strict adversarial zero-leakage constraints.

---

## Running the Test Suite

Execute the entire test suite from the repository root:

```bash
# Using pytest directly
pytest tests/ -v

# Or using the Makefile target
make test
```

To run a specific test module (e.g., adversarial leakage verification):

```bash
pytest tests/test_leakage.py -v
```

---

## Test Modules & Verification Matrix

| Test Module | Test Count | Target Scope | Key Verification Criteria |
| :--- | :---: | :--- | :--- |
| **`test_leakage.py`** | 4 | **Adversarial Leakage & Integrity (Critical)** | Verifies: (1) strict spatial mutual exclusivity (zero well or 25-km cell overlap across train/val/test); (2) temporal horizon isolation (training strictly capped at 2021–2023); (3) graph message asymmetry (query nodes receive messages but emit zero outgoing edges); (4) mask integrity (imputed values are never flagged as observed targets and never enter loss functions). |
| **`test_splits.py`** | 4 | Spatial & Temporal Split Partitions | Validates existence and schema of `spatial_split_manifest.csv` and `temporal_split_manifest.json`; verifies ~64%/16%/20% partition allocation percentages and zero cell intersection. |
| **`test_calibration.py`** | 3 | Split-Conformal Calibration | Tests conformity score computation $s_i = \max(L_i - y_i, y_i - U_i, 0)$; confirms score monotonicity and verifies interval expansion increases empirical test coverage. |
| **`test_data_features.py`**| 5 | Geodesic Math & Feature Engineering | Tests Haversine geodesic distance accuracy against analytical benchmarks; verifies IDW weight normalization ($\sum w_i = 1$) and co-located singularity handling; validates EPSG:32643 UTM projection and spatiotemporal grid array shapes. |
| **`test_student.py`** | 4 | Distillation Architecture & Training | Validates distillation loss convergence to zero when student equals teacher; checks Student GNN tensor dimensions (64-dim hidden, 2 GAT heads); verifies alpha sweep artifact and serialized checkpoint `student_best.pt`. |
| **`test_teacher.py`** | 2 | Teacher Architecture & Soft Targets | Validates over-parameterized Teacher GNN specification (128-dim hidden, 4 GAT heads); tests out-of-fold cross-fitting archive `teacher_oof.parquet` integrity and column schema. |
| **`test_imputer.py`** | 3 | DeepMVI Sequence Imputation | Confirms existence of `deepmvi_imputer.pt`; validates that 20-sample stochastic sampling preserves ground-truth observed telemetry while sampling missing gaps; checks reconstruction benchmark results. |
| **`test_baselines.py`** | 3 | Benchmark Regressors | Confirms existence of baseline summary tables; checks coverage of standard models (Ridge, Random Forest, Contemporaneous IDW, XGBoost, Persistence); verifies physical plausibility of error metrics. |
| **`test_metrics.py`** | 4 | Hydrological & Deterministic Metrics | Verifies mathematical exactness for MAE, RMSE, and Nash–Sutcliffe Efficiency ($\text{NSE} = 1$ for perfect predictions, $\text{NSE} = 0$ for mean prediction). |
| **`test_experiments.py`**| 4 | Experimental Artifacts & Multi-Seed | Asserts valid rows and non-NaN values in multi-seed summaries, horizon comparisons, ablation tables, and confirms existence of all 7 high-resolution publication figures. |
| **`test_utils.py`** | 4 | Utility & Reproducibility Functions | Asserts deterministic reproducibility under fixed seeds across NumPy/PyTorch; verifies hierarchical YAML loading and inheritance from `base.yaml`. |
| **`conftest.py`** | — | Test Fixtures & Environment | Configures repository root imports, shared test paths, mock fixtures, and pytest session hooks. |
| **`__init__.py`** | — | Package Initialization | Defines the test directory package namespace. |

---

## Critical Zero-Leakage Guarantees (`test_leakage.py`)

Hydrological and spatiotemporal machine learning models are uniquely susceptible to subtle data leakage that inflates reported performance. The test suite enforces four invariants:

1. **Spatial Invariant:** 
   $$\mathcal{W}_{\text{train}} \cap \mathcal{W}_{\text{val}} = \emptyset, \quad \mathcal{W}_{\text{train}} \cap \mathcal{W}_{\text{test}} = \emptyset, \quad \mathcal{W}_{\text{val}} \cap \mathcal{W}_{\text{test}} = \emptyset$$
   $$\mathcal{C}_{\text{train}} \cap \mathcal{C}_{\text{val}} = \emptyset, \quad \mathcal{C}_{\text{train}} \cap \mathcal{C}_{\text{test}} = \emptyset, \quad \mathcal{C}_{\text{val}} \cap \mathcal{C}_{\text{test}} = \emptyset$$
   where $\mathcal{W}$ denotes borewell IDs and $\mathcal{C}$ denotes 25-km UTM grid blocks.

2. **Temporal Invariant:**
   For any forecast at origin $t$, dynamic input features are strictly restricted to $\tau \le t$. Future meteorological or hydrological telemetry ($\tau > t$) is strictly masked.

3. **Graph Message Passing Invariant:**
   Let $\mathcal{V}_{\text{query}}$ be the set of unmonitored evaluation nodes. For any directed edge $(u, v) \in \mathcal{E}$, if $u \in \mathcal{V}_{\text{query}}$, then the edge weight is zero ($w_{uv} = 0$), preventing query nodes from diffusing information to other nodes.

4. **Target Mask Invariant:**
   Let $M_{i,t} \in \{0, 1\}$ be the observation mask. For any missing or imputed observation, $M_{i,t} \equiv 0$, guaranteeing that imputed values never contribute to loss gradients or quantitative evaluation metrics.
