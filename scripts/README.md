# Pipeline Execution & Operational Scripts

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![Reproducibility](https://img.shields.io/badge/pipeline-deterministic-success.svg)]()

This directory contains executable entry-point scripts for data ingestion, feature generation, neural network training, adversarial verification, report compilation, and web demo data export for:
> **"Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring in Karnataka, India"**

---

## Script Overview

```
scripts/
├── run_pipeline.py                 # Master multi-phase orchestration entry point
├── make_synthetic.py               # Generates synthetic data for smoke testing
├── build_merged_dataset.py         # Constructs the canonical 99,480-row merged dataset
├── audit_artifacts.py              # Adversarial artifact and metric verification
├── export_demo_data.py             # Pre-computes and exports data for the web application
├── compile_paper.py                # Compiles the publication-quality research paper to PDF
├── compile_comparison_report.py    # Compiles the comparative benchmark report vs. Naik et al.
├── download_raw_data.py            # Downloads raw NWIC/IMD telemetry data
├── audit_met.py                    # Audits gridded meteorological station quality
└── [auxiliary utilities]           # Diagnostic, streaming, and exploratory scripts
```

---

## Primary Pipeline Entry Points

### 1. Master Pipeline Orchestrator: `run_pipeline.py`
Executes individual pipeline phases or the end-to-end workflow under a specified YAML configuration:
```bash
# Execute end-to-end pipeline with full research configuration
python scripts/run_pipeline.py --config configs/base.yaml

# Execute fast smoke test on synthetic data
python scripts/run_pipeline.py --config configs/smoke.yaml

# Execute an isolated pipeline phase
python scripts/run_pipeline.py --config configs/base.yaml --phase <phase_name>
```

**Supported Pipeline Phases (in execution order):**
1. `data`: Ingests and audits raw groundwater telemetry and station meteorology.
2. `features`: Projects coordinates to UTM EPSG:32643, executes spatial IDW mapping, and creates `spatiotemporal_grid.npz`.
3. `splits`: Generates 25-km mutually exclusive spatial blocks and temporal partition manifests.
4. `baselines`: Trains and evaluates benchmark regressors (Ridge, RF, XGBoost, Contemporaneous IDW, Naive).
5. `imputer`: Trains the DeepMVI bidirectional GRU and generates 20 stochastic reconstruction realizations.
6. `teacher`: Executes $K=5$ spatially blocked cross-fitting of the Teacher GNN and exports `teacher_oof.parquet`.
7. `student`: Trains the lightweight Student GNN via joint distillation loss with 20% pseudo-query masking.
8. `calibration`: Calibrates 90% prediction intervals using split-conformal inference on $2024\text{H2}$.
9. `eval`: Evaluates multi-horizon lead times ($h \in \{1, 3, 6\}$), multi-seed runs, and ablations; generates all tables and figures.
10. `paper`: Triggers automatic compilation of the publication research manuscript.

---

### 2. Synthetic Test Generator: `make_synthetic.py`
Synthesizes realistic spatiotemporal groundwater records and meteorological forcings for fast integration and smoke testing without requiring the full 1.14 GB raw telemetry archive:
```bash
python scripts/make_synthetic.py --n_wells 20
```

---

### 3. Canonical Dataset Builder: `build_merged_dataset.py`
Constructs the unified $99,480$-row canonical dataset (`merged_dataset.csv` / `all_data_combined.csv`):
- Combines 1,658 monitoring borewells across 60 calendar months (2021-01 to 2025-12).
- Merges ground-truth groundwater levels, observation masks, and DeepMVI imputations.
- Integrates IDW-interpolated precipitation, temperature, and antecedent accumulation windows (3, 6, 12 months).
- Appends 25-km spatial grid cell identifiers (`cell_id`), coordinates, district, basin, and split indicators.
```bash
python scripts/build_merged_dataset.py
```

---

### 4. Adversarial Artifact Auditor: `audit_artifacts.py`
Performs programmatic verification of experimental integrity:
- Verifies that every table, figure, model weight checkpoint, and Parquet archive referenced in the publication exists.
- Enforces strict non-emptiness, column schema conformity, and zero unresolved NaNs in key metric fields.
- Guards against hardcoded placeholders or fabricated metrics.
```bash
python scripts/audit_artifacts.py
```

---

### 5. Research Paper Compiler: `compile_paper.py`
Generates the publication-grade scientific manuscript (`paper/main.pdf`) using ReportLab:
- Renders Elsevier/AGU-styled layout with title, structured abstract, key points, numbered equations, booktabs tables, and embedded 300 DPI figures.
```bash
python scripts/compile_paper.py
```

---

### 6. Benchmark Comparison Report Compiler: `compile_comparison_report.py`
Generates the comparative technical report (`paper/comparison_report.pdf`):
- Rigorously benchmarks the proposed distilled graph framework against Naik et al. (2026).
- Analyzes inductive spatial generalization on ungauged aquifers, pseudo-query distillation advantages, and adaptive conformal uncertainty bounds.
```bash
python scripts/compile_comparison_report.py
```

---

### 7. Interactive Demo Exporter: `export_demo_data.py`
Extracts pre-computed tables, predictions, hydrographs, and spatial geo-coordinates into lightweight, offline JSON structures (`demo_app/public/data/`) powering the interactive web application.
```bash
python scripts/export_demo_data.py
```

---

### 8. Raw Ingestion & Meteorological Audits: `download_raw_data.py` & `audit_met.py`
- **`download_raw_data.py`**: Automated extraction from the National Water Informatics Centre (NWIC) DWLR portals and Indian Meteorological Department (IMD) archives.
- **`audit_met.py`**: Conducts spatiotemporal quality audits across 686 rainfall and 132 temperature stations, verifying station coverage and bounding erroneous spikes.

---

## Diagnostic & Inspection Utilities

| Script | Purpose |
| :--- | :--- |
| **`check_nwdp_api.py`** | Validates live API connectivity, authentication, and endpoint schemas for telemetry portals. |
| **`check_temporal_distribution.py`** | Audits observation density and missingness trajectories across study months (2021–2025). |
| **`inspect_gw_values.py`** | Analyzes depth-to-water distributions, identifying physical boundary violations ($< 0.1\,\text{m}$ or $> 100\,\text{m}$). |
| **`run_audit.py`** | Standalone runner for full dataset health audits and missingness reporting. |
| **`test_residual_student.py`** | Evaluates residual-skip connection variants for student GNN architectures. |
| **`test_stream_*.py`** | Evaluates real-time telemetry streaming and ingestion performance (`test_stream_gw.py`, `test_stream_gwd.py`, `test_stream_met.py`). |
