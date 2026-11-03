"""Download real datasets from the National Water Data Portal (NWIC).

Datasets:
1. Karnataka groundwater telemetry (2021-2025)
2. Karnataka Ground Water Department groundwater telemetry (2021-2025)
3. Karnataka rainfall telemetry hourly (2021-2025)
4. Karnataka temperature telemetry hourly (2021-2025)
"""
import sys
import time
from pathlib import Path
import requests

DATASETS = {
    "gwl_karnataka_2021_2025.csv": (
        "https://nwdp.nwic.gov.in/dataset/924fba56-48b8-4abe-b052-a114ae548dc1/resource/b6e5ef9f-733b-41cd-bc6f-035807acb959/download/gwl_tel_6_hourly_karnataka_ka_2021_2025.csv",
        986945
    ),
    "gwl_karnataka_gwd_2021_2025.csv": (
        "https://nwdp.nwic.gov.in/dataset/832fa98a-93d2-4f5b-8c4a-28964b4993db/resource/f6178453-cbc0-4005-98b3-8408e6dfc19a/download/gwl_tel_6_hourly_karnataka_gw_ka_2021_2025.csv",
        756700277
    ),
    "rainfall_karnataka_2021_2025.csv": (
        "https://nwdp.nwic.gov.in/dataset/f45260de-893a-4d95-b189-d3800379737c/resource/18434c62-2ed5-4083-8060-cac00be166c9/download/rainfall_tel_hr_karnataka_ka_2021_2025.csv",
        83495207
    ),
    "temperature_karnataka_2021_2025.csv": (
        "https://nwdp.nwic.gov.in/dataset/229a18b3-2d74-48fd-8848-8a1f66e8f390/resource/da57ae54-1d27-4769-964c-c83411c40fc6/download/temprature_tel_hr_karnataka_ka_2021_2025.csv",
        295033474
    ),
}

def download_file(url: str, dest_path: Path, expected_size: int = None, chunk_size: int = 1024 * 1024):
    if dest_path.exists() and expected_size and dest_path.stat().st_size == expected_size:
        print(f"Already downloaded: {dest_path.name} ({dest_path.stat().st_size:,} bytes)")
        return

    print(f"\nStarting download: {dest_path.name}")
    print(f"URL: {url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    start_time = time.time()
    resp = requests.get(url, headers=headers, stream=True, timeout=60)
    resp.raise_for_status()
    
    total_size = int(resp.headers.get('content-length', expected_size or 0))
    downloaded = 0
    temp_path = dest_path.with_suffix('.tmp')

    with open(temp_path, 'wb') as f:
        last_log = time.time()
        for chunk in resp.iter_content(chunk_size=chunk_size):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                now = time.time()
                if now - last_log >= 5.0 or (total_size and downloaded >= total_size):
                    pct = (downloaded / total_size * 100) if total_size else 0
                    speed = (downloaded / (now - start_time)) / (1024 * 1024)
                    print(f"  {downloaded:,} / {total_size:,} bytes ({pct:.1f}%) - {speed:.2f} MB/s")
                    last_log = now

    temp_path.replace(dest_path)
    elapsed = time.time() - start_time
    print(f"Completed {dest_path.name} in {elapsed:.1f}s ({dest_path.stat().st_size:,} bytes)")

def main():
    raw_dir = Path("data/raw")
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    for filename, (url, expected_size) in DATASETS.items():
        dest = raw_dir / filename
        try:
            download_file(url, dest, expected_size)
        except Exception as e:
            print(f"Failed to download {filename}: {e}", file=sys.stderr)
            raise

if __name__ == '__main__':
    main()
