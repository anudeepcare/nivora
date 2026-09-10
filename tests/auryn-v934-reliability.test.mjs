import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const provider=await import('../.engine-test/auryn/v934/twelve-multitimeframe.js');
const snapmod=await import('../.engine-test/auryn/v934/intelligence-snapshot.js');
const indicators=await import('../.engine-test/auryn/v934/indicators.js');

const bars=(n=90,start=100)=>Array.from({length:n},(_,i)=>({datetime:new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10),open:start+i*.2,high:start+i*.2+1,low:start+i*.2-1,close:start+i*.2+.4,volume:100000+i*100}));
const truth={snapshotId:'m1',symbol:'TEST',asOf:'2026-09-10T22:00:00Z',session:'AFTER_HOURS',calendarState:'OPEN',displayPrice:118,decisionPrice:118,executionPrice:null,priceState:'EXTENDED_VERIFIED',priceUse:'RESEARCH_EXTENDED'};

test('basic indicator formulas are deterministic on fixed fixtures',()=>{const x=[1,2,3,4,5,6,7,8,9,10];assert.equal(indicators.smaN(x,5),8);assert.equal(indicators.smaN(x,20),null);const r=indicators.computeRsi14(Array.from({length:30},(_,i)=>100+i));assert.ok(r>=99&&r<=100);});

test('provider adapter fails soft when one or more timeframe feeds are unavailable',async()=>{
 const fetchJson=async(url)=>{if(url.includes('15min')||url.includes('4h'))throw new Error('provider chaos');return{values:bars(120).map(x=>({...x,datetime:x.datetime}))}};
 const x=await provider.loadV934MarketBars({symbol:'TEST',key:'x',asOf:new Date('2026-09-10T22:00:00Z'),fetchJson});
 assert.ok(x.coverage['1D']>0);assert.equal(x.coverage['15M'],0);assert.match(x.errors['15M'],/provider chaos/);
});

test('canonical market-intelligence snapshot is byte-stable for identical completed evidence',()=>{
 const daily=bars(90),weekly=bars(50,90);const input={symbol:'TEST',marketTruth:truth,confirmedBars:{'1D':daily,'1W':weekly,'4H':daily},previewBars:{},benchmark:null};
 const a=snapmod.buildAurynMarketIntelligenceSnapshot(input),b=snapmod.buildAurynMarketIntelligenceSnapshot(input);assert.equal(a.fingerprint,b.fingerprint);assert.deepEqual(a.actionMap,b.actionMap);
});

test('production surfaces do not create a second V9.3.4 action map',()=>{
 const stock=fs.readFileSync('components/StockClient.tsx','utf8'),summary=fs.readFileSync('app/api/decision/summaries/route.ts','utf8'),paper=fs.readFileSync('app/api/trading-lab/run-paper/route.ts','utf8');
 assert.match(stock,/projectMarketIntelligence/);assert.match(summary,/evidence\?\.v934/);assert.match(paper,/V934_MARKET_INTELLIGENCE/);
 assert.doesNotMatch(summary,/buildStructuralPriceMap|computeTimeframeTechnicalState/);
});

test('current price authority remains centralized while historical/research adapters stay separate',()=>{
 for(const f of ['app/api/quote/[symbol]/route.ts','app/api/market/route.ts','app/api/portfolio/pulse/route.ts']){const s=fs.readFileSync(f,'utf8');assert.match(s,/market-data-gateway|loadCanonicalMarketSnapshot/);}
 const analyze=fs.readFileSync('app/api/analyze/[symbol]/route.ts','utf8');assert.doesNotMatch(analyze,/https:\/\/api\.twelvedata\.com/);assert.match(analyze,/twelve-multitimeframe/);
});
