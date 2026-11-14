"""Evaluate broad turtle recognition separately from species resolution."""
import json,pathlib,numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[2];CACHE=ROOT/'.model-cache'
m=json.loads((ROOT/'models/eastern-box-v1/classifier.json').read_text())['heads']['species']
review={r['photo_id']:r for r in json.loads((CACHE/'review-manifest.json').read_text())}
report={'threshold':.95,'note':'Sum of existing turtle-class scores; not a calibrated probability. Community source labels and limited negative coverage do not establish general accuracy.','cohorts':{}}
for filename,cohorts in [('features.jsonl',['validation','test']),('fresh-features.jsonl',['additional'])]:
    raw=[json.loads(s) for s in (CACHE/filename).read_text().splitlines()]
    for split in cohorts:
        rows=[r for r in raw if split=='additional' or (r['photo_id'] in review and review[r['photo_id']]['split']==split)]
        X=np.array([r['features'] for r in rows]);X/=np.linalg.norm(X,axis=1,keepdims=True)
        z=X@np.array(m['coefficients']).T+np.array(m['intercepts'])
        p=np.exp(z-z.max(axis=1,keepdims=True));p/=p.sum(axis=1,keepdims=True)
        detected=(1-p[:,m['classes'].index('other')])>=.95
        actual=np.array([r['species']!='other' for r in rows])
        report['cohorts'][split]={'photos':len(rows),'turtles':int(actual.sum()),'nonTurtles':int((~actual).sum()),'detections':int(detected.sum()),'correct':int((detected&actual).sum()),'incorrect':int((detected&~actual).sum())}
(CACHE/'detection-evaluation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
