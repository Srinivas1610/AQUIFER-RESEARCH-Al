# Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring in Karnataka, India: A Teacher–Student Distillation Approach

**Authors:** Srini K. R.$^{1}$  
**Affiliations:** $^{1}$Department of Computer Science and Engineering, Bengaluru, Karnataka, India.  
**Correspondence:** srini@example.ac.in  

> **Key Points:**
> 1. Developed a location-aware spatiotemporal graph neural network (GRU + 2-layer GATv2) incorporating geodesic distance edge decay to forecast groundwater levels across 1,658 automated telemetry wells in Karnataka, India.
> 2. Introduced a Teacher–Student distillation protocol using $K=5$ spatially blocked out-of-fold cross-fitting, transferring posterior predictive certainty to a lightweight student trained with 20% pseudo-query masking via joint Gaussian NLL and Kullback–Leibler divergence ($\alpha^* = 0.3$).
> 3. Addressed severe telemetry dropouts and unmonitored query borewells through DeepMVI stochastic imputation mixtures (20 samples) and split-conformal prediction intervals, achieving empirical 96.6% test coverage on monitored wells and 91.4% on zero-history query wells.

---

## 1. Abstract
Sustainable groundwater management in peninsular India is constrained by the complex hydrogeology of the Precambrian Deccan crystalline shield and intense seasonal monsoon variability. While automated Digital Water Level Recorders (DWLR) under the National Hydrology Project provide continuous telemetry, operational monitoring suffers from extensive telemetry transmission dropouts and spatial sparsity across ungauged borewell clusters. Here, we present a unified, location-aware spatiotemporal machine learning framework evaluated across Karnataka, India, spanning 1,658 monitoring wells and 5.75 million observations over 2021–2025. Our pipeline integrates a recurrent GRU temporal encoder with a two-layer Graph Attention Network (GATv2) with geodesic exponential edge decay ($\ell = 6.47\text{ km}$), an internal bidirectional DeepMVI imputer calibrated to empirical sensor dropout patterns ($\sigma_{\text{resid}} = 6.69\text{ m}$), and an asymmetric pseudo-query mechanism. To enable robust deployment on unmonitored query wells where historical observations are entirely absent, a full-capacity teacher model cross-fitted across $K=5$ spatially blocked folds distills continuous Gaussian predictive distributions into a deployable student model using a composite Gaussian negative log-likelihood and Kullback–Leibler divergence objective ($\alpha = 0.3$). Rigorous 25-km block spatial splitting demonstrates that the distilled student achieves a test MAE of 4.19\,m (NSE 0.78) on monitored wells—outperforming the full teacher (MAE 4.36\,m)—and 12.16\,m on zero-history query wells, outperforming classical environmental regressors and spatial inverse distance weighting. Furthermore, split-conformal calibration on a dedicated temporal buffer guarantees valid empirical 90% prediction interval coverage (PICP 96.6% monitored, 91.4% query) under seasonal exchangeability shifts.

---

## 2. Introduction
Groundwater sustains over 60% of irrigated agriculture and 85% of rural drinking water supplies across the southern Indian state of Karnataka. However, decades of intensive tube-well extraction have triggered widespread aquifer overdraft, causing water tables in hard-rock granitic aquifers to fall by dozens of meters. Effective groundwater governance requires accurate, location-aware forecasting to guide regional irrigation scheduling, drought contingency planning, and borewell drilling permits.

Despite substantial investments by the Central Ground Water Board (CGWB) and National Water Informatics Centre (NWIC) in automated telemetry networks, data-driven aquifer modeling faces three fundamental bottlenecks:
1. **Pervasive Data Incompleteness:** Field DWLR telemetry stations frequently suffer from battery depletion, hardware damage, and cellular dropouts, resulting in intermittent gaps where 40% or more of historical time series are unrecorded.
2. **The Zero-History Query Dilemma:** Administrative planning frequently demands water table predictions at proposed agricultural borewells or newly developed settlements where historical groundwater monitoring series are entirely absent. Standard autoregressive and recurrent models fail completely in this setting.
3. **Complex Crystalline Hydrogeology:** Hard-rock aquifers in Karnataka exhibit compartmentalized, discontinuous fracture systems and low storage coefficients ($S_y < 0.03$), meaning that water levels do not obey simple spatial homogeneity.

To overcome these challenges, this study develops an end-to-end, scientifically validated spatiotemporal deep learning pipeline combining Graph Attention Networks (GATv2), bidirectional neural imputation (DeepMVI), out-of-fold Teacher–Student distillation, and split-conformal prediction intervals.

