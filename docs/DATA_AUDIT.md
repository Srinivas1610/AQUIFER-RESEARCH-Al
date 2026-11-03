# Data Audit and Ingestion Report: Karnataka Spatiotemporal Groundwater Telemetry

**Study Area:** Karnataka, India  
**Temporal Window:** January 2021 – December 2025 (60 calendar months, Asia/Kolkata)  
**Primary Target:** Groundwater depth in metres below ground level ($m\text{ bgl}$)  
**Source Platform:** National Water Data Portal (NWDP), National Water Informatics Centre (NWIC), Ministry of Jal Shakti, Government of India.

---

## 1. Executive Summary & Raw Inventory

Four primary telemetry datasets were retrieved directly from the NWDP CKAN server:

| Dataset | Raw File Name | Cadence | Raw Records | Unique Entities | Entities with Valid Coords | Valid Observed Target Months | Units |
|---|---|---|---|---|---|---|---|
| **Groundwater Telemetry (GWD)** | `gwl_karnataka_gwd_2021_2025.csv` | 6-hourly | 5,747,936 | 1,798 | 1,658 | 59,065 | $m\text{ bgl}$ |
| **Groundwater Telemetry (WRD)** | `gwl_karnataka_2021_2025.csv` | 6-hourly | 7,977 | 36 | 36 | 365 | $m\text{ bgl}$ |
| **Rainfall Telemetry** | `rainfall_karnataka_2021_2025.csv` | Hourly | 683,619 | 686 | 686 | 41,160 | $mm$ |
| **Temperature Telemetry** | `temperature_karnataka_2021_2025.csv` | Hourly | 2,415,543 | 132 | 132 | 7,920 | $^\circ\text{C}$ |
| **Consolidated Target Grid** | Derived monthly | Monthly ($\ge 10\text{ days}$) | 1,322,841 | 1,658 | 1,658 | 59,065 | $m\text{ bgl}$ |

