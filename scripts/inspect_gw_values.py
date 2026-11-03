"""Inspect groundwater value distributions and station overlaps."""
import pandas as pd
import numpy as np

def inspect_gw():
    f = "data/raw/gwl_karnataka_gwd_2021_2025.csv"
    val_col = 'Groundwater Level Telemetry 6 Hourly (meter)'
    
    print("Sampling 1,000,000 records from GWD...")
    df = pd.read_csv(f, nrows=1_000_000, low_memory=False)
    v = pd.to_numeric(df[val_col], errors='coerce').dropna()
    
    print(f"Total sampled: {len(v):,}")
    print("Negative values percentiles (raw):")
    neg = v[v < 0]
    print(f"  Count: {len(neg):,} ({len(neg)/len(v)*100:.1f}%)")
    print(f"  Quantiles (neg): 1%={neg.quantile(0.01):.2f}, 5%={neg.quantile(0.05):.2f}, 50%={neg.quantile(0.5):.2f}, 95%={neg.quantile(0.95):.2f}, 99%={neg.quantile(0.99):.2f}")
    
    print("Positive values percentiles (raw):")
    pos = v[v > 0]
    print(f"  Count: {len(pos):,} ({len(pos)/len(v)*100:.1f}%)")
    print(f"  Quantiles (pos): 1%={pos.quantile(0.01):.2f}, 5%={pos.quantile(0.05):.2f}, 50%={pos.quantile(0.5):.2f}, 95%={pos.quantile(0.95):.2f}, 99%={pos.quantile(0.99):.2f}")

    # Inspect absolute value distribution
    v_abs = v.abs()
    print("Absolute values quantiles:")
    print(f"  Quantiles (|v|): 1%={v_abs.quantile(0.01):.2f}, 5%={v_abs.quantile(0.05):.2f}, 50%={v_abs.quantile(0.5):.2f}, 95%={v_abs.quantile(0.95):.2f}, 99%={v_abs.quantile(0.99):.2f}")
    
    # Plausible groundwater depth range in Karnataka: 0.1m to 80m below ground level
    plausible = (v_abs >= 0.1) & (v_abs <= 100.0)
    print(f"Plausible depth range [0.1, 100.0m]: {plausible.sum():,} / {len(v):,} ({plausible.mean()*100:.2f}%)")
    
    # Check extreme outliers (< -100 or > 100)
    outliers_low = (v < -100).sum()
    outliers_high = (v > 100).sum()
    print(f"Extreme sensor errors: < -100m: {outliers_low:,}, > 100m: {outliers_high:,}")

    # Inspect a few specific stations across time
    stns = df['Station'].value_counts().head(5).index.tolist()
    for s in stns:
        sdf = df[df['Station'] == s]
        sv = pd.to_numeric(sdf[val_col], errors='coerce').dropna()
        print(f"\nStation '{s}': {len(sdf):,} records, {sdf['District'].iloc[0]}, Lat={sdf['Latitude'].iloc[0]}, Lon={sdf['Longitude'].iloc[0]}")
        print(f"  Val range: [{sv.min():.2f}, {sv.max():.2f}], Mean={sv.mean():.2f}, Std={sv.std():.2f}")
        print(f"  Samples: {sv.head(5).tolist()}")

if __name__ == '__main__':
    inspect_gw()
