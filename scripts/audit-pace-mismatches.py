#!/usr/bin/env python3
"""Inspect saved comparisons without fitting or changing any production policy."""
import argparse, collections, csv, hashlib, json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('audit');p.add_argument('candidate');p.add_argument('--output',required=True);a=p.parse_args()
audit=json.loads(Path(a.audit).read_text());candidate=json.loads(Path(a.candidate).read_text());source={r['symbol']:r for r in audit['rows'] if r['status']=='compared'}
rows=[]
for r in candidate['rows']:
 if r['split']!='reserved' or r['candidate']==r['reference']:continue
 s=source[r['symbol']]
 rows.append({**r,'referenceClose':s['dcaClose'],'providerClose':s['providerClose'],'providerDate':s['lastBar'],'priceMatches':s['priceMatchCents'],'referencePriceMatchingDates':';'.join(s.get('referencePriceMatchingRecentDates',[])),'priceAlignedBaseline':s.get('priceAlignedCategory'),'baselineConfirmed':s.get('confirmedPace'),'baselineForming':s.get('formingPace'),'extensionPreserved':s.get('formingPace')==0,'triage':'preserved-extension-rule' if s.get('formingPace')==0 else 'price-alignment-review' if not s['priceMatchCents'] else 'category-boundary-review'})
output=Path(a.output);output.mkdir(parents=True,exist_ok=True)
with (output/'mismatch-triage.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
summary={'scope':'Diagnostic of an already explored sample; no new validation or causal attribution. Matching price does not prove matching timestamps or corporate-action basis.','n':len(rows),'triage':dict(collections.Counter(r['triage'] for r in rows)),'referenceToCandidate':dict(collections.Counter(r['reference']+' -> '+r['candidate'] for r in rows)),'dateAlignedBaselineResolves':sum(r['priceAlignedBaseline']==r['reference'] for r in rows if not r['priceMatches']),'productionChanged':False}
(output/'mismatch-triage.json').write_text(json.dumps(summary,indent=2)+'\n')
freeze={'purpose':'Freeze configuration and exclusions before collecting fresh observations; not a serialized trained model.','candidate':candidate['selected'],'evaluationScriptSha256':hashlib.sha256(Path('scripts/evaluate-pace-features.py').read_bytes()).hexdigest(),'auditSha256':hashlib.sha256(Path(a.audit).read_bytes()).hexdigest(),'existingSymbols':sorted(source),'referenceDate':audit['asOf'],'candidateConfiguration':{'max_iter':120,'max_depth':4,'min_samples_leaf':15,'l2_regularization':4,'random_state':8},'requirements':['New-symbol cohort excludes every existing symbol and related share class','Later-date cohort records reference close date and monthly forming/confirmed state explicitly','Corporate-action and quote bases must align before category comparison','No selection or tuning using new cohort labels','Report 1X/2X/3X/4X and trim counts separately','Report missing observations; never count them as matches'],'freshRowsCollected':0}
(output/'frozen-candidate-protocol.json').write_text(json.dumps(freeze,indent=2)+'\n')
with (output/'fresh-observations-template.csv').open('w') as f:f.write('symbol,observed_at,reference_close_date,reference_close,reference_zone,timeframe,reading_state,source_url,price_adjustment_basis\n')
print(json.dumps(summary,indent=2))
