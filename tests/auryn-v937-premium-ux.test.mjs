import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url).pathname;
const read=p=>fs.readFileSync(root+p,'utf8');

test('security identity uses provider logo then deterministic fallback and exposes optional market facts',()=>{
 const h=read('components/stock/StockSecurityHeader.tsx');
 assert.match(h,/logoUrl/);
 assert.match(h,/onError/);
 assert.match(h,/marketCap/);
 assert.match(h,/week52High/);
 assert.match(h,/week52Low/);
 assert.match(h,/volume/);
});

test('research overview has semantic action hero and contextual metric help',()=>{
 const p=read('components/premium/AurynResearchOverview.tsx');
 assert.match(p,/actionClass/);
 assert.match(p,/MetricInfo/);
 assert.match(p,/Decision ladder/);
 assert.match(p,/Risk ladder/);
 assert.match(p,/Entry Quality/);
 assert.match(p,/Decision Freshness/);
});

test('research navigation scrolls selected evidence into view',()=>{
 const c=read('components/StockClient.tsx');
 assert.match(c,/handleEvidenceTab/);
 assert.match(c,/scrollIntoView/);
 assert.match(c,/<StockEvidenceNav tab={tab} setTab={handleEvidenceTab}/);
});

test('portfolio capital priorities are a ranked queue rather than three empty columns',()=>{
 const p=read('components/portfolio/PortfolioPulse.tsx');
 assert.match(p,/Capital Queue/);
 assert.match(p,/URGENCY/);
 assert.match(p,/NEXT TRIGGER/);
 assert.doesNotMatch(p,/CapitalBucket/);
});

test('holdings show current price pnl percent weight and next trigger',()=>{
 const p=read('components/portfolio/HoldingsIntelligence.tsx');
 assert.match(p,/CURRENT/);
 assert.match(p,/P\/L %/);
 assert.match(p,/WEIGHT/);
 assert.match(p,/NEXT TRIGGER/);
});

test('all portfolio periods remain available in the UI',()=>{
 const p=read('components/portfolio/PortfolioPulse.tsx');
 for(const period of ['1D','1W','1M','3M','6M','YTD','1Y','2Y','3Y','4Y','ALL']) assert.match(p,new RegExp(`"${period}"`));
 assert.match(p,/availableFrom/);
});
