import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url).pathname;

const read=p=>fs.readFileSync(root+p,'utf8');

test('premium research overview exists and owns hero chart metrics and scenario balance',()=>{
 const p=read('components/premium/AurynResearchOverview.tsx');
 assert.match(p,/AURYN CALL/);
 assert.match(p,/PriceChart/);
 assert.match(p,/KEY METRICS/);
 assert.match(p,/Scenario (?:value|spectrum)/);
 assert.match(p,/Pattern/);
 assert.match(p,/Reward \/ Risk/);
});

test('StockClient renders premium overview instead of the legacy institutional first-screen component',()=>{
 const s=read('components/StockClient.tsx');
 assert.match(s,/AurynResearchOverview/);
 assert.doesNotMatch(s,/<InstitutionalDecisionBrief decision=/);
});

test('overview relies on existing canonical evidence and introduces no provider fetch',()=>{
 const p=read('components/premium/AurynResearchOverview.tsx');
 assert.doesNotMatch(p,/fetch\(/);
 assert.doesNotMatch(p,/twelvedata|alpaca/i);
});

test('premium overview only imports lucide icons supported by the pinned icon package',()=>{
 const p=read('components/premium/AurynResearchOverview.tsx');
 assert.doesNotMatch(p,/\bWaveform\b/);
});

test('premium overview renders decision-grade bear base bull values instead of percentage scenario balance',()=>{
 const p=read('components/premium/AurynResearchOverview.tsx');
 assert.match(p,/Scenario (?:value|spectrum)/);
 assert.match(p,/scenarioValue/);
 assert.match(p,/>BULL</);
 assert.match(p,/>BASE</);
 assert.match(p,/>BEAR</);
 assert.doesNotMatch(p,/lens\.scenarioBalance\.bull}%/);
});

test('premium overview includes premium investor experience metrics without creating a second decision engine',()=>{
 const p=read('components/premium/AurynResearchOverview.tsx');
 assert.match(p,/To Confirm/);
 assert.match(p,/To T1/);
 assert.match(p,/Downside/);
 assert.match(p,/Evidence/);
 assert.match(p,/Opportunity/);
 assert.doesNotMatch(p,/fetch\(/);
});

test('security masthead supports premium company logo treatment with deterministic fallback',()=>{
 const p=read('components/stock/StockSecurityHeader.tsx');
 assert.match(p,/SecurityLogo/);
 assert.match(p,/AAPL:"apple"/);
 assert.match(p,/cdn\.simpleicons\.org/);
 assert.match(p,/aurynSecurityLogoFallback/);
});

test('research navigation follows mockup hierarchy with Overview first and sits before premium overview',()=>{
 const nav=read('components/stock/StockEvidenceNav.tsx');
 const stock=read('components/StockClient.tsx');
 assert.match(nav,/\['thesis','Overview'\]/);
 const navIndex=stock.indexOf('<StockEvidenceNav');
 const overviewIndex=stock.indexOf('<AurynResearchOverview');
 assert.ok(navIndex>=0 && overviewIndex>=0 && navIndex<overviewIndex,'evidence nav must render before premium overview');
});
