import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file) {
  const module = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  function localRequire(name) {
    if(name==='@/lib/supabase')return {supabaseBrowser:()=>{throw Error('Render must not access a private account')}};
    if(name==='@/components/AssetLogo')return {__esModule:true,default:()=>React.createElement('span',{'aria-hidden':true},'logo')};
    if(name==='@/components/MetricHelp')return {__esModule:true,default:()=>null};
    if(name.startsWith('.')||name.startsWith('@/')){
      const base=name.startsWith('@/')?path.resolve(name.slice(2)):path.resolve(path.dirname(file),name);
      if(base.endsWith('.mjs'))return require(base);
      return load(fs.existsSync(base+'.tsx')?base+'.tsx':base+'.ts');
    }
    return require(name);
  }
  new Function('module','exports','require',code)(module,module.exports,localRequire);return module.exports;
}
const component=()=>load('components/portfolio/TrackedList.tsx');
const now=Date.parse('2026-10-16T14:30:30Z');
const quote={market:{displayPrice:120,currency:'USD',session:'REGULAR',priceState:'LIVE_VERIFIED',liveMarketPriceAsOf:'2026-10-16T14:30:00Z'},research:{state:'READY',thesisScore:82,longTermAction:'ATTRACTIVE',setupState:'WAIT_PULLBACK'}};
function render(q=quote,extra={}){const {TrackedItem}=component();assert.equal(typeof TrackedItem,'function');return renderToStaticMarkup(React.createElement(TrackedItem,{item:{id:'1',symbol:'BTC/USD',is_active:true,target_price:100},quote:q,now,busy:false,onRemove:()=>{},onToggle:()=>{},...extra}));}
test('watchlist displays only ready canonical research lenses',()=>{
  const {trackedLenses}=component();assert.equal(typeof trackedLenses,'function');
  assert.deepEqual(trackedLenses(quote.research).map(x=>x.value),['82/100','ATTRACTIVE','WAIT PULLBACK']);
  assert.deepEqual(trackedLenses({...quote.research,state:'STALE_VERIFIED'}),[]);
  assert.deepEqual(trackedLenses({state:'READY',thesisScore:null}),[]);
  assert.deepEqual(trackedLenses({state:'READY',thesisScore:150}),[]);
});
test('watchlist logo and identity open encoded research without nesting remove controls',()=>{
  const html=render();assert.match(html,/href="\/stock\/BTC%2FUSD"/);assert.match(html,/\$120\.00/);assert.match(html,/82\/100/);
  for(const [anchor] of html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g))assert.doesNotMatch(anchor,/<button/);
});
test('missing and foreign quotes stay unavailable instead of becoming dollar values',()=>{
  for(const market of [{displayPrice:null},{displayPrice:120,currency:'EUR'}]){const html=render({market});assert.match(html,/Price unavailable/);assert.doesNotMatch(html,/\$0\.00|\$120\.00/);}
});
test('stale quotes cannot claim current alert target attainment',()=>{
  const html=render({...quote,market:{...quote.market,liveMarketPriceAsOf:'2026-10-15T14:30:00Z'},research:{...quote.research,state:'STALE_VERIFIED'}},{alerts:true});
  assert.match(html,/Quote needs refresh/);assert.doesNotMatch(html,/At or above target|82\/100/);assert.match(html,/Research is stale/);
});
test('paused alerts keep their target and offer resume',()=>{
  const html=render(quote,{alerts:true,item:{id:'1',symbol:'MSFT',is_active:false,target_price:140}});
  assert.match(html,/\$140\.00/);assert.match(html,/Paused/);assert.match(html,/>Resume</);
});
test('an absent saved alert target is unavailable, never a zero-dollar threshold',()=>{
  const html=render(quote,{alerts:true,item:{id:'1',symbol:'MSFT',is_active:true,target_price:null}});
  assert.match(html,/Target unavailable/);assert.doesNotMatch(html,/\$0\.00|At or above target/);
});
