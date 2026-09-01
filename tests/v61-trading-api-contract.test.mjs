import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
test('paper run route is secret protected and paper only',()=>{const s=read('../app/api/trading-lab/run-paper/route.ts');assert.match(s,/TRADING_LAB_CRON_SECRET/);assert.match(s,/AlpacaPaperBroker/);assert.doesNotMatch(s,/api\.alpaca\.markets/)});
test('evaluate route uses deterministic intent and risk engine',()=>{const s=read('../app/api/trading-lab/evaluate/route.ts');assert.match(s,/deriveTradeIntent/);assert.match(s,/evaluateTradingRisk/);assert.match(s,/planPaperOrder/)});
test('status route exposes evidence-based metrics and broker mode',()=>{const s=read('../app/api/trading-lab/status/route.ts');assert.match(s,/summarizeTradingPerformance/);assert.match(s,/paper/);assert.match(s,/liveExecution.*approval/i)});
test('execution quote exposes a typed changePct for trading risk context',()=>{const s=read('../lib/nivora-execution-quote.ts');assert.match(s,/changePct:number\|null/);const r=read('../app/api/trading-lab/run-paper/route.ts');assert.match(r,/changePct:quote\.changePct/)});
