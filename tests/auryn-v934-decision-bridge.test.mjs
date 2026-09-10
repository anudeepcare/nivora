import test from 'node:test';import assert from 'node:assert/strict';
const {deriveV934DecisionTechnical}=await import('../.engine-test/auryn/v934/decision-bridge.js').catch(()=>({}));
const st=(rating,score,trend,momentum,participation,price=100)=>({rating,score,asOf:'2026-09-09T20:00:00Z',price,trend:{score:trend,label:''},momentum:{score:momentum,label:''},participation:{score:participation,label:''},relativeStrength:{score:60,benchmark:'SPY',returnPct:1,benchmarkReturnPct:0,relativePct:1},counts:{buy:10,neutral:8,sell:4}});
const snap={snapshotId:'x',confirmed:{'4H':st('BUY',35,70,72,66,99),'1D':st('NEUTRAL',10,58,62,55,100),'1W':st('BUY',42,76,68,64,97)},livePreview:{'1D':st('SELL',-30,20,30,25,94)},actionMap:{confirm:104,invalidation:90}};

test('confirmed multi-timeframe state drives decision technical inputs, not live preview',()=>{const x=deriveV934DecisionTechnical(snap);assert.ok(x.marketStructureScore>50);assert.equal(x.confirmedPrice,100);assert.equal(x.livePreviewRating,'SELL');assert.equal(x.confirmedBreakout,false);assert.match(x.why,/1D NEUTRAL/);assert.match(x.why,/4H BUY/);assert.match(x.why,/1W BUY/);});

test('structural break uses completed daily price and canonical invalidation',()=>{const x=deriveV934DecisionTechnical({...snap,confirmed:{...snap.confirmed,'1D':st('SELL',-55,20,25,30,88)}});assert.equal(x.structuralBreak,true);});

test('identical confirmed inputs produce identical bridge even if live preview changes',()=>{const a=deriveV934DecisionTechnical(snap);const b=deriveV934DecisionTechnical({...snap,livePreview:{'1D':st('BUY',80,90,90,90,110)}});assert.equal(a.marketStructureScore,b.marketStructureScore);assert.equal(a.trend,b.trend);assert.equal(a.nearResistance,b.nearResistance);});

import fs from 'node:fs';
test('stock institutional decision consumes V9.3.4 bridge rather than old daily-only market structure when available',()=>{const src=fs.readFileSync('components/StockClient.tsx','utf8');assert.match(src,/deriveV934DecisionTechnical/);assert.match(src,/marketStructureScore/);assert.match(src,/v934Technical\?\.why/);});
