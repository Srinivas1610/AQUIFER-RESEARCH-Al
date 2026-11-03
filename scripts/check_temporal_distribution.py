"""Check temporal distribution of observations across the planned study partitions."""
import pandas as pd

def check_partitions():
    df = pd.read_parquet("data/interim/groundwater_monthly.parquet")
    meta = pd.read_parquet("data/interim/wells_metadata.parquet")
    core_wells = set(meta[meta['is_core_cohort']]['well_id'])

    print(f"Total well-month records: {len(df):,}")
    print(f"Total wells represented: {df['station'].nunique():,}")

    partitions = {
        "Initial fit (Train) [2021-01 to 2023-12]": ('2021-01', '2023-12'),
        "Validation / Tuning [2024-01 to 2024-06]": ('2024-01', '2024-06'),
        "Refit window [2021-01 to 2024-06]": ('2021-01', '2024-06'),
        "Calibration [2024-07 to 2024-12]": ('2024-07', '2024-12'),
        "Final test [2025-01 to 2025-12]": ('2025-01', '2025-12')
    }

    print("\n--- PARTITION COVERAGE (ALL WELLS) ---")
    for name, (start, end) in partitions.items():
        sub = df[(df['year_month_str'] >= start) & (df['year_month_str'] <= end)]
        n_obs = len(sub)
        n_wells = sub['station'].nunique()
        print(f"{name:45s}: {n_obs:6,d} targets across {n_wells:4,d} wells")

    print("\n--- PARTITION COVERAGE (CORE COHORT: 260 WELLS) ---")
    core_df = df[df['station'].isin(core_wells)]
    for name, (start, end) in partitions.items():
        sub = core_df[(core_df['year_month_str'] >= start) & (core_df['year_month_str'] <= end)]
        n_obs = len(sub)
        n_wells = sub['station'].nunique()
        print(f"{name:45s}: {n_obs:6,d} targets across {n_wells:4,d} wells")

    # Missingness statistics
    print("\n--- MISSINGNESS SUMMARY ---")
    # For core cohort across 60 months
    possible_grid = len(core_wells) * 60
    actual_obs = len(core_df)
    missing_core = possible_grid - actual_obs
    print(f"Core cohort possible grid (260 wells x 60 mos): {possible_grid:,}")
    print(f"Core cohort actual observed targets:            {actual_obs:,} ({actual_obs/possible_grid*100:.1f}%)")
    print(f"Core cohort missing well-months:                 {missing_core:,} ({missing_core/possible_grid*100:.1f}%)")

    # For all 1,658 wells across 60 months
    possible_all = 1658 * 60
    actual_all = len(df)
    missing_all = possible_all - actual_all
    print(f"\nAll wells possible grid (1,658 wells x 60 mos):   {possible_all:,}")
    print(f"All wells actual observed targets:              {actual_all:,} ({actual_all/possible_all*100:.1f}%)")
    print(f"All wells missing well-months:                   {missing_all:,} ({missing_all/possible_all*100:.1f}%)")

if __name__ == '__main__':
    check_partitions()
