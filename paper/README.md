# Scientific Manuscript & Comparative Benchmark

[![Manuscript: IEEEtran](https://img.shields.io/badge/Manuscript-IEEEtran%20(12%20pp)-blue.svg)]()
[![Benchmark: Comparative](https://img.shields.io/badge/Benchmark-Naik%20et%20al.%20(2024)-purple.svg)]()
[![Status: Under Review](https://img.shields.io/badge/Status-Under%20Review-success.svg)]()
[![Reproducibility: LaTeX](https://img.shields.io/badge/Build-pdflatex%20%7C%20bibtex-brightgreen.svg)]()

This directory contains the manuscript source files, compiled publication PDFs, bibliographic records, and comparative benchmark analyses for the study:
> **"Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring in Karnataka, India: A Teacher–Student Distillation Approach"**

---

## 1. Directory Inventory

| File Name | Format | Pages / Scope | Description |
|---|---|---|---|
| [`main.tex`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/paper/main.tex) | LaTeX (`IEEEtran`) | 12 pages | Complete LaTeX source code for the 12-page journal manuscript, including formal mathematical derivations, architecture schematics, ablation studies, and empirical benchmark tables. |
| [`main.pdf`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/paper/main.pdf) | PDF | 12 pages | Compiled publication-ready manuscript (also mirrored at the project root as [`1_RESEARCH_PAPER_main.pdf`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/1_RESEARCH_PAPER_main.pdf)). |
| [`references.bib`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/paper/references.bib) | BibTeX | 123 entries | Comprehensive bibliographic database covering hydrogeology, graph neural networks, knowledge distillation, and distribution-free conformal inference. |
| [`COMPARATIVE_BENCHMARK_REPORT.pdf`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/paper/COMPARATIVE_BENCHMARK_REPORT.pdf) | PDF | 5 pages | Rigorous comparative technical benchmark contrasting this framework with the state-of-the-art regional baseline established by Naik et al. (2024). |
| [`PAPER.md`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/paper/PAPER.md) | Markdown | Working Outline | Extended preprint draft, paper outline, section-by-section narratives, and mathematical working notes. |

---

## 2. Methodological Scope Documented in the Paper

The manuscript details an end-to-end spatiotemporal machine learning framework evaluated across **1,658 automated monitoring wells** and **5.75 million observations** spanning 2021–2025 across all 31 districts of Karnataka:

1. **Recurrent Graph Attention Network (GATv2) Teacher:**
   - Combines a temporal GRU encoder with a 2-layer dynamic Graph Attention Network (GATv2).
   - Incorporates geodesic exponential edge decay with characteristic length scale $\ell = 6.47\text{ km}$ to capture fractured crystalline aquifer heterogeneity.
2. **DeepMVI Stochastic Imputation Mixture:**
   - Employs a bidirectional GRU imputer calibrated to internal telemetry dropout distributions ($\sigma_{\text{resid}} = 6.69\text{ m}$).
   - Draws 20 Monte Carlo realizations at inference to prevent look-ahead bias and capture aleatoric missingness uncertainty.
3. **Privileged Teacher–Student Knowledge Distillation:**
   - The full-capacity teacher is cross-fitted across $K=5$ spatially blocked folds inside the training partition, yielding 16,312 out-of-fold soft predictive targets.
   - Distills continuous Gaussian predictive distributions into a deployable student model trained with 20% random historical masking (pseudo-queries) under a composite loss ($\alpha^* = 0.3$ KL divergence + $0.7$ Gaussian NLL).
4. **Split-Conformal Prediction Calibration:**
   - Calibrated against a dedicated temporal buffer (July–December 2024).
   - Yields valid 90% empirical prediction interval coverage under non-stationary monsoon shifts without requiring unconditional exchangeability.
5. **Leakage-Free Spatiotemporal Partitioning:**
   - 25-km spatial grid blocking (64% train, 16% validation, 20% spatial holdout) prevents spatial autocorrelation leakage across all baselines and proposed architectures.

---

## 3. Comparative Benchmark Summary (vs. Naik et al., 2024)

[`COMPARATIVE_BENCHMARK_REPORT.pdf`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/paper/COMPARATIVE_BENCHMARK_REPORT.pdf) contrasts the empirical performance and deployment viability of this framework against Naik et al. (2024) (*Groundwater Level Prediction Using Machine Learning Algorithms in a Drought-Prone Area*):

| Evaluation Dimension | Naik et al. (2024) Baseline | Proposed Framework (Distilled Student) |
|---|---|---|
| **Spatial Scope** | Localized / single basin | Statewide (1,658 wells, 31 Karnataka districts) |
| **Spatial Leakage Control** | Standard random train/test split | 25-km disjoint spatial grid blocking |
| **Handling of Missing Records** | Mean imputation / row omission | Bidirectional DeepMVI (20-sample mixture) |
| **Unmonitored / Query Wells** | Inapplicable (requires full historical series) | Location-aware pseudo-query distillation |
| **Uncertainty Quantification** | Point estimates only | Split-conformal calibration (90% target) |
| **Monitored Wells Performance** | Regional baseline | **MAE = 4.19 m, RMSE = 7.89 m, NSE = 0.78** |
| **Zero-History Query Performance** | $N/A$ | **MAE = 11.73 m, NSE = 0.02** |

---

## 4. Manuscript Compilation Instructions

To compile the LaTeX manuscript from source, ensure a modern TeX distribution (`TeX Live`, `MacTeX`, or `MiKTeX`) with `IEEEtran` is installed:

```bash
# Clean compilation pipeline using latexmk
latexmk -pdf -synctex=1 main.tex

# Alternatively, manual multi-pass compilation:
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

The output PDF will be rendered at [`main.pdf`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/paper/main.pdf).
