import test from 'node:test';
import assert from 'node:assert/strict';
import {routeMetadata,publicPaths,SITE_URL,SUPPORT_EMAIL} from '../lib/site-metadata.ts';
import {analyticsPath,safeAnalyticsEvent,validMeasurementId} from '../lib/analytics-policy.ts';
test('public SEO has unique canonical titles and private routes cannot be indexed',()=>{
 assert.equal(SITE_URL,'https://www.auryninvest.com'); assert.equal(SUPPORT_EMAIL,'support@auryninvest.com');
 assert.equal(new Set(publicPaths.map(p=>routeMetadata(p).title)).size,publicPaths.length);
 for(const p of publicPaths) {const m=routeMetadata(p);assert.equal(m.robots.index,true);assert.equal(m.alternates.canonical,SITE_URL+p);}
 for(const p of ['/research/AAPL','/preview','/portfolio','/settings','/login','/unknown']) {const m=routeMetadata(p);assert.equal(m.robots.index,false);assert.equal(m.alternates?.canonical,undefined);}
});
test('analytics drops queries, tickers, unknown routes and all free text',()=>{
 assert.equal(analyticsPath('/research/AAPL?email=a@b.com'),'/research');
 assert.equal(analyticsPath('/preview/research/AAPL'),null);
 assert.equal(analyticsPath('/unknown/private'),null);
 assert.equal(validMeasurementId('G-ABC123'),true);assert.equal(validMeasurementId('G-foo<script>'),false);
 assert.equal(safeAnalyticsEvent('email_sent',{email:'x'}),null);
 const e=safeAnalyticsEvent('search_result',{outcome:'success',duration:1234,query:'AAPL',email:'x',ticker:'AAPL',count:8});
 assert.deepEqual(e,{name:'search_result',params:{outcome:'success',duration_bucket:'1–3s'}});
 assert.equal(safeAnalyticsEvent('search_result',{outcome:'AAPL'}),null);
});
