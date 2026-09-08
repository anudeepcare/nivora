import test from 'node:test';
import assert from 'node:assert/strict';
import {assessHistoryCoverage} from '../.engine-test/auryn/v82/provider-coverage.js';

test('upstream 404 and missing history become clean provider coverage states',()=>{
  assert.equal(assessHistoryCoverage('APDN',{status:'error',code:404,message:'Not found'}).code,'PROVIDER_COVERAGE_MISSING');
  assert.equal(assessHistoryCoverage('AFBI',{message:'Upstream 404'}).code,'PROVIDER_COVERAGE_MISSING');
  assert.equal(assessHistoryCoverage('APMD',{values:[]}).code,'MARKET_HISTORY_UNAVAILABLE');
});

test('short history is explicit and non-executable rather than a generic failure',()=>{
  const x=assessHistoryCoverage('NEW', {values:Array.from({length:20},(_,i)=>({datetime:String(i),close:'1'}))});
  assert.equal(x.code,'INSUFFICIENT_HISTORY');
  assert.equal(x.analysisAllowed,false);
  assert.equal(x.executionAllowed,false);
});

test('adequate history passes coverage gate',()=>{
  const x=assessHistoryCoverage('MSFT',{values:Array.from({length:80},(_,i)=>({datetime:String(i),close:'1'}))});
  assert.equal(x.code,'OK');
  assert.equal(x.analysisAllowed,true);
});
