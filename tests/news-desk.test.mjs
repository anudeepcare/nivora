import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const load=async()=>{assert.ok(fs.existsSync('lib/news-desk.ts'),'news presentation helper missing');return import('../lib/news-desk.ts')};
const now=Date.parse('2026-11-15T12:00:00Z');
const rows=[
 {title:'ServiceNow reports quarterly results',date:'2026-11-14T12:00:00Z',url:'https://example.com/now?utm_source=mail',sentiment:.3},
 {title:'ServiceNow reports quarterly results',date:'2026-11-14T11:00:00Z',url:'https://example.com/now',sentiment:.3},
 {title:'Southwest reports earnings',date:'2026-11-15T09:00:00Z',url:'https://other.com/air',sentiment:.8},
 {title:'Analysts discuss $NOW',date:'2026-11-15T10:00:00Z',url:'https://example.com/analysts',sentiment:null},
 {title:'ServiceNow future headline',date:'2026-11-16',url:'https://example.com/future',sentiment:null},
 {title:'ServiceNow invalid URL',date:'2026-11-15',url:'javascript:alert(1)',sentiment:null},
];
test('News separates explicit company mentions from unmatched coverage without silently discarding it',async()=>{
 const {newsDesk}=await load();const v=newsDesk(rows,'NOW','ServiceNow, Inc.',now);
 assert.deepEqual(v.company.map(x=>x.title),['Analysts discuss $NOW','ServiceNow reports quarterly results']);
 assert.deepEqual(v.broader.map(x=>x.title),['Southwest reports earnings']);
 assert.equal(v.company[0].source,'example.com');
 assert.equal(v.company[0].date,rows[3].date);
});
test('News rejects future/invalid records and deduplicates title and tracked URLs',async()=>{
 const {newsDesk}=await load();const v=newsDesk(rows,'NOW','ServiceNow, Inc.',now);
 assert.equal(v.company.length+v.broader.length,3);
 assert.deepEqual(newsDesk(rows,'NOW','ServiceNow, Inc.',NaN),{company:[],broader:[]});
});
test('Ordinary word tickers do not turn unrelated articles into company news',async()=>{
 const {newsDesk}=await load();const v=newsDesk([{title:'Now is a good time to review markets',date:'2026-11-14',url:'https://example.com/market',sentiment:null}],'NOW','ServiceNow',now);
 assert.equal(v.company.length,0);assert.equal(v.broader.length,1);
});
test('Distinct non-Latin headlines remain separately accessible',async()=>{
 const {newsDesk}=await load();
 const v=newsDesk([
 {title:'今日の市場について',date:'2026-11-14',url:'https://example.com/one',sentiment:null},
 {title:'企業の決算について',date:'2026-11-14',url:'https://example.com/two',sentiment:null},
 ],'NOW','ServiceNow',now);
 assert.equal(v.broader.length,2);
});
test('Filings retain partial-coverage warnings and an explicit expansion beyond six records',()=>{
 const source=fs.readFileSync('components/NewsCoverage.tsx','utf8');
 assert.match(source,/filingsError && .*filings.*length/s);
 assert.match(source,/All supplied filings/);
});
test('News decodes publisher entities before duplicate matching, retaining plain escaped text',async()=>{
 const {newsDesk}=await load();
 const make=(title,i)=>({title,date:'2026-11-14',url:`https://example.com/${i}`,sentiment:null});
 const result=newsDesk([make('Hims &amp; Hers &#x2014; results',1),make('Hims & Hers — results',2),make('Hims &lt;script&gt;alert(1)&lt;/script&gt; &#99999999;',3)],'HIMS','Hims & Hers',now);
 const all=[...result.company,...result.broader];
 assert.equal(all.length,2);
 assert.equal(all[0].title,'Hims & Hers — results');
 assert.equal(all[1].title,'Hims <script>alert(1)</script> &#99999999;');
 assert.doesNotMatch(fs.readFileSync('components/NewsCoverage.tsx','utf8'),/dangerouslySetInnerHTML/);
});
