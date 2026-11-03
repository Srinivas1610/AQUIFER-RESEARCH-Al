"""Meteorological aggregation and IDW spatial interpolation pipeline.

Follows Methodology Section B steps 3 & 5:
1. Hourly rainfall -> monthly station totals (mm).
2. Hourly temperature -> monthly station medians (°C).
3. Geodesic distance calculation to wells using geopy.
4. Inverse-distance weighting (power 2, up to 5 nearest stations).
5. Trailing 3-month and 6-month rainfall totals.
6. Sine/cosine month seasonal features.
"""
import sys
import gc
from pathlib import Path
import numpy as np
import pandas as pd
from geopy.distance import geodesic

def aggregate_monthly_meteorology():
    print("=" * 60)
    print("AGGREGATING MONTHLY RAINFALL AND TEMPERATURE")
    print("=" * 60)

    rain_file = Path("data/raw/rainfall_karnataka_2021_2025.csv")
    temp_file = Path("data/raw/temperature_karnataka_2021_2025.csv")
    interim_dir = Path("data/interim")
    interim_dir.mkdir(parents=True, exist_ok=True)

    # 1. Rainfall aggregation
    print(f"\n1. Aggregating {rain_file.name}...")
    rain_val_col = 'Telemetry Hourly Rainfall (mm)'
    rain_chunks = []
    rain_station_meta = {}

    for chunk in pd.read_csv(rain_file, chunksize=300_000, low_memory=False):
        for _, row in chunk[['Station', 'Latitude', 'Longitude']].dropna().drop_duplicates(subset=['Station']).iterrows():
            stn = str(row['Station']).strip()
            if stn not in rain_station_meta:
                try:
                    lat, lon = float(row['Latitude']), float(row['Longitude'])
                    if 11.5 <= lat <= 18.6 and 74.0 <= lon <= 78.6:
                        rain_station_meta[stn] = (lat, lon)
                except: pass

        vals = pd.to_numeric(chunk[rain_val_col], errors='coerce')
        # Physical filter: hourly rain in [0, 250mm]
        valid_mask = (vals >= 0) & (vals <= 250.0)
        
        c = pd.DataFrame({
            'station': chunk['Station'].astype(str).str.strip()[valid_mask],
            'rain_mm': vals[valid_mask],
            'dt': pd.to_datetime(chunk['Data Acquisition Time'][valid_mask], format='mixed', errors='coerce')
        }).dropna()
        c['year_month'] = c['dt'].dt.to_period('M')
        # Sum hourly rainfall to station-month
        m_chunk = c.groupby(['station', 'year_month'])['rain_mm'].sum().reset_index()
        rain_chunks.append(m_chunk)

    rain_df = pd.concat(rain_chunks, ignore_index=True)
    del rain_chunks
    gc.collect()
    rain_monthly = rain_df.groupby(['station', 'year_month'])['rain_mm'].sum().reset_index()
    rain_monthly['year_month_str'] = rain_monthly['year_month'].astype(str)
    # Retain only stations with valid coords
    rain_monthly = rain_monthly[rain_monthly['station'].isin(rain_station_meta)].copy()
    print(f"   Rainfall monthly records: {len(rain_monthly):,} across {rain_monthly['station'].nunique()} stations")

    # Save rain stations metadata
    rain_meta_df = pd.DataFrame([
        {'station': s, 'latitude': c[0], 'longitude': c[1]}
        for s, c in rain_station_meta.items()
    ])
    rain_meta_df.to_parquet(interim_dir / "rain_stations.parquet", index=False)
    rain_monthly.to_parquet(interim_dir / "rainfall_monthly.parquet", index=False)

    # 2. Temperature aggregation
    print(f"\n2. Aggregating {temp_file.name}...")
    temp_val_col = [c for c in pd.read_csv(temp_file, nrows=10).columns if 'temp' in c.lower()][-1]
    temp_chunks = []
    temp_station_meta = {}

    for chunk in pd.read_csv(temp_file, chunksize=500_000, low_memory=False):
        for _, row in chunk[['Station', 'Latitude', 'Longitude']].dropna().drop_duplicates(subset=['Station']).iterrows():
            stn = str(row['Station']).strip()
            if stn not in temp_station_meta:
                try:
                    lat, lon = float(row['Latitude']), float(row['Longitude'])
                    if 11.5 <= lat <= 18.6 and 74.0 <= lon <= 78.6:
                        temp_station_meta[stn] = (lat, lon)
                except: pass

        vals = pd.to_numeric(chunk[temp_val_col], errors='coerce')
        # Physical filter for Karnataka temperature: [5.0, 50.0 °C]
        valid_mask = (vals >= 5.0) & (vals <= 50.0)

        c = pd.DataFrame({
            'station': chunk['Station'].astype(str).str.strip()[valid_mask],
            'temp_c': vals[valid_mask],
            'dt': pd.to_datetime(chunk['Data Acquisition Time'][valid_mask], format='mixed', errors='coerce')
        }).dropna()
        c['year_month'] = c['dt'].dt.to_period('M')
        # Median hourly temperature to station-month
        m_chunk = c.groupby(['station', 'year_month'])['temp_c'].median().reset_index()
        temp_chunks.append(m_chunk)

    temp_df = pd.concat(temp_chunks, ignore_index=True)
    del temp_chunks
    gc.collect()
    temp_monthly = temp_df.groupby(['station', 'year_month'])['temp_c'].median().reset_index()
    temp_monthly['year_month_str'] = temp_monthly['year_month'].astype(str)
    temp_monthly = temp_monthly[temp_monthly['station'].isin(temp_station_meta)].copy()
    print(f"   Temperature monthly records: {len(temp_monthly):,} across {temp_monthly['station'].nunique()} stations")

    temp_meta_df = pd.DataFrame([
        {'station': s, 'latitude': c[0], 'longitude': c[1]}
        for s, c in temp_station_meta.items()
    ])
    temp_meta_df.to_parquet(interim_dir / "temp_stations.parquet", index=False)
    temp_monthly.to_parquet(interim_dir / "temperature_monthly.parquet", index=False)

    print("\nSaved monthly meteorological series to data/interim/.")
    return rain_monthly, rain_meta_df, temp_monthly, temp_meta_df

if __name__ == '__main__':
    aggregate_monthly_meteorology()
