import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
let data;try{data=require('../lib/auryn/workspace/recovery.ts');}catch{data={};}
test('optional research storage failure preserves existing watchlist and holdings',()=>{
 assert.equal(typeof data.workspaceReadResult,'function');
 const r=data.workspaceReadResult({status:'rejected',reason:Error('storage unavailable')},{data:[{symbol:'MSFT'}],error:null},{data:[{symbol:'IREN'}],error:null});
 assert.deepEqual(r.watchSymbols,['MSFT']);assert.deepEqual(r.portfolioSymbols,['IREN']);assert.equal(r.storage,'unavailable');assert.ok(r.limitations.length);
});
test('discovery selects latest security evidence and excludes stale snapshots',()=>{
 assert.equal(typeof data.discoveryRows,'function');
 const row={symbol:'TEST',observed_at:'2026-10-16T12:00:00Z',financial:{metrics:[{key:'revenue',value:200,source:'SEC'}]},assessment:{newMoneyAction:'WATCH',dimensions:{business:{score:70}}}};
 const r=data.discoveryRows([row,{...row,observed_at:'2026-10-10T12:00:00Z'},{...row,symbol:'OLD',observed_at:'2026-09-01T12:00:00Z'}],Date.parse('2026-10-16T15:00:00Z'));
 assert.equal(r.length,1);assert.equal(r[0].symbol,'TEST');assert.equal(r[0].price,null);assert.equal(r[0].metrics[0].value,200);
});
test('options numeric conversion preserves missing values and rejects booleans',()=>{
 assert.equal(typeof data.providerNumber,'function');
 for(const v of [null,undefined,'',true,false,'abc'])assert.equal(data.providerNumber(v),null);
 assert.equal(data.providerNumber('0'),0);
});
test('options ranking needs a dated two-sided liquid quote and a measured delta',()=>{
 assert.equal(typeof data.optionQuoteEligible,'function');
 const now=Date.parse('2026-10-16T15:00:00Z'),q={bid:2,ask:2.1,mid:2.05,delta:.6,openInterest:500,updated:now/1000};
 assert.equal(data.optionQuoteEligible(q,now),true);
 for(const change of [{bid:null},{delta:null},{updated:now/1000-7200},{ask:4},{openInterest:0}])assert.equal(data.optionQuoteEligible({...q,...change},now),false);
});
test('independent ownership feeds never fabricate zero missing aggregates',()=>{const module=require('../lib/insider-transactions.ts');assert.equal(typeof module.applyOwnershipAvailability,'function');const r=module.applyOwnershipAvailability({institutionalScore:18,increased:0,reduced:0,newManagers:0},module.summarizeInsiderTransactions([]),false,false);assert.equal(r.institutional.institutionalScore,null);assert.equal(r.institutional.increased,null);assert.equal(r.insiders.grants,null);assert.equal(r.insiders.exercises,null);assert.equal(r.insiders.available,false);const valid=module.applyOwnershipAvailability({},module.summarizeInsiderTransactions([]),false,true);assert.equal(valid.insiders.grants,0);assert.equal(valid.insiders.available,true);});
