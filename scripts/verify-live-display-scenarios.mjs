import fs from 'node:fs';import assert from 'node:assert/strict';import {revenueSensitivity} from '../lib/revenue-sensitivity.ts';
const input=JSON.parse(fs.readFileSync('verification/core-scenario-20261108/live-display-inputs.json'));
export const cases=input.rows.map(row=>{
 const research={company:{symbol:row.symbol,assetType:'stock',currency:'USD',exchange:'NASDAQ'},quote:{price:row.quote,currency:'USD',asOf:row.quoteAsOf??input.quoteAsOf,stale:false},retrievedAt:'2026-11-08T23:00:00Z',history:[],facts:[],evidence:{source:'EODHD',updatedAt:input.observedAt,estimates:[{date:row.end,period:'FY'+row.end.slice(0,4),frequency:'Annual',currency:row.estimateCurrency,revenueLow:row.revenueLow,revenue:row.revenue,revenueHigh:row.revenueHigh}]}};
 const result=revenueSensitivity(research);assert.equal(result.available,true,row.symbol);assert.equal(result.cases[1].target,row.quote);assert.ok(result.cases[0].target<=row.quote&&result.cases[2].target>=row.quote);return {symbol:row.symbol,result};
});
if(process.argv[1]?.endsWith('verify-live-display-scenarios.mjs'))console.log(JSON.stringify({scope:'Local calculation replay of six real displayed, rounded forecast ranges; NOT deployed after-change verification',cases},null,2));
