"""Inverse Distance Weighting (IDW) and feature engineering module.

Implements Methodology Section B steps 3 & 5, and Section C:
- Geodesic pairwise distances using WGS-84 ellipsoid / Haversine.
- IDW with power 2 for up to 5 nearest available stations.
- Trailing 3-month and 6-month rainfall totals.
- Seasonal harmonic encodings (sin/cos of calendar month).
- Projected coordinates in EPSG:32643 (UTM Zone 43N).
- Strict separation of observed-target masks and input-hiding masks.
"""
from pathlib import Path
import numpy as np
import pandas as pd
from pyproj import Transformer

WGS84_TO_UTM43N = Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True)

def haversine_distance_matrix(lats1, lons1, lats2, lons2):
    """Compute pairwise great-circle distance in kilometers.
    
    lats1, lons1: shape (N1,)
    lats2, lons2: shape (N2,)
    Returns: shape (N1, N2) in km
    """
    R = 6371.0  # Earth radius in km
    phi1 = np.radians(lats1)[:, np.newaxis]
    phi2 = np.radians(lats2)[np.newaxis, :]
    delta_phi = np.radians(lats2[np.newaxis, :] - lats1[:, np.newaxis])
    delta_lambda = np.radians(lons2[np.newaxis, :] - lons1[:, np.newaxis])

    a = np.sin(delta_phi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2.0)**2
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return R * c

def compute_idw_weights(dist_matrix, k=5, power=2):
    """Compute IDW weights for k nearest stations with power 2.
    
    dist_matrix: (N_wells, N_stations) in km
    Returns: sparse indices and weights
    """
    n_wells, n_stations = dist_matrix.shape
    k = min(k, n_stations)
    
    # Find k nearest stations per well
    nearest_idx = np.argsort(dist_matrix, axis=1)[:, :k]
    nearest_dist = np.take_along_axis(dist_matrix, nearest_idx, axis=1)

    # Avoid division by zero for co-located stations (d < 1e-4 km = 10cm)
    eps = 1e-4
    is_colocated = nearest_dist < eps
    
    # Calculate inverse distance squared
    inv_dist_sq = 1.0 / np.maximum(nearest_dist, eps)**power
    # Where co-located, weight is 1.0 for the closest, 0 for others
    has_colocated = is_colocated.any(axis=1)
    
    weights = inv_dist_sq / inv_dist_sq.sum(axis=1, keepdims=True)
    for i in np.where(has_colocated)[0]:
        first_coloc = np.argmax(is_colocated[i])
        weights[i, :] = 0.0
        weights[i, first_coloc] = 1.0

    return nearest_idx, weights

def project_coordinates_utm(lats, lons):
    """Project WGS84 lat/lon to EPSG:32643 UTM coordinates in meters."""
    x, y = WGS84_TO_UTM43N.transform(lons, lats)
    return x, y

