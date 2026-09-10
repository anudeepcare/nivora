import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveTwelveRegularClose,normalizeTwelveQuote} from '../.engine-test/nivora-live-quote.js';
import {normalizeTwelveExecutionQuote} from '../.engine-test/nivora-execution-quote.js';

const epoch=s=>Math.floor(Date.parse(s)/1000);

test('modern Twelve after-hours schema uses current regular close, not previous trading-day close',()=>{
  const raw={symbol:'MU',exchange:'NASDAQ',currency:'USD',close:'976.63',previous_close:'1027.77',timestamp:epoch('2026-09-10T20:00:00.000Z'),extended_price:'977.18',extended_timestamp:epoch('2026-09-10T20:14:30.000Z'),extended_change:'0.55',extended_percent_change:'0.0563'};
  const asOf=new Date('2026-09-10T20:15:00.000Z');
  assert.equal(resolveTwelveRegularClose(raw,asOf),976.63);
  const q=normalizeTwelveQuote(raw,asOf);
  assert.equal(q.regularClose,976.63);
  assert.equal(q.price,977.18);
  assert.equal(q.providerTimestamp,'2026-09-10T20:14:30.000Z');
  assert.equal(q.changePct,0.0563);
  assert.equal(q.isExtendedHours,true);
});

test('modern Twelve premarket schema keeps prior regular close and uses extended price as live context',()=>{
  const raw={symbol:'AAPL',exchange:'NASDAQ',currency:'USD',close:'187.10',previous_close:'185.20',timestamp:epoch('2026-09-09T20:00:00.000Z'),extended_price:'188.02',extended_timestamp:epoch('2026-09-10T12:15:00.000Z'),extended_percent_change:'0.4917'};
  const asOf=new Date('2026-09-10T12:15:20.000Z');
  assert.equal(resolveTwelveRegularClose(raw,asOf),187.10);
  const q=normalizeTwelveExecutionQuote(raw,asOf);
  assert.equal(q.price,188.02);
  assert.equal(q.providerTimestamp,'2026-09-10T12:15:00.000Z');
});

test('legacy is_extended_hours schema remains supported',()=>{
  const raw={symbol:'BE',close:'270.10',previous_close:'269.28',timestamp:epoch('2026-09-10T20:10:00.000Z'),is_extended_hours:true};
  const asOf=new Date('2026-09-10T20:10:15.000Z');
  assert.equal(resolveTwelveRegularClose(raw,asOf),269.28);
  const q=normalizeTwelveQuote(raw,asOf);
  assert.equal(q.price,270.10);
  assert.equal(q.regularClose,269.28);
});

test('after-hours non-extended quote close is today regular close instead of stale previous_close',()=>{
  const raw={symbol:'MU',close:'976.63',previous_close:'1027.77',timestamp:epoch('2026-09-10T20:00:00.000Z'),is_extended_hours:false};
  assert.equal(resolveTwelveRegularClose(raw,new Date('2026-09-10T20:15:00.000Z')),976.63);
});

test('stock core does not wait on tactical 15M history and uses bounded first-render timeouts',()=>{
  const src=fs.readFileSync('app/api/analyze/[symbol]/route.ts','utf8');
  const mtf=fs.readFileSync('lib/auryn/v934/twelve-multitimeframe.ts','utf8');
  assert.doesNotMatch(src,/loadV934LiveContext/);
  assert.match(src,/benchPromise/);
  assert.match(mtf,/loadV934DecisionBars/);
  assert.match(mtf,/1day/);
});

import {loadV934DecisionBars,loadV934LiveContext} from '../.engine-test/auryn/v934/twelve-multitimeframe.js';

const fakeDaily=(count=80)=>({values:Array.from({length:count},(_,i)=>({datetime:`2026-${String(5+Math.floor(i/28)).padStart(2,'0')}-${String(i%28+1).padStart(2,'0')}`,open:100+i*.1,high:101+i*.1,low:99+i*.1,close:100.5+i*.1,volume:100000+i}))});

