"""Collect an additional evaluation cohort after development, without tuning it."""
import collections, hashlib, importlib.util, json, pathlib, time, concurrent.futures
ROOT=pathlib.Path(__file__).resolve().parents[2];CACHE=ROOT/'.model-cache'
spec=importlib.util.spec_from_file_location('collect',pathlib.Path(__file__).with_name('collect.py'));c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
existing=json.loads((CACHE/'review-manifest.json').read_text());observers={x['observer_group'] for x in existing};photos={x['photo_id'] for x in existing}
queries=[('eastern',50001,60),('other_box_turtle',39807,20),('other_box_turtle',1544605,20),('other_turtle',39532,30),('other',47124,20)]
selected=[]
for kind,taxon,want in queries:
 params={'taxon_id':taxon,'year':2023,'quality_grade':'research','photos':'true','photo_license':'cc0,cc-by','per_page':200,'order_by':'id','order':'desc'}
 name=CACHE/f'fresh-{taxon}.json'
 if name.exists():rows=json.loads(name.read_text())
 else:
  data=json.loads(c.get('https://api.inaturalist.org/v1/observations?'+c.urllib.parse.urlencode(params)));rows=[]
  for x in data['results']:
   group=hashlib.sha256(f"tt-v1:{x['user']['id']}".encode()).hexdigest()[:16]
   if group in observers:continue
   if kind=='other_turtle' and x['taxon']['name'].startswith('Terrapene'):continue
   pp=[p for p in x['photos'] if p.get('license_code') in c.ALLOWED and not p.get('hidden') and not p.get('flags') and p['id'] not in photos]
   if not pp:continue
   p=pp[0]
   if not p['url'].startswith('https://inaturalist-open-data.s3.amazonaws.com/photos/'):continue
   rows.append({'observation_id':x['id'],'photo_id':p['id'],'photo_url':p['url'].replace('/square.','/small.'),'source_url':f"https://www.inaturalist.org/observations/{x['id']}",'attribution':p['attribution'],'license':p['license_code'],'species':kind,'taxon_name':x['taxon']['name'],'life_stage':'unknown','sex':'unknown','observer_group':group})
   if len(rows)==want:break
  name.write_text(json.dumps(rows,indent=2));time.sleep(1.1)
 selected.extend(rows);print(kind,len(rows),flush=True)
def download(r):
 dest=CACHE/'images'/f"{r['photo_id']}.jpg"
 if not dest.exists():tmp=dest.with_suffix('.part');tmp.write_bytes(c.get(r['photo_url']));tmp.replace(dest);time.sleep(.5)
 return r
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:rows=list(pool.map(download,selected))
(CACHE/'fresh-manifest.json').write_text(json.dumps(rows,indent=2));print('Fresh cohort',len(rows),flush=True)