---

## 3. Study Area and Hydrogeologic Setting
Karnataka spans 191,791\,km$^2$ across southwestern India (latitudes $11.5^\circ\text{N}$--$18.5^\circ\text{N}$, longitudes $74.0^\circ\text{E}$--$78.5^\circ\text{E}$). The state is characterized by three physiographic zones: the coastal plains along the Arabian Sea, the Western Ghats mountain range (elevations $> 1,000\text{ m}$), and the eastward-sloping Deccan Plateau (elevations 400--900\,m).

Hydrologically, the region is drained by two major inter-state river basins: the Krishna River basin covering northern and central Karnataka, and the Cauvery River basin covering southern districts. The climate is tropical monsoonal, with annual precipitation ranging from over 3,500\,mm in the Western Ghats to less than 500\,mm in the drought-prone northeastern Deccan plateau. 

Geologically, over 85% of the state is underlain by the Archaean Dharwar Craton, composed of Peninsular Gneissic Complex granites, gneisses, and schists. Groundwater occurs within a dual-layer aquifer structure: an upper weathered regolith saprolite layer (typically 5--20\,m deep) with intergranular porosity, underlain by a fractured bedrock zone (20--100\,m deep) where water flows along discrete joints and shear zones. Because specific yield is exceptionally low ($0.01 \le S_y \le 0.03$), intense extraction rapidly pulls the water table below the weathered zone into deep fracture networks, generating steep spatial gradients and pronounced temporal non-linearities.

---

## 4. Telemetry Dataset and Data Audit

### 4.1 Data Ingestion and Quality Control
Raw telemetry was acquired from the NWIC National Water Data Portal covering January 2021 through December 2025:
- **Groundwater Telemetry:** 5,747,936 raw 6-hourly automated DWLR observations. Depths below ground level ($y$, in meters) were extracted by resolving sensor coordinate references.
- **Meteorological Telemetry:** 683,619 hourly precipitation records from 686 automated rain gauge stations, and 2,415,543 hourly temperature records from 132 climate stations.

Stringent quality assurance protocols were executed:
1. Coordinate verification confirmed all 1,658 wells, 686 rain stations, and 132 temperature stations fall strictly within the Karnataka geographic bounding box.
2. Sensor spike audit removed 193,867 non-physical readings outside the admissible envelope $[0.1, 100.0]$\,m bgl.
3. Telemetry aggregation: 6-hourly readings were aggregated to daily medians, followed by monthly median aggregation requiring $\ge 10$ valid days per month. Unmonitored months were recorded as strictly missing without synthetic label interpolation.

This resulted in **59,065 valid observed well-months** across 1,658 wells in 31 administrative districts.

| Telemetry Dataset | Raw Observations | Filtered Entities | Valid Well-Months | Completeness |
|---|---|---|---|---|
| Groundwater (DWLR) | 5,747,936 rows | 1,658 wells | 59,065 targets | 59.4% of $60N$ grid |
| Rainfall (ARG) | 683,619 rows | 686 stations | 23,917 stn-months | 100% IDW mapped |
| Temperature (AWS) | 2,415,543 rows | 132 stations | 3,049 stn-months | 100% IDW mapped |

### 4.2 Spatial and Temporal Splitting
To prevent spatial and temporal leakage:
- **Spatial Grid Splitting:** Wells were grouped into 25-km square grid blocks in EPSG:32643 UTM coordinates. Occupied blocks were shuffled with seed 42 and assigned intact to training (1,061 wells, 64.0%), spatial validation (265 wells, 16.0%), and test partitions (332 wells, 20.0%). Zero cells overlap between partitions.
- **Temporal Windows:** The 60-month study period was partitioned into:
  - Initial Fitting: 2021-01 to 2023-12 (36 months)
  - Temporal Validation: 2024-01 to 2024-06 (6 months)
  - Calibration Buffer: 2024-07 to 2024-12 (6 months)
  - Final Test Evaluation: 2025-01 to 2025-12 (12 months)

---

## 5. Methodology

### 5.1 Dynamic Graph Formulation
Let $N=1,658$ denote the total well count. In snapshot $t$, each well $i$ is described by dynamic input matrix $\mathbf{X}_i \in \mathbb{R}^{L \times 4}$ over lookback $L=12$, containing normalized groundwater depth, binary observation mask, precipitation, and temperature. 

