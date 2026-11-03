"""Build the canonical combined dataset CSV (merged_dataset.csv / all_data_combined.csv).

Combines:
- 1,658 monitoring wells across 60 calendar months (2021-01 to 2025-12)
- Monthly groundwater telemetry depths and observation masks
- Geodesic IDW-mapped monthly rainfall and temperature
- Trailing cumulative rainfall (3-month, 6-month, 12-month)
- Dynamic groundwater lag features (lag 1m, 2m, 3m, 6m, 12m) and delta trends
- 25-km spatial grid block cell IDs and partitions (train 64%, val 16%, test 20%)
- Temporal partition flags (initial_fit, val, calibration, test)
- Hydrogeological metadata: district, basin, UTM projected coordinates, core cohort flags
"""
import sys
import shutil
from pathlib import Path
import numpy as np
import pandas as pd

def build_merged_dataset():
    print("Loading preprocessed grid, manifests, and metadata...", flush=True)
    grid_path = Path("data/processed/spatiotemporal_grid.npz")
    manifest_path = Path("results/manifests/spatial_split_manifest.csv")
    interim_gw_path = Path("data/interim/groundwater_monthly.parquet")
    
    with np.load(grid_path) as loaded:
        grid = {k: loaded[k] for k in loaded.files}
        
    manifest = pd.read_csv(manifest_path)
    manifest_map = manifest.set_index('well_id').to_dict(orient='index')
    
    gw_interim = pd.read_parquet(interim_gw_path)
    gw_lookup = gw_interim.set_index(['station', 'year_month_str']).to_dict(orient='index')
    
    study_months = list(grid['study_months'])
    well_ids = list(grid['well_ids'])
    T = len(study_months)
    N = len(well_ids)
    
    gw_target = grid['gw_target']          # (60, 1658)
    gw_mask = grid['gw_observed_mask']      # (60, 1658)
    rainfall = grid['rainfall']            # (60, 1658)
    rainfall_3m = grid['rainfall_3m']      # (60, 1658)
    rainfall_6m = grid['rainfall_6m']      # (60, 1658)
    temperature = grid['temperature']      # (60, 1658)
    sin_month = grid['sin_month']          # (60, 1)
    cos_month = grid['cos_month']          # (60, 1)
    utm_x = grid['utm_x']                  # (1658,)
    utm_y = grid['utm_y']                  # (1658,)
    latitude = grid['latitude']            # (1658,)
    longitude = grid['longitude']          # (1658,)
    
    # Compute trailing 12-month cumulative rainfall
    rainfall_12m = np.zeros_like(rainfall)
    for t in range(T):
        start_t = max(0, t - 11)
        rainfall_12m[t] = np.sum(rainfall[start_t : t + 1], axis=0)
        
    print(f"Constructing tabular panel across {T} months and {N} wells ({T*N} total records)...", flush=True)
    records = []
    
    for t in range(T):
        ym = study_months[t]
        year = int(ym[:4])
        month = int(ym[5:7])
        
        # Temporal partition label
        if '2021-01' <= ym <= '2023-12':
            t_split = 'initial_fit'
        elif '2024-01' <= ym <= '2024-06':
            t_split = 'temporal_val'
        elif '2024-07' <= ym <= '2024-12':
            t_split = 'calibration'
        else:
            t_split = 'test'
            
        for i in range(N):
            wid = well_ids[i]
            meta = manifest_map.get(wid, {})
            gw_day_info = gw_lookup.get((wid, ym), {})
            
            is_obs = int(gw_mask[t, i])
            depth = float(gw_target[t, i]) if is_obs == 1 else np.nan
            
            # Dynamic groundwater lags (where observed, else NaN)
            lag_1m = float(gw_target[t-1, i]) if t >= 1 and gw_mask[t-1, i] == 1 else np.nan
            lag_2m = float(gw_target[t-2, i]) if t >= 2 and gw_mask[t-2, i] == 1 else np.nan
            lag_3m = float(gw_target[t-3, i]) if t >= 3 and gw_mask[t-3, i] == 1 else np.nan
            lag_6m = float(gw_target[t-6, i]) if t >= 6 and gw_mask[t-6, i] == 1 else np.nan
            lag_12m = float(gw_target[t-12, i]) if t >= 12 and gw_mask[t-12, i] == 1 else np.nan
            
            # Delta trends
            delta_1m = (lag_1m - lag_2m) if not (np.isnan(lag_1m) or np.isnan(lag_2m)) else np.nan
            delta_3m = (lag_1m - lag_3m) if not (np.isnan(lag_1m) or np.isnan(lag_3m)) else np.nan
            
            rec = {
                'station_id': wid,
                'year_month': ym,
                'year': year,
                'month': month,
                'latitude': round(float(latitude[i]), 6),
                'longitude': round(float(longitude[i]), 6),
                'utm_x': round(float(utm_x[i]), 2),
                'utm_y': round(float(utm_y[i]), 2),
                'district': meta.get('district', ''),
                'basin': meta.get('basin', ''),
                'cell_id': meta.get('cell_id', ''),
                'spatial_partition': meta.get('spatial_partition', ''),
                'temporal_split': t_split,
                'is_core_cohort': bool(meta.get('is_core_cohort', False)),
                'gwl_observed': is_obs,
                'depth_m_bgl': round(depth, 4) if not np.isnan(depth) else np.nan,
                'n_valid_days': gw_day_info.get('n_valid_days', np.nan),
                'depth_std_m': round(float(gw_day_info.get('depth_std', np.nan)), 4) if pd.notna(gw_day_info.get('depth_std')) else np.nan,
                'rainfall_mm': round(float(rainfall[t, i]), 2),
                'temp_c': round(float(temperature[t, i]), 2),
                'rain_cumul_3m_mm': round(float(rainfall_3m[t, i]), 2),
                'rain_cumul_6m_mm': round(float(rainfall_6m[t, i]), 2),
                'rain_cumul_12m_mm': round(float(rainfall_12m[t, i]), 2),
                'gwl_lag_1m': round(lag_1m, 4) if not np.isnan(lag_1m) else np.nan,
                'gwl_lag_2m': round(lag_2m, 4) if not np.isnan(lag_2m) else np.nan,
                'gwl_lag_3m': round(lag_3m, 4) if not np.isnan(lag_3m) else np.nan,
                'gwl_lag_6m': round(lag_6m, 4) if not np.isnan(lag_6m) else np.nan,
                'gwl_lag_12m': round(lag_12m, 4) if not np.isnan(lag_12m) else np.nan,
                'gwl_delta_1m': round(delta_1m, 4) if not np.isnan(delta_1m) else np.nan,
                'gwl_delta_3m': round(delta_3m, 4) if not np.isnan(delta_3m) else np.nan,
                'month_sin': round(float(sin_month[t, 0]), 4),
                'month_cos': round(float(cos_month[t, 0]), 4)
            }
            records.append(rec)
            
    df = pd.DataFrame(records)
    print(f"DataFrame built: {df.shape[0]} rows, {df.shape[1]} columns.", flush=True)
    
    primary_out = Path("data/processed/merged_dataset.csv")
    print(f"Exporting to {primary_out}...", flush=True)
    df.to_csv(primary_out, index=False)
    
    # Destination locations for convenient sharing
    destinations = [
        Path("merged_dataset.csv"),
        Path("all_data_combined.csv"),
        Path("ml shared/merged_dataset.csv"),
        Path("ml shared/all_data_combined.csv"),
        Path("../merged_dataset.csv"),
        Path("../all_data_combined.csv")
    ]
    
    for dst in destinations:
        try:
            shutil.copyfile(primary_out, dst)
            sz_mb = dst.stat().st_size / (1024 * 1024)
            print(f"Copied -> {dst.resolve()} ({sz_mb:.2f} MB)", flush=True)
        except Exception as e:
            print(f"Could not copy to {dst}: {e}")
            
    print("\nDataset creation successfully completed!")

if __name__ == '__main__':
    build_merged_dataset()
