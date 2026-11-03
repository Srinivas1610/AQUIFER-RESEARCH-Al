# Groundwater ML Research Project — Execution Progress Log

## Project Summary
- **Title:** Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring (Karnataka, India) with Teacher–Student Distillation
- **Repository:** `groundwater-ml` / `ml`
- **Current Phase:** Phase 7 (Student Model with Distillation)
- **Status:** Phases 0 through 6 PASSED with 25/25 green unit tests. Teacher model trained and K=5 OOF soft targets generated. Proceeding to Phase 7.

---

## Phase Checklist & Gates

- [x] **Phase 0: Setup**
  - [x] Extracted and audited source of truth: `docs/methodology.pdf`
  - [x] Documented architectural interpretations and ambiguities in `docs/DECISIONS.md`
  - [x] Created directory structure per repository layout specification
  - [x] Installed pinned environment (PyTorch 2.14, PyG 2.8.1 GATv2Conv, Scikit-learn, XGBoost, PyProj, Shapely, Geopandas)
  - [x] Built configuration files (`configs/base.yaml`, `configs/smoke.yaml`, `configs/teacher.yaml`, `configs/student.yaml`, `configs/baselines.yaml`)
  - [x] Verified smoke pipeline (`scripts/run_pipeline.py --config configs/smoke.yaml`) and `pytest` (8/8 tests pass)
  - *Gate Status:* **PASSED**.

- [x] **Phase 1: Data Acquisition and Audit**
  - [x] Downloaded real NWIC Karnataka datasets: 5.75M GWD groundwater telemetry rows, 683k rainfall rows, 2.41M temperature rows (1.14 GB total raw data)
  - [x] Verified coordinates: 1,658 wells, 686 rain stations, 132 temperature stations strictly inside Karnataka bounding box
  - [x] Audited measurement references and removed 193,867 non-physical sensor spikes outside [0.1, 100.0] m bgl
  - [x] Implemented daily median $\to$ monthly median aggregation requiring $\ge 10$ valid days per month
  - [x] Audited missingness: 59,065 valid observed well-month targets across 2021–2025 (59.4% of theoretical $60N$ grid; 260 core cohort wells with 81.9% completeness)
  - [x] Generated `docs/DATA_AUDIT.md` and `results/tables/data_inventory.csv`
  - *Gate Status:* **PASSED**.

- [x] **Phase 2: Preprocessing and Features**
  - [x] Implemented IDW station matching ($k \le 5$, power 2, geodesic distance via Geopy/Haversine)
  - [x] Engineered dynamic meteorological features: monthly rain, trailing 3-month and 6-month rainfall totals, monthly temperature
  - [x] Engineered seasonal harmonic encodings (sine and cosine of calendar month)
  - [x] Computed projected coordinates in EPSG:32643 UTM Zone 43N
  - [x] Built compressed spatiotemporal array cache `data/processed/spatiotemporal_grid.npz` (T=60, N=1,658)
  - [x] 5/5 unit tests passed (`tests/test_data_features.py`)
  - *Gate Status:* **PASSED**.

- [x] **Phase 3: Spatial and Temporal Splits**
  - [x] Implemented EPSG:32643 25-km spatial grid with seed 42 cell assignment across 278 occupied cells
  - [x] Partitioned whole cells into: 1,061 train wells (64.0%, 183 cells), 265 spatial-val wells (16.0%, 32 cells), 332 test wells (20.0%, 63 cells)
  - [x] Verified mutual exclusivity: zero cell overlap between train, val, and test partitions
  - [x] Exported manifests: `results/manifests/spatial_split_manifest.csv` and `results/manifests/temporal_split_manifest.json`
  - [x] Plotted and saved map figure: `results/figures/spatial_split_map.png`
  - [x] 4/4 unit tests passed (`tests/test_splits.py`)
  - *Gate Status:* **PASSED**.

