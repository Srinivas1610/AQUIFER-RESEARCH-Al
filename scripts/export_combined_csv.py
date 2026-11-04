"""Export a combined CSV by concatenating all result tables.

This script scans `results/tables/` for CSV files, loads each with pandas and
concatenates them vertically. An additional column `source_file` records the
origin CSV for each row. The combined DataFrame is saved to
`results/combined_dataset.csv`.

All operations are offline and use only the local filesystem.
"""

import os
import pandas as pd

def main():
    tables_dir = os.path.join(os.path.dirname(__file__), "..", "results", "tables")
    out_path = os.path.join(os.path.dirname(__file__), "..", "results", "combined_dataset.csv")

    csv_files = [f for f in os.listdir(tables_dir) if f.lower().endswith('.csv')]
    if not csv_files:
        print("No CSV files found in results/tables.")
        return

    dfs = []
    for fname in csv_files:
        path = os.path.join(tables_dir, fname)
        df = pd.read_csv(path)
        df['source_file'] = fname
        dfs.append(df)
        print(f"Loaded {fname} with {df.shape[0]} rows, {df.shape[1]} cols")

    combined = pd.concat(dfs, ignore_index=True, sort=False)
    combined.to_csv(out_path, index=False)
    print(f"Combined CSV written to {out_path}, shape {combined.shape}")

if __name__ == "__main__":
    main()
