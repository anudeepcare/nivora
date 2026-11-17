import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {evaluateAccumulation} from '../lib/accumulation-evaluation.ts';
const input=process.argv[2];
if(!input)throw Error('Supply a private JSON map of symbol to daily OHLC bars.');
const asOf='2026-10-22T23:00:00Z';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const frozen={policy:hash('lib/accumulation-policy-v5.ts'),evaluation:hash('lib/accumulation-evaluation.ts')};
const all=JSON.parse(fs.readFileSync(input));
const rows=Object.entries(all).map(([symbol,bars])=>{
 const runs=[10,50].map(cost=>{
 const r=evaluateAccumulation(bars,asOf,cost,'us-equity','monthly-v5');
 if(!r.available)return {costBps:cost,available:false,reason:r.reason};
 assert.equal(r.fixed.contributed,r.adaptive.contributed);
 assert.ok(r.history.every(h=>h.cash>=0&&h.signalDate<h.executionDate));
 const future=evaluateAccumulation([...bars,{time:'2030-01-31',open:1,high:1,low:1,close:1,volume:1}],asOf,cost,'us-equity','monthly-v5');
 assert.deepEqual(future,r);
 return {available:true,costBps:cost,months:r.months,start:r.history[0].executionDate,end:r.history.at(-1).month,contributions:r.fixed.contributed,fixedValue:r.fixed.value,adaptiveValue:r.adaptive.value,differencePct:(r.adaptive.value/r.fixed.value-1)*100,fixedDrawdownPct:r.fixed.drawdown,adaptiveDrawdownPct:r.adaptive.drawdown,adaptiveCash:r.adaptive.cash,fixedCosts:r.fixed.costs,adaptiveCosts:r.adaptive.costs};
 });return {symbol,observations:bars.length,runs};
});
assert.equal(hash('lib/accumulation-policy-v5.ts'),frozen.policy);
assert.equal(hash('lib/accumulation-evaluation.ts'),frozen.evaluation);
const eligible=rows.map(x=>x.runs[0]).filter(x=>x.available);
const report={asOf,frozen,source:'Connected Twelve Data daily OHLC retrieved after policy freeze; no production provider routing changed.',sample:'Eight newly selected tickers not used to tune monthly-v5; historical exploratory validation, not prospective or randomly sampled.',limitations:['Selected surviving securities; not representative of the full investable universe.','Price-only; dividends, cash interest and taxes omitted. Corporate-action adjustment provenance has not been independently reconciled.','10 bps each purchase; 50 bps stress. 100 units deposited monthly in each strategy; stronger multipliers use only carried cash, no leverage.','Prior confirmed monthly signal executes at next observed month opening price. Monthly marked drawdowns miss intramonth losses.','No new competitor reference labels: this does not measure DCA Optimizer parity.','Rules unchanged; no threshold tuning after results.'],rows,summary:{eligible:eligible.length,wins:eligible.filter(x=>x.differencePct>0).length,losses:eligible.filter(x=>x.differencePct<0).length,meanEndingAssetDifferencePct:eligible.reduce((n,x)=>n+x.differencePct,0)/eligible.length,lowerMonthlyDrawdown:eligible.filter(x=>x.adaptiveDrawdownPct>x.fixedDrawdownPct).length}};
fs.writeFileSync('verification/dca-frozen-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
