import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planPaperOrder} from '../.engine-test/nivora-paper-execution.js';
import {normalizeAlpacaQuote} from '../.engine-test/nivora-execution-quote.js';

test('paper equity limit prices are normalized to two decimals before broker submission',()=>{
 const order=planPaperOrder({id:'x',symbol:'DLO',side:'BUY'},1000,15.435,0.25);
 assert.equal(Number(order.limitPrice.toFixed(2)),order.limitPrice);
});


test('Alpaca execution quote prefers the freshest quote timestamp over an older last trade',()=>{
 const asOf=new Date('2026-09-04T15:00:10Z');
 const q=normalizeAlpacaQuote('MELI',{bp:1670,ap:1670.2,t:'2026-09-04T15:00:08Z'},{p:1668,t:'2026-09-04T14:58:00Z'},asOf);
 assert.equal(q.ageSeconds,2);
 assert.equal(q.price,1670.1);
 assert.equal(q.freshness,'LIVE');
});

test('paper runner retries market data once when an open-session quote is stale',()=>{
 const s=fs.readFileSync('app/api/trading-lab/run-paper/route.ts','utf8');
 assert.match(s,/refreshTradingMarketData/);
 assert.match(s,/STALE|DELAYED/);
});

test('analysis route does not serially wait for optional Alpaca bar integrity after Twelve Data',()=>{
 const s=fs.readFileSync('app/api/analyze/[symbol]/route.ts','utf8');
 assert.match(s,/alpacaBarsPromise/);
 assert.match(s,/Promise\.all\(\[series\(symbol/);
});

test('stock core loader allows one bounded retry before presenting a fatal timeout',()=>{
 const s=fs.readFileSync('components/StockClient.tsx','utf8');
 assert.match(s,/CORE_ATTEMPTS\s*=\s*2/);
 assert.match(s,/for\s*\(let attempt=1;attempt<=CORE_ATTEMPTS;attempt\+\+\)/);
});


test('metric help treats risk pressure as inverse and exposes score contributors',()=>{
 const s=fs.readFileSync('components/v65/MetricInfo.tsx','utf8');
 assert.match(s,/metric==="risk"/);
 assert.match(s,/proof\?\.contributors/);
 assert.match(s,/Why this score/);
});

test('metric info stays an inline title unit and portfolio snapshot has no decorative underline',()=>{
 const css=fs.readFileSync('app/globals.css','utf8');
 assert.match(css,/\.metricLabel\{[^}]*display:inline-flex[^}]*align-items:center/s);
 assert.match(css,/\.v658PortfolioSnapshot article:after\{[^}]*display:none/s);
});

test('top market context uses compact segmented periods and reduced divider treatment',()=>{
 const css=fs.readFileSync('app/globals.css','utf8');
 assert.match(css,/\.v659ContextStrip/);
 assert.match(css,/\.v659PeriodSwitch/);
 const s=fs.readFileSync('components/StockClient.tsx','utf8');
 assert.match(s,/v659ContextStrip/);
 assert.match(s,/v659PeriodSwitch/);
});

test('user-facing live status does not expose LIVE_SINGLE_SOURCE debug wording',()=>{
 const s=fs.readFileSync('components/StockClient.tsx','utf8');
 assert.match(s,/marketStatusLabel/);
 assert.doesNotMatch(s,/\?\`\$\{String\(liveQuote\.session/);
});