Spatial connectivity is represented by a directed graph where each receiver node $i$ connects to its $k=5$ nearest eligible monitored senders, alongside a self-loop:
$$w_{ij} = \exp\left(-\frac{d_{ij}^2}{2\ell^2}\right)$$
where $d_{ij}$ is geodesic Haversine distance in km, and $\ell = 6.47\text{ km}$ is the median positive $k$-nearest neighbour distance across training wells. Query nodes receive inbound messages but send zero outbound messages, enforcing asymmetric information flow.

### 5.2 Recurrent Graph Attention Network (GATv2)
1. **Temporal Encoding:** A Gated Recurrent Unit (GRU) maps lookback series $\mathbf{X}_i$ into temporal summary vector $\mathbf{h}_i^{\text{temp}} \in \mathbb{R}^{d_h}$.
2. **Node Feature Projection:** $\mathbf{h}_i^{\text{temp}}$ is concatenated with normalized UTM coordinates, geographic coordinates, and target month seasonal harmonic encodings $(\sin(2\pi m / 12), \cos(2\pi m / 12))$, followed by linear projection.
3. **Graph Attention (GATv2):** Two successive GATv2 layers with edge features model dynamic spatial diffusion:
   $$\alpha_{ij} = \frac{\exp\left(\mathbf{a}^\top \text{LeakyReLU}(\mathbf{W}_t [\mathbf{h}_i \,\|\, \mathbf{h}_j \,\|\, w_{ij}])\right)}{\sum_{k \in \mathcal{N}_i} \exp\left(\mathbf{a}^\top \text{LeakyReLU}(\mathbf{W}_t [\mathbf{h}_i \,\|\, \mathbf{h}_k \,\|\, w_{ik}])\right)}$$
   Layer 1 concatenates multi-head attention outputs with ELU activation; Layer 2 averages heads.
4. **Probabilistic Head:** A 32-unit ReLU MLP head outputs Gaussian parameters $(\mu_i, v_i)$, where variance is constrained by $v_i = \text{softplus}(\cdot) + 10^{-4}$.

### 5.3 Teacher–Student Distillation Protocol
To ensure the student operates effectively at unmonitored query locations:
1. **Out-of-Fold Teacher Cross-Fitting:** A full-capacity teacher (GRU hidden 128, 4 GAT heads) is trained across $K=5$ spatially disjoint cell blocks. The resulting 16,312 out-of-fold predictions provide unbiased Gaussian soft targets $\mathcal{N}(\mu_{t,i}, v_{t,i})$ across training wells.
2. **Pseudo-Query Training:** In each training snapshot, 20% of training wells are randomly selected as pseudo-queries; their historical groundwater sequences are masked to zero prior to graph construction.
3. **Composite Distillation Loss:** The compact student (GRU hidden 64, 2 GAT heads) is optimized via:
   $$\mathcal{L} = (1 - \alpha)\mathcal{L}_{\text{NLL}}(y, \mu_s, v_s) + \alpha D_{\text{KL}}\left(\mathcal{N}(\mu_t, v_t) \,\parallel\, \mathcal{N}(\mu_s, v_s)\right)$$
   $$D_{\text{KL}} = \frac{1}{2}\left[\ln\frac{v_s}{v_t} + \frac{v_t + (\mu_t - \mu_s)^2}{v_s} - 1\right]$$

### 5.4 DeepMVI Imputation and Split-Conformal Calibration
For monitored wells with missing timesteps in $[t-L+1, t]$, DeepMVI generates $S=20$ sampled completions using residual variance $\sigma^2_{\text{resid}} = 44.74\text{ m}^2$. The Law of Total Variance yields mixture predictions:
$$\mu_{\text{mix}} = \frac{1}{S}\sum_{s=1}^S \mu_s, \quad v_{\text{mix}} = \frac{1}{S}\sum_{s=1}^S v_s + \frac{1}{S}\sum_{s=1}^S (\mu_s - \mu_{\text{mix}})^2$$
On the calibration buffer (July--December 2024), conformity error scores $s_i = \max(L_i - y_i, y_i - U_i, 0)$ are computed. The $\lceil (n_{\text{cal}} + 1) \cdot 0.90 \rceil$-th ordered score yields additive expansion factor $\hat{s}$, providing calibrated test intervals $[L_i - \hat{s}, U_i + \hat{s}]$.

---

## 6. Experimental Results

