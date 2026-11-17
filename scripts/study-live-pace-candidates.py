"""Offline candidate study; does not replace the application's model."""
import hashlib,json,pathlib,sys
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier,RandomForestClassifier
from sklearn.model_selection import StratifiedGroupKFold,cross_val_score
from sklearn.metrics import accuracy_score,balanced_accuracy_score
base=pathlib.Path(sys.argv[1]); raw=json.loads((base/'analysis/features.json').read_text())
rows=[r for r in raw if r['features']]
labels={'1X DCA':1,'2X DCA':2,'3X DCA':3,'4X DCA':4,'LIGHT TRIM':5,'STRONG TRIM':6}
X=np.array([r['features'] for r in rows]);y=np.array([labels[r['expected']] for r in rows]);baseline=np.array([labels.get(r['actual'],0) for r in rows])
paired={'BRK-A':'BRK','BRK-B':'BRK','BF-A':'BF','BF-B':'BF','BH-A':'BH','BH':'BH','CRD-A':'CRD','CRD-B':'CRD','BBDO':'BBD','BBD':'BBD'}
groups=np.array([paired.get(r['symbol'],r['company'].lower()) for r in rows])
hold=np.array([int(hashlib.sha256(('auryn-20261112-pace-study:'+g).encode()).hexdigest()[:8],16)%5==0 for g in groups]);train=~hold
# Selection sees only development folds; the outer split stays fixed.
cv=list(StratifiedGroupKFold(n_splits=3,shuffle=True,random_state=12).split(X[train],y[train],groups[train]))
candidates=[('boost2',HistGradientBoostingClassifier(max_iter=120,max_depth=2,min_samples_leaf=10,l2_regularization=3,random_state=12)),('boost3',HistGradientBoostingClassifier(max_iter=120,max_depth=3,min_samples_leaf=10,l2_regularization=3,random_state=12)),('forest',RandomForestClassifier(n_estimators=250,max_depth=12,min_samples_leaf=2,max_features=.8,random_state=12,n_jobs=1))]
scores=[]
for name,m in candidates:
 score=cross_val_score(m,X[train],y[train],cv=cv,scoring='accuracy',n_jobs=1)
 scores.append({'name':name,'cvExact':float(score.mean()),'folds':score.tolist()})
selected=max(range(len(scores)),key=lambda i:scores[i]['cvExact']);name,m=candidates[selected];m.fit(X[train],y[train]);pred=m.predict(X)
def metrics(mask,p):
 yy=y[mask];pp=p[mask]
 return {'n':int(mask.sum()),'matches':int((yy==pp).sum()),'exact':float(accuracy_score(yy,pp)),'byReference':{k:{'n':int((yy==v).sum()),'matches':int(((yy==v)&(pp==v)).sum())} for k,v in labels.items()}}
out={'scope':'Offline candidate study on previously inspected reference snapshot. Outer rows excluded from fitting, but this is not pristine blind or later-date validation. No app model change.','selection':'development three-fold grouped exact agreement','selected':name,'crossValidation':scores,'inputSha256':hashlib.sha256((base/'analysis/features.json').read_bytes()).hexdigest(),'eligible':len(rows),'excludedFeatureRows':len(raw)-len(rows),'productionChanged':False,'results':{split:{'baseline':metrics(mask,baseline),'candidate':metrics(mask,pred)} for split,mask in [('development',train),('heldOutFromFit',hold),('all',np.ones(len(rows),dtype=bool))]},'rows':[{'symbol':r['symbol'],'split':'heldOutFromFit' if hold[i] else 'development','reference':int(y[i]),'baseline':int(baseline[i]),'candidate':int(pred[i])} for i,r in enumerate(rows)]}
(base/'analysis/candidate-study.json').write_text(json.dumps(out,indent=2));print(json.dumps({k:v for k,v in out.items() if k!='rows'},indent=2))
if name=='forest':
 model={'kind':'random-forest','scope':'Research candidate; not used by application','trainedThrough':'2026-11-11','createdOn':'2026-11-12','classes':[int(x) for x in m.classes_],'inputSha256':out['inputSha256'],'trainingSymbols':[r['symbol'] for i,r in enumerate(rows) if train[i]],'trees':[]}
 for estimator in m.estimators_:
  t=estimator.tree_
  model['trees'].append([[int(t.feature[i]),float(t.threshold[i]),int(t.children_left[i]),int(t.children_right[i]),t.value[i][0].tolist()] for i in range(t.node_count)])
 (base/'analysis/candidate-model.json').write_text(json.dumps(model,separators=(',',':')))
