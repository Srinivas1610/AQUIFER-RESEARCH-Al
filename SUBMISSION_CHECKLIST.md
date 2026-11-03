# Submission Verification & Reproducibility Checklist

Project: **Spatiotemporal Groundwater Level Prediction (Karnataka) with Teacher–Student Distillation**  
Lead Engineer / Author: **Srini K. R.**  
Verification Date: **October 12, 2026**  

---

## 1. Non-Negotiable Rules Audit

- [x] **Rule 1: Never fabricate results.**
  - Every numerical metric, table entry, and figure in `paper/PAPER.md` and `paper/main.tex` is directly derived from executed code artifacts in `results/tables/`.
  - Zero placeholder values ("XX.X", "??", "TODO") present in paper or documentation.
  - Traceability verified by `scripts/audit_artifacts.py`.

- [x] **Rule 2: Never fabricate data.**
  - Real NWIC Karnataka telemetry datasets (1.14 GB raw data) acquired and audited:
    - 5,747,936 raw 6-hourly DWLR groundwater observations (1,658 wells).
    - 683,619 rainfall records (686 stations) mapped via geodesic IDW.
    - 2,415,543 temperature records (132 stations) mapped via geodesic IDW.
  - Synthetic data (`scripts/make_synthetic.py`) is watermarked `SYNTHETIC` and used strictly for smoke testing; zero synthetic data in paper results.

- [x] **Rule 3: No leakage, ever.**
  - 25-km block spatial grid split (EPSG:32643, seed 42) ensures 100% cell mutual exclusivity (1,061 train, 265 val, 332 test wells).
  - Scalers (`target_mean`, `target_std`) and DeepMVI imputer fit strictly on the 2021--2023 training partition.
  - Query nodes (spatial-val, test, pseudo-queries) receive messages but send no messages.
  - Automated tests pass: `tests/test_leakage.py` (4/4 green).

- [x] **Rule 4: Imputed values never counted as measured samples.**
  - Mask integrity enforced: $m_{i,t} = 0$ for all missing and imputed entries.
  - Only observed targets with $m_{i,t+h} = 1$ enter the Gaussian negative log-likelihood loss.
  - Verified by `tests/test_leakage.py::test_observed_mask_zero_for_missing_and_imputed`.

- [x] **Rule 5: No silent changes to methodology.**
  - All mathematical interpretations and engineering adaptations documented in `docs/DECISIONS.md`:
    - Interpretation of $K=5$ spatially blocked out-of-fold cross-fitting for teacher soft targets.
    - DeepMVI mixture uncertainty formulation (Law of Total Variance).
    - Split-conformal calibration exchangeability caveats.
    - Daily-to-monthly median aggregation with $\ge 10$ valid days per month threshold.

- [x] **Rule 6: Strict reproducibility.**
  - Pinned `requirements.txt`.
  - Config-driven execution (`configs/*.yaml`).
  - Fixed seeds (42, 43, 44) for final model evaluation.
  - Saved manifests (`results/manifests/spatial_split_manifest.csv`, `temporal_split_manifest.json`).

---

## 2. Phase-by-Phase Verification

| Phase | Milestone | Primary Output Artifact | Status |
|---|---|---|---|
| **Phase 0** | Environment & Setup | `configs/base.yaml`, PyG 2.8.1, `tests/test_utils.py` | **PASSED** |
| **Phase 1** | Data Acquisition & Audit | `docs/DATA_AUDIT.md`, `results/tables/data_inventory.csv` | **PASSED** |
| **Phase 2** | Feature Engineering & IDW | `data/processed/spatiotemporal_grid.npz` (T=60, N=1,658) | **PASSED** |
| **Phase 3** | Spatial & Temporal Splits | `results/manifests/spatial_split_manifest.csv`, `results/figures/spatial_split_map.png` | **PASSED** |
| **Phase 4** | Benchmark Baselines | `results/tables/baselines_performance.csv` (10 models) | **PASSED** |
| **Phase 5** | DeepMVI Imputer Benchmark | `results/models/deepmvi_imputer.pt`, `results/tables/reconstruction_results.csv` | **PASSED** |
| **Phase 6** | Teacher Model & OOF Soft Targets | `results/models/teacher_final.pt`, `results/predictions/teacher_oof.parquet` | **PASSED** |
| **Phase 7** | Distilled Student GNN | `results/models/student_best.pt`, `results/tables/student_alpha_sweep.csv` | **PASSED** |
| **Phase 8** | Uncertainty & Conformal Calibration | `results/tables/uncertainty_calibration.csv`, `results/figures/uncertainty_intervals.png` | **PASSED** |
| **Phase 9** | Multi-Seed Fits & Ablations | `results/tables/multiseed_summary.csv`, `results/tables/ablation_study.csv` | **PASSED** |
| **Phase 10** | Adversarial Verification Audit | `tests/test_leakage.py`, `scripts/audit_artifacts.py` | **PASSED** |
| **Phase 11** | Scientific Paper & PDF Compilation | `paper/PAPER.md`, `paper/main.tex`, `paper/main.pdf` | **PASSED** |
| **Phase 12** | Packaging & Reproducibility | `README.md`, `Makefile`, `SUBMISSION_CHECKLIST.md` | **PASSED** |

---

## 3. Automated Test Suite Summary
- Total Unit Tests: **40 passing** (100% green across all test modules)
  - `test_utils.py`: 4/4 passed
  - `test_metrics.py`: 4/4 passed
  - `test_data_features.py`: 5/5 passed
  - `test_splits.py`: 4/4 passed
  - `test_baselines.py`: 3/3 passed
  - `test_imputer.py`: 3/3 passed
  - `test_teacher.py`: 2/2 passed
  - `test_student.py`: 4/4 passed
  - `test_calibration.py`: 3/3 passed
  - `test_leakage.py`: 4/4 passed
  - `test_experiments.py`: 4/4 passed
