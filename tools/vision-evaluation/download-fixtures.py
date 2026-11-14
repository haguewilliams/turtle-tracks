"""Fetch original public photographs for local evaluation, not model training.

Some photographers retain copyright. Keep photographs out of Git and do not
redistribute them. Captions identify specimens; they do not guarantee sex is
visually determinable in a single photograph.
"""
import concurrent.futures,hashlib,json,pathlib,requests
ROOT=pathlib.Path(__file__).resolve().parents[2]
CACHE=ROOT/'.model-cache/vision-evaluation';PHOTOS=CACHE/'internet-photos';PHOTOS.mkdir(parents=True,exist_ok=True)
rows=json.loads(pathlib.Path(__file__).with_name('internet-sources.json').read_text())
assert len({r['sha256'] for r in rows})==len(rows),'Duplicate source photograph'
def download(row):
 dest=PHOTOS/(row['id']+'.jpg')
 if not dest.exists():
  response=requests.get(row['url'],timeout=30);response.raise_for_status()
  if not response.headers.get('content-type','').startswith('image/'):raise ValueError('Not an image: '+row['id'])
  dest.write_bytes(response.content)
 if hashlib.sha256(dest.read_bytes()).hexdigest()!=row['sha256']:
  raise ValueError('Source image changed; review before updating checksum: '+row['id'])
 return {**row,'path':str(dest)}
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for result in pool.map(download,rows):results.append(result);print('Downloaded',result['id'],flush=True)
(CACHE/'internet-fixtures.json').write_text(json.dumps(results,indent=2)+'\n')
print('Original internet photographs:',len(results))
