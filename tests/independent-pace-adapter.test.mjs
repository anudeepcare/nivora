import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const file='lib/independent-pace-adapter.ts';
test('inactive evidence adapter exists',()=>assert.ok(fs.existsSync(file)));
const request=()=>({providerTicker:'TEST.US',from:'2026-01-01',to:'2026-05-14',asOf:'2026-05-15'});
const profile=()=>({General:{Code:'TEST',Exchange:'NASDAQ',CurrencyCode:'USD',Type:'Common Stock',IsDelisted:false}});
const rows=()=>[{date:'2026-01-02',close:100,adjusted_close:10},{date:'2026-05-14',close:20,adjusted_close:20}];
async function collect(req=request(),general=profile(),history=rows()){
 const calls=[];const read=async(path,params,ttl)=>{calls.push({path,params,ttl});return calls.length===1?general:history;};
 const {collectIndependentPriceEvidence}=await import('../lib/independent-pace-adapter.ts');
 return {result:await collectIndependentPriceEvidence(read,req),calls};
}
test('uses one adjusted snapshot, preserves actual venue and withholds trust and signal',async()=>{
 const {result:r,calls}=await collect();assert.equal(r.status,'evidence-only');assert.equal(r.readyForPace,false);assert.equal(r.stage,null);assert.equal(r.instruction,null);
 assert.deepEqual(r.daily.map(p=>p.close),[10,20]);assert.equal(r.security.venue,'NASDAQ');assert.equal(r.security.providerTicker,'TEST.US');assert.equal(r.provenance.originalFetchedAt,null);assert.equal(r.provenance.calendarVerified,false);assert.match(r.provenance.evidenceHash,/^[0-9a-f]{64}$/);assert.equal(calls.length,2);assert.equal(calls[0].path,'v1.1/fundamentals/TEST.US');assert.equal(calls[1].path,'eod/TEST.US');assert.equal(calls[1].params.period,'d');assert.ok(Object.isFrozen(r.daily[0]));
});
test('invalid identity/type/status/currency stops before price request',async()=>{
 for(const mutate of [g=>g.General.Code='OTHER',g=>g.General.Type='ETF',g=>g.General.IsDelisted=true,g=>delete g.General.IsDelisted,g=>g.General.CurrencyCode='CAD',g=>g.General.Exchange='LSE']){
 const p=profile();mutate(p);const {result,calls}=await collect(request(),p);assert.equal(result.status,'unavailable');assert.equal(calls.length,1);
 }
});
test('bad requests spend no provider calls',async()=>{
 for(const mutate of [r=>r.providerTicker='../secret',r=>r.providerTicker='TEST.LSE',r=>r.from='2026-02-30',r=>r.to='2026-05-16',r=>r.from='2026-06-01']){const req=request();mutate(req);const {result,calls}=await collect(req);assert.equal(result.status,'unavailable');assert.equal(calls.length,0);}
});
test('never substitutes raw close; invalid/duplicate/out-of-order/future rows withhold all evidence',async()=>{
 for(const history of [[{date:'2026-01-02',close:100}], [...rows(),rows()[1]],rows().reverse(),[{date:'2026-05-16',adjusted_close:10}],[{date:'2026-01-02',adjusted_close:Infinity}],[]]){const {result}=await collect(request(),profile(),history);assert.equal(result.status,'unavailable');assert.equal(result.daily.length,0);}
});
test('provider errors do not leak tokens, and no fallback spends more requests',async()=>{
 const {collectIndependentPriceEvidence}=await import('../lib/independent-pace-adapter.ts');let calls=0;const result=await collectIndependentPriceEvidence(async()=>{calls++;throw Error('token=SECRET');},request());assert.equal(calls,1);assert.equal(result.status,'unavailable');assert.doesNotMatch(JSON.stringify(result),/SECRET/);
});
test('request identity is snapshotted across asynchronous reads',async()=>{
 const {collectIndependentPriceEvidence}=await import('../lib/independent-pace-adapter.ts');const req=request();const calls=[];
 const result=await collectIndependentPriceEvidence(async path=>{calls.push(path);if(calls.length===1){req.providerTicker='OTHER.US';return profile();}return rows();},req);
 assert.equal(result.status,'evidence-only');assert.equal(calls[1],'eod/TEST.US');
});
