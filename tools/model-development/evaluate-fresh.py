"""Evaluate the frozen species model on additional observers; never tune it here."""
import collections, hashlib, json, pathlib, argparse
import numpy as np
from train import image_hash

ROOT=pathlib.Path(__file__).resolve().parents[2];CACHE=ROOT/'.model-cache'
parser=argparse.ArgumentParser();parser.add_argument('--alpha',type=float,choices=[.5,.75,1],default=.5);parser.add_argument('--backbone',choices=['mobilenet','bioclip'],default='mobilenet');args=parser.parse_args()
suffix='-bioclip' if args.backbone=='bioclip' else '' if args.alpha==.5 else f'-{round(args.alpha*100)}'
model_bytes=(CACHE/f'classifier{suffix}.json').read_bytes();model=json.loads(model_bytes)
head=model['heads']['species'];threshold=head['threshold']
development=json.loads((CACHE/f'review-manifest{suffix}.json').read_text())
seen=[image_hash(r['photo_id']) for r in development]
observers={r['observer_group'] for r in development}
rows=[];duplicates=0
for line in (CACHE/f'fresh-features{suffix}.jsonl').read_text().splitlines():
    row=json.loads(line)
    assert row['observer_group'] not in observers
    h=image_hash(row['photo_id'])
    if any((h^old).bit_count()<=3 for old in seen):duplicates+=1;continue
    seen.append(h);rows.append(row)
X=np.array([r['features'] for r in rows],dtype=np.float64)
X/=np.maximum(np.linalg.norm(X,axis=1,keepdims=True),1e-8)
logits=X@np.array(head['coefficients']).T+np.array(head['intercepts'])
exps=np.exp(logits-logits.max(axis=1,keepdims=True));scores=exps/exps.sum(axis=1,keepdims=True)
accepted=scores[:,head['classes'].index('eastern')]>=threshold
positive=np.array([r['species']=='eastern' for r in rows]);tp=int((accepted&positive).sum());fp=int((accepted&~positive).sum())
report={'cohort':'Additional 2023 sightings from observers absent from development; frozen model and threshold',
 'classifierSHA256':hashlib.sha256(model_bytes).hexdigest(),'photos':len(rows),'nearDuplicatesExcluded':duplicates,
 'easternCount':int(positive.sum()),'otherCount':int((~positive).sum()),'threshold':threshold,
 'suggestions':int(accepted.sum()),'correct':tp,'incorrect':fp,'precision':tp/int(accepted.sum()) if accepted.any() else None,
 'recall':tp/int(positive.sum()),'byLabel':{}}
for kind in sorted({r['species'] for r in rows}):
    mask=np.array([r['species']==kind for r in rows])
    report['byLabel'][kind]={'photos':int(mask.sum()),'easternSuggestions':int((mask&accepted).sum())}
(CACHE/f'fresh-evaluation{suffix}.json').write_text(json.dumps(report,indent=2))
(CACHE/f'fresh-review-manifest{suffix}.json').write_text(json.dumps([{k:v for k,v in r.items() if k!='features'} for r in rows],indent=2))
print(json.dumps(report,indent=2))
