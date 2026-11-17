import test from 'node:test';
import assert from 'node:assert/strict';
const m=await import('../lib/revenue-sensitivity.ts').catch(()=>({}));
const fixture=()=>({
 company:{symbol:'ASTS',assetType:'stock',currency:'USD',exchange:'NASDAQ'},
 quote:{price:100,currency:'USD',asOf:'2026-10-26T13:23:00Z',stale:false,session:'Live · premarket',source:'test'},
 history:[],facts:[],filings:[],issues:[],retrievedAt:'2026-10-26T13:24:00Z',
 evidence:{updatedAt:'2026-10-26',profile:{sector:'Technology',industry:'Communications'},estimates:[
 {date:'2027-12-31',period:'FY2027',frequency:'Annual',currency:'USD',revenueLow:80,revenue:100,revenueHigh:150},
 ]},
});
function run(r=fixture(),options){assert.equal(typeof m.revenueSensitivity,'function');return m.revenueSensitivity(r,options);}
test('one complete annual range anchors base exactly to price with explicit relative pricing stresses',()=>{
 const r=fixture(),before=structuredClone(r),result=run(r);
 assert.equal(result.available,true);assert.equal(result.basis,'revenue-sensitivity');
 assert.equal(result.anchorRevenue,100);assert.equal(result.reference.price,100);
 assert.deepEqual(result.cases.map(x=>x.target),[64,100,180]);
 assert.deepEqual(result.cases.map(x=>x.relativePricingStress),[.8,1,1.2]);
 assert.equal(result.cases[1].change,0);assert.match(result.caveat,/neutral price anchor/);
 assert.match(result.caveat,/constant.*FX|FX.*constant/i);assert.match(result.caveat,/not.*fair value/);
 assert.equal('analysts' in result,false);assert.equal('forwardPE' in result,false);assert.deepEqual(r,before);
});
test('same-period ratio cancels reporting currency units but never invents conversion or cross-year growth',()=>{
 const r=fixture();r.evidence.estimates[0].currency='EUR';
 r.evidence.estimates.push({...r.evidence.estimates[0],date:'2028-12-31',period:'FY2028',revenueLow:800,revenue:1000,revenueHigh:1500});
 const result=run(r,{fiscalEnd:'2028-12-31'});assert.equal(result.available,true);
 assert.equal(result.estimateCurrency,'EUR');assert.deepEqual(result.cases.map(x=>x.target),[64,100,180]);
 assert.equal(result.anchorRevenue,1000);assert.equal(run(r).end,'2027-12-31');
 assert.equal(run(r,{fiscalEnd:'2030-12-31'}).available,false);
});
test('missing, malformed, quarterly, invalid-currency or nonpositive ranges never create targets',()=>{
 for(const patch of [{revenueLow:null},{revenueHigh:Infinity},{revenue:0},{revenueLow:101},{revenueHigh:99},{currency:'ZZZ'},{frequency:'Quarterly'},{frequency:'Not Annual'},{period:'FY2035'},{date:'2027-02-30'},{date:'2026-12-31'},{date:'2032-12-31'}]){
  const r=fixture();Object.assign(r.evidence.estimates[0],patch);assert.equal(run(r).available,false,JSON.stringify(patch));
 }
});
test('expired or future evidence and absent recent price withhold sensitivities',()=>{
 for(const stamp of ['2025-01-01','2026-10-27','invalid']){const r=fixture();r.evidence.updatedAt=stamp;assert.equal(run(r).available,false);}
 const r=fixture();r.quote.asOf='2026-01-01';assert.equal(run(r).available,false);
 r.retrievedAt='invalid';assert.equal(run(r).available,false);
});
test('uses selected settled price rather than discarded quote and requires listing currency consistency',()=>{
 const r=fixture();r.retrievedAt='2026-10-27T13:24:00Z';r.quote.asOf='2026-10-23T20:00:00Z';r.quote.price=999;r.quote.stale=true;
 r.history=[{time:'2026-10-26',open:110,high:110,low:110,close:110,volume:100}];
 const result=run(r);assert.equal(result.available,true);assert.equal(result.reference.basis,'settled-close');assert.equal(result.cases[1].target,110);
 r.quote.currency='EUR';assert.equal(run(r).available,false);
});
test('supports operating, infrastructure and frontier without allowing specialist or crypto models',()=>{
 for(const symbol of ['APP','MSFT','CIFR','NBIS','IREN','ASTS']){const r=fixture();r.company.symbol=symbol;assert.equal(run(r).available,true,symbol);}
 for(const [sector,industry] of [['Financial Services','Banks - Regional'],['Healthcare','Healthcare Plans'],['Real Estate','REIT - Retail'],['Financial Services','Asset Management']]){
  const r=fixture();r.company.symbol='EXAMPLE';r.evidence.profile={sector,industry};assert.equal(run(r).available,false,industry);
 }
 const r=fixture();r.company.assetType='crypto';assert.equal(run(r).available,false);
});
test('conflicting annual observations for the selected fiscal end are not chosen arbitrarily',()=>{
 const r=fixture();r.evidence.estimates.push({...r.evidence.estimates[0],revenue:120});assert.equal(run(r).available,false);
 r.evidence.estimates[1]={...r.evidence.estimates[0]};assert.equal(run(r).available,true);
});