def build_dataset_features(interim_dir="data/interim", processed_dir="data/processed"):
    """Assemble complete spatiotemporal tabular features across all 60 months."""
    interim_dir = Path(interim_dir)
    processed_dir = Path(processed_dir)
    processed_dir.mkdir(parents=True, exist_ok=True)

    print("Loading interim artifacts...")
    wells_df = pd.read_parquet(interim_dir / "wells_metadata.parquet")
    gw_df = pd.read_parquet(interim_dir / "groundwater_monthly.parquet")
    rain_df = pd.read_parquet(interim_dir / "rainfall_monthly.parquet")
    rain_meta = pd.read_parquet(interim_dir / "rain_stations.parquet")
    temp_df = pd.read_parquet(interim_dir / "temperature_monthly.parquet")
    temp_meta = pd.read_parquet(interim_dir / "temp_stations.parquet")

    # Project well coordinates to EPSG:32643
    utm_x, utm_y = project_coordinates_utm(wells_df['latitude'].values, wells_df['longitude'].values)
    wells_df['utm_x'] = utm_x
    wells_df['utm_y'] = utm_y

    print(f"Wells: {len(wells_df):,}, Rain stations: {len(rain_meta):,}, Temp stations: {len(temp_meta):,}")

    # Build monthly time grid (60 months from 2021-01 to 2025-12)
    study_months = [str(m) for m in pd.period_range('2021-01', '2025-12', freq='M')]
    well_ids = wells_df['well_id'].tolist()
    well_id_to_idx = {w: i for i, w in enumerate(well_ids)}

    # Distance matrices
    print("Computing geodesic distance matrices...")
    dist_well_to_rain = haversine_distance_matrix(
        wells_df['latitude'].values, wells_df['longitude'].values,
        rain_meta['latitude'].values, rain_meta['longitude'].values
    )
    dist_well_to_temp = haversine_distance_matrix(
        wells_df['latitude'].values, wells_df['longitude'].values,
        temp_meta['latitude'].values, temp_meta['longitude'].values
    )

    rain_stn_ids = rain_meta['station'].tolist()
    temp_stn_ids = temp_meta['station'].tolist()
    rain_stn_to_col = {s: i for i, s in enumerate(rain_stn_ids)}
    temp_stn_to_col = {s: i for i, s in enumerate(temp_stn_ids)}

    # Pivot station monthly values into (month x station) arrays
    print("Pivoting station series...")
    rain_pivot = rain_df.pivot(index='year_month_str', columns='station', values='rain_mm').reindex(
        index=study_months, columns=rain_stn_ids
    ).fillna(0.0)

    temp_pivot = temp_df.pivot(index='year_month_str', columns='station', values='temp_c').reindex(
        index=study_months, columns=temp_stn_ids
    )
    # Fill missing station temperature with monthly median across active stations
    temp_month_median = temp_pivot.median(axis=1)
    temp_pivot = temp_pivot.apply(lambda col: col.fillna(temp_month_median), axis=0)

    # Perform IDW mapping for each month
    print("Interpolating monthly meteorology to well locations via IDW (k=5, power=2)...")
    rain_near_idx, rain_weights = compute_idw_weights(dist_well_to_rain, k=5, power=2)
    temp_near_idx, temp_weights = compute_idw_weights(dist_well_to_temp, k=5, power=2)

    # well_rain[t, i] = sum_k w_{i,k} * rain_pivot[t, rain_near_idx[i, k]]
    rain_vals = rain_pivot.values  # (T, N_rain)
    temp_vals = temp_pivot.values  # (T, N_temp)
    T = len(study_months)
    N = len(well_ids)

    well_rain = np.zeros((T, N), dtype=np.float32)
    well_temp = np.zeros((T, N), dtype=np.float32)

    for i in range(N):
        r_cols = rain_near_idx[i]
        r_w = rain_weights[i]
        well_rain[:, i] = np.dot(rain_vals[:, r_cols], r_w)

        t_cols = temp_near_idx[i]
        t_w = temp_weights[i]
        well_temp[:, i] = np.dot(temp_vals[:, t_cols], t_w)

    # Build groundwater target matrix (T x N)
    print("Building groundwater target matrix...")
    gw_target = np.full((T, N), np.nan, dtype=np.float32)
    gw_observed_mask = np.zeros((T, N), dtype=np.int8)

    for _, row in gw_df.iterrows():
        stn = row['station']
        ym = row['year_month_str']
        if stn in well_id_to_idx and ym in study_months:
            t_idx = study_months.index(ym)
            w_idx = well_id_to_idx[stn]
            gw_target[t_idx, w_idx] = float(row['depth_m_bgl'])
            gw_observed_mask[t_idx, w_idx] = 1

    print(f"Total target observations in matrix: {gw_observed_mask.sum():,} / {T * N:,}")

    # Build trailing 3-month and 6-month rainfall
    print("Computing trailing 3-month and 6-month rainfall totals...")
    rain_3m = np.zeros_like(well_rain)
    rain_6m = np.zeros_like(well_rain)
    for t in range(T):
        t_start_3 = max(0, t - 2)
        rain_3m[t] = well_rain[t_start_3 : t + 1].sum(axis=0)
        t_start_6 = max(0, t - 5)
        rain_6m[t] = well_rain[t_start_6 : t + 1].sum(axis=0)

    # Seasonal harmonic encodings (sin/cos of calendar month)
    cal_months = np.array([int(ym.split('-')[1]) for ym in study_months])
    sin_month = np.sin(2.0 * np.pi * cal_months / 12.0).astype(np.float32)[:, np.newaxis]
    cos_month = np.cos(2.0 * np.pi * cal_months / 12.0).astype(np.float32)[:, np.newaxis]

    # Save complete arrays to processed directory
    np.savez_compressed(
        processed_dir / "spatiotemporal_grid.npz",
        study_months=np.array(study_months),
        well_ids=np.array(well_ids),
        gw_target=gw_target,
        gw_observed_mask=gw_observed_mask,
        rainfall=well_rain,
        rainfall_3m=rain_3m,
        rainfall_6m=rain_6m,
        temperature=well_temp,
        sin_month=sin_month,
        cos_month=cos_month,
        utm_x=utm_x,
        utm_y=utm_y,
        latitude=wells_df['latitude'].values,
        longitude=wells_df['longitude'].values,
        is_core_cohort=wells_df['is_core_cohort'].values
    )
    wells_df.to_parquet(processed_dir / "wells_annotated.parquet", index=False)
    print(f"Saved complete grid to {processed_dir / 'spatiotemporal_grid.npz'}")
    return processed_dir / "spatiotemporal_grid.npz"

if __name__ == '__main__':
    build_dataset_features()