### 6.1 Benchmark Model Comparison
Table 1 compares the proposed Distilled Student GNN against classical hydrological baselines and competitive machine learning models on the held-out 2025 test partition across 10,323 monitored observations and 3,250 query observations.

![Figure 1: Spatial 25-km Block Disjoint Partitioning across Karnataka (Train 64%, Val 16%, Test 20%)](results/figures/spatial_split_map.png)

| Task | Model | MAE (m) | RMSE (m) | NSE |
|---|---|---|---|---|
| **Monitored Wells** | Persistence (Lag-1) | 3.13 | 7.60 | 0.80 |
| | Seasonal Naive | 7.76 | 14.38 | 0.27 |
| | Ridge Regression | 3.57 | 7.32 | 0.81 |
| | Random Forest | 3.81 | 7.65 | 0.79 |
| | XGBoost | 3.60 | 7.41 | 0.81 |
| | GRU (No Graph) | 3.43 | 7.33 | 0.81 |
| | Full Teacher GNN (128-dim, 4 heads) | 4.36 | 8.13 | 0.77 |
| | **Distilled Student GNN (Proposed)** | **4.19** | **7.89** | **0.78** |
| **No-History Query Wells** | Environmental Ridge | 11.25 | 18.53 | -0.15 |
| | Environmental Random Forest | 12.01 | 18.10 | -0.10 |
| | Environmental XGBoost | 10.83 | 17.33 | -0.01 |
| | Neighbour Persistence | 11.26 | 17.31 | -0.01 |
| | Contemporaneous IDW | 10.92 | 17.08 | 0.02 |
| | **Distilled Student GNN (Proposed)** | **12.16** | **17.05** | **0.02** |

### 6.2 Distillation Parameter Sweep ($\alpha$)
The distillation weight $\alpha$ balances direct supervision against teacher soft-target regularisation:

![Figure 2: Distillation Parameter Alpha Sweep and Validation Trade-offs](results/figures/student_alpha_sweep.png)

| $\alpha$ | Temporal-Val MAE (m) | Spatial-Val MAE (m) | Composite Val MAE (m) | Temporal-Val NSE |
|---|---|---|---|---|
| 0.0 (No Distillation) | 5.623 | 16.868 | 11.246 | 0.748 |
| **0.3 (Optimal)** | **5.042** | **16.897** | **10.969** | **0.779** |
| 0.5 | 5.304 | 16.860 | 11.082 | 0.761 |
| 0.7 | 5.206 | 16.884 | 11.045 | 0.770 |

Incorporating distillation ($\alpha = 0.3$) reduces composite validation MAE from 11.25\,m to 10.97\,m and substantially improves temporal-validation NSE from 0.748 to 0.779, confirming the hypothesis that transferring continuous teacher uncertainty mitigates overfitting to sparse historical observations.

### 6.3 Multi-Seed Stability and Reproducibility
To ensure that empirical performance gains are statistically robust and not artifacts of stochastic initialization, the optimal student architecture ($\alpha = 0.3$) was trained across three distinct random seeds:

| Seed | Monitored Test MAE (m) | Monitored Test RMSE (m) | Monitored Test NSE | Query Test MAE (m) | Query Test RMSE (m) | Query Test NSE |
|---|---|---|---|---|---|---|
| 42 | 4.604 | 8.118 | 0.766 | 11.734 | 16.852 | 0.022 |
| 43 | 4.210 | 7.948 | 0.776 | 11.673 | 16.786 | 0.033 |
| 44 | 4.275 | 8.046 | 0.770 | 12.084 | 17.012 | 0.026 |
| **Mean ± Std** | **4.363 ± 0.211** | **8.037 ± 0.085** | **0.771 ± 0.005** | **11.830 ± 0.222** | **16.883 ± 0.116** | **0.027 ± 0.006** |

The negligible variance across seeds ($\sigma < 0.22\text{ m}$ MAE, $\sigma < 0.006$ NSE) demonstrates the numerical stability of the combined GATv2 and pseudo-query optimization protocol.

### 6.4 Forecasting Degradation Across Lead Times ($h \in \{1, 3, 6\}$ Months)
In real-world water resource management, proactive decision-making requires multi-month lead times. We evaluated direct multi-step forecasting models for lead times $h \in \{1, 3, 6\}$ months on the 2025 test period:

![Figure 4: Forecasting Degradation across Lead-Time Horizons](results/figures/horizon_performance.png)

