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
const labels=load('components/portfolio/MarketLabel.tsx');

test('all thirty holdings are requested and kept, with no batch truncation',async()=>{
 const original=global.fetch,requested=[];global.fetch=async url=>{const symbols=new URL(url,'http://local').searchParams.get('symbols').split(',');requested.push(...symbols);return {ok:true,json:async()=>({items:symbols.map(symbol=>({security:{symbol},market:{displayPrice:10}}))})}};
 try{const symbols=Array.from({length:30},(_,i)=>`S${i}`),result=await labels.fetchQuotes(symbols);assert.deepEqual(Object.keys(result).sort(),symbols.sort());assert.equal(requested.length,30)}finally{global.fetch=original}
});
test('canonical aliases map quotes back to original holdings without losing BTC/USD',async()=>{
 const original=global.fetch;global.fetch=async()=>({ok:true,json:async()=>({items:[{security:{symbol:'AAPL'},market:{displayPrice:200}},{security:{symbol:'BTC/USD'},market:{displayPrice:60000}}]})});
 try{const result=await labels.fetchQuotes([' aapl ','btc-usd']);assert.equal(result[' aapl ']?.market.displayPrice,200);assert.equal(result['btc-usd']?.market.displayPrice,60000)}finally{global.fetch=original}
});
test('a missing returned symbol is explicitly unavailable instead of disappearing',async()=>{
 const original=global.fetch;global.fetch=async()=>({ok:true,json:async()=>({items:[]})});
 try{const result=await labels.fetchQuotes(['NVDA']);assert.equal(result.NVDA?.market,null);assert.match(result.NVDA?.quoteError||'',/unavailable/i)}finally{global.fetch=original}
});
test('LIVE labels expire and invalid or future provider timestamps are never live',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),now=Date.now();
 for(const stamp of [new Date(now-3600_000).toISOString(),'broken',new Date(now+3600_000).toISOString(),null]){
  const html=renderToStaticMarkup(React.createElement(labels.MarketLabel,{market:{displayPrice:10,priceState:'LIVE_VERIFIED',session:'REGULAR',liveMarketPriceAsOf:stamp}}));
  assert.doesNotMatch(html,/LIVE VERIFIED/);assert.match(html,/stale|unverified/i);
 }
});
test('explicit crypto asset types normalize bare symbols without changing equity identity',async()=>{
 const original=global.fetch,requested=[];global.fetch=async url=>{const symbols=new URL(url,'http://local').searchParams.get('symbols').split(',');requested.push(...symbols);return{ok:true,json:async()=>({items:symbols.map(symbol=>({security:{symbol},market:{displayPrice:symbol.includes('/')?60000:30}}))})}};
 try{const result=await labels.fetchQuotes([{symbol:'BTC',assetType:'CRYPTO'},'BRK-B']);assert.equal(result.BTC.market.displayPrice,60000);assert.deepEqual(requested,['BTC/USD','BRK-B'])}finally{global.fetch=original}
});
test('batch errors retain successful prices and explicitly identify the remaining holdings',async()=>{
 const original=global.fetch;let calls=0,active=0,peak=0;
 global.fetch=async url=>{active++;peak=Math.max(peak,active);await Promise.resolve();active--;calls++;const symbols=new URL(url,'http://local').searchParams.get('symbols').split(',');if(calls===2)return{ok:false,status:503,json:async()=>({error:'Provider unavailable'})};return{ok:true,json:async()=>({items:symbols.map(symbol=>({security:{symbol},market:{displayPrice:10}}))})}};
 try{const result=await labels.fetchQuotes(Array.from({length:30},(_,i)=>`S${i}`));assert.equal(result.S0.market.displayPrice,10);assert.equal(result.S10.market,null);assert.match(result.S10.quoteError,/unavailable/i);assert.equal(result.S29.market.displayPrice,10);assert.equal(peak,1)}finally{global.fetch=original}
});
test('large portfolios receive completed batches before every holding finishes',async()=>{
 const original=global.fetch,progress=[];let calls=0;
 global.fetch=async url=>{calls++;const symbols=new URL(url,'http://local').searchParams.get('symbols').split(',');return{ok:true,json:async()=>({items:symbols.map(symbol=>({security:{symbol},market:{displayPrice:10}}))})}};
 try{await labels.fetchQuotes(Array.from({length:30},(_,i)=>`S${i}`),{onProgress:quotes=>progress.push({calls,count:Object.keys(quotes).length})});assert.deepEqual(progress,[{calls:1,count:10},{calls:2,count:20},{calls:3,count:30}]);}finally{global.fetch=original}
});
test('closed equities keep the latest official close while weekend crypto stays live',()=>{
 const now=Date.parse('2026-10-17T12:00:00Z'),stamp='2026-10-16T20:00:00Z';
 const equity=labels.quoteStatus({displayPrice:100,priceState:'OFFICIAL_CLOSE',session:'CLOSED',regularCloseAsOf:stamp},now);
 assert.equal(equity.current,true);assert.match(equity.label,/closed/i);
 assert.equal(labels.quoteStatus({displayPrice:100,priceState:'OFFICIAL_CLOSE',session:'CLOSED',regularCloseAsOf:'2026-10-15T20:00:00Z'},now).stale,true);
 const crypto=labels.quoteStatus({displayPrice:60000,priceState:'LIVE_SINGLE_SOURCE',session:'CRYPTO_24X7',liveMarketPriceAsOf:'2026-10-17T11:59:30Z'},now);
 assert.equal(crypto.current,true);assert.match(crypto.label,/24\/7/);
});
test('non-USD quotes are unavailable for portfolio USD price coverage',()=>{
 const status=labels.quoteStatus({displayPrice:60000,currency:'USDT',session:'CRYPTO_24X7',priceState:'LIVE_SINGLE_SOURCE',liveMarketPriceAsOf:'2026-10-17T11:59:30Z'},Date.parse('2026-10-17T12:00:00Z'));
 assert.equal(status.missing,true);assert.equal(status.current,false);assert.match(status.label,/currency|USD/);
});
test('bounded rotation eventually visits all thirty holdings and skips current closed equities',()=>{
 const {nextQuoteRefresh}=load('components/portfolio/quote-status.ts'),symbols=Array.from({length:30},(_,i)=>`S${i}`),visited=[];let cursor=0;
 for(let i=0;i<5;i++){const next=nextQuoteRefresh(symbols,{},cursor,Date.parse('2026-10-17T12:00:00Z'));assert.ok(next.symbols.length<=6);visited.push(...next.symbols);cursor=next.cursor;}
 assert.equal(new Set(visited).size,30);
 const next=nextQuoteRefresh(['AAPL','BTC/USD'],{AAPL:{market:{displayPrice:100,priceState:'OFFICIAL_CLOSE',regularCloseAsOf:'2026-10-16T20:00:00Z'}},'BTC/USD':{market:{session:'CRYPTO_24X7'}}},0,Date.parse('2026-10-17T12:00:00Z'));
 assert.deepEqual(next.symbols,['BTC/USD']);
});

