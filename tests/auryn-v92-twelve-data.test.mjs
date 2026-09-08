import test from 'node:test';
import assert from 'node:assert/strict';
let mod; try{mod=await import('../.engine-test/auryn/v92/twelve-data.js')}catch{}

const payload={meta:{symbol:'AAA',interval:'1day',currency:'USD',exchange:'NASDAQ',exchange_timezone:'America/New_York',type:'Common Stock'},values:[
 {datetime:'2024-01-03',open:'101',high:'103',low:'100',close:'102',volume:'1200'},
 {datetime:'2024-01-02',open:'100',high:'102',low:'99',close:'101',volume:'1000'}
]};

test('V9.2 builds Twelve Data historical request with explicit bounds and adjust=all',()=>{
 assert.ok(mod,'V9.2 Twelve Data adapter must exist');
 const u=mod.buildTwelveDataDailyUrl({symbol:'AAA',startDate:'2020-01-01',endDate:'2024-12-31',apiKey:'secret'});
 const p=new URL(u);
 assert.equal(p.pathname,'/time_series');
 assert.equal(p.searchParams.get('symbol'),'AAA');
 assert.equal(p.searchParams.get('interval'),'1day');
 assert.equal(p.searchParams.get('start_date'),'2020-01-01');
 assert.equal(p.searchParams.get('end_date'),'2024-12-31');
 assert.equal(p.searchParams.get('adjust'),'all');
 assert.equal(p.searchParams.get('apikey'),'secret');
 assert.equal(p.searchParams.has('outputsize'),false,'bounded historical request must not silently truncate with outputsize');
});

test('V9.2 normalizes reverse provider payload into ascending explicitly adjusted bars',()=>{
 const r=mod.normalizeTwelveDataDaily('AAA',payload);
 assert.deepEqual(r.bars.map(x=>x.date),['2024-01-02','2024-01-03']);
 assert.equal(r.bars.every(x=>x.adjusted===true),true);
 assert.equal(r.bars[0].close,101);
 assert.equal(r.provider.exchange,'NASDAQ');
 assert.equal(r.provider.timezone,'America/New_York');
});

test('V9.2 refuses provider error payloads and invalid OHLC geometry',()=>{
 assert.throws(()=>mod.normalizeTwelveDataDaily('AAA',{status:'error',message:'credits exhausted'}),/credits exhausted|provider/i);
 const bad=structuredClone(payload); bad.values[0].low='200';
 assert.throws(()=>mod.normalizeTwelveDataDaily('AAA',bad),/OHLC|geometry/i);
});