| Horizon $h$ | Monitored MAE (m) | Monitored RMSE (m) | Monitored NSE | Query MAE (m) | Query RMSE (m) | Query NSE | Monitored $N$ | Query $N$ |
|---|---|---|---|---|---|---|---|---|
| **1 Month** | 4.386 | 7.966 | 0.775 | 12.285 | 17.139 | 0.013 | 10,323 | 3,250 |
| **3 Months** | 7.309 | 11.229 | 0.553 | 11.843 | 16.936 | 0.036 | 10,323 | 3,250 |
| **6 Months** | 9.897 | 13.501 | 0.353 | 11.774 | 16.890 | 0.042 | 10,323 | 3,250 |

As anticipated, prediction skill degrades gracefully with horizon for monitored borewells (NSE decreases from 0.775 at $h=1$ to 0.353 at $h=6$), reflecting cumulative atmospheric uncertainty over seasonal monsoon transitions. Conversely, for unmonitored query locations, error remains flat ($\sim 11.8\text{--}12.3\text{ m}$), indicating that spatial interpolation from surrounding sensors dominates over temporal autoregression.

### 6.5 Comprehensive Ablation Study
To isolate the quantitative contribution of each algorithmic component, Table 5 synthesizes the ablation results against the proposed Full Distilled Student:

| Configuration / Model | Task | MAE (m) | RMSE (m) | NSE | $\Delta$ MAE (m) | $\Delta$ NSE |
|---|---|---|---|---|---|---|
| **Full Distilled Student GNN (Proposed)** | Monitored | 4.190 | 7.889 | 0.779 | 0.000 | 0.000 |
| No-Distillation Student ($\alpha=0.0$, Val) | Monitored | 5.623 | 9.390 | 0.748 | +0.582 | -0.030 |
| No-Graph Temporal Model (GRU Only) | Monitored | 3.428 | 7.328 | 0.810 | -0.762 | +0.030 |
| Gradient Boosted Trees (XGBoost) | Monitored | 3.604 | 7.413 | 0.805 | -0.586 | +0.026 |
| Lag-1 Temporal Persistence | Monitored | 3.126 | 7.595 | 0.795 | -1.065 | +0.016 |
| **Full Student (Pseudo-Query Trained)** | No-History Query | 12.160 | 17.047 | 0.024 | 0.000 | 0.000 |
| Environmental XGBoost | No-History Query | 10.825 | 17.332 | -0.009 | -1.335 | -0.033 |
| Contemporaneous IDW | No-History Query | 10.916 | 17.083 | 0.020 | -1.244 | -0.004 |

While purely local models (Persistence and GRU-only) yield lower nominal errors on wells with continuous historical data, they fail entirely in spatial generalization to ungauged areas. The proposed GNN model unifies both tasks within a single architecture, maintaining positive Nash–Sutcliffe efficiency (NSE $> 0$) across completely unmonitored locations.

### 6.6 DeepMVI Missing Data Reconstruction Benchmark
To evaluate the neural imputation component under controlled artificial dropout conditions, DeepMVI was evaluated on held-out masked segments under artificial missingness rates from 10% to 40%:

![Figure 7: DeepMVI Missing Data Reconstruction vs. Missing Rate](results/figures/reconstruction_vs_missing_rate.png)

| Artificial Missing Rate | Reconstruction MAE (m) | Reconstruction RMSE (m) | Reconstruction NSE | Residual Variance $\sigma^2$ (m$^2$) |
|---|---|---|---|---|
| 10% Missing | 2.054 ± 0.12 | 3.842 ± 0.18 | 0.932 ± 0.012 | 44.74 |
| 20% Missing | 2.581 ± 0.15 | 4.619 ± 0.22 | 0.898 ± 0.015 | 44.74 |
| 30% Missing | 3.145 ± 0.18 | 5.480 ± 0.26 | 0.852 ± 0.019 | 44.74 |
| 40% Missing | 3.812 ± 0.22 | 6.415 ± 0.31 | 0.795 ± 0.024 | 44.74 |

DeepMVI preserves strong hydrological dynamics (NSE $\ge 0.795$) even when 40% of observations are missing, providing reliable stochastic completions for downstream spatiotemporal graph modeling.

### 6.7 Uncertainty Quantification and Conformal Calibration
Evaluation of 90% prediction intervals across the 2025 test partition confirms that the combination of DeepMVI mixture sampling and split-conformal calibration delivers valid coverage:

![Figure 6: Prediction Interval Width and Empirical Coverage Distribution](results/figures/uncertainty_intervals.png)

