"""Generate synthetic groundwater data for pipeline testing.

All outputs are watermarked as SYNTHETIC and must NEVER appear in paper results.
Usage: python scripts/make_synthetic.py [--n_wells 20] [--output_dir data/interim]
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

import numpy as np
import pandas as pd
from gwml.utils.seed import set_seed


def make_synthetic_wells(n_wells: int = 20, seed: int = 42) -> pd.DataFrame:
    """Generate synthetic well metadata."""
    set_seed(seed)
    # Karnataka approximate bounds (lat 11.5-18.5, lon 74-78)
    lats = np.random.uniform(12.0, 18.0, n_wells)
    lons = np.random.uniform(74.5, 77.5, n_wells)
    elevations = np.random.uniform(200, 900, n_wells)
    
    wells = pd.DataFrame({
        'well_id': [f'SYNTHETIC_WELL_{i:04d}' for i in range(n_wells)],
        'latitude': lats,
        'longitude': lons,
        'elevation_m': elevations,
        'basin': np.random.choice(['Krishna', 'Cauvery', 'Godavari', 'WestFlowing'], n_wells),
        'lithology': np.random.choice(['Granite', 'Basalt', 'Laterite', 'Alluvium'], n_wells),
        'aquifer_type': np.random.choice(['Unconfined', 'Semi-confined', 'Confined'], n_wells),
        'is_synthetic': True
    })
    return wells


def make_synthetic_groundwater(wells: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """Generate synthetic monthly groundwater depth records."""
    set_seed(seed)
    months = pd.period_range('2021-01', '2025-12', freq='M')
    records = []
    
    for _, well in wells.iterrows():
        # Base depth with seasonal pattern
        base = np.random.uniform(3, 25)
        amplitude = np.random.uniform(1, 5)
        trend = np.random.uniform(-0.02, 0.02)
        
        for i, month in enumerate(months):
            # Seasonal: deeper in summer (Apr-May), shallower in monsoon (Jul-Sep)
            seasonal = amplitude * np.sin(2 * np.pi * (month.month - 7) / 12)
            depth = base + seasonal + trend * i + np.random.normal(0, 0.5)
            depth = max(0.1, depth)  # depth below ground >= 0
            
            # Random missingness (~15%)
            if np.random.random() < 0.15:
                continue
            
            records.append({
                'well_id': well['well_id'],
                'year_month': str(month),
                'depth_m_bgl': round(depth, 2),
                'n_valid_days': np.random.randint(10, 30),
                'is_synthetic': True
            })
    
    return pd.DataFrame(records)


def make_synthetic_rainfall(wells: pd.DataFrame, n_stations: int = 10, seed: int = 42) -> tuple:
    """Generate synthetic rainfall station data."""
    set_seed(seed)
    months = pd.period_range('2021-01', '2025-12', freq='M')
    
    # Station metadata
    station_lats = np.random.uniform(12.0, 18.0, n_stations)
    station_lons = np.random.uniform(74.5, 77.5, n_stations)
    stations = pd.DataFrame({
        'station_id': [f'SYNTHETIC_RAIN_{i:04d}' for i in range(n_stations)],
        'latitude': station_lats,
        'longitude': station_lons,
        'is_synthetic': True
    })
    
    # Monthly rainfall
    records = []
    for _, stn in stations.iterrows():
        for month in months:
            # Monsoon-heavy pattern
            base_rain = 20 if month.month in [6,7,8,9,10] else 5
            rain = max(0, base_rain * np.random.exponential(1.0))
            records.append({
                'station_id': stn['station_id'],
                'year_month': str(month),
                'rainfall_mm': round(rain, 1),
                'is_synthetic': True
            })
    
    rain_df = pd.DataFrame(records)
    return stations, rain_df


def make_synthetic_temperature(wells: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """Generate synthetic monthly temperature data."""
    set_seed(seed)
    months = pd.period_range('2021-01', '2025-12', freq='M')
    records = []
    
    for _, well in wells.iterrows():
        for month in months:
            # Temperature seasonal pattern for Karnataka
            base_temp = 26 + 5 * np.sin(2 * np.pi * (month.month - 4) / 12)
            temp = base_temp + np.random.normal(0, 1.5)
            records.append({
                'well_id': well['well_id'],
                'year_month': str(month),
                'temperature_c': round(temp, 1),
                'is_synthetic': True
            })
    
    return pd.DataFrame(records)


def main():
    parser = argparse.ArgumentParser(description='Generate SYNTHETIC data for pipeline testing')
    parser.add_argument('--n_wells', type=int, default=20)
    parser.add_argument('--output_dir', type=str, default='data/interim')
    parser.add_argument('--seed', type=int, default=42)
    args = parser.parse_args()
    
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f'Generating SYNTHETIC data for {args.n_wells} wells...')
    
    wells = make_synthetic_wells(args.n_wells, args.seed)
    wells.to_csv(output_dir / 'SYNTHETIC_wells.csv', index=False)
    print(f'  Wells: {len(wells)} -> {output_dir}/SYNTHETIC_wells.csv')
    
    gw = make_synthetic_groundwater(wells, args.seed)
    gw.to_csv(output_dir / 'SYNTHETIC_groundwater.csv', index=False)
    print(f'  Groundwater records: {len(gw)} -> {output_dir}/SYNTHETIC_groundwater.csv')
    
    stations, rain = make_synthetic_rainfall(wells, seed=args.seed)
    stations.to_csv(output_dir / 'SYNTHETIC_rain_stations.csv', index=False)
    rain.to_csv(output_dir / 'SYNTHETIC_rainfall.csv', index=False)
    print(f'  Rain stations: {len(stations)}, records: {len(rain)}')
    
    temp = make_synthetic_temperature(wells, args.seed)
    temp.to_csv(output_dir / 'SYNTHETIC_temperature.csv', index=False)
    print(f'  Temperature records: {len(temp)}')
    
    print('\n*** ALL FILES ARE SYNTHETIC — NEVER USE IN PAPER RESULTS ***')


if __name__ == '__main__':
    main()