const cryptoFile='lib/auryn/canonical-crypto.ts',crypto=fs.existsSync(cryptoFile)?load(cryptoFile):{};
test('canonical crypto uses real trade time on weekends and never enables execution',()=>{
 assert.equal(typeof crypto.buildCanonicalCryptoSnapshot,'function','canonical crypto must have a separate 24/7 authority');
 const result=crypto.buildCanonicalCryptoSnapshot('BTC/USD',{price:'60000',time:'2026-10-17T11:59:30Z'},new Date('2026-10-17T12:00:00Z'));
 assert.equal(result.displayPrice,60000);assert.equal(result.session,'CRYPTO_24X7');assert.equal(result.liveMarketPriceAsOf,'2026-10-17T11:59:30Z');assert.equal(result.executionTradable,false);assert.equal(result.executionPrice,null);assert.equal(result.priceState,'LIVE_SINGLE_SOURCE');
});
test('canonical crypto rejects missing, invalid, stale and future timestamps',()=>{
 assert.equal(typeof crypto.buildCanonicalCryptoSnapshot,'function');
 for(const time of [null,undefined,'','broken','2026-10-17T12:00:01Z','2026-10-17T11:54:59Z']){
  const result=crypto.buildCanonicalCryptoSnapshot('BTC/USD',{price:'60000',time},new Date('2026-10-17T12:00:00Z'));
  assert.equal(result.displayPrice,null);assert.equal(result.executionTradable,false);assert.doesNotMatch(result.priceState,/LIVE/);
 }
});
test('crypto requests preserve the quoted currency and use no paid fallback calls',async()=>{
 assert.equal(typeof crypto.loadCanonicalCryptoSnapshot,'function');const urls=[];
 const result=await crypto.loadCanonicalCryptoSnapshot('BTC/USDT',new Date('2026-10-17T12:00:00Z'),async url=>{urls.push(url);return{ok:true,json:async()=>({price:'60000',time:'2026-10-17T11:59:30Z'})}});
 assert.equal(urls.length,1);assert.match(urls[0],/BTC-USDT/);assert.equal(result.currency,'USDT');
});
test('a current crypto trade received during a request is evaluated at response time',async()=>{
 const NativeDate=global.Date;let clock=NativeDate.parse('2026-10-17T12:00:00Z');
 global.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock}};
 try{const result=await crypto.loadCanonicalCryptoSnapshot('BTC/USD',undefined,async()=>{clock+=1000;return{ok:true,json:async()=>({price:'60000',time:new NativeDate(clock).toISOString()})}});assert.equal(result.priceState,'LIVE_SINGLE_SOURCE');assert.equal(result.asOf,'2026-10-17T12:00:01.000Z');}finally{global.Date=NativeDate}
});

