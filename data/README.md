# Data Directory: Spatiotemporal Groundwater Telemetry & Features

[![Data Format: Parquet & CSV](https://img.shields.io/badge/Data%20Format-Parquet%20%7C%20CSV%20%7C%20NPZ-blue.svg)]()
[![Data Sources](https://img.shields.io/badge/Sources-NWIC%20%7C%20IMD-brightgreen.svg)]()
[![Study Period](https://img.shields.io/badge/Coverage-2021--2025%20(60%20Months)-orange.svg)]()
[![Study Region](https://img.shields.io/badge/Region-Karnataka%2C%20India%20(1%2C658%20Wells)-informational.svg)]()

This directory houses the raw, intermediate, and processed datasets supporting the research publication:
> **"Spatiotemporal Groundwater Level Prediction Using Machine Learning for Location-Aware Aquifer Monitoring in Karnataka, India"**

The dataset encompasses multi-source environmental and hydrological telemetry collected over 60 calendar months (January 2021 to December 2025) across Karnataka, India, integrating automated Digital Water Level Recorder (DWLR) readings with high-resolution meteorological data.

---

## 1. Directory Structure and Data Inventory

The data pipeline is partitioned into three hierarchical tiers:

```
data/
├── raw/         # (Excluded from Git ~1.1 GB) Primary telemetry streams from NWIC and IMD
├── interim/     # Monthly aggregated Parquet partitions and smoke-test fixtures
└── processed/   # Analysis-ready spatiotemporal grids, tensors, and annotated well inventories
```

### 1.1 Raw Telemetry Stream (`raw/`)
*Note: Due to file size constraints (~1.1 GB total), raw source telemetry files are excluded from version control via `.gitignore`. They can be acquired via the reproduction script described in [Section 3](#3-data-reproduction-and-pipeline-workflow).*

| File Name | Description | Size | Records / Entities | Source Agency | Repository Status |
|---|---|---|---|---|---|
| [`gwl_karnataka_2021_2025.csv`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/raw/gwl_karnataka_2021_2025.csv) | Well metadata and monitoring station characteristics | 0.94 MB | 7,977 rows (36 WRD wells) | NWIC (WRD stream) | Excluded (`.gitignore`) |
| [`gwl_karnataka_gwd_2021_2025.csv`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/raw/gwl_karnataka_gwd_2021_2025.csv) | High-cadence raw groundwater depth telemetry records | 721.65 MB | 5,747,936 rows (1,658 wells) | NWIC (GWD stream) | Excluded (`.gitignore`) |
| [`rainfall_karnataka_2021_2025.csv`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/raw/rainfall_karnataka_2021_2025.csv) | Hourly precipitation telemetry across surface stations | 79.63 MB | 683,619 rows (686 stations) | IMD | Excluded (`.gitignore`) |
| [`temperature_karnataka_2021_2025.csv`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/raw/temperature_karnataka_2021_2025.csv) | Hourly surface air temperature telemetry | 281.37 MB | 2,415,543 rows (132 stations) | IMD | Excluded (`.gitignore`) |

### 1.2 Intermediate Processing Outputs (`interim/`)
*Included in the repository to enable rapid model training and pipeline execution without raw data downloads.*

| File Name | Description | Format | Scope / Dimension |
|---|---|---|---|
| [`groundwater_monthly.parquet`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/interim/groundwater_monthly.parquet) | Monthly aggregated water levels ($\ge 10$ operational days per month criterion) | Parquet | 59,065 valid observed well-months |
| [`rainfall_monthly.parquet`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/interim/rainfall_monthly.parquet) | Monthly aggregated precipitation by rain station | Parquet | 41,160 station-months |
| [`temperature_monthly.parquet`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/interim/temperature_monthly.parquet) | Monthly mean surface temperature by temperature station | Parquet | 7,920 station-months |
| [`wells_metadata.parquet`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/interim/wells_metadata.parquet) | Hydrological station metadata with verified geographic coordinates (EPSG:4326 / EPSG:32643) | Parquet | 1,658 monitoring wells |
| [`rain_stations.parquet`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/interim/rain_stations.parquet) | Spatial metadata and coordinates for rain gauge stations | Parquet | 686 stations |
| [`temp_stations.parquet`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/interim/temp_stations.parquet) | Spatial metadata and coordinates for temperature observation stations | Parquet | 132 stations |
| `SYNTHETIC_*.csv` | Fixture datasets for continuous integration and smoke tests: <br>• [`SYNTHETIC_groundwater.csv`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/interim/SYNTHETIC_groundwater.csv)<br>• [`SYNTHETIC_rainfall.csv`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/interim/SYNTHETIC_rainfall.csv)<br>• [`SYNTHETIC_rain_stations.csv`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/interim/SYNTHETIC_rain_stations.csv)<br>• [`SYNTHETIC_temperature.csv`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/interim/SYNTHETIC_temperature.csv)<br>• [`SYNTHETIC_wells.csv`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/interim/SYNTHETIC_wells.csv) | CSV | Stand-in test fixtures for automated pipeline validation |

### 1.3 Final Processed Datasets (`processed/`)
*Included in the repository for direct modeling, baseline benchmarking, and inference.*

| File Name | Format | Dimensions | Description |
|---|---|---|---|
| [`merged_dataset.csv`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/processed/merged_dataset.csv) | CSV | 99,480 rows $\times$ 32 columns | Full balanced spatiotemporal matrix ($N = 1{,}658$ wells $\times T = 60$ months) aligning monthly groundwater depths, meteorological covariates, lag features, and geological covariates. |
| [`spatiotemporal_grid.npz`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/processed/spatiotemporal_grid.npz) | Compressed NumPy Archive | Dynamic tensors $(N, T, D)$ | Pre-structured binary tensor representations structured for direct consumption by PyTorch / PyTorch Geometric graph recurrent models. |
| [`wells_annotated.parquet`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/processed/wells_annotated.parquet) | Parquet | 1,658 wells | Well spatial inventory enriched with lithological classes, hydrogeological basin identifiers, elevation, and 25-km spatial cross-validation fold IDs. |

---

## 2. Primary Data Sources and Provenance

1. **National Water Informatics Centre (NWIC), Ministry of Jal Shakti, Government of India**
   - Telemetry Stream: Digital Water Level Recorders (DWLRs) deployed under the National Hydrology Project (NHP).
   - Variables: Sub-surface groundwater level in metres below ground level ($m\text{ bgl}$).
   - Quality Controls: Sensor validation filter enforcing physical bounds $[0.1, 100.0]\text{ m}$, negative-datum conversion, and minimum temporal aggregation threshold ($\ge 10\text{ recorded days/month}$).

2. **India Meteorological Department (IMD)**
   - Telemetry Stream: Surface meteorological observation network.
   - Variables: Daily/hourly precipitation ($mm$) and ambient 2-meter air temperature ($^\circ\text{C}$).
   - Spatial Interpolation: Projected to monitoring well coordinates via Inverse Distance Weighting (IDW) power 2 over geodesic distances.

---

## 3. Data Reproduction and Pipeline Workflow

To reproduce the interim and processed datasets from the original raw telemetry archives:

```bash
# Step 1: Download raw telemetry streams (requires NWDP/IMD network access)
python scripts/download_raw_data.py

# Step 2: Ingest, audit, and aggregate raw telemetry into interim Parquet files
make data

# Step 3: Compute inverse distance weighting, construct spatial graph, and assemble features
make features
```

The resulting feature store produces [`data/processed/merged_dataset.csv`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/processed/merged_dataset.csv) and [`data/processed/spatiotemporal_grid.npz`](file:///c:/Users/srini/Desktop/SEM%20V/ML/ML%20PROJECT/ml/data/processed/spatiotemporal_grid.npz), fully formatted for teacher model pre-training, distillation, and conformal calibration.
