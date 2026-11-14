"""Train compact linear heads; evaluate on held-out observers, not training photos.

Stage and sex annotations are exploratory labels. They cannot activate those
fields without visible-feature evidence and independent expert validation.
"""
import collections, hashlib, json, pathlib
import numpy as np
from PIL import Image, ImageOps
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

ROOT=pathlib.Path(__file__).resolve().parents[2];CACHE=ROOT/'.model-cache'

def image_hash(photo_id):
    with Image.open(CACHE/'images'/f'{photo_id}.jpg') as im:
        a=np.array(ImageOps.exif_transpose(im).convert('L').resize((9,8)))
        return int.from_bytes(np.packbits(a[:,1:]>a[:,:-1]).tobytes(),'big')

def main():
    raw=[json.loads(s) for s in (CACHE/'features.jsonl').read_text().splitlines()]
    rows=[];seen=[];duplicates=0
    for row in raw:
        h=image_hash(row['photo_id'])
        if any((h^old).bit_count()<=3 for old in seen):duplicates+=1;continue
        seen.append(h);rows.append(row)
    X=np.array([r.pop('features') for r in rows],dtype=np.float32)
    X/=np.maximum(np.linalg.norm(X,axis=1,keepdims=True),1e-8)
    # Observer-independent partition; do not move rows to improve a result.
    partitions=np.array(['train' if (n:=int(r['observer_group'][:8],16)%100)<70 else 'validation' if n<85 else 'test' for r in rows])
    report={'dataset':'iNaturalist CC0 / CC BY; research-grade taxon, unverified community age/sex annotations',
       'photos':len(rows),'perceptualDuplicatesRemoved':duplicates,'split':'observer-hash 70/15/15; no observer spans splits','heads':{}}
    export={'schemaVersion':1,'id':'eastern-box-mobilenet-v2-050-experiment-1','backbone':{'version':2,'alpha':.5,'inputRange':[0,1],'dimensions':1280},'heads':{}}
    for field in ['species','life_stage','sex']:
        usable=np.array([r[field]!='unknown' and (field=='species' or r['species']=='eastern') for r in rows])
        labels=np.array([r[field] for r in rows]);train=(partitions=='train')&usable;val=(partitions=='validation')&usable;test=(partitions=='test')&usable
        if min(train.sum(),val.sum(),test.sum())==0:continue
        candidates=[]
        for c in [.1,1,10,100]:
            m=LogisticRegression(C=c,max_iter=2000,class_weight='balanced',random_state=17).fit(X[train],labels[train])
            if field=='species':
                v=m.predict_proba(X[val])[:,list(m.classes_).index('eastern')];vy=labels[val]=='eastern'
                eligible=[]
                for threshold in np.arange(.5,1,.005):
                    a=v>=threshold;n=int(a.sum());tp=int((a&vy).sum())
                    if n>=30 and tp/n>=.97:eligible.append((tp,threshold))
                score=max((n for n,t in eligible),default=0)
            else:score=accuracy_score(labels[val],m.predict(X[val]))
            candidates.append((score,c,m))
        _,c,m=max(candidates,key=lambda x:(x[0],-x[1]));pred=m.predict(X[test]);p=m.predict_proba(X[test])
        details={'train':int(train.sum()),'validation':int(val.sum()),'test':int(test.sum()),'C':c,'classes':m.classes_.tolist(),
          'testAccuracy':float(accuracy_score(labels[test],pred)),'confusionMatrix':confusion_matrix(labels[test],pred,labels=m.classes_).tolist(),
          'classificationReport':classification_report(labels[test],pred,output_dict=True,zero_division=0),
          'deploymentApproved':False}
        if field=='species':
            idx=list(m.classes_).index('eastern');v=m.predict_proba(X[val])[:,idx];vy=labels[val]=='eastern'
            decisions=[]
            for threshold in np.arange(.5,1,.005):
                accept=v>=threshold;n=int(accept.sum());tp=int((accept&vy).sum());fp=int((accept&~vy).sum())
                decisions.append({'threshold':threshold,'suggestions':n,'correct':tp,'incorrect':fp,'precision':tp/n if n else None,'recall':tp/int(vy.sum())})
            passing=[d for d in decisions if d['suggestions']>=30 and d['precision']>=.97]
            threshold=passing[0]['threshold'] if passing else 1.0
            accept=p[:,idx]>=threshold;ty=labels[test]=='eastern';n=int(accept.sum());tp=int((accept&ty).sum());fp=int((accept&~ty).sum())
            details.update({'validationThresholds':decisions,'threshold':threshold,'testSuggestions':n,'testCorrect':tp,'testIncorrect':fp,
               'testSuggestionPrecision':tp/n if n else None,'testRecall':tp/int(ty.sum()),'testEasternCount':int(ty.sum()),'testOtherCount':int((~ty).sum())})
            details['candidateForBrowserTrial']=n>=30 and fp/max(n,1)<=.05 and details['testRecall']>=.25
            # No browser readiness claim is made by the training script.
        else:
            details['blockedReason']='Community annotations do not verify visible diagnostic evidence; expert review is required.'
        export['heads'][field]={'classes':m.classes_.tolist(),'coefficients':m.coef_.tolist(),'intercepts':m.intercept_.tolist(),'threshold':details.get('threshold',1.0),'enabled':False}
        report['heads'][field]=details
        for i in np.flatnonzero(test):
            row=rows[i];row.setdefault('predictions',{})[field]={'label':str(m.predict(X[i:i+1])[0]),'scores':m.predict_proba(X[i:i+1])[0].tolist()}
    (CACHE/'classifier.json').write_text(json.dumps(export,separators=(',',':')))
    (CACHE/'evaluation.json').write_text(json.dumps(report,indent=2))
    for i,r in enumerate(rows):r['split']=str(partitions[i])
    (CACHE/'review-manifest.json').write_text(json.dumps(rows,indent=2))
    print(json.dumps({k:{a:b for a,b in v.items() if a not in ['classificationReport','validationThresholds','confusionMatrix']} for k,v in report['heads'].items()},indent=2))

if __name__=='__main__':main()
