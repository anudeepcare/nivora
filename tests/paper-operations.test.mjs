import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),cache=new Map();
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 assert.ok(fs.existsSync(file),`Paper safety helper must exist: ${file}`);
 const exports={};cache.set(file,exports);
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{exports,require:n=>n.startsWith('.')?load(path.resolve(path.dirname(file),n+'.ts')):require(n),process,Buffer,Date,Request,Response,URL,AbortSignal,crypto:globalThis.crypto,console});return exports;
}
const api=()=>load('lib/server/paper-operations.ts');
const now=new Date('2026-10-16T15:00:00Z');
function snapshot(){return {observed_at:now.toISOString(),evidence_fingerprint:'evidence',evidence:{v995:{autonomous:true,policyVersion:'auryn-intelligence-2026-10-16'},v935:{snapshotId:'canonical',contract:'AURYN_V9_3_5_CANONICAL_SNAPSHOT',marketSnapshotId:'market',researchSnapshotId:'research'},v931:{policyVersion:'auryn-intelligence-2026-10-16',snapshotId:'research',canonicalPrimaryAction:'BUY',executionAction:'READY'},v934:{snapshotId:'technical',marketTruthSnapshotId:'market',actionMap:{invalidation:90,support:95,confirm:102,asOf:now.toISOString()},confirmed:{'1D':{rating:'BUY',score:70}},summary:{alignment:'BULLISH_ALIGNED'},coverage:{}}}};}
test('raw canonical intelligence is projected while missing data, stale data and mismatched provenance stay blocked',()=>{
 const h=api(),raw=snapshot();const r=h.normalizePaperEvidence(raw,now);assert.equal(r.ok,true);assert.equal(r.marketIntelligence.levels.invalidation,90);
 const projected={...raw,evidence:{...raw.evidence,v934:r.marketIntelligence}};assert.equal(h.normalizePaperEvidence(projected,now).ok,true);
 for(const change of [s=>s.observed_at='2026-10-16T14:00:00Z',s=>s.evidence.v934.actionMap=null,s=>s.evidence.v934.marketTruthSnapshotId='other',s=>s.evidence.v931.executionAction='BLOCKED']){const s=snapshot();change(s);assert.equal(h.normalizePaperEvidence(s,now).ok,false);}
});
test('legacy, client-origin and old-policy research is observation-only',()=>{
 for(const change of [s=>delete s.evidence.v995,s=>s.evidence.v995.autonomous=false,s=>s.evidence.v995.policyVersion='old',s=>s.evidence.v931.policyVersion='old']){const s=snapshot();change(s);assert.equal(api().normalizePaperEvidence(s,now).code,'TRUSTED_AUTONOMOUS_PROVENANCE_REQUIRED');}
});
test('canonical cron secret wins over legacy configuration without exposing either',()=>{
 const h=api(),env={CRON_SECRET:'canonical',TRADING_LAB_CRON_SECRET:'legacy'};
 assert.equal(h.authorizePaperCron(new Request('https://app',{headers:{authorization:'Bearer canonical'}}),env),true);
 assert.equal(h.authorizePaperCron(new Request('https://app',{headers:{authorization:'Bearer legacy'}}),env),false);
 assert.equal(h.authorizePaperCron(new Request('https://app',{headers:{authorization:'Bearer legacy'}}),{TRADING_LAB_CRON_SECRET:'legacy'}),true);
});
test('scheduler reports missing automatic activity and the actual fifteen-minute cadence',()=>{
 const h=api();assert.equal(h.paperSchedulerState({enabled:true,paused:false,session:'REGULAR',lastAutomaticRun:null,now}).state,'not-observed');
 assert.equal(h.paperSchedulerState({enabled:true,paused:false,session:'REGULAR',lastAutomaticRun:{started_at:'2026-10-16T14:00:00Z'},now}).state,'overdue');
 assert.equal(h.paperSchedulerState({enabled:false,paused:false,session:'REGULAR',lastAutomaticRun:null,now}).state,'disabled');
 assert.match(h.paperSchedulerState({enabled:true,paused:true,session:'REGULAR',lastAutomaticRun:null,now}).schedule,/15/);
});
test('pending buys reserve cash and position room; pending sells reserve available shares',()=>{
 const h=api(),s=h.reservePaperCapacity({equity:10000,cash:3000,buyingPower:3000},[{symbol:'A',qty:20,availableQty:20,marketValue:1000}],[{id:'one',symbol:'B',side:'buy',qty:10,filledQty:2,limitPrice:100},{id:'two',symbol:'A',side:'sell',qty:5,filledQty:0,limitPrice:50}]);
 assert.equal(s.account.cash,2200);assert.equal(s.positions.find(x=>x.symbol==='B').marketValue,800);assert.equal(s.positions.find(x=>x.symbol==='A').availableQty,15);
 assert.throws(()=>h.reservePaperCapacity({equity:10000,cash:3000,buyingPower:3000},[],[{id:'bad',symbol:'B',side:'buy',qty:10,filledQty:0,limitPrice:null}]),/PENDING_ORDER/);
});
test('broker available quantity already includes pending sells and is not reserved twice',()=>{
 const h=api(),account={equity:10000,cash:3000,buyingPower:3000};
 const orders=[{id:'sell-one',symbol:'A',side:'sell',qty:15,filledQty:5,status:'partially_filled'},{id:'sell-two',symbol:'A',side:'sell',qty:20,filledQty:0,status:'accepted'}];
 for(const [availableQty,expected] of [[70,70],[90,70],[60,60],[undefined,70]]){
  const s=h.reservePaperCapacity(account,[{symbol:'A',qty:100,availableQty,marketValue:5000}],orders);
  assert.equal(s.positions[0].availableQty,expected);
 }
});
test('new submissions reserve additional shares beyond the broker snapshot across a batch',()=>{
 const h=api(),account={equity:10000,cash:3000,buyingPower:3000};
 let s=h.reservePaperCapacity(account,[{symbol:'A',qty:100,availableQty:70,marketValue:5000}],[{id:'existing',symbol:'A',side:'sell',qty:30,filledQty:0,status:'accepted'}]);
 for(const [qty,expected] of [[10,60],[5,55]]){
  s=h.reservePaperCapacity(s.account,s.positions,[{id:`new-${qty}`,symbol:'A',side:'sell',qty,filledQty:0,status:'accepted'}],'new');
  assert.equal(s.positions[0].availableQty,expected);
 }
});
test('lease errors and a lost lease fail closed before work or submission',async()=>{
 const h=api();let work=0;
 await assert.rejects(()=>h.withPaperLease({rpc:async()=>({error:{message:'missing migration'}})},'run',async()=>work++),/PAPER_CONTROL/);
 await assert.rejects(()=>h.withPaperLease({rpc:async()=>({data:false,error:null})},'run',async()=>work++),/PAPER_BUSY_OR_PAUSED/);assert.equal(work,0);
 await assert.rejects(()=>h.assertPaperLease({rpc:async()=>({data:false,error:null})},'run'),/PAPER_LEASE_LOST/);
});
function submissionHarness({writeError=false,uncertain=false}={}){
 const rows=new Map();let transmissions=0;let accepted=null;
 const db={from:()=>({async insert(row){if(writeError)return {error:{code:'storage'}};if(rows.has(row.intent_id))return {error:{code:'23505'}};rows.set(row.intent_id,row);return {error:null};},update(patch){return {eq:async(k,v)=>{if(rows.has(v))Object.assign(rows.get(v),patch);return {error:null}}};},upsert:async()=>({error:null}),select(){return {eq(){return {maybeSingle:async()=>({data:rows.get('intent'),error:null})}}}}})};
 const broker={async submitOrder(order){transmissions++;accepted={...order,id:'broker',status:'accepted',qty:1,filledQty:0};if(uncertain)throw Error('timeout');return accepted},async getOrderByClientOrderId(){return accepted}};
 const args={db,broker,intent:{intent_id:'intent',symbol:'A',side:'BUY'},order:{clientOrderId:'stable-id',symbol:'A',side:'BUY',quantity:1,limitPrice:100},runId:'run',assertLease:async()=>{}};
 return {args,rows,get transmissions(){return transmissions}};
}
test('atomic intent claim permits one transmission across simultaneous callers',async()=>{
 const h=submissionHarness();const results=await Promise.all([api().submitAuditedPaperOrder(h.args),api().submitAuditedPaperOrder(h.args)]);assert.equal(h.transmissions,1);assert.ok(results.some(x=>x.status==='SUBMITTED'));assert.ok(results.some(x=>['DUPLICATE','RECONCILED'].includes(x.status)));
});
test('failed intent audit prevents transmission and an uncertain acknowledgment recovers the same client ID without resend',async()=>{
 const failed=submissionHarness({writeError:true});await assert.rejects(()=>api().submitAuditedPaperOrder(failed.args),/PAPER_INTENT_AUDIT/);assert.equal(failed.transmissions,0);
 const h=submissionHarness({uncertain:true});assert.equal((await api().submitAuditedPaperOrder(h.args)).status,'RECONCILED');await api().submitAuditedPaperOrder(h.args);assert.equal(h.transmissions,1);
});
test('unverifiable broker quantities or fill status cannot be recorded as a successful order',async()=>{
 const h=submissionHarness();
 for(const extra of [{qty:2},{qty:1,filledQty:2},{qty:1,filledQty:1,status:'filled',filledAvgPrice:null}]){
  await assert.rejects(()=>api().recordPaperOrder(h.args.db,h.args.intent,h.args.order,{id:'broker',clientOrderId:'stable-id',symbol:'A',side:'buy',status:'accepted',filledQty:0,...extra}),/BROKER_ORDER/);
 }
});
test('invalid account capacity is never coerced into an executable budget',()=>{
 for(const account of [{equity:100,cash:NaN,buyingPower:100},{equity:0,cash:100,buyingPower:100}])assert.throws(()=>api().reservePaperCapacity(account,[],[]),/ACCOUNT/);
});
test('fill reporting distinguishes a partial broker fill, full cumulative fill, and unverified historical activity',()=>{
 const h=api();assert.equal(h.paperFillStatus({qty:10,filled_quantity:4,broker_checked_at:'now'}),'PARTIALLY_FILLED');
 assert.equal(h.paperFillStatus({qty:10,filled_quantity:10,broker_checked_at:'now'}),'FILLED');
 assert.equal(h.paperFillStatus({qty:10,filled_quantity:0,broker_checked_at:'now'}),'UNFILLED');
 assert.equal(h.paperFillStatus({qty:10},true),'FILL_RECORDED_UNVERIFIED_TOTAL');
});

test('definitive broker rejection is recorded and never retransmitted',async()=>{const h=submissionHarness();let calls=0;h.args.broker.submitOrder=async()=>{calls++;throw Object.assign(Error('rejected'),{status:422})};h.args.broker.getOrderByClientOrderId=async()=>null;await assert.rejects(()=>api().submitAuditedPaperOrder(h.args),/BROKER_REJECTED/);assert.equal(h.rows.get('intent').status,'REJECTED');await api().submitAuditedPaperOrder(h.args);assert.equal(calls,1);});