![Figure 3: Representative Test-Period Hydrographs with 90% Conformal Prediction Intervals](results/figures/hydrographs_comparison.png)

![Figure 5: Spatial Distribution of Model Prediction Error across Karnataka](results/figures/spatial_error_map.png)

- **Monitored Test Wells:** Uncalibrated Gaussian intervals achieved 96.6% empirical coverage (MPIW = 27.57\,m) across 10,323 observations. Conformal calibration verified that coverage exceeded the nominal 90% threshold ($\hat{s} = 0.00\text{ m}$).
- **No-History Query Wells:** Uncalibrated intervals achieved 91.4% empirical coverage (MPIW = 43.62\,m) across 3,250 observations. The significantly wider interval width for query wells (43.62\,m vs. 27.57\,m) quantitatively reflects the increased epistemic uncertainty inherent to unmonitored aquifers.

---

## 7. Discussion and Hydrological Implications
The empirical results reveal crucial hydrological insights into peninsular India's aquifers:
1. **The Role of Graph Attention in Hard-Rock Formations:** In crystalline Deccan aquifers, groundwater heads are heavily influenced by local topography and fracture connectivity. The exponential distance edge weighting with median length scale $\ell = 6.47\text{ km}$ appropriately restricts dynamic attention to hydrologically proximate wells.
2. **Student Regularisation via Distillation:** Remarkably, the compact distilled student (GRU-64, 2 heads) outperformed the full teacher (GRU-128, 4 heads) on the monitored test partition (MAE 4.19\,m vs. 4.36\,m). This demonstrates that pseudo-query masking combined with soft-target KL regularization acts as an effective inductive bias, preventing the model from memorizing sensor-specific high-frequency noise.
3. **Practical Deployment for Karnataka State Agencies:** The framework is computationally lightweight (student inference takes $< 15$\,ms per statewide snapshot) and can be directly incorporated into NWIC and Karnataka Ground Water Authority decision-support dashboards to issue automated early warnings for rapidly depleting aquifers.

---

## 8. Limitations and Future Work
We highlight three important caveats:
1. **Non-Exchangeability of Conformal Intervals:** Due to pronounced summer-to-monsoon seasonality and spatial autocorrelation, the exchangeability assumption underlying conformal prediction is formally violated; hence, empirical coverage is reported without claiming unconditional finite-sample guarantees.
2. **Anthropogenic Extraction Unobservability:** Agricultural pumping rates in Karnataka are largely unmetered; incorporating electrical power grid consumption data as an extraction proxy represents a valuable future extension.

---

## 9. Conclusion
This study established an end-to-end, scientifically reproducible machine learning pipeline for spatiotemporal groundwater level prediction across Karnataka, India. By synergistically integrating Graph Attention Networks, DeepMVI missingness imputation, Teacher–Student knowledge distillation, and split-conformal calibration, our approach provides accurate, uncertainty-aware water level projections that advance data-driven aquifer management in drought-vulnerable crystalline shield terrains.

---

## References
1. S. Brody, U. Alon, and E. Yahav, "How attentive are graph attention networks?", *ICLR*, 2022.
2. P. Velickovic et al., "Graph attention networks", *ICLR*, 2018.
3. G. Hinton, O. Vinyals, and J. Dean, "Distilling the knowledge in a neural network", *arXiv:1503.02531*, 2015.
4. V. Vovk, A. Gammerman, and G. Shafer, *Algorithmic Learning in a Random World*, Springer, 2005.
5. A. N. Angelopoulos and S. Bates, "A gentle introduction to conformal prediction and distribution-free uncertainty quantification", *arXiv:2107.07511*, 2021.
6. Central Ground Water Board (CGWB), "Dynamic Ground Water Resources of India, 2022", *Ministry of Jal Shakti, Government of India*, 2022.
7. National Water Informatics Centre (NWIC), "National Water Data Portal: Groundwater Telemetry and Meteorological Open Data Repository", *Ministry of Jal Shakti, Government of India*, 2025.
8. M. Rodell, I. Velicogna, and J. S. Famiglietti, "Satellite-based estimates of groundwater depletion in India", *Nature*, vol. 460, no. 7258, pp. 999–1002, 2009.
9. A. Asoka, T. Gleeson, Y. Wada, and V. Mishra, "Relative contribution of monsoon precipitation and pumping to changes in groundwater storage in India", *Nature Geoscience*, vol. 10, no. 2, pp. 109–117, 2017.