*Traceable artifact:* [`results/tables/data_inventory.csv`](file:///results/tables/data_inventory.csv)

---

## 2. Spatial and Coordinate Verification

- **Geographic Bounding Box:** Karnataka boundaries span Latitude $11.5^\circ\text{N}$ to $18.6^\circ\text{N}$ and Longitude $74.0^\circ\text{E}$ to $78.6^\circ\text{E}$.
- **Groundwater Wells (GWD):**
  - Out of 1,798 raw station IDs, 1,659 stations provided coordinate entries.
  - One typo was identified where a decimal separator was missing in longitude (`77368889.0` $\to$ `77.368889`), which was corrected deterministically.
  - After coordinate sanitation, **1,658 unique wells** fell strictly within Karnataka's geographic boundary across all 31 administrative districts.
  - 140 stations with missing, null, or zero coordinates (`-` or `None`) were excluded from spatial graph modelling due to inability to position them in EPSG:32643 or calculate geodesic edges.
- **Meteorological Stations:**
  - **686 rainfall stations** with verified coordinates across 32 administrative divisions.
  - **132 temperature stations** with verified coordinates across Karnataka.

---

## 3. Telemetry Units, Sensor Errors, and Reference Datums

### Measurement Reference
- In the GWD telemetry stream, Digital Water Level Recorders (DWLRs) record depth below the surface reference datum ($z=0$) as negative elevations (e.g., $-9.066\text{ m}$, $-21.24\text{ m}$). 
- 91.2% ($5,240,193$ raw records) were negative.
- Per Section B of the methodology:
  $$\text{Depth } (m\text{ bgl}) = -y \quad \text{if } y < 0, \quad \text{else } y$$
  Smaller depth indicates shallower groundwater (closer to the surface).

### Sensor Error Spikes & Documented Exclusions
- Raw data exhibited extreme non-physical spikes:
  - Minimum raw reading: $-1,561,912,100.0\text{ m}$
  - Maximum raw reading: $+9,505,536.0\text{ m}$
  - Telemetric pressure transducers frequently emit atmospheric pressure values in millibars (e.g., $950\text{--}965\text{ hPa}$) or disconnected error codes ($-9999$).
- **Filtering Rule:** Physical groundwater depths in Karnataka crystalline aquifers and alluvial zones range from waterlogging ($0.1\text{ m bgl}$) to deep weathered borewells ($80\text{--}100\text{ m bgl}$). Readings outside $[0.1\text{ m}, 100.0\text{ m}]$ were flagged as non-physical sensor errors and removed:
  - Excluded sensor error rows: **193,867 (3.4%)**
  - Retained valid physical telemetry records: **5,554,069 (96.6%)**

---

## 4. Deduplication Decisions

- Station IDs between `gwl_karnataka_2021_2025.csv` (WRD canal distributory network, 36 stations) and `gwl_karnataka_gwd_2021_2025.csv` (Ground Water Department state piezometers, 1,798 stations) were cross-referenced.
- Overlap between station names and physical coordinates was exactly **0**.
- Therefore, no records were conflated or arbitrarily dropped; each network preserves its verified physical identities.

---

## 5. Aggregation & Missingness Policy (Section B Steps 1–5)

1. **Daily Medians:** 6-hourly telemetry was aggregated to daily medians per canonical station, yielding **1,322,841 valid station-days** for stations with verified coordinates.
2. **Monthly Medians ($\ge 10\text{ valid days}$ threshold):**
   - Each canonical well-month requires at least 10 valid observation days in that calendar month.
   - Months with $< 10$ valid days are marked as unobserved/missing.
   - Sparse seasonal measurements are never interpolated into measured labels.
3. **Observed Targets ($y$):**
   - Total observed well-months in 2021–2025: **59,065 targets**.
   - Active wells with $\ge 1$ observed month: **1,631 wells**.

### Theoretical Grid ($60N$) vs Measured Sample Count
- For all $N=1,658$ wells, the theoretical full matrix size across 60 months is $60 \times 1,658 = 99,480$ well-months.
- Observed targets: $59,065$ ($59.4\%$).
- Missing targets: $40,415$ ($40.6\%$).
- Imputed values are **never** counted as measured samples and **never** receive an observed-target mask ($o_{i,t} = 0$).

---

## 6. Cohort Definition & Usable Windows per Partition

### Core Training Cohort ($\ge 70\%$ Coverage in 2021–2023)
- Evaluated over the 36-month initial period (Jan 2021 – Dec 2023):
  - Threshold: $\ge 0.70 \times 36 = 25.2 \implies \ge 26$ valid monthly targets.
  - **Core cohort size: 260 canonical wells**.
  - **Sparse monitoring cohort: 1,398 wells** (analysed separately per Section B).

### Chronological Partition Breakdown (Table 2)

| Stage | Period | Months | All Wells Targets | Active Wells (All) | Core Cohort Targets | Active Wells (Core) | Max Windows ($L=12, h=1$) |
|---|---|---|---|---|---|---|---|
| **Initial Fit (Train)** | 2021-01 to 2023-12 | 36 | 26,117 | 1,547 | 6,991 | 260 | 24 |
| **Validation / Tuning** | 2024-01 to 2024-06 | 6 | 8,497 | 1,496 | 1,524 | 259 | 6 |
| **Refit Window** | 2021-01 to 2024-06 | 42 | 34,614 | 1,589 | 8,515 | 260 | 30 |
| **Calibration** | 2024-07 to 2024-12 | 6 | 8,495 | 1,523 | 1,464 | 254 | 6 |
| **Final Test** | 2025-01 to 2025-12 | 12 | 15,956 | 1,530 | 2,799 | 255 | 12 |
| **Total** | **2021-01 to 2025-12** | **60** | **59,065** | **1,631** | **12,778** | **260** | **48** |

In the core training cohort, coverage is remarkably high in the hold-out windows:
- Validation: $1,524 / (260 \times 6) = 97.7\%$
- Calibration: $1,464 / (260 \times 6) = 93.8\%$
- Final Test: $2,799 / (260 \times 12) = 89.7\%$

This fully satisfies the data requirements of the experimental protocol.
