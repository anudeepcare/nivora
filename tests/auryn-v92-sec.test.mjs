import test from 'node:test';
import assert from 'node:assert/strict';
let mod; try{mod=await import('../.engine-test/auryn/v92/sec-companyfacts.js')}catch{}

const companyFacts={
 cik:1234,entityName:'Example Inc',facts:{'us-gaap':{
  Revenues:{label:'Revenues',units:{USD:[
   {fy:2023,fp:'FY',form:'10-K',filed:'2024-02-10',start:'2023-01-01',end:'2023-12-31',val:1000,accn:'0001'},
   {fy:2023,fp:'FY',form:'10-K/A',filed:'2024-03-01',start:'2023-01-01',end:'2023-12-31',val:1050,accn:'0002'}
  ]}},
  NetIncomeLoss:{label:'Net income',units:{USD:[{fy:2023,fp:'FY',form:'10-K',filed:'2024-02-10',start:'2023-01-01',end:'2023-12-31',val:120,accn:'0001'}]}},
  EarningsPerShareDiluted:{label:'EPS',units:{'USD/shares':[{fy:2023,fp:'FY',form:'10-K',filed:'2024-02-10',start:'2023-01-01',end:'2023-12-31',val:2.4,accn:'0001'}]}}
 }}
};

test('V9.2 SEC adapter uses filing date for public availability, never period end',()=>{
 assert.ok(mod,'V9.2 SEC adapter must exist');
 const facts=mod.normalizeSecCompanyFacts('AAA',companyFacts);
 const rev=facts.filter(x=>x.metric==='revenue');
 assert.equal(rev.length,2,'original filing and amendment must remain distinct point-in-time observations');
 assert.equal(rev[0].periodEnd,'2023-12-31');
 assert.equal(rev[0].availableAt,'2024-02-10');
 assert.equal(rev[1].availableAt,'2024-03-01');
 assert.equal(rev[1].value,1050);
});

test('V9.2 SEC adapter maps supported units deterministically and ignores unsupported facts',()=>{
 const a=mod.normalizeSecCompanyFacts('AAA',companyFacts);
 const b=mod.normalizeSecCompanyFacts('AAA',structuredClone(companyFacts));
 assert.deepEqual(a,b);
 assert.ok(a.some(x=>x.metric==='net_income'&&x.value===120));
 assert.ok(a.some(x=>x.metric==='eps_diluted'&&x.value===2.4));
 assert.equal(a.some(x=>!Number.isFinite(x.value)),false);
});

test('V9.2 SEC adapter rejects rows without a filing date rather than leaking period-end knowledge',()=>{
 const bad=structuredClone(companyFacts); delete bad.facts['us-gaap'].Revenues.units.USD[0].filed;
 assert.throws(()=>mod.normalizeSecCompanyFacts('AAA',bad),/filed|availability/i);
});

test('V9.2 derives growth and margins only from annual filing anchors, never Q3/YTD facts',()=>{
 const p={facts:{'us-gaap':{
  Revenues:{units:{USD:[
   {fy:2022,fp:'FY',form:'10-K',filed:'2023-02-10',start:'2022-01-01',end:'2022-12-31',val:100,accn:'a'},
   {fy:2023,fp:'Q3',form:'10-Q',filed:'2023-11-01',start:'2023-01-01',end:'2023-09-30',val:90,accn:'b'},
   {fy:2023,fp:'FY',form:'10-K',filed:'2024-02-10',start:'2023-01-01',end:'2023-12-31',val:120,accn:'c'}
  ]}},
  GrossProfit:{units:{USD:[
   {fy:2022,fp:'FY',form:'10-K',filed:'2023-02-10',start:'2022-01-01',end:'2022-12-31',val:50,accn:'a'},
   {fy:2023,fp:'FY',form:'10-K',filed:'2024-02-10',start:'2023-01-01',end:'2023-12-31',val:66,accn:'c'}
  ]}}
 }}};
 const n=mod.normalizeAndDeriveSecCompanyFacts('AAA',p);
 assert.equal(n.derived.some(x=>x.availableAt==='2023-11-01'),false,'quarterly/YTD filing must not create annual growth metrics');
 const g=n.derived.find(x=>x.metric==='revenue_growth'&&x.availableAt==='2024-02-10');
 assert.ok(g);assert.equal(g.value,20);
 const m=n.derived.find(x=>x.metric==='gross_margin'&&x.availableAt==='2024-02-10');assert.ok(m);assert.equal(m.value,55);
});
