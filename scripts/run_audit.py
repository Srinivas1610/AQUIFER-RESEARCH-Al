"""Data audit script for Karnataka groundwater, rainfall, and temperature telemetry.
Generates data_inventory.csv and provides detailed diagnostic statistics for docs/DATA_AUDIT.md.
"""
import sys
import gc
from pathlib import Path
import numpy as np
import pandas as pd

def audit_gw_datasets():
    print("=" * 60)
    print("AUDITING GROUNDWATER DATASETS")
    print("=" * 60)

    # 1. Inspect gwl_karnataka_2021_2025.csv
    file1 = Path("data/raw/gwl_karnataka_2021_2025.csv")
    print(f"\n1. Reading {file1.name} ({file1.stat().st_size:,} bytes)...")
    df1 = pd.read_csv(file1, low_memory=False)
    print(f"   Raw records: {len(df1):,}")
    print(f"   Columns: {list(df1.columns)}")
    print(f"   Agencies: {df1['Agency'].unique() if 'Agency' in df1 else 'N/A'}")
    print(f"   Unique stations: {df1['Station'].nunique()}")
    print(f"   Districts: {df1['District'].nunique()} unique")
    val_col1 = [c for c in df1.columns if 'meter' in c.lower() or 'level' in c.lower()][-1]
    print(f"   Target value column: '{val_col1}'")
    s1 = pd.to_numeric(df1[val_col1], errors='coerce')
    print(f"   Value stats: valid={s1.notna().sum():,}, null={s1.isna().sum():,}")
    print(f"   Min={s1.min()}, Max={s1.max()}, Median={s1.median()}, Mean={s1.mean():.2f}")
    print(f"   Negative count: {(s1 < 0).sum()}, Zero count: {(s1 == 0).sum()}")
    
    # Check date range
    time_col1 = 'Data Acquisition Time'
    t1 = pd.to_datetime(df1[time_col1], format='mixed', errors='coerce')
    print(f"   Timestamps: min={t1.min()}, max={t1.max()}, null_dates={t1.isna().sum()}")

    # Coordinates
    lat1 = pd.to_numeric(df1['Latitude'], errors='coerce')
    lon1 = pd.to_numeric(df1['Longitude'], errors='coerce')
    print(f"   Lat range: [{lat1.min()}, {lat1.max()}], Lon range: [{lon1.min()}, {lon1.max()}]")
    print(f"   Invalid coords: lat_null={lat1.isna().sum()}, lon_null={lon1.isna().sum()}")

    print("\n" + "-" * 50)
    # 2. Inspect gwl_karnataka_gwd_2021_2025.csv in chunks to manage memory
    file2 = Path("data/raw/gwl_karnataka_gwd_2021_2025.csv")
    print(f"\n2. Auditing {file2.name} ({file2.stat().st_size:,} bytes) in chunks...")
    
    chunk_size = 500_000
    n_records = 0
    stations = set()
    districts = set()
    val_col2 = None
    all_values = []
    min_date, max_date = None, None
    station_coords = {}
    
    # First chunk to get columns
    sample_df = pd.read_csv(file2, nrows=100)
    val_col2 = [c for c in sample_df.columns if 'meter' in c.lower() or 'level' in c.lower()][-1]
    print(f"   Columns: {list(sample_df.columns)}")
    print(f"   Target column: '{val_col2}'")

    del sample_df
    gc.collect()

    chunk_idx = 0
    n_neg = 0
    n_pos = 0
    n_zero = 0
    n_null = 0
    total_val_sum = 0.0
    total_val_count = 0
    val_min = float('inf')
    val_max = float('-inf')

    for chunk in pd.read_csv(file2, chunksize=chunk_size, low_memory=False):
        chunk_idx += 1
        n_records += len(chunk)
        stns = chunk['Station'].dropna().unique()
        stations.update(stns)
        if 'District' in chunk:
            districts.update(chunk['District'].dropna().unique())
        
        # Coordinates
        for _, row in chunk[['Station', 'Latitude', 'Longitude']].dropna().drop_duplicates(subset=['Station']).iterrows():
            stn = row['Station']
            if stn not in station_coords:
                try:
                    station_coords[stn] = (float(row['Latitude']), float(row['Longitude']))
                except (ValueError, TypeError):
                    pass

        # Target values
        vals = pd.to_numeric(chunk[val_col2], errors='coerce')
        valid_v = vals.dropna()
        n_null += vals.isna().sum()
        if len(valid_v) > 0:
            n_neg += (valid_v < 0).sum()
            n_pos += (valid_v > 0).sum()
            n_zero += (valid_v == 0).sum()
            c_min = valid_v.min()
            c_max = valid_v.max()
            if c_min < val_min: val_min = c_min
            if c_max > val_max: val_max = c_max
            total_val_sum += valid_v.sum()
            total_val_count += len(valid_v)

        # Dates (sample from chunk)
        dates = pd.to_datetime(chunk[time_col1], format='mixed', errors='coerce').dropna()
        if len(dates) > 0:
            c_dmin = dates.min()
            c_dmax = dates.max()
            if min_date is None or c_dmin < min_date: min_date = c_dmin
            if max_date is None or c_dmax > max_date: max_date = c_dmax

        if chunk_idx % 4 == 0:
            print(f"   Processed {n_records:,} records... ({len(stations)} unique stations)")

    print(f"\n   Total GWD raw records: {n_records:,}")
    print(f"   Unique GWD stations: {len(stations)}")
    print(f"   Unique GWD districts: {len(districts)}")
    print(f"   Date range: {min_date} to {max_date}")
    print(f"   Values: valid={total_val_count:,}, null={n_null:,}")
    print(f"   Negative count: {n_neg:,} ({n_neg/total_val_count*100:.1f}%)")
    print(f"   Positive count: {n_pos:,} ({n_pos/total_val_count*100:.1f}%)")
    print(f"   Zero count: {n_zero:,}")
    print(f"   Min: {val_min}, Max: {val_max}, Mean: {total_val_sum/total_val_count:.2f}")

    # Inspect coordinate validity across unique stations
    lats = [c[0] for c in station_coords.values()]
    lons = [c[1] for c in station_coords.values()]
    print(f"   Station coordinates: {len(station_coords)} stations with coords")
    print(f"   Lat range: [{min(lats):.4f}, {max(lats):.4f}], Lon range: [{min(lons):.4f}, {max(lons):.4f}]")
    
    # Karnataka bounding box: Lat 11.5 - 18.6, Lon 74.0 - 78.6
    valid_coords = sum(11.5 <= lat <= 18.6 and 74.0 <= lon <= 78.6 for lat, lon in station_coords.values())
    print(f"   Stations strictly within Karnataka bounds: {valid_coords} / {len(station_coords)}")

    return df1, file1, file2

if __name__ == '__main__':
    audit_gw_datasets()
