#!/usr/bin/env python3
"""Offline, deterministic candidate evaluation. Never writes production policy.
Requires the preserved comparison.json; reference labels are not ground truth.
"""
import argparse, hashlib, json, pathlib
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('--output',required=True);args=p.parse_args()
data=pathlib.Path(args.input).read_bytes();raw=json.loads(data)
rows=[r for r in raw['rows'] if r['status']=='compared']
# Keep known alternate share classes together. No rule uses the ticker.
groups={'GOOGL':'GOOG','BRK.B':'BRK.A','BBDO':'BBD','FOX':'FOXA','NWS':'NWSA','UAA':'UA'}
def fold(r):
 key=groups.get(r['symbol'],r['symbol'])
 return 'holdout' if int(hashlib.sha256(('auryn-pace-20261108:'+key).encode()).hexdigest()[:8],16)%10<3 else 'development'
def predict(r,c):
 if r['formingPace']==0:return r['formingComparableCategory']
 f=r['formulaInputs'];d=f['deviation'];z=f['z']
 for level,distance,spread in [(4,35,1.3),(3,25,.95),(2,10,.5)]:
  if d<=-distance*c['distanceScale'] and z<=-spread*c['spreadScale']:
   return str(min(level,2) if level>=3 and not f['cycleCorroborated'] else level)
 return '1'
def score(rs,c=None):
 pairs=[(r['dcaZone'],predict(r,c) if c else r['formingComparableCategory']) for r in rs]
 classes={k:{'n':sum(a==k for a,b in pairs),'matches':sum(a==k and a==b for a,b in pairs)} for k in ['1','2','3','4','LIGHT_TRIM','STRONG_TRIM']}
 for v in classes.values():v['agreement']=v['matches']/v['n'] if v['n'] else None
 deep=[(a,b) for a,b in pairs if a in ['2','3','4']]
 return {'n':len(rs),'exact':sum(a==b for a,b in pairs)/len(rs),'deeperN':len(deep),'deeperExact':sum(a==b for a,b in deep)/len(deep),'macro':sum(classes[k]['agreement'] for k in ['1','2','3','4'])/4,'classes':classes,'matrix':{a+' -> '+b:sum(x==a and y==b for x,y in pairs) for a,b in sorted(set(pairs))}}
dev=[r for r in rows if fold(r)=='development'];hold=[r for r in rows if fold(r)=='holdout'];baseline=score(dev)
# Small predeclared grid; selecting only on development balanced-category agreement.
configs=[{'distanceScale':d,'spreadScale':z} for d in [.5,.7,.85,1] for z in [.5,.75,1]]
trials=[{'config':c,'score':score(dev,c)} for c in configs]
eligible=[t for t in trials if t['score']['classes']['1']['agreement']>=baseline['classes']['1']['agreement']-.02 and t['score']['exact']>=baseline['exact']]
best=max(eligible,key=lambda t:(t['score']['macro'],t['score']['exact'],t['config']['distanceScale'],t['config']['spreadScale']))
report={'scope':'Saved Nov 6 snapshot; reference-label agreement, not investment accuracy. Historical aggregate results were already inspected; this is a reserved-symbol diagnostic, not a pristine independent validation. No later-date reference labels available.','inputSha256':hashlib.sha256(data).hexdigest(),'split':'SHA256(auryn-pace-20261108:issuer-key) mod 10 < 3 holdout; known paired classes grouped; remaining issuer overlap unverified.','candidateCount':len(configs),'selected':best['config'],'development':{'baseline':baseline,'candidate':best['score']},'holdout':{'baseline':score(hold),'candidate':score(hold,best['config'])},'allSnapshot':{'baseline':score(rows),'candidate':score(rows,best['config'])},'productionPolicyChanged':False,'promotionStatus':'Research candidate only; no temporal validation, sparse trim coverage, and reference-methodology unknown.','trials':trials,'rows':[{'symbol':r['symbol'],'split':fold(r),'reference':r['dcaZone'],'baseline':r['formingComparableCategory'],'candidate':predict(r,best['config']),'samePrice':r['priceMatchCents']} for r in rows]}
out=pathlib.Path(args.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['selected','development','holdout','allSnapshot','productionPolicyChanged']},indent=2))
