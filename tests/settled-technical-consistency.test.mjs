import test from 'node:test';
import assert from 'node:assert/strict';
import { indicators, perspective } from '../lib/analysis.ts';
import { priceStudies } from '../lib/price-studies.ts';
import { researchDecision } from '../lib/decision-research.ts';
import { selectPriceReference } from '../lib/price-reference.ts';
import { demoData } from './fixtures/demo.ts';

const candle=(time,close)=>({time,open:close,high:close,low:close,close,volume:100});
const history=[];
for(let at=Date.parse('2025-11-01');at<Date.parse('2026-11-13');at+=86400000){
 const d=new Date(at);if(![0,6].includes(d.getUTCDay()))history.push(candle(d.toISOString().slice(0,10),100));
}
history.push(candle('2026-11-13',200));
function research(at){const r=structuredClone(demoData.research.MSFT);r.history=history;r.retrievedAt=at;r.quote={...r.quote,price:null,asOf:null,stale:true};return r;}

test('after settlement technical indicators and the decision use the same close as Pace and price references',()=>{
 const r=research('2026-11-13T22:05:00Z');
 const reference=selectPriceReference(r,Date.parse(r.retrievedAt));
 assert.equal(reference.price,200);
 assert.equal(perspective(r).tech.close,reference.price);
 assert.equal(perspective(r).tech.last,'2026-11-13');
 assert.equal(researchDecision(r).timing.close,reference.price);
 assert.equal(researchDecision(r).timing.observations,history.length);
 assert.equal(perspective(r).tech.ma50,102);
});

test('US same-day RSI, EMA and bands advance only after the shared 17:00 New York settlement cutoff',()=>{
 const before='2026-11-13T21:59:00Z',after='2026-11-13T22:00:00Z';
 assert.equal(indicators(history,before,'us-equity').close,100);
 assert.equal(indicators(history,before,'us-equity').rsi,50);
 assert.equal(indicators(history,after,'us-equity').close,200);
 assert.equal(indicators(history,after,'us-equity').rsi,100);
 assert.equal(priceStudies(history,before,'us-equity').bands.mid,100);
 assert.equal(priceStudies(history,after,'us-equity').bands.mid,105);
 assert.equal(priceStudies(history,after,'us-equity').ema20,100+200/21);
});

test('crypto waits for UTC midnight and the study cache distinguishes market clocks',()=>{
 const at='2026-11-13T22:05:00Z';
 assert.equal(indicators(history,at,'crypto').close,100);
 assert.equal(indicators(history,at,'us-equity').close,200);
 assert.equal(indicators(history,'2026-11-14T00:00:00Z','crypto').close,200);
});

test('invalid, conflicting duplicate and future bars cannot silently change technical conclusions',()=>{
 const at='2026-11-13T22:05:00Z';
 const rows=[...history,candle('2026-11-13',250),candle('2026-11-16',400),{...candle('2026-11-12',300),high:1}];
 assert.equal(indicators(rows,at,'us-equity').close,100);
 assert.equal(indicators(rows,at,'us-equity').last,'2026-11-12');
 assert.equal(priceStudies(rows,at,'us-equity').bands.mid,100);
});

test('advanced, professional and expanded Technicals share the settled observation',async()=>{
 const {advancedStudies}=await import('../lib/advanced-research.ts');
 const {professionalStudies}=await import('../lib/professional-studies.ts');
 const {expandedStudies}=await import('../lib/technical-expanded.ts');
 const at='2026-11-13T22:05:00Z';
 assert.equal(advancedStudies(history,at,'us-equity').last,200);
 assert.equal(advancedStudies(history,at,'us-equity').asOf,'2026-11-13');
 assert.equal(professionalStudies(history,at,252,'us-equity').ma50,102);
 assert.equal(expandedStudies(history,at,[],'us-equity').roc20,100);
});

test('a quote-only refresh cannot certify an intraday history snapshot as a settled bar',()=>{
 const r=research('2026-11-13T21:59:00Z');
 r.priceObservedAt='2026-11-13T22:05:00Z';
 assert.equal(perspective(r).tech.close,100);
 assert.equal(researchDecision(r).timing.close,100);
});

test('extended technical context uses the same daily and weekly completion boundary',async()=>{
 const {technicalContext}=await import('../lib/technical-context.ts');
 assert.equal(technicalContext(history,'2026-11-13T22:05:00Z','us-equity').asOf,'2026-11-13');
 assert.equal(technicalContext(history,'2026-11-13T21:59:00Z','us-equity').asOf,'2026-11-12');
 assert.equal(technicalContext(history,'2026-11-13T22:05:00Z','crypto').asOf,'2026-11-12');
});

test('a stale forming close is not promoted into a settled reference by a later quote-refresh clock',()=>{
 const r=research('2026-11-13T21:59:00Z');
 r.priceObservedAt='2026-11-13T22:05:00Z';
 assert.equal(selectPriceReference(r,Date.parse(r.priceObservedAt)).price,100);
});
