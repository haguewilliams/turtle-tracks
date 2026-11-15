"""Select exploratory stage/sex abstention thresholds on validation only."""
import collections, hashlib, json, pathlib, statistics
ROOT=pathlib.Path(__file__).resolve().parents[2]
CACHE=ROOT/'.model-cache/vision-evaluation'
rows=[json.loads(s) for s in (CACHE/'browser-candidate-scores.jsonl').read_text().splitlines()]
assert len({r['id'] for r in rows})==len(rows)
def decision(row,field,threshold,kind='q8'):
    scores=row['models'][kind]['heads'][field]
    if field=='species':return 'eastern' if scores['eastern']>=threshold else 'unknown'
    if row['models'][kind]['heads']['species']['eastern']<.63:return 'unknown'
    best=max(scores,key=scores.get)
    return best if scores[best]>=threshold else 'unknown'
def metrics(subset,field,threshold,kind='q8'):
    usable=[r for r in subset if r['reference'][field]!='unknown' and (field=='species' or r['reference']['species']=='eastern')]
    accepted=[(r,decision(r,field,threshold,kind)) for r in usable if decision(r,field,threshold,kind)!='unknown']
    correct=sum(label==r['reference'][field] for r,label in accepted)
    out={'photos':len(usable),'suggestions':len(accepted),'correct':correct,'incorrect':len(accepted)-correct,'abstentions':len(usable)-len(accepted),'precision':correct/len(accepted) if accepted else None}
    if field=='species':
        positive=sum(r['reference']['species']=='eastern' for r in usable)
        out.update(eastern=positive,recall=correct/positive if positive else None)
    out['byLabel']={label:{'suggestions':sum(p==label for _,p in accepted),'correct':sum(p==label and r['reference'][field]==label for r,p in accepted)} for label in sorted({r['reference'][field] for r in usable})}
    return out
groups={'validation':[r for r in rows if r.get('split')=='validation'],'test':[r for r in rows if r.get('split')=='test'],'additional':[r for r in rows if r['cohort'] not in ['development','internet','fresh-stage']],'internet':[r for r in rows if r['cohort']=='internet'],'freshStage':[r for r in rows if r['cohort']=='fresh-stage']}
report={'scope':'Previously used comparison cohorts, not new independent validation. Community labels do not validate visible sex/stage evidence. Thresholds selected only on original validation partition.','photos':len(rows),'quantization':json.loads((CACHE/'bioclip/quantization.json').read_text()),'species':{kind:{k:metrics(v,'species',.63,kind) for k,v in groups.items()} for kind in ['fp16','q8']},'exploratory':{}}
for field in ['life_stage','sex']:
    thresholds=[round(.5+i*.01,2) for i in range(50)]
    comparisons=[{'threshold':t,**metrics(groups['validation'],field,t)} for t in thresholds]
    passing=[r for r in comparisons if r['suggestions']>=20 and r['precision']>=.95 and all(x['suggestions']>=8 and x['correct']/x['suggestions']>=.95 for x in r['byLabel'].values())]
    selected=passing[0]['threshold'] if passing else 1.
    report['exploratory'][field]={'selectedThreshold':selected,'validationPassed':bool(passing),'deploymentApproved':False,'validationThresholds':comparisons,'cohorts':{k:metrics(v,field,selected) for k,v in groups.items()}}
report['nativeRuntimeSeconds']={kind:{'median':statistics.median(r['models'][kind]['seconds'] for r in rows),'max':max(r['models'][kind]['seconds'] for r in rows)} for kind in ['fp16','q8']}
report['adultOnlyTrial']={'threshold':.8,'selection':'Selected from original validation results before evaluating that threshold on test and before collecting fresh-stage photos; both-label stage trial failed.','limitations':'Community labels; four juveniles in fresh cohort is limited negative coverage. Attribution-string exclusion cannot certify observer independence. No exact-age inference.','cohorts':{}}
for name,group in groups.items():
    usable=[r for r in group if r['reference']['species']=='eastern' and r['reference']['life_stage']!='unknown']
    accepted=[r for r in usable if r['models']['q8']['heads']['species']['eastern']>=.63 and r['models']['q8']['heads']['life_stage']['adult']>=.8]
    correct=sum(r['reference']['life_stage']=='adult' for r in accepted)
    report['adultOnlyTrial']['cohorts'][name]={'photos':len(usable),'sourceAdults':sum(r['reference']['life_stage']=='adult' for r in usable),'sourceJuveniles':sum(r['reference']['life_stage']=='juvenile' for r in usable),'suggestions':len(accepted),'correct':correct,'incorrect':len(accepted)-correct,'abstentions':len(usable)-len(accepted)}
target=ROOT/'tools/vision-evaluation/results/browser-candidate-evaluation.json'
target.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({**report,'exploratory':{k:{a:b for a,b in v.items() if a!='validationThresholds'} for k,v in report['exploratory'].items()}},indent=2))
