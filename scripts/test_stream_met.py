import requests

urls = {
    'rainfall': "https://nwdp.nwic.gov.in/dataset/f45260de-893a-4d95-b189-d3800379737c/resource/18434c62-2ed5-4083-8060-cac00be166c9/download/rainfall_tel_hr_karnataka_ka_2021_2025.csv",
    'temperature': "https://nwdp.nwic.gov.in/dataset/229a18b3-2d74-48fd-8848-8a1f66e8f390/resource/da57ae54-1d27-4769-964c-c83411c40fc6/download/temprature_tel_hr_karnataka_ka_2021_2025.csv"
}

headers = {'User-Agent': 'Mozilla/5.0'}

for name, url in urls.items():
    print(f"\nChecking {name}: {url}")
    try:
        r = requests.get(url, headers=headers, stream=True, timeout=20)
        print(f"Status: {r.status_code}, Length: {r.headers.get('content-length')}")
        lines = []
        for line in r.iter_lines(decode_unicode=True):
            if line:
                lines.append(line)
            if len(lines) >= 5:
                break
        for i, l in enumerate(lines):
            print(f"  {i+1}: {l}")
    except Exception as e:
        print(f"Error {name}: {e}")
