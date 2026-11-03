import requests

url = "https://nwdp.nwic.gov.in/dataset/832fa98a-93d2-4f5b-8c4a-28964b4993db/resource/f6178453-cbc0-4005-98b3-8408e6dfc19a/download/gwl_tel_6_hourly_karnataka_gw_ka_2021_2025.csv"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

print(f"Connecting to {url}...")
try:
    r = requests.get(url, headers=headers, stream=True, timeout=30)
    print(f"Status: {r.status_code}")
    print(f"Content-Length: {r.headers.get('content-length')}")
    lines = []
    for line in r.iter_lines(decode_unicode=True):
        if line:
            lines.append(line)
        if len(lines) >= 10:
            break
    print("\n--- FIRST 10 LINES ---")
    for i, l in enumerate(lines):
        print(f"{i+1}: {l}")
except Exception as e:
    print(f"Error: {e}")
