import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');

test('canonical V9.3.1 decision is persisted with the validation snapshot for reuse across surfaces',()=>{
 const stock=read('components/StockClient.tsx');
 assert.match(stock,/v931:institutionalDecision\?\{snapshotId:institutionalDecision\.snapshotId/);
 assert.match(stock,/newMoneyAction:institutionalDecision\.newMoneyAction/);
 assert.match(stock,/ownerAction:institutionalDecision\.ownerAction/);
 assert.match(stock,/setupState:institutionalDecision\.setupState/);
});

test('decision summary API overlays last verified canonical decision with current Market Truth',()=>{
 const s=read('app/api/decision/summaries/route.ts');
 assert.match(s,/nivora_v59_decision_snapshots/);
 assert.match(s,/market-data-gateway/);
 assert.match(s,/CANONICAL_LAST_VERIFIED/);
 assert.match(s,/canonicalAction/);
 assert.match(s,/canonicalOwnerAction/);
 assert.match(s,/snapshot\?\.displayPrice/);
 assert.match(s,/priceUse/);
});

test('watchlist shows canonical decision status instead of presenting scanner action as the AURYN call',()=>{
 const s=read('app/watchlist/page.tsx');
 assert.match(s,/\/api\/decision\/summaries/);
 assert.match(s,/canonicalAction/);
 assert.match(s,/CANONICAL DECISION|ANALYZE FOR CALL/);
 assert.doesNotMatch(s,/x\.action&&<strong/);
});

test('portfolio owner actions prefer canonical owner decisions and never derive a company call from stored scan action',()=>{
 const s=read('app/portfolio/page.tsx');
 assert.match(s,/\/api\/decision\/summaries/);
 assert.match(s,/canonicalOwnerAction/);
 assert.doesNotMatch(s,/q\?\.ownerAction\|\|q\?\.action/);
});

test('alerts expose canonical decision and canonical current price beside a price trigger',()=>{
 const s=read('app/alerts/page.tsx');
 assert.match(s,/\/api\/decision\/summaries/);
 assert.match(s,/canonicalAction/);
 assert.match(s,/displayPrice/);
});

test('stock-wide institutional brief sits above evidence tabs so every stock tab shares one call',()=>{
 const s=read('components/StockClient.tsx');
 assert.ok(s.indexOf('<InstitutionalDecisionBrief')<s.indexOf('<StockEvidenceNav'));
 const brief=read('components/stock/v931/InstitutionalDecisionBrief.tsx');
 for(const x of ['Business quality','Earnings & revisions','Valuation / expected return','Market structure','Catalysts / regime','Risk / asymmetry']) assert.match(read('lib/auryn/v931/decision-kernel.ts'),new RegExp(x.replace(/[&/]/g,'\\$&'),'i'));
 assert.match(brief,/WHAT UPGRADES IT/);
 assert.match(brief,/WHAT BREAKS IT/);
 assert.match(brief,/PREFERRED ENTRY/);
});

test('stock experience has one canonical expert view with no legacy decision duplicate',()=>{
 const stock=read('components/StockClient.tsx');
 const brief=read('components/stock/v931/InstitutionalDecisionBrief.tsx');
 assert.match(stock,/InstitutionalDecisionBrief decision=\{institutionalDecision\} marketTruth=\{marketTruth\}/);
 assert.doesNotMatch(stock,/const\[depth,setDepth\]/);
 assert.doesNotMatch(stock,/<StockV5Decision/);
 assert.doesNotMatch(stock,/Extreme Pro · model diagnostics/);
 assert.doesNotMatch(brief,/Beginner|Extreme Pro|Research depth/);
 assert.match(brief,/Evidence quality/i);
 assert.match(brief,/not a probability/i);
 assert.doesNotMatch(brief,/<details|Full evidence & model trace|DECISION ATTRIBUTION/);
 assert.doesNotMatch(stock,/AstraAnalystPanel/);
});

test('evidence tabs explain the same institutional decision with pillar-specific rationale instead of generic tab copy',()=>{
 const stock=read('components/StockClient.tsx');
 for(const pillar of ['business','earningsRevisions','marketStructure','catalystsRegime','riskAsymmetry']) assert.match(stock,new RegExp(`institutionalDecision\\?\\.pillars\\.${pillar}\\.why`));
 assert.match(stock,/action=\{institutionalDecision\?\.newMoneyAction\?\?v5Analysis\?\.decision\.primaryAction\}/);
});

test('Trading Lab is bound to the persisted canonical decision and treats V5 as challenger only',()=>{
 const stock=read('components/StockClient.tsx');
 const run=read('app/api/trading-lab/run-paper/route.ts');
 const status=read('app/api/trading-lab/status/route.ts');
 assert.match(stock,/canonicalPrimaryAction:institutionalDecision\.canonicalPrimaryAction/);
 assert.match(stock,/executionAction:institutionalDecision\.executionAction/);
 assert.match(run,/v931Meta/);
 assert.doesNotMatch(run,/CANONICAL_DECISION_DIVERGENCE/);
 assert.match(run,/CANONICAL_HARD_VETO|hardVetoReasons/);
 assert.match(run,/mapInstitutionalActionToToday/);
 assert.match(status,/select\("id,symbol,observed_at,decision,evidence"\)/);
 assert.match(status,/v931\?\.newMoneyAction/);
});
