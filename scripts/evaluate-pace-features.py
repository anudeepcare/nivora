#!/usr/bin/env python3
"""Research-only technical feature comparison; never imported by the application."""
import argparse,hashlib,json,pathlib
import numpy as np
from sklearn.tree import DecisionTreeClassifier,export_text
from sklearn.ensemble import HistGradientBoostingClassifier,RandomForestClassifier,ExtraTreesClassifier
from sklearn.model_selection import StratifiedKFold,cross_val_score
from sklearn.metrics import confusion_matrix
p=argparse.ArgumentParser();p.add_argument('audit');p.add_argument('--output',required=True);p.add_argument('--export-model');a=p.parse_args();base=pathlib.Path(a.audit)
report=json.loads((base/'comparison.json').read_text());rows=[r for r in report['rows'] if r['status']=='compared'];groups={'GOOGL':'GOOG','BRK.B':'BRK.A','BBDO':'BBD','FOX':'FOXA','NWS':'NWSA','UAA':'UA'}
def ishold(r):return int(hashlib.sha256(('auryn-pace-20261108:'+groups.get(r['symbol'],r['symbol'])).encode()).hexdigest()[:8],16)%10<3
features=[];names=[]
for r in rows:
 source=json.loads((base/'raw'/f"{r['symbol']}.json").read_text());bars=[]
 for line in source['raw'].strip().split('\n')[1:]:
  t,o,h,l,c,v=line.split(';')
  if t<='2026-11-06':bars.append((t,float(c),float(h),float(l)))
 bars.sort();monthly={}
 for t,c,h,l in bars:monthly[t[:7]]=c
 current=bars[-1][1];past=np.array(list(monthly.values())[:-1]);cl=np.array([b[1] for b in bars]);f={}
 for n in [6,12,18,24]:
  x=past[-n:];mu=x.mean();sd=max(x.std(ddof=1),mu*.01)
  f[f'month{n}_distance']=current/mu-1;f[f'month{n}_z']=(current-mu)/sd
  f[f'month{n}_drawdown']=current/x.max()-1;f[f'month{n}_range']=(current-x.min())/max(x.max()-x.min(),mu*.01)
  f[f'month{n}_return']=current/x[0]-1
  xx=np.arange(len(x));slope,intercept=np.polyfit(xx,np.log(x),1);res=np.log(x)-(intercept+slope*xx)
  f[f'month{n}_trend_z']=(np.log(current)-(intercept+slope*len(x)))/max(res.std(),.05)
 for n in [20,50,100,200,252]:
  x=cl[-n:];f[f'day{n}_distance']=current/x.mean()-1;f[f'day{n}_drawdown']=current/x.max()-1
  f[f'day{n}_volatility']=np.diff(np.log(x)).std()
 changes=np.diff(cl[-15:]);gain=np.maximum(changes,0).mean();loss=np.maximum(-changes,0).mean();f['rsi14']=100 if loss==0 else 100-100/(1+gain/loss)
 f['cycle_z']=r['formulaInputs']['z'];f['cycle_distance']=r['formulaInputs']['deviation']/100
 names=list(f);features.append(list(f.values()))
X=np.array(features);y=np.array([r['dcaZone'] for r in rows]);hold=np.array([ishold(r) for r in rows]);eligible=np.array([r['formingPace']!=0 and r['dcaZone'] in ['1','2','3','4'] for r in rows]);train=(~hold)&eligible
candidates=[('tree-depth3',DecisionTreeClassifier(max_depth=3,min_samples_leaf=10,random_state=8)),('tree-depth5',DecisionTreeClassifier(max_depth=5,min_samples_leaf=8,random_state=8)),('forest',RandomForestClassifier(n_estimators=150,max_depth=7,min_samples_leaf=5,max_features=.7,random_state=8,n_jobs=1)),('boost-depth2',HistGradientBoostingClassifier(max_iter=80,max_depth=2,min_samples_leaf=12,l2_regularization=2,random_state=8)),('boost-depth3',HistGradientBoostingClassifier(max_iter=80,max_depth=3,min_samples_leaf=12,l2_regularization=2,random_state=8))]
candidates += [('extra-trees',ExtraTreesClassifier(n_estimators=250,max_depth=10,min_samples_leaf=3,max_features=.8,random_state=8,n_jobs=1)),('boost-depth4',HistGradientBoostingClassifier(max_iter=120,max_depth=4,min_samples_leaf=15,l2_regularization=4,random_state=8))]
cv=StratifiedKFold(n_splits=4,shuffle=True,random_state=8);scores=[]
for name,model in candidates:
 folds=cross_val_score(model,X[train],y[train],cv=cv,scoring='balanced_accuracy',n_jobs=1);scores.append({'name':name,'mean':float(folds.mean()),'folds':folds.tolist()})
