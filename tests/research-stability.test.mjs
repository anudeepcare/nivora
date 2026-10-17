import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(import.meta.url),root=path.resolve('.'),cache=new Map();
function load(relative){
 const file=path.resolve(root,relative);if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('module','exports','require',compiled)(module,module.exports,id=>{
  if(id.startsWith('.')||id.startsWith('@/')){const base=id.startsWith('@/')?path.resolve(root,id.slice(2)):path.resolve(path.dirname(file),id);return load(fs.existsSync(base+'.ts')?base+'.ts':base+'.tsx');}
  return require(id);
 });return module.exports;
}

const {createQuoteRefreshController}=load('components/portfolio/quote-refresh.ts');
const {firstGlance}=load('lib/research-first-glance.ts');
const {dcaAllocationContext}=load('lib/dca-market-signal.ts');
test('a pullback signal cannot imply adding when the owner assessment says Reduce',()=>{
 const result=dcaAllocationContext({research:{state:'READY',decision:{ownerAction:'REDUCE',newMoneyAction:'WAIT'}}});
 assert.equal(result.canSuggestAdding,false);assert.match(result.label,/reduce|risk review/i);
});
test('missing company evidence keeps the DCA reading explicitly price-only',()=>{
 assert.equal(dcaAllocationContext(null).label,'Price signal only');
});
test('portfolio publishes a completed quote cycle once, not provisional subtotals',async()=>{
 const publications=[];let release;const gate=new Promise(r=>release=r);
 const controller=createQuoteRefreshController({requests:['A','B'],getQuotes:()=>({}),onQuotes:q=>publications.push(q),onState:()=>{},setTimer:()=>0,clearTimer:()=>{},fetcher:async(_,{onProgress})=>{onProgress?.({A:{market:{displayPrice:10}}});await gate;return{A:{market:{displayPrice:10}},B:{market:{displayPrice:20}}}}});
 const work=controller.wake();await Promise.resolve();assert.equal(publications.length,0,'Partial batch must not change the portfolio total');release();await work;assert.equal(publications.length,1);assert.equal(publications[0].B.market.displayPrice,20);controller.dispose();
});
test('a WAIT caused by missing valuation is identified separately from a timing wait',()=>{
 const d={newMoneyAction:'WAIT',ownerAction:'HOLD',pillars:{business:{score:80},valuation:{score:null}},dimensions:{valuation:{state:'UNAVAILABLE'}},setupState:'TRENDING'};
 assert.equal(firstGlance(d,'READY').label,'Needs valuation');assert.match(firstGlance(d,'READY').reason,/valuation/i);assert.equal(firstGlance(d,'READY').owner,'Hold');
});
test('a measured timing wait retains the engine action and explains its condition',()=>{
 const d={newMoneyAction:'WAIT',ownerAction:'HOLD',pillars:{business:{score:80},valuation:{score:60}},setupState:'REPAIRING'};
 assert.equal(firstGlance(d,'READY').label,'Wait for support');assert.match(firstGlance(d,'READY').reason,/support|hold|confirm/i);
});
test('missing business data never appears as a timing recommendation',()=>{
 const d={newMoneyAction:'WAIT',pillars:{business:{score:null},valuation:{score:null}}};assert.equal(firstGlance(d,'READY').label,'Needs research');
});
const {fetchCachedPortfolioQuotes,cachedPortfolioQuotes}=load('components/portfolio/quote-cache.ts');
test('public quote reuse avoids duplicate fetches and retains observation dates after failure',async()=>{
 const originalFetch=globalThis.fetch,originalNow=Date.now;let clock=1000000,calls=0;
 Date.now=()=>clock;
 globalThis.fetch=async()=>{calls++;return calls===1?new Response(JSON.stringify({items:[{security:{symbol:'CACHE-QA'},market:{displayPrice:42,observedAt:'2026-10-15T20:00:00Z'}}]})):new Response(JSON.stringify({error:'Provider unavailable'}),{status:503})};
 try{
  const first=await fetchCachedPortfolioQuotes(['CACHE-QA']);assert.equal(first['CACHE-QA'].market.displayPrice,42);
  await fetchCachedPortfolioQuotes(['CACHE-QA']);assert.equal(calls,1,'Immediate navigation reuses the shared market snapshot');
  clock+=61000;const retained=await fetchCachedPortfolioQuotes(['CACHE-QA']);assert.equal(calls,2);
  assert.equal(retained['CACHE-QA'].market.observedAt,'2026-10-15T20:00:00Z');assert.match(retained['CACHE-QA'].quoteRefreshError,/unavailable/i);
  clock+=601000;assert.equal(cachedPortfolioQuotes(['CACHE-QA'])['CACHE-QA'],undefined,'Expired cache does not become a fresh quote');
 }finally{globalThis.fetch=originalFetch;Date.now=originalNow}
});
