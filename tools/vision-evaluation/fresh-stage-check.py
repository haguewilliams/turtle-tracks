"""New dated, attribution-excluded stage check; retain no GPS or private records."""
import concurrent.futures, hashlib, json, pathlib, threading, time
import requests
ROOT=pathlib.Path(__file__).resolve().parents[2]
CACHE=ROOT/'.model-cache/vision-evaluation'
DEST=CACHE/'stage-photos';DEST.mkdir(exist_ok=True)
sources=json.loads((ROOT/'models/eastern-box-v1/sources.json').read_text())['photos']
excluded={r['attribution'] for r in sources}
seen=set();rows=[];session=requests.Session()
session.headers['User-Agent']='TurtleTracksModelResearch/0.2 (https://github.com/haguewilliams/turtle-tracks)'
for value,stage in [(2,'adult'),(8,'juvenile')]:
    response=session.get('https://api.inaturalist.org/v1/observations',params={'taxon_id':50001,'quality_grade':'research','photos':'true','photo_license':'cc0,cc-by','term_id':1,'term_value_id':value,'per_page':200,'d1':'2018-01-01','d2':'2022-12-31','order_by':'id','order':'desc'},timeout=45)
    response.raise_for_status();count=0
    for r in response.json()['results']:
        labels={a['controlled_value_id'] for a in r.get('annotations',[]) if a['controlled_attribute_id']==1 and a.get('vote_score',0)>=0}
        if labels!={value}:continue
        photos=[p for p in r.get('photos',[]) if p.get('license_code') in ['cc0','cc-by'] and not p.get('hidden') and not p.get('flags') and p['url'].startswith('https://inaturalist-open-data.s3.amazonaws.com/photos/')]
        if not photos:continue
        p=photos[0]
        if p['attribution'] in excluded or p['attribution'] in seen:continue
        seen.add(p['attribution'])
        rows.append({'id':'stage-'+str(p['id']),'photo_id':p['id'],'cohort':'fresh-stage','species':'eastern','life_stage':stage,'sex':'unknown','source':'https://www.inaturalist.org/observations/'+str(r['id']),'photo_url':p['url'].replace('/square.','/small.'),'attribution':p['attribution'],'license':p['license_code'],'path':str(DEST/(str(p['id'])+'.jpg'))})
        count+=1
        if count>=40:break
    print('Selected',stage,count,flush=True);time.sleep(1)
local=threading.local()
def download(row):
    if not hasattr(local,'session'):local.session=requests.Session()
    path=pathlib.Path(row['path'])
    if not path.exists():
        response=local.session.get(row['photo_url'],timeout=30);response.raise_for_status();path.write_bytes(response.content)
    return {**row,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:rows=list(pool.map(download,rows))
(CACHE/'fresh-stage-cohort.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Downloaded',len(rows),'new stage photographs',flush=True)
