import test from 'node:test';import assert from 'node:assert/strict';
import {decisionGuide,decisionChecklist} from '../lib/decision-guide.ts';import {demoData} from './fixtures/demo.ts';
const base=demoData.research.MSFT;
const fresh=(over={})=>({...base,retrievedAt:'2026-10-19T14:00:00Z',priceObservedAt:'2026-10-19T14:38:00Z',...over,quote:{...base.quote,asOf:'2026-10-19T14:38:00Z',stale:false,...(over.quote||{})}});
const variants=()=>{const f=fresh();return [f,fresh({company:{...base.company,sector:'Technology'},evidence:{...base.evidence,profile:{...(base.evidence?.profile||{}),sector:'Technology',industry:'Software - Infrastructure'}}}),fresh({quote:{asOf:'2026-10-01T14:38:00Z'}}),fresh({company:{...base.company,foreignListing:true}}),{...f,history:[]},fresh({company:{...base.company,assetType:'crypto'}})];};
test('the checklist adds no rule: a buy candidate holds exactly when every check is met',()=>{
 for(const r of variants()){const g=decisionGuide(r),c=decisionChecklist(r);assert.equal(g.buying.code==='candidate',c.candidateMet,g.buying.code+' '+c.checks.filter(x=>x.state!=='met').map(x=>x.id));}
});
test('every check has a state and plain text, and unknown never counts as met',()=>{
 for(const r of variants()){for(const c of decisionChecklist(r).checks){assert.ok(['met','not-met','unknown'].includes(c.state));assert.ok(c.label.length>0);if(c.state!=='unknown')assert.ok(c.detail.length>0);}}
 const none=decisionChecklist({...fresh(),evidence:undefined});assert.equal(none.candidateMet,false);assert.ok(none.checks.some(c=>c.state==='unknown'||c.state==='not-met'));
});
test('trim and sell triggers mirror the guide labels',()=>{
 for(const r of variants()){const g=decisionGuide(r),t=Object.fromEntries(decisionChecklist(r).triggers.map(x=>[x.id,x]));if(g.owning.code==='trim')assert.equal(t.trim.active,true);if(g.owning.code==='exit')assert.equal(t.sell.active,true);if(t.trim.active===true&&g.buying.code!=='data'&&g.buying.code!=='specialist')assert.equal(g.owning.code,'trim');}
});
