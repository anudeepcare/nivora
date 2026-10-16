import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
async function get(fail){
  const modules=new Map();
  const fact={val:100,start:'2025-01-01',end:'2025-12-31',filed:'2026-02-15',accn:'0000000001-26-000001',form:'10-K'};
  function load(file){if(modules.has(file))return modules.get(file).exports;const m={exports:{}};modules.set(file,m);const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(compiled,{module:m,exports:m.exports,require:name=>{
    if(name==='@/lib/shared-cache')return {nowIso:()=> '2026-10-16T12:00:00Z',sharedJson:async(url)=>{if(url.includes('company_tickers'))return {0:{ticker:'TEST',cik_str:1,title:'Test'}};if(url.includes(fail??'never'))throw new Error('Upstream 429');return url.includes('companyfacts')?{_aurynRetrievedAt:'2026-10-15T10:00:00Z',facts:{'us-gaap':{Revenues:{units:{USD:[fact]}}}}}:{_aurynRetrievedAt:'2026-10-16T10:00:00Z',filings:{recent:{form:['10-K'],filingDate:['2026-02-15'],accessionNumber:['0000000001-26-000001'],primaryDocument:['annual.htm']}}};}};
    return name.startsWith('@/')?load(path.resolve(name.slice(2)+'.ts')):require(name);
  },process:{env:{}},Date,Map,Set,URL,Request,Response});return m.exports;}
  const response=await load(path.resolve('app/api/company/[symbol]/route.ts')).GET(new Request('http://localhost/api/company/TEST'),{params:Promise.resolve({symbol:'TEST'})});return response.json();
}
test('submissions outage preserves usable company facts and identifies the failed endpoint',async()=>{
  const c=await get('submissions');assert.equal(c.rawMetrics.revenue,100);assert.equal(c.availability.filings.state,'RATE_LIMITED');assert.equal(c.availability.fundamentals.state,'AVAILABLE');
});
test('facts outage preserves filing links and does not invent empty fundamentals',async()=>{
  const c=await get('companyfacts');assert.equal(c.filings.length,1);assert.equal(c.rawMetrics.revenue,null);assert.equal(c.availability.fundamentals.state,'RATE_LIMITED');
});
test('cached provider retrieval time is not relabeled as the new response time',async()=>{
  const c=await get();assert.equal(c.freshness.fundamentalsAt,'2026-10-15T10:00:00Z');assert.equal(c.asOf,'2026-02-15');assert.equal(c.freshness.responseAt,'2026-10-16T12:00:00Z');
});
