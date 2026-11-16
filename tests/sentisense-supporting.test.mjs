import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSentiSenseNews as news, normalizeSentiSenseCalendar as calendar, normalizeSentiSenseCongress as congress, normalizeSentiSenseInsiders as insiders, normalizeSentiSenseOptions as options, normalizeSentiSensePeers as peers } from '../lib/sentisense-supporting-normalize.ts';
const now=Date.parse('2026-11-16T12:00:00Z');
test('news uses source labels, never invents article headlines and rejects unsafe/mismatched records',()=>{
 const row={url:'https://example.com/a',published:now/1000-100,source:'NEWS',sourceName:'Example',sentiment:[{ticker:'IREN'}],averageSentiment:0};
 const result=news({documents:[row,{...row,url:'https://example.com/b'},{...row,url:'javascript:bad'},{...row,url:'https://example.com/c',sentiment:[{ticker:'AAPL'}]}]},'IREN',now);
 assert.equal(result.items.length,2);assert.equal(result.items[0].title,'IREN · News from Example');assert.equal(result.items[0].sentiment,0);
});
test('calendar preserves zero and null EPS, restricts ticker and calendar dates',()=>{
 const raw={data:{earnings:[{ticker:'IREN',earningsDate:'2026-11-17',actualEps:0,estimatedEps:null,earningsTime:'after_close'}]}};
 assert.deepEqual(calendar(raw,['IREN'],'2026-11-16','2026-11-20').map(r=>[r.actual,r.estimate]),[[0,null]]);
 assert.equal(calendar(raw,['APP'],'2026-11-16','2026-11-20').length,0);
 assert.throws(()=>calendar({...raw,isPreview:true},['IREN'],'2026-11-16','2026-11-20'));
});
test('congress has no invented filing URL, future and mismatched records excluded',()=>{
 const row={ticker:'APP',transactionDate:'2026-11-01',disclosureDate:'2026-11-05',politicianName:'Example Member',chamber:'HOUSE',transactionType:'PURCHASE',amountRange:'$1,001–$15,000'};
 const got=congress({data:[row,{...row,ticker:'IREN'},{...row,disclosureDate:'2026-12-01'}]},'APP','2026-11-16');
 assert.equal(got.length,1);assert.equal(got[0].filingUrl,'');assert.equal(got[0].lagDays,4);
});
test('insider tax withholding is not a market sale and unknown direction is omitted',()=>{
 const row={ticker:'APP',transactionDate:'2026-11-01',filedDate:'2026-11-02',insiderName:'Example',sharesTransacted:10,transactionCode:'F',pricePerShare:2};
 const got=insiders({data:[row,{...row,transactionCode:'M'}]},'APP','2026-11-16');
 assert.equal(got.length,1);assert.equal(got[0].change,-10);assert.equal(got[0].action,'Tax withholding');
});
test('options preserve fractions and missing data, reject preview/future dates',()=>{
 const raw={data:{asOf:'2026-11-13',latest:{atmIv:0.4,callVol:0,putVol:null,expectedMove1d:0.02}}};
 const got=options(raw,'APP','2026-11-16');assert.equal(got.snapshot.metrics.atmIv,0.4);assert.equal(got.snapshot.metrics.callVol,0);assert.equal(got.snapshot.metrics.putVol,null);
 assert.equal(options({data:null},'APP','2026-11-16').status,'unavailable');
 assert.throws(()=>options({...raw,isPreview:true},'APP','2026-11-16'));
 assert.throws(()=>options(raw,'APP','2026-11-01'));
});
test('peers do not infer market caps or sectors',()=>{assert.deepEqual(peers([{ticker:'NVDA',name:'Nvidia'}],'APP'),[{symbol:'NVDA',name:'Nvidia',marketCap:null,sector:'',industry:''}]);});