selected=max(range(len(scores)),key=lambda i:scores[i]['mean']);name,model=candidates[selected];model.fit(X[train],y[train]);pred=model.predict(X)
# Preserve production extension handling: one reference trim cannot train a trim model.
for i,r in enumerate(rows):
 if r['formingPace']==0:pred[i]=r['formingComparableCategory']
basepred=np.array([r['formingComparableCategory'] for r in rows])
def score(mask,pred):
 idx=np.where(mask)[0];deep=[i for i in idx if y[i] in ['2','3','4']];return {'n':len(idx),'matches':int(sum(pred[idx]==y[idx])),'exact':float(np.mean(pred[idx]==y[idx])),'deeperN':len(deep),'deeperMatches':int(sum(pred[deep]==y[deep])),'deeperExact':float(np.mean(pred[deep]==y[deep])),'byReference':{k:{'n':int(sum(y[idx]==k)),'matches':int(sum((y[idx]==k)&(pred[idx]==k)))} for k in ['1','2','3','4','LIGHT_TRIM','STRONG_TRIM']}}
out={'scope':'Research-only imitation of saved reference labels, not investment accuracy. Reserved symbols were already used for the simpler threshold diagnostic, so this is NOT a pristine final holdout. No later-date validation. No production formula changed.','asOf':report['asOf'],'inputSha256':hashlib.sha256((base/'comparison.json').read_bytes()).hexdigest(),'features':names,'selection':'Four-fold development balanced accuracy; selected before feature-model reserved-symbol evaluation. Known paired classes grouped in outer split; inner folds and other issuer overlap not group-verified.','crossValidation':scores,'selected':name,'productionPolicyChanged':False,'promotionBlockedBy':['No temporal reference labels','Unknown proprietary method','Only one trim reference','Exploratory reuse of reserved symbols','No performance backtest of candidate'],'results':{k:{'baseline':score(mask,basepred),'candidate':score(mask,pred)} for k,mask in [('development',~hold),('reservedSymbols',hold),('allSnapshot',np.ones(len(rows),dtype=bool)),('reservedSamePrice',hold&np.array([r['priceMatchCents'] for r in rows]))]},'rows':[{'symbol':r['symbol'],'split':'reserved' if hold[i] else 'development','reference':y[i],'baseline':basepred[i],'candidate':pred[i]} for i,r in enumerate(rows)]}
path=pathlib.Path(a.output);path.write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'selected':name,'crossValidation':scores,'results':out['results']},indent=2))

if a.export_model:
 def tree_nodes(t):
  return [[float(n['value']),int(n['feature_idx']),float(n['num_threshold']),int(n['left']),int(n['right']),int(n['is_leaf']),int(n['missing_go_to_left'])] for n in t.nodes]
 artifact={'version':'monthly-v6','trainedThrough':'2026-11-06','availableFrom':'2026-11-07','features':names,'classes':[int(c) for c in model.classes_],'baseline':model._baseline_prediction[0].tolist(),'trees':[[tree_nodes(t) for t in stage] for stage in model._predictors],'trainingSymbols':[r['symbol'] for i,r in enumerate(rows) if train[i]],'inputSha256':out['inputSha256']}
 dest=pathlib.Path(a.export_model)
 dest.write_text('/* Generated fixed technical classifier. Do not hand-edit weights. */\nexport const paceModel: {version:string;trainedThrough:string;availableFrom:string;features:string[];classes:number[];baseline:number[];trees:number[][][][];trainingSymbols:string[];inputSha256:string} = '+json.dumps(artifact,separators=(',',':'))+';\n')
 golden=[{'symbol':r['symbol'],'features':features[i],'expected':int(model.predict(X[i:i+1])[0])} for i,r in enumerate(rows)]
 pathlib.Path('tests/fixtures/pace-v6-golden.json').write_text(json.dumps(golden,separators=(',',':'))+'\n')