const refreshFile='components/portfolio/quote-refresh.ts',refresh=fs.existsSync(refreshFile)?load(refreshFile):{};
test('refresh controller pauses hidden pages, throttles focus retries and disposes its timer',async()=>{
 assert.equal(typeof refresh.createQuoteRefreshController,'function');
 let now=0,visible=false,calls=0,timer=null,cleared=0;const updates=[];
 const controller=refresh.createQuoteRefreshController({requests:['AAPL'],getQuotes:()=>({}),onQuotes:x=>updates.push(x),onState:()=>{},isVisible:()=>visible,now:()=>now,setTimer:fn=>(timer=fn,1),clearTimer:()=>{cleared++;timer=null},fetcher:async()=>{calls++;return{AAPL:{market:{displayPrice:100}}}}});
 await controller.wake();assert.equal(calls,0);visible=true;await controller.wake();assert.equal(calls,1);await controller.wake();assert.equal(calls,1);now=60_000;await controller.wake();assert.equal(calls,2);assert.equal(updates.length,2);controller.dispose();assert.ok(cleared>0);assert.equal(timer,null);
});
test('refresh controller prevents overlap and rotates a bounded batch after initial load',async()=>{
 assert.equal(typeof refresh.createQuoteRefreshController,'function');
 let now=0,release,calls=0;const sizes=[];const initial=new Promise(resolve=>release=resolve);
 const controller=refresh.createQuoteRefreshController({requests:Array.from({length:30},(_,i)=>`S${i}`),getQuotes:()=>({}),onQuotes:()=>{},onState:()=>{},now:()=>now,setTimer:()=>1,clearTimer:()=>{},fetcher:async symbols=>{calls++;sizes.push(symbols.length);if(calls===1)await initial;return{}}});
 const first=controller.wake();await controller.wake();assert.equal(calls,1);release();await first;now=60_000;await controller.wake();assert.deepEqual(sizes,[30,6]);controller.dispose();
});
test('refresh errors back off for a minute and retain prior timestamped prices',async()=>{
 assert.equal(typeof refresh.createQuoteRefreshController,'function');assert.equal(typeof refresh.mergeQuoteResults,'function');
 const old={AAPL:{market:{displayPrice:100,liveMarketPriceAsOf:'2026-10-16T12:00:00Z'}}},merged=refresh.mergeQuoteResults(old,{AAPL:{market:null,quoteError:'Provider unavailable'}});
 assert.equal(merged.AAPL.market.displayPrice,100);assert.equal(merged.AAPL.market.liveMarketPriceAsOf,old.AAPL.market.liveMarketPriceAsOf);assert.match(merged.AAPL.quoteRefreshError,/unavailable/);
 let calls=0,now=0;const controller=refresh.createQuoteRefreshController({requests:['AAPL'],getQuotes:()=>old,onQuotes:()=>{},onState:()=>{},now:()=>now,setTimer:()=>1,clearTimer:()=>{},fetcher:async()=>{calls++;throw Error('offline')}});
 await controller.wake();await controller.wake();assert.equal(calls,1);now=60_000;await controller.wake();assert.equal(calls,2);controller.dispose();
});

test('retaining a last price does not retain superseded research decisions',()=>{
 const old={AAPL:{security:{symbol:'AAPL'},market:{displayPrice:100,liveMarketPriceAsOf:'2026-10-16T12:00:00Z'},research:{state:'READY',action:'BUY'},degraded:false}};
 const incoming={AAPL:{security:{symbol:'AAPL'},market:{displayPrice:null},research:{state:'STALE_VERIFIED',action:'REDUCE'},degraded:true}};
 const merged=refresh.mergeQuoteResults(old,incoming);
 assert.equal(merged.AAPL.market,old.AAPL.market,'Only the original timestamped price is retained');
 assert.deepEqual(merged.AAPL.research,incoming.AAPL.research,'New canonical research supersedes the old decision');
 assert.equal(merged.AAPL.degraded,true);
 const transport=refresh.mergeQuoteResults(old,{AAPL:{market:null,quoteError:'Network unavailable'}});
 assert.deepEqual(transport.AAPL.research,old.AAPL.research,'Transport failure has no replacement research');
});
