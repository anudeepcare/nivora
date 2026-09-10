import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');

test('audit number parsing preserves null and accepts signed consensus scores', async()=>{
  const u=await import('../scripts/v934_live_audit_utils.mjs');
  assert.equal(u.finiteNumber(null),null);
  assert.equal(u.finiteNumber(undefined),null);
  assert.equal(u.finiteNumber(''),null);
  assert.equal(u.finiteNumber('12.5'),12.5);
  assert.equal(u.validConsensusScore(-100),true);
  assert.equal(u.validConsensusScore(-42),true);
  assert.equal(u.validConsensusScore(0),true);
  assert.equal(u.validConsensusScore(100),true);
  assert.equal(u.validConsensusScore(101),false);
});

test('audit universe always includes golden symbols before diversified fill', async()=>{
  const u=await import('../scripts/v934_live_audit_utils.mjs');
  const selected=u.selectAuditSymbols(['AMBO','BCO','EME','GDHG','HVMC','LRCX','PEB','RGNT','SQM','VNET','BRO','CTRI'],10);
  for(const s of ['SPY','QQQ','AAPL','MSFT','NVDA','IREN','BE','ASTS','SAP']) assert.ok(selected.includes(s),`${s} missing from golden audit`);
  assert.equal(selected.length,10);
});

test('V9.3.4.1 confirmed decision history excludes blocking 15-minute fetches', async()=>{
  const mod=await import('../.engine-test/auryn/v934/twelve-multitimeframe.js');
  const urls=[];
  const fetchJson=async url=>{urls.push(url);return {values:[]}};
  await mod.loadV934DecisionBars({symbol:'QQQ',key:'x',asOf:new Date('2026-09-10T18:45:00Z'),fetchJson});
  assert.ok(urls.some(x=>x.includes('interval=4h')));
  assert.ok(urls.some(x=>x.includes('interval=1day')));
  assert.ok(!urls.some(x=>x.includes('interval=15min')),'15-minute request must not block core decision path');
});

test('V9.3.4.1 live context remains separate from the core and may enrich 4H progressively', async()=>{
  const mod=await import('../.engine-test/auryn/v934/twelve-multitimeframe.js');
  const urls=[];
  const fetchJson=async url=>{urls.push(url);return {values:[]}};
  const r=await mod.loadV934LiveContext({symbol:'QQQ',key:'x',asOf:new Date('2026-09-10T18:45:00Z'),fetchJson});
  assert.equal(urls.filter(x=>x.includes('interval=15min')).length,1);
  assert.ok(urls.some(x=>x.includes('interval=15min')&&x.includes('prepost=true')));
  assert.ok(urls.some(x=>x.includes('interval=4h')),'4H enrichment may load progressively instead of blocking the core');
  assert.ok(r.preview);
});

test('analyze route distinguishes temporary provider failure from permanent no-history coverage',()=>{
  const src=read('app/api/analyze/[symbol]/route.ts');
  assert.match(src,/loadV934DecisionBars/);
  assert.doesNotMatch(src,/loadV934MarketBars\(/);
  assert.match(src,/PROVIDER_TEMPORARY_FAILURE/);
  assert.match(src,/status:503/);
});

test('stock page never collapses to a full-screen analysis error and loads tactical context separately',()=>{
  const src=read('components/StockClient.tsx');
  assert.doesNotMatch(src,/if\(err\)return\s*<div className="osError"/);
  assert.match(src,/market-intelligence\/live/);
  assert.match(src,/research temporarily updating|core research temporarily updating/i);
  assert.match(src,/liveMarketContext/);
  assert.match(src,/aurynProgressiveResearch/);
});

test('decision UX clearly separates technical state from investment action and market plan',()=>{
  const src=read('components/stock/v931/InstitutionalDecisionBrief.tsx');
  assert.match(src,/Technical structure/);
  assert.match(src,/new money remains/);
  assert.match(src,/v934DecisionPlan/);
  assert.match(src,/MARKET PLAN/);
  assert.match(src,/DECISION LOGIC/);
});

test('V9.3.4 live audit uses corrected helpers and golden-first selection',()=>{
  const src=read('scripts/run_v934_live_audit.mjs');
  assert.match(src,/v934_live_audit_utils\.mjs/);
  assert.match(src,/selectAuditSymbols/);
  assert.match(src,/validConsensusScore/);
  assert.match(src,/market-intelligence\/live/);
  assert.match(src,/PROVIDER_TEMPORARY_FAILURE/);
  assert.doesNotMatch(src,/score<0\|\|score>100/);
});