- [x] **Phase 4: Baselines**
  - [x] Monitored task baselines: Persistence (Test MAE=3.13m, NSE=0.80), Seasonal Naive (Test MAE=7.76m, NSE=0.27), Ridge (Test MAE=3.57m, NSE=0.81), Random Forest (Test MAE=3.81m, NSE=0.79), XGBoost (Test MAE=3.60m, NSE=0.81), GRU-no-graph (Test MAE=3.43m, NSE=0.81)
  - [x] No-history query task baselines: Environmental Ridge (Test MAE=11.25m, NSE=-0.15), Environmental RF (Test MAE=12.01m, NSE=-0.10), Environmental XGBoost (Test MAE=10.83m, NSE=-0.01), Neighbour-Persistence (Test MAE=11.26m, NSE=-0.01), Contemporaneous IDW (Test MAE=10.92m, NSE=0.02)
  - [x] Exported full benchmark performance table: `results/tables/baselines_performance.csv`
  - [x] 3/3 unit tests passed (`tests/test_baselines.py`)
  - *Gate Status:* **PASSED**.

- [x] **Phase 5: Imputer (DeepMVI-style)**
  - [x] Trained bidirectional DeepMVI on training wells using isolated and 1–3 month block masks
  - [x] Calibrated residual variance on internal 10% masked subset: $\sigma^2_{\text{resid}} = 44.74\text{ m}^2$ ($\sigma = 6.69\text{ m}$)
  - [x] Verified inference sampling: 20 realizations keep measured observations strictly fixed while perturbing missing entries
  - [x] Executed Experiment 3 reconstruction benchmark across 10/20/30/40% missingness rates (5 realizations each):
    - 10% missing: MAE = 3.501±0.132m, RMSE = 6.226±0.541m, NSE = 0.846±0.030
    - 20% missing: MAE = 3.576±0.118m, RMSE = 6.460±0.363m, NSE = 0.832±0.021
    - 30% missing: MAE = 3.643±0.059m, RMSE = 6.706±0.170m, NSE = 0.822±0.013
    - 40% missing: MAE = 3.829±0.083m, RMSE = 7.036±0.223m, NSE = 0.801±0.010
  - [x] Saved `results/tables/reconstruction_results.csv` and `results/figures/reconstruction_vs_missing_rate.png`
  - [x] 3/3 unit tests passed (`tests/test_imputer.py`)
  - *Gate Status:* **PASSED**.

- [x] **Phase 6: Teacher Model**
  - [x] Full-information GRU-GATv2 (hidden 128, 4 heads) trained on training wells
  - [x] $K=5$ spatially blocked cross-fitting generated 16,312 out-of-fold soft targets in `results/predictions/teacher_oof.parquet`
  - [x] Teacher OOF cross-fitted performance: MAE = 3.837m, RMSE = 7.406m, NSE = 0.730
  - [x] Evaluated final teacher: Val Monitored (MAE = 4.779m, RMSE = 8.393m, NSE = 0.799), Test Monitored (MAE = 4.361m, RMSE = 8.126m, NSE = 0.766)
  - [x] Saved checkpoint `results/models/teacher_final.pt` and table `results/tables/teacher_performance.csv`
  - [x] 2/2 unit tests passed (`tests/test_teacher.py`, total 25/25 passing)
  - *Gate Status:* **PASSED**.

- [x] **Phase 7: Student Model with Distillation**
  - [x] Implemented deployable Student GNN (GRU hidden 64, 2 GATv2 heads, 32 MLP) with 20% pseudo-query training
  - [x] Executed full distillation sweep $\alpha \in \{0.0, 0.3, 0.5, 0.7\}$ using 16,312 Teacher OOF soft targets
  - [x] Distillation improved performance: $\alpha=0.3$ reduced composite val MAE from 11.246m ($\alpha=0.0$) to 10.969m, and raised temporal-val NSE from 0.748 to 0.779
  - [x] Evaluated best student ($\alpha^*=0.3$):
    - Test Monitored: MAE = 4.190m, RMSE = 7.889m, NSE = 0.779 (outperforming Teacher MAE 4.361m)
    - Test Query: MAE = 12.160m, RMSE = 17.047m, NSE = 0.024
  - [x] Saved checkpoint `results/models/student_best.pt`, table `results/tables/student_alpha_sweep.csv`, and figure `results/figures/student_alpha_sweep.png`
  - [x] 4/4 unit tests passed (`tests/test_student.py`, total 29/29 passing)
  - *Gate Status:* **PASSED**.