test('decision bars return daily/weekly core without waiting for a slow 4H request',async()=>{
  const fetchJson=(url)=>{
    if(url.includes('interval=1day'))return Promise.resolve(fakeDaily(90));
    if(url.includes('interval=4h'))return new Promise(resolve=>setTimeout(()=>resolve({values:[]}),2500));
    throw new Error('unexpected '+url);
  };
  const started=Date.now();
  const result=await loadV934DecisionBars({symbol:'QQQ',key:'x',asOf:new Date('2026-09-10T19:00:00.000Z'),fetchJson});
  assert.ok(Date.now()-started<1200,'slow 4H request blocked the core decision');
  assert.ok((result.confirmed['1D']?.length??0)>40);
});

test('progressive market context can deliver 4H independently of tactical 15M availability',async()=>{
  const four={values:Array.from({length:60},(_,i)=>({datetime:new Date(Date.parse('2026-08-01T13:30:00Z')+i*4*3600000).toISOString(),open:100+i*.1,high:101+i*.1,low:99+i*.1,close:100.5+i*.1,volume:1000+i}))};
  const fetchJson=(url)=>url.includes('interval=4h')?Promise.resolve(four):Promise.reject(new Error('15m temporary failure'));
  const result=await loadV934LiveContext({symbol:'QQQ',key:'x',asOf:new Date('2026-09-10T19:00:00.000Z'),fetchJson});
  assert.ok((result.confirmed['4H']?.length??0)>=40);
  assert.equal(result.coverage['15M'],0);
});

import {providerMarketHint} from '../.engine-test/auryn/v82/security-master.js';

test('new ADR and cross-listed golden symbols have explicit US venue/currency identity',()=>{
  assert.deepEqual(providerMarketHint('SKHY'),{exchange:'NASDAQ',currency:'USD'});
  assert.deepEqual(providerMarketHint('NBIS'),{exchange:'NASDAQ',currency:'USD'});
  assert.deepEqual(providerMarketHint('MU'),{exchange:'NASDAQ',currency:'USD'});
});

test('analyze first render bounds optional benchmark and market-truth waits',()=>{
  const src=fs.readFileSync('app/api/analyze/[symbol]/route.ts','utf8');
  assert.match(src,/marketGatewayPromise/);
  assert.match(src,/1200/);
  assert.match(src,/setTimeout\(\(\)=>resolve\(null\),900\)/);
});

test('live audit permanently includes MU NBIS and SKHY price-identity sentinels',()=>{
  const src=fs.readFileSync('scripts/v934_live_audit_utils.mjs','utf8');
  for(const symbol of ['MU','NBIS','SKHY'])assert.match(src,new RegExp(`['\"]${symbol}['\"]`));
});

test('live audit detects a same-session official close that disagrees with the completed daily anchor',()=>{
  const src=fs.readFileSync('scripts/run_v934_live_audit.mjs','utf8');
  assert.match(src,/regularClosePrice|regularClose/);
  assert.match(src,/analysisAnchorPrice/);
  assert.match(src,/regular close.*daily anchor|daily anchor.*regular close/i);
});

test('V9.3.4 release gate includes the V9.3.4.2 price-truth suite',()=>{
  const gate=fs.readFileSync('scripts/run_v934_release_gate.mjs','utf8');
  assert.match(gate,/test:v9342/);
});

test('live quote provider deadline is bounded for a fast first price render',()=>{
  const src=fs.readFileSync('lib/nivora-trading-market-data.ts','utf8');
  const match=src.match(/api\.twelvedata\.com\/quote[\s\S]*?AbortSignal\.timeout\((\d+)\)/);
  assert.ok(match,'Twelve quote request must have an explicit deadline');
  assert.ok(Number(match[1])<=2500,`Twelve quote deadline ${match[1]}ms is too slow for the primary price header`);
});

test('progressive market-intelligence endpoint publishes the V9.3.4.2 contract version',()=>{
  const src=fs.readFileSync('app/api/market-intelligence/live/[symbol]/route.ts','utf8');
  assert.match(src,/auryn-v9\.3\.4\.2-live/);
});

test('progressive live route never optional-chains through an impossible null benchmark object',()=>{
  const src=fs.readFileSync('app/api/market-intelligence/live/[symbol]/route.ts','utf8');
  assert.doesNotMatch(src,/bench\?\.(confirmed|preview)/,'a const-null benchmark narrows to never under Next production type checking');
  assert.match(src,/computeTimeframeTechnicalState\([^\n]+,null,tf,benchmark\)/,'live tactical states should explicitly run without benchmark bars when none are loaded');
});
