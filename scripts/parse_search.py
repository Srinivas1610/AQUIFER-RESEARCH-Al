import re

with open(r'C:\Users\srini\.gemini\antigravity\brain\3a71d1dc-b7d8-4613-8543-0f73334cbaba\.system_generated\steps\125\content.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Look for dataset links
matches = re.findall(r'href="(/dataset/[^"?]+)"', text)
unique_links = sorted(list(set(matches)))
print(f"Found {len(unique_links)} unique dataset links:")
for link in unique_links:
    print(f"https://nwdp.nwic.gov.in{link}")
