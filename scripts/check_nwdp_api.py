import requests
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
datasets = [
    'ground-water-level-telemetry-hourly-karnataka-department',
    'ground-water-level-telemetry-hourly-karnataka-ground-water-department',
    'kwris-ground-water-telemetry-six-hourly-karnataka',
    'rainfall-telemetry-hourly-karnataka-department',
    'temperature-telemetry-hourly-karnataka-water-department'
]

for d in datasets:
    api_url = f'https://nwdp.nwic.gov.in/api/3/action/package_show?id={d}'
    try:
        r = requests.get(api_url, headers=headers, timeout=15)
        print(f"Dataset: {d} | Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            if data.get('success'):
                res_list = data['result'].get('resources', [])
                print(f"  Found {len(res_list)} resources:")
                for res in res_list:
                    name = res.get('name')
                    fmt = res.get('format')
                    url = res.get('url')
                    size = res.get('size')
                    print(f"    * [{fmt}] {name}: {url} (size={size})")
            else:
                print(f"  API returned success=False")
        else:
            print(f"  HTTP error response: {r.text[:200]}")
    except Exception as e:
        print(f"  Request failed: {e}")