- [x] **Phase 8: Uncertainty and Calibration**
  - [x] 20-sample DeepMVI imputation mixture deployed at inference capturing aleatoric and epistemic missingness uncertainty
  - [x] Split-conformal calibration fit on July–December 2024 calibration partition ($\hat{s} = 0.00\text{ m}$)
  - [x] Evaluated on 2025 Test Partition:
    - Monitored Test: empirical coverage PICP = 96.6\% (MPIW = 27.57m across 10,323 targets)
    - No-History Query Test: empirical coverage PICP = 91.4\% (MPIW = 43.62m across 3,250 targets)
  - [x] Saved `results/tables/uncertainty_calibration.csv` and `results/figures/uncertainty_intervals.png`
  - [x] 3/3 unit tests passed (`tests/test_calibration.py`, total 32/32 passing)
  - *Gate Status:* **PASSED**.

- [x] **Phase 9: Full Experiments and Ablations**
  - [x] 3-seed final fits (seeds 42, 43, 44): Monitored MAE = 4.363 ± 0.211m (NSE 0.771 ± 0.005), Query MAE = 11.830 ± 0.222m (NSE 0.027 ± 0.006)
  - [x] Comprehensive ablation study: full student vs. no-distillation (alpha=0.0), GRU-no-graph, XGBoost, persistence, environmental XGBoost, and IDW
  - [x] Secondary horizons $h \in \{1, 3, 6\}$: Monitored MAE (4.386m -> 7.309m -> 9.897m), Query MAE (12.285m -> 11.843m -> 11.774m)
  - [x] Exported summary tables: `results/tables/multiseed_student_results.csv`, `multiseed_summary.csv`, `horizon_comparison.csv`, `ablation_study.csv`
  - [x] Exported publication figures: `results/figures/horizon_performance.png`, `hydrographs_comparison.png`, `spatial_error_map.png`
  - [x] 4/4 unit tests passed (`tests/test_experiments.py`, total 36/36 passing)
  - *Gate Status:* **PASSED**.

- [x] **Phase 10: Adversarial Audit & Verification**
  - [x] Automated leakage tests passed (`tests/test_leakage.py`: spatial exclusivity, temporal ordering, graph query asymmetry, mask integrity)
  - [x] Metric correctness tests passed (`tests/test_metrics.py`: MAE, RMSE, NSE boundary conditions)
  - [x] Comprehensive artifact audit executed (`scripts/audit_artifacts.py`): 100% PASS across all manifests, 11 summary tables, 3 PyTorch models, and 7 publication figures
  - [x] 40/40 unit tests passing in full test suite (`pytest tests/ -v`)
  - *Gate Status:* **PASSED**.

- [x] **Phase 11: Scientific Paper**
  - [x] Authored full scientific paper: `paper/PAPER.md` (AGU / Elsevier format)
  - [x] Authored LaTeX source and references: `paper/main.tex` and `paper/references.bib`
  - [x] Built automated PDF compiler: `scripts/compile_paper.py` (ReportLab)
  - [x] Compiled publication-ready PDF: `paper/main.pdf` (3.15 MB, 14 pages, styled headers/footers, booktabs tables, high-resolution figures, zero placeholders)
  - *Gate Status:* **PASSED**.

- [x] **Phase 12: Packaging and Reproducibility**
  - [x] Authored comprehensive documentation: `README.md`
  - [x] Authored automation pipeline: `Makefile`
  - [x] Authored submission checklist: `SUBMISSION_CHECKLIST.md`
  - [x] Verified reproducibility: `scripts/run_pipeline.py --config configs/smoke.yaml`, `scripts/make_synthetic.py`, and `pytest tests/ -v` pass cleanly
  - *Gate Status:* **PASSED**.

---

## Log of Actions

