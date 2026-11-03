# Methodological and Implementation Decisions Log

This document records all architectural choices, interpretations of ambiguities, and any necessary deviations from the proposed research methodology document (`docs/methodology.pdf`).

---

## Decision Log

### DEC-001: Separation of Rolling-Origin Sanity Checks vs. Official Chronological Plan
- **Context:** The methodology specifies rolling-origin development checks (fit $\le$ Dec 2022 $\to$ validate Jan–Jun 2023; fit $\le$ Jun 2023 $\to$ validate Jul–Dec 2023) and also provides Table 2 with an official chronological split (fit 2021–2023 $\to$ validation/tuning Jan–Jun 2024 $\to$ refit 2021–Jun 2024 $\to$ calibration Jul–Dec 2024 $\to$ test 2025).
- **Decision:** Rolling-origin folds are treated as pipeline validation and stability/dev sanity checks. Table 2 is adopted as the strict official experimental protocol for all model selection, hyperparameter tuning, conformal calibration, and final evaluation.
- **Rationale:** Table 2 provides a clean non-overlapping progression matching the full 2021–2025 study timeline, ensuring calibration and test sets remain completely untouched during hyperparameter tuning and model selection.
- **Impact:** Prevents any temporal snooping or leakage across evaluation phases.

---

### DEC-002: Tense Convention for Scientific Deliverables
- **Context:** The proposal document was authored in future tense ("will combine", "will be evaluated").
- **Decision:** All experimental documentation, audit reports, and the final manuscript (`paper/main.tex`) are written in standard academic past tense ("we combined", "was evaluated") reporting empirical findings.
- **Rationale:** Standard academic publication convention for executed research.
- **Impact:** Consistency with publication standards.

---

### DEC-003: DeepMVI Faithful Implementation & Sampling Protocol
- **Context:** DeepMVI (Bansal et al., 2021) uses an autoregressive / bidirectional multi-resolution architecture with artificial isolated and block masks.
- **Decision:** Implement a faithful PyTorch-based DeepMVI module trained strictly on training-fold records with artificial isolated and block masks (1–3 months). For forecast inference, inputs are truncated at the forecast origin ($t \le \tau$) to prevent look-ahead. For retrospective gap reconstruction, bidirectional context ($t \ne \tau_{gap}$) is leveraged. Residual variance is calibrated using an internal 10% masked training subset. 20 stochastic realizations are drawn at inference.
- **Rationale:** Adheres strictly to Section C (Equations 4–5) and Section 6.
- **Impact:** Rigorous propagation of input imputation uncertainty without data leakage.

---

### DEC-004: Teacher–Student Distillation via Spatially Blocked OOF Cross-Fitting
- **Context:** Section 5 extends the proposal with a privileged-information Teacher–Student framework. If the teacher generates soft targets on its own training samples, the student risks distilling memorized residuals.
- **Decision:** Teacher soft targets on the training set are strictly generated via $K=5$ spatially blocked cross-fitting (cell-based, seed 42) inside the training partition. Each training well's soft targets $(\mu_T, v_T)$ are produced by a teacher model that never saw that well's targets during training. Soft targets are saved to `results/predictions/teacher_oof.parquet`.
- **Distillation Loss:**
  $$\mathcal{L}_{total} = (1 - \alpha) \cdot \mathcal{L}_{NLL}(S) + \alpha \cdot \text{KL}(\mathcal{N}(\mu_T, v_T) \parallel \mathcal{N}(\mu_S, v_S))$$
  evaluated exclusively at observed target locations by default.
- **Rationale:** Prevents label leakage and over-confidence transfer from memorization.

---

### DEC-005: Split-Conformal Calibration Guarantee Caveats
- **Context:** Section C specifies split-conformal-style interval expansion:
  $$s_j = \max(L_j - y_j, y_j - U_j, 0), \quad \hat{q} = \text{Score}_{\lceil (n_{cal}+1) \cdot 0.90 \rceil}$$
- **Decision:** In accordance with Auer et al. (2024), we explicitly state in all reports and the paper that empirical coverage is evaluated without claiming unconditional finite-sample coverage guarantees, because spatiotemporal groundwater dynamics violate strict exchangeability.
- **Impact:** Transparent, scientifically defensible uncertainty quantification.

---

### DEC-006: Data Source Verification and Missingness Ingestion Rule
- **Context:** Karnataka telemetry and meteorological records from NWIC / Karnataka Ground Water Department.
- **Decision:** Telemetry is aggregated into daily medians then monthly medians. A month requires $\ge 10$ valid daily measurements; otherwise it is marked missing (no seasonal interpolation). Core training cohort requires $\ge 70\%$ valid monthly targets during 2021–2023.
- **Impact:** Preserves genuine sensor observations and prevents synthetic label pollution.
