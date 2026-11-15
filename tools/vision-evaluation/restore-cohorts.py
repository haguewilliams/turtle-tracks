"""Restore the published held-out photos and their original partitions."""
import concurrent.futures, json, pathlib, requests, time
ROOT = pathlib.Path(__file__).resolve().parents[2]
CACHE = ROOT / '.model-cache/vision-evaluation'
DEST = CACHE / 'cohort-photos'
DEST.mkdir(parents=True, exist_ok=True)
sources = json.loads((ROOT/'models/eastern-box-v1/sources.json').read_text())['photos']
rows = [r for r in sources if r.get('split') in ['validation', 'test'] or r['cohort'] != 'development']
def download(row):
    dest = DEST / (str(row['photo_id'])+'.jpg')
    if not dest.exists():
        response = requests.get(row['photo_url'], timeout=30)
        response.raise_for_status()
        dest.write_bytes(response.content)
        time.sleep(.2)
    return {**row, 'path': str(dest)}
output=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for i, row in enumerate(pool.map(download, rows)):
        output.append(row)
        if i%100==0: print('Restored',i+1,'of',len(rows),flush=True)
(CACHE/'restored-cohorts.json').write_text(json.dumps(output,indent=2)+'\n')
print('Restored',len(output),'held-out photos',flush=True)
