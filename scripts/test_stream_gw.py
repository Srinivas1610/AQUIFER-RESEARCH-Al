import requests

url = "https://nwdp.nwic.gov.in/dataset/924fba56-48b8-4abe-b052-a114ae548dc1/resource/b6e5ef9f-733b-41cd-bc6f-035807acb959/download/gwl_tel_6_hourly_karnataka_ka_2021_2025.csv"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

print(f"Connecting to {url}...")
try:
    r = requests.get(url, headers=headers, stream=True, timeout=30)
    print(f"Status: {r.status_code}")
    print(f"Content-Type: {r.headers.get('content-type')}")
    print(f"Content-Length: {r.headers.get('content-length')}")
    lines = []
    for line in r.iter_lines(decode_unicode=True):
        if line:
            lines.append(line)
        if len(lines) >= 20:
            break
    print("\n--- FIRST 20 LINES ---")
    for i, l in enumerate(lines):
        print(f"{i+1}: {l}")
except Exception as e:
    print(f"Error: {e}")
