import test from'node:test';
import assert from'node:assert/strict';
import{buildSecuritiesValuationHistory,renderSecuritiesValuationHistory}from'../src/public/portfolio-performance.js';

const trade={symbol:'AAPL.US',type:'BUY',shares:1,price:100,fees:0,date:'2026-01-02',currency:'USD'};

test('historical portfolio valuation remains disabled without corporate-action-aware quantities',()=>{
  const histories={'AAPL.US':{status:'live',symbol:'AAPL.US',currency:'USD',source:'EODHD',data:[{date:'2026-01-02',close:100},{date:'2026-01-03',close:101}]}},value=buildSecuritiesValuationHistory([trade],histories,{asOf:new Date('2026-01-03T23:00:00Z')});
  assert.equal(value.status,'unavailable');
  assert.deepEqual(value.rows,[]);
  assert.match(value.reason,/adjusted prices cannot be combined with unadjusted ledger quantities/i);
  const html=renderSecuritiesValuationHistory(value,String);assert.match(html,/Unavailable/);assert.doesNotMatch(html,/viewBox|\$101/);
});

test('a two-for-one split cannot create a false marked-value series',()=>{
  const adjusted={'AAPL.US':{status:'live',symbol:'AAPL.US',currency:'USD',source:'EODHD',data:[{date:'2026-01-02',close:50},{date:'2026-02-02',close:55}]}},value=buildSecuritiesValuationHistory([trade],adjusted,{asOf:new Date('2026-02-02T23:00:00Z')});
  assert.equal(value.status,'unavailable');
  assert.deepEqual(value.rows,[]);
  assert.match(value.reason,/splits|corporate actions/i);
});

test('full liquidation is not silently omitted from a purported value history',()=>{
  const trades=[trade,{symbol:'AAPL.US',type:'SELL',shares:1,price:110,fees:0,date:'2026-02-02',currency:'USD'}],histories={'AAPL.US':{status:'live',symbol:'AAPL.US',currency:'USD',source:'EODHD',data:[{date:'2026-01-02',close:100},{date:'2026-02-02',close:110}]}},value=buildSecuritiesValuationHistory(trades,histories,{asOf:new Date('2026-02-02T23:00:00Z')});
  assert.equal(value.status,'unavailable');
  assert.deepEqual(value.rows,[]);
});
