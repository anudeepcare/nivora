import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('metric help uses a compact inline info control',()=>{
  const s=fs.readFileSync('components/v65/MetricInfo.tsx','utf8');
  assert.doesNotMatch(s,/>\?<\/button>/);
  assert.doesNotMatch(s,/>Details<\/button>/);
  assert.match(s,/v6516InfoGlyph/);
});

test('analyze page keeps deep evidence behind one disclosure',()=>{
  const s=fs.readFileSync('components/InvestorDecisionHero.tsx','utf8');
  assert.match(s,/v653DeepResearch/);
  assert.match(s,/Explore full analysis/);
  assert.match(s,/BUY CANDIDATE/);
});

test('trading lab has one-click paper verification endpoint',()=>{
  const api=fs.readFileSync('app/api/trading-lab/run-now/route.ts','utf8');
  const ui=fs.readFileSync('app/trading-lab/page.tsx','utf8');
  assert.match(api,/auth\.getUser/);
  assert.match(api,/api\/portfolio\/learn/);
  assert.match(api,/api\/trading-lab\/run-paper/);
  assert.match(ui,/Run paper check now/);
});

test('trading lab hides migration instructions from primary UX',()=>{
  const s=fs.readFileSync('app/trading-lab/page.tsx','utf8');
  assert.doesNotMatch(s,/Deploy the V65 trading-runs migration/);
  assert.doesNotMatch(s,/Run supabase\//);
});

test('owner guidance consumes the actual owner Today action',()=>{
 const s=fs.readFileSync('components/InvestorDecisionHero.tsx','utf8');
 assert.match(s,/ownerAction:owns\?action:"HOLD"/);
});
