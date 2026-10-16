import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../components/portfolio/valuation.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const module={exports:{}};new Function('module','exports',compiled)(module,module.exports);
const {positivePrice,positionValue,valuationSummary,validPosition}=module.exports;
test('missing, zero, negative and malformed quotes remain unavailable',()=>{for(const value of [null,undefined,'',0,-2,NaN,'broken'])assert.equal(positivePrice(value),null);assert.equal(positivePrice('12.5'),12.5)});
test('cost basis is never substituted for market price',()=>{assert.equal(positionValue({shares:10,avg_cost:100,asset_type:'EQUITY'},{displayPrice:null}),null);assert.equal(positionValue({shares:10,avg_cost:100,asset_type:'EQUITY'},{displayPrice:120}),1200)});
test('cash is shares and unsupported currencies are not silently valued as USD',()=>{assert.equal(positionValue({asset_type:'CASH',shares:500,currency:'USD'},null),500);assert.equal(positionValue({asset_type:'CASH',shares:500,currency:'EUR'},null),null)});
test('partial valuation labels total unavailable and P/L covers priced assets only',()=>{const rows=[{symbol:'A',shares:10,avg_cost:100,asset_type:'EQUITY'},{symbol:'B',shares:10,avg_cost:50,asset_type:'EQUITY'},{symbol:'USD',currency:'USD',shares:50,asset_type:'CASH'}];assert.deepEqual(valuationSummary(rows,{A:{market:{displayPrice:120}},B:{market:{displayPrice:null}}}),{knownValue:1250,unrealized:200,missing:1,totalValue:null})});
test('edit and add share validation rejects negative or absent quantities and costs',()=>{assert.equal(validPosition(1,0),true);for(const [qty,cost] of [[0,1],[-1,2],[1,-1],['',1],[1,''],[Infinity,1]])assert.equal(validPosition(qty,cost),false)});
test('stale or unverified research cannot contribute current calls or thesis scores',()=>{
 const project=module.exports.currentResearch;
 assert.equal(typeof project,'function','research presentation must enforce canonical readiness');
 for(const state of ['STALE_VERIFIED','ANALYSIS_REQUIRED',undefined]){
  const result=project({state,action:'BUY',ownerAction:'SELL',longTermAction:'ATTRACTIVE',thesisScore:90});
  assert.equal(result.action,null);assert.equal(result.ownerAction,null);assert.equal(result.thesisScore,null);
 }
 assert.equal(project({state:'READY',action:'BUY',ownerAction:'HOLD',thesisScore:80}).ownerAction,'HOLD');
 assert.equal(project({state:'READY',action:'BUY',ownerAction:'HOLD',thesisScore:80}).thesisScore,80);
});