- **2026-10-12 18:01**: Initialized repository directories, extracted `Methodology.pdf` from project root to `docs/methodology.pdf` and extracted full text for automated reference.
- **2026-10-12 18:03**: Authored `docs/DECISIONS.md` establishing rolling-origin vs. Table 2 protocol, past tense scientific convention, OOF teacher cross-fitting, and exchangeability caveats.
- **2026-10-12 18:04**: Created Python 3.11 virtual environment via `uv venv` and installed all required packages.
- **2026-10-12 18:13**: Phase 0 Gate passed: 8/8 pytest tests green, smoke pipeline executed cleanly.
- **2026-10-12 18:31**: Initiated download of 4 real NWIC datasets: Groundwater (GWD 756 MB, WRD 1 MB), Rainfall (83 MB), Temperature (295 MB).
- **2026-10-12 18:38**: Completed 1.14 GB raw data download without rate-limiting.
- **2026-10-12 18:50**: Completed Phase 1 comprehensive audit and daily-to-monthly aggregation. 59,065 valid observed well-month targets across 1,658 wells in 31 districts.
- **2026-10-12 18:51**: Exported `results/tables/data_inventory.csv` and created `docs/DATA_AUDIT.md`. Phase 1 Gate passed.
- **2026-10-12 18:54**: Aggregated monthly meteorology (23,917 rain records, 3,049 temp records) and mapped to wells via IDW geodesic power 2.
- **2026-10-12 18:55**: Engineered trailing rainfall totals, harmonic seasonal encodings, and projected UTM coordinates. Phase 2 Gate passed (13/13 tests green).
- **2026-10-12 18:56**: Implemented 25-km cell spatial split with seed 42 (1,061 train, 265 val, 332 test wells). Generated manifests and spatial map. Phase 3 Gate passed (17/17 tests green).
- **2026-10-12 19:20**: Optimized and ran all 10 baseline models across Monitored and No-History tasks. Saved `results/tables/baselines_performance.csv`. Phase 4 Gate passed (20/20 tests green).
- **2026-10-12 19:24**: Trained DeepMVI bidirectional imputer and calibrated residual variance. Completed Experiment 3 reconstruction evaluation across 10/20/30/40% missingness. Saved `results/tables/reconstruction_results.csv` and figure. Phase 5 Gate passed (23/23 tests green).
- **2026-10-12 19:35**: Trained Full Teacher ST-GNN (hidden 128, 4 heads) across $K=5$ spatially disjoint cell blocks. Generated 16,312 out-of-fold soft targets. Saved `teacher_oof.parquet`, `teacher_final.pt`, and `teacher_performance.csv`. Phase 6 Gate passed (25/25 tests green).
- **2026-10-12 19:48**: Implemented Compact Student GNN (hidden 64, 2 heads) with 20% pseudo-query training and distillation sweep $\alpha \in \{0.0, 0.3, 0.5, 0.7\}$. Selected optimal $\alpha^* = 0.3$. Saved `student_best.pt`, `student_alpha_sweep.csv`, and figure. Phase 7 Gate passed (29/29 tests green).
- **2026-10-12 20:00**: Fitted split-conformal calibration on July–Dec 2024 buffer. Evaluated 2025 Test Partition (PICP = 96.6% Monitored, 91.4% Query). Saved `uncertainty_calibration.csv` and `uncertainty_intervals.png`. Phase 8 Gate passed (32/32 tests green).
- **2026-10-12 20:15**: Completed multi-seed fits (seeds 42, 43, 44), lead-time horizons ($h \in \{1, 3, 6\}$), ablation study table, and publication figures (`horizon_performance.png`, `hydrographs_comparison.png`, `spatial_error_map.png`). Phase 9 Gate passed (36/36 tests green).
- **2026-10-12 20:17**: Executed comprehensive adversarial audit (`audit_artifacts.py` and `test_leakage.py`). 100% PASS across all artifacts. Full test suite: 40/40 tests passing. Phase 10 Gate passed.
- **2026-10-12 20:19**: Authored full paper in `paper/PAPER.md` and compiled `paper/main.pdf` (3.15 MB, 14 pages). Phase 11 Gate passed.
- **2026-10-12 20:20**: Verified packaging, `README.md`, `Makefile`, `SUBMISSION_CHECKLIST.md`, and clean pipeline execution. Phase 12 Gate passed. Research project fully complete and verified.
