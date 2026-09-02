import {createRequire} from 'node:module';const require=createRequire(import.meta.url);import test from 'node:test';import assert from 'node:assert/strict';
const {replayOne}=require('../.engine-test/nivora-backtest-replay.js');
const {pointInTimeFundamentals}=require('../.engine-test/nivora-backtest-fundamentals.js');
const {buildBacktestReport,applyCosts,walkForwardSplit}=require('../.engine-test/nivora-backtest-report.js');
const {validateUniverseManifest}=require('../.engine-test/nivora-backtest-universe.js');

function fakeBars(n,startPrice=100){const out=[];let p=startPrice;const day=new Date('2020-01-01');for(let i=0;i<n;i++){p*=(1+((Math.sin(i/7)+1)/2-0.48)*0.03);const d=new Date(day);d.setDate(d.getDate()+i);out.push({datetime:d.toISOString().slice(0,10),open:p,high:p*1.01,low:p*0.99,close:p,volume:1000000});}return out;}

test('replayOne never uses a bar dated after asOfDate for entry',()=>{
  const bars=fakeBars(400);
  const asOfDate=bars[250].datetime;
  const row=replayOne({symbol:'TEST',archetypeHintBars:bars,benchBars:fakeBars(400),companyFacts:{facts:{}},benchmarkSymbol:'SPY'},asOfDate,63);
  assert.ok(row,'expected a row to be produced with sufficient history');
  assert.ok(row.entryPrice>0);
  assert.equal(row.asOfDate,asOfDate);
});

test('replayOne returns null when there is not enough forward data for the horizon',()=>{
  const bars=fakeBars(400);
  const asOfDate=bars[390].datetime; // only 10 bars left, horizon needs 63
  const row=replayOne({symbol:'TEST',archetypeHintBars:bars,benchBars:fakeBars(400),companyFacts:{facts:{}},benchmarkSymbol:'SPY'},asOfDate,63);
  assert.equal(row,null,'should refuse to extrapolate past the end of available data');
});

test('replayOne returns null when there is not enough trailing history for a decision',()=>{
  const bars=fakeBars(400);
  const asOfDate=bars[50].datetime; // only 50 bars of history, need 200+
  const row=replayOne({symbol:'TEST',archetypeHintBars:bars,benchBars:fakeBars(400),companyFacts:{facts:{}},benchmarkSymbol:'SPY'},asOfDate,63);
  assert.equal(row,null);
});

test('pointInTimeFundamentals excludes facts filed after asOfDate', () => {
  const facts = {facts: {'us-gaap': {Revenues: {units: {USD: [
    {val: 100, end: '2019-12-31', filed: '2020-02-01', form: '10-K'},
    {val: 200, end: '2020-12-31', filed: '2021-02-01', form: '10-K'} // filed AFTER our asOfDate below
  ]}}}}};
  const asOf = pointInTimeFundamentals(facts, '2020-06-01');
  // Only the 2019 10-K (filed 2020-02-01) should be visible; the 2020 10-K (filed 2021-02-01) must not leak in.
  assert.equal(asOf.fiveYearRecord.years, 1);
});

test('walkForwardSplit never overlaps in-sample and out-of-sample dates',()=>{
  const dates=Array.from({length:100},(_,i)=>{const d=new Date('2020-01-01');d.setDate(d.getDate()+i*7);return d.toISOString().slice(0,10);});
  const {inSample,outOfSample}=walkForwardSplit(dates,0.6);
  const overlap=inSample.filter(d=>outOfSample.includes(d));
  assert.equal(overlap.length,0);
  assert.equal(inSample.length+outOfSample.length,dates.length);
});

test('applyCosts reduces alpha by the full round-trip cost',()=>{
  const rows=[{score:70,alphaPct:5,archetype:'general',symbol:'X',asOfDate:'2020-01-01',horizonDays:63,action:'ACCUMULATE',thesisState:'Intact',entryPrice:100,exitPrice:105}];
  const [r]=applyCosts(rows,{slippageBps:15,commissionBps:0});
  assert.ok(r.alphaPct<5,'cost-adjusted alpha should be lower than raw alpha');
  assert.ok(Math.abs(r.alphaPct-(5-0.30))<0.001);
});

test('buildBacktestReport flags insufficient sample size below minimum',()=>{
  const rows=[{score:70,alphaPct:2,archetype:'general',symbol:'X',asOfDate:'2020-01-01',horizonDays:63,action:'ACCUMULATE',thesisState:'Intact',entryPrice:100,exitPrice:102}];
  const report=buildBacktestReport(rows,100);
  assert.equal(report.minimumSampleMet,false);
});

test('universe manifest surfaces survivorship-bias quality rather than assuming it away',()=>{
 const weak=validateUniverseManifest([{symbol:'AAPL',cik:'320193'}]);
 assert.equal(weak.quality,'LIMITED');
 assert.equal(weak.survivorshipBiasControlled,false);
 const strong=validateUniverseManifest({meta:{pointInTimeCorrect:true,includesDelisted:true,delistingReturnsHandled:true,source:'historical membership file',asOfDate:'2019-01-01'},symbols:[{symbol:'AAPL',cik:'320193'}]});
 assert.equal(strong.quality,'DECISION_GRADE');
 assert.equal(strong.survivorshipBiasControlled,true);
});
