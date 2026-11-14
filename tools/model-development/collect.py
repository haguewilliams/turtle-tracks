"""Bounded, attribution-preserving iNaturalist feasibility sample. No GPS retained.

Labels are community annotations, not expert certification. This script never
submits observations. Cache is ignored by Git; release only reviewed artifacts.
"""
import concurrent.futures, hashlib, json, pathlib, threading, time, urllib.parse
import requests

ROOT = pathlib.Path(__file__).resolve().parents[2]
CACHE = ROOT / '.model-cache'
CACHE.mkdir(exist_ok=True)
(CACHE / 'images').mkdir(exist_ok=True)
UA = 'TurtleTracksModelResearch/0.1 (https://github.com/haguewilliams/turtle-tracks)'
ALLOWED = {'cc0', 'cc-by'}
LOCAL=threading.local()
QUERIES = [
 ('eastern', {'taxon_id':50001}, 180),
 ('eastern', {'taxon_id':50001,'term_id':1,'term_value_id':8}, 180),
 ('eastern', {'taxon_id':50001,'term_id':1,'term_value_id':2}, 180),
 ('eastern', {'taxon_id':50001,'term_id':9,'term_value_id':10}, 180),
 ('eastern', {'taxon_id':50001,'term_id':9,'term_value_id':11}, 180),
 ('other_box_turtle', {'taxon_id':39807}, 100),
 ('other_box_turtle', {'taxon_id':1544605}, 100),
 ('other_box_turtle', {'taxon_id':39817}, 100),
 ('other_box_turtle', {'taxon_id':39819}, 100),
 ('other_turtle', {'taxon_id':39532}, 200),
 ('other', {'taxon_id':20979}, 100),
 ('other', {'taxon_id':26172}, 100),
 ('other', {'taxon_id':47124}, 100),
 ('other', {'taxon_id':40151}, 100),
]

def get(url):
    if not hasattr(LOCAL,'session'):
        LOCAL.session=requests.Session();LOCAL.session.headers['User-Agent']=UA
    for attempt in range(3):
        try:
            r=LOCAL.session.get(url,timeout=45);r.raise_for_status();return r.content
        except Exception:
            if attempt==2: raise
            time.sleep(2+attempt*3)

def label(observation, term, mapping):
    values={a['controlled_value_id'] for a in observation.get('annotations',[]) if a['controlled_attribute_id']==term and a.get('vote_score',0)>=0}
    return mapping.get(next(iter(values)),'unknown') if len(values)==1 else 'unknown'

def collect():
    rows={}
    for kind,query,count in QUERIES:
        params={'quality_grade':'research','photos':'true','photo_license':'cc0,cc-by','per_page':count,'order_by':'id','order':'desc',**query}
        cachekey=hashlib.sha256(json.dumps(params,sort_keys=True).encode()).hexdigest()[:12]
        file=CACHE/f'query-{cachekey}.json'
        if file.exists(): clean=json.loads(file.read_text())
        else:
            payload=json.loads(get('https://api.inaturalist.org/v1/observations?'+urllib.parse.urlencode(params)))
            clean=[]
            for x in payload['results']:
                photos=[p for p in x.get('photos',[]) if p.get('license_code') in ALLOWED and not p.get('hidden') and not p.get('flags')]
                if not photos: continue
                taxon=x.get('taxon',{});name=taxon.get('name','')
                if kind=='other_turtle' and name.startswith('Terrapene'):continue
                p=photos[0]
                if not p['url'].startswith('https://inaturalist-open-data.s3.amazonaws.com/photos/'):continue
                clean.append({'observation_id':x['id'],'photo_id':p['id'],'photo_url':p['url'].replace('/square.','/small.'),
                  'source_url':f"https://www.inaturalist.org/observations/{x['id']}",'attribution':p['attribution'],'license':p['license_code'],
                  'species':kind,'taxon_name':name,'life_stage':label(x,1,{2:'adult',8:'juvenile'}) if kind=='eastern' else 'unknown',
                  'sex':label(x,9,{10:'female',11:'male'}) if kind=='eastern' else 'unknown',
                  'observer_group':hashlib.sha256(f"tt-v1:{x['user']['id']}".encode()).hexdigest()[:16]})
            file.write_text(json.dumps(clean,indent=2))
            time.sleep(1.1)
        for row in clean:
            row['photo_url']=row['photo_url'].replace('/medium.','/small.')
            rows.setdefault(row['photo_id'],row)
        print(kind,query,'accepted',len(clean),'unique',len(rows),flush=True)
    def download(row):
        dest=CACHE/'images'/f"{row['photo_id']}.jpg"
        try:
            if not dest.exists():
                temp=dest.with_suffix('.part');temp.write_bytes(get(row['photo_url']));temp.replace(dest);time.sleep(.5)
            return row
        except Exception as e:
            print('image failed',row['photo_id'],type(e).__name__,flush=True);return None
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        output=[r for r in pool.map(download,rows.values()) if r]
    (CACHE/'manifest.json').write_text(json.dumps(output,indent=2))
    print('Downloaded',len(output),'licensed photos. Community annotations require separate validation.',flush=True)

if __name__=='__main__': collect()
