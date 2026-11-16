import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeSentiSenseGrow as grow} from '../lib/sentisense-grow.ts';
const call=(dataset,raw)=>grow('IREN',dataset,raw,'2026-11-16T12:00:00Z','2025-11-16','2027-02-16');
test('SentiSense Grow profile uses documented fields, no numeric coercion or credentials in website',()=>{
 const r=call('profile',{ticker:'IREN',name:'Iren',ceo:'Example',employees:'100',currency:'usd',homepageUrl:'https://secret:pw@example.com'});
 assert.equal(r.profile.ceo,'Example');assert.equal(r.profile.employees,null);assert.equal(r.profile.website,null);assert.equal(r.currency,'USD');
 assert.throws(()=>call('profile',{ticker:'APP'}));
});
test('SentiSense Grow earnings preserves zero/null and suppresses future actuals',()=>{
 const r=call('earnings',{data:{earnings:[{ticker:'IREN',earningsDate:'2026-11-01',actualEps:0,estimatedEps:-1},{ticker:'IREN',earningsDate:'2026-12-01',actualEps:4,estimatedEps:null}]}});
 assert.equal(r.currency,null);assert.equal(r.earnings[0].actual,null);assert.equal(r.earnings[1].actual,0);assert.equal(r.earnings[1].surprise,100);
 assert.throws(()=>call('earnings',{isPreview:true,data:{earnings:[]}}));
});
test('Unsupported datasets never become successful empty results',()=>{for(const kind of ['dividends','splits','announcements'])assert.throws(()=>call(kind,{}));});
test('Provider branches before legacy and monitor selects SentiSense calendar',()=>{
 const p=readFileSync(new URL('../lib/grow-provider.ts',import.meta.url),'utf8');assert.ok(p.indexOf('if (isSentiSenseMarket())')<p.indexOf('if (eodEnabled())'));
 const m=readFileSync(new URL('../lib/monitor.ts',import.meta.url),'utf8');assert.match(m,/await sentiSenseCalendar\(\[rule.symbol\], from, to\)/);
});
