"""Audit rainfall and temperature datasets."""
from pathlib import Path
import pandas as pd
import numpy as np

def audit_rainfall():
    print("=" * 60)
    print("AUDITING RAINFALL DATASET")
    print("=" * 60)
    f = Path("data/raw/rainfall_karnataka_2021_2025.csv")
    print(f"Reading {f.name} ({f.stat().st_size:,} bytes)...")
    
    # Read sample
    sample = pd.read_csv(f, nrows=100)
    print(f"Columns: {list(sample.columns)}")
    val_col = [c for c in sample.columns if 'rain' in c.lower()][-1]
    print(f"Rainfall col: '{val_col}'")
    
    # Process full file in chunks
    n_records = 0
    stations = set()
    districts = set()
    coords = {}
    total_rain = 0.0
    rain_min = float('inf')
    rain_max = float('-inf')
    rain_zeros = 0
    valid_count = 0
    min_date, max_date = None, None

    for chunk in pd.read_csv(f, chunksize=500_000, low_memory=False):
        n_records += len(chunk)
        stations.update(chunk['Station'].dropna().unique())
        if 'District' in chunk:
            districts.update(chunk['District'].dropna().unique())
        
        for _, row in chunk[['Station', 'Latitude', 'Longitude']].dropna().drop_duplicates(subset=['Station']).iterrows():
            stn = row['Station']
            if stn not in coords:
                try:
                    coords[stn] = (float(row['Latitude']), float(row['Longitude']))
                except: pass
        
        vals = pd.to_numeric(chunk[val_col], errors='coerce').dropna()
        if len(vals) > 0:
            c_min = vals.min()
            c_max = vals.max()
            if c_min < rain_min: rain_min = c_min
            if c_max > rain_max: rain_max = c_max
            rain_zeros += (vals == 0).sum()
            total_rain += vals.sum()
            valid_count += len(vals)
        
        dates = pd.to_datetime(chunk['Data Acquisition Time'], format='mixed', errors='coerce').dropna()
        if len(dates) > 0:
            if min_date is None or dates.min() < min_date: min_date = dates.min()
            if max_date is None or dates.max() > max_date: max_date = dates.max()

    print(f"Total rainfall records: {n_records:,}")
    print(f"Unique rainfall stations: {len(stations)}")
    print(f"Districts: {len(districts)}")
    print(f"Stations with coords: {len(coords)}")
    print(f"Date range: {min_date} to {max_date}")
    print(f"Rainfall min={rain_min}, max={rain_max}, zeros={rain_zeros:,} ({rain_zeros/valid_count*100:.1f}%), mean={total_rain/valid_count:.2f} mm")

def audit_temperature():
    print("\n" + "=" * 60)
    print("AUDITING TEMPERATURE DATASET")
    print("=" * 60)
    f = Path("data/raw/temperature_karnataka_2021_2025.csv")
    print(f"Reading {f.name} ({f.stat().st_size:,} bytes)...")
    
    sample = pd.read_csv(f, nrows=100)
    print(f"Columns: {list(sample.columns)}")
    val_col = [c for c in sample.columns if 'temp' in c.lower()][-1]
    print(f"Temperature col: '{val_col}'")

    n_records = 0
    stations = set()
    coords = {}
    valid_count = 0
    temp_min = float('inf')
    temp_max = float('-inf')
    temp_sum = 0.0
    min_date, max_date = None, None

    for chunk in pd.read_csv(f, chunksize=500_000, low_memory=False):
        n_records += len(chunk)
        stations.update(chunk['Station'].dropna().unique())
        for _, row in chunk[['Station', 'Latitude', 'Longitude']].dropna().drop_duplicates(subset=['Station']).iterrows():
            stn = row['Station']
            if stn not in coords:
                try:
                    coords[stn] = (float(row['Latitude']), float(row['Longitude']))
                except: pass
        
        vals = pd.to_numeric(chunk[val_col], errors='coerce').dropna()
        if len(vals) > 0:
            c_min = vals.min()
            c_max = vals.max()
            if c_min < temp_min: temp_min = c_min
            if c_max > temp_max: temp_max = c_max
            temp_sum += vals.sum()
            valid_count += len(vals)

        dates = pd.to_datetime(chunk['Data Acquisition Time'], format='mixed', errors='coerce').dropna()
        if len(dates) > 0:
            if min_date is None or dates.min() < min_date: min_date = dates.min()
            if max_date is None or dates.max() > max_date: max_date = dates.max()

    print(f"Total temperature records: {n_records:,}")
    print(f"Unique temperature stations: {len(stations)}")
    print(f"Stations with coords: {len(coords)}")
    print(f"Date range: {min_date} to {max_date}")
    print(f"Temp min={temp_min}, max={temp_max}, mean={temp_sum/valid_count:.2f} C")

if __name__ == '__main__':
    audit_rainfall()
    audit_temperature()
