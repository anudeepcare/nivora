import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');

test('stock research renders one canonical multi-timeframe tape and evidence-backed action map',()=>{
 const src=read('components/StockClient.tsx');
 assert.match(src,/MarketTimeframeTape/);
 assert.match(src,/MarketActionMap/);
 assert.match(src,/marketIntelligence/);
 const tape=read('components/market/MarketTimeframeTape.tsx');
 for(const tf of ['15M','1H','4H','1D','1W'])assert.match(tape,new RegExp(tf));
});

test('institutional decision brief uses V9.3.4 action map rather than legacy execution levels when available',()=>{
 const src=read('components/stock/v931/InstitutionalDecisionBrief.tsx');
 assert.match(src,/marketIntelligence/);
 assert.match(src,/actionMap/);
 assert.match(src,/MarketActionMap/);
 const map=read('components/market/MarketActionMap.tsx');
 assert.match(map,/PREFERRED ENTRY|RECOVERY \/ WATCH ZONE/);assert.match(map,/CONFIRM/);assert.match(map,/T1/);assert.match(map,/T2/);assert.match(map,/RISK \/ INVALIDATION/);
});

test('portfolio holdings surface canonical market intelligence state and next level',()=>{
 const page=read('app/portfolio/page.tsx');
 const holdings=read('components/portfolio/HoldingsIntelligence.tsx');
 assert.match(page,/marketIntelligence/);
 assert.match(holdings,/marketIntelligence/);
 assert.match(holdings,/1D/);assert.match(holdings,/4H/);assert.match(holdings,/CONFIRM|Confirm/);
});

test('monitor shows timeframe context from decision summaries instead of only stored action text',()=>{
 const src=read('app/alerts/page.tsx');
 assert.match(src,/marketIntelligence/);
 assert.match(src,/4H/);assert.match(src,/1D/);assert.match(src,/1W/);
});

test('trading lab status and UI publish the same V9.3.4 snapshot identity used for execution',()=>{
 const status=read('app/api/trading-lab/status/route.ts');
 const page=read('app/trading-lab/page.tsx');
 assert.match(status,/evidence\?\.v934/);
 assert.match(status,/marketIntelligenceSnapshotId/);
 assert.match(page,/marketIntelligenceSnapshotId/);
 assert.match(page,/1D|4H/);
});

test('V9.3.4 UI remains editorial instead of introducing another metric-card dashboard',()=>{
 const css=read('app/auryn-product.css');
 assert.match(css,/v934TimeframeTape/);
 assert.match(css,/v934ActionMap/);
 assert.doesNotMatch(css,/v934KpiGrid|v934DashboardGrid/);
});
