import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData } from './fixtures/demo.ts';
import { aurynDecision } from '../lib/auryn-decision.ts';
import { workspaceGuidance } from '../lib/edge-research.ts';
import { decisionAttention } from '../lib/decision-attention.ts';
function riskResearch(cash, equity) {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = undefined;
  r.history = [];
  r.quote = { ...r.quote, price: null, asOf: null, stale: true };
  r.facts = [];
  for (const year of [2025, 2026]) {
    for (const [metric, value] of Object.entries({ revenue: 1000,
      operatingIncome: -100, operatingCashFlow: -100, capex: 100,
      cash, debt: 400, equity })) {
      const instant = ['cash', 'debt', 'equity'].includes(metric);
      r.facts.push({ id: `${year}-${metric}`, metric, value,
        unit: 'USD', currency: 'USD',
        start: instant ? '' : `${year - 1}-07-01`,
        end: `${year}-06-30`, filed: `${year}-07-30`,
        accession: `x${year}`, form: '10-K', sourceUrl: '', basis: 'GAAP',
        scope: instant ? 'instant' : 'annual' });
    }
  }
  return r;
}
for (const [cash, equity, owns, action] of [
  [10, -100, true, 'Sell'],
  [50, 100, true, 'Reduce'],
  [10, -100, false, 'Avoid'],
]) {
  test(`missing price does not erase an independently established ${action} business-risk review`, () => {
    const r = riskResearch(cash, equity), now = Date.parse(r.retrievedAt);
    const d = aurynDecision(r, { now, ownsPosition: owns });
    assert.equal(d.action, action);
    assert.equal(d.reference, null);
    const signal = workspaceGuidance(r, owns, now);
    const rows = decisionAttention({ symbols: ['MSFT', 'HOLD'],
      held: owns ? ['MSFT', 'HOLD'] : ['HOLD'],
      rows: { MSFT: { signal }, HOLD: { signal: {
        action: 'Hold', view: { detail: 'Supported', actionLabel: 'Hold' },
        contextLabel: 'For your holding',
      } } } });
    assert.equal(rows[0].symbol, 'MSFT');
    assert.equal(rows[0].action, action);
    assert.ok(rows[0].risk);
    assert.ok(rows[0].changeCondition);
    assert.equal(rows[0].assessmentAvailable, true);
  });
}
test('unusable financials still require evidence review rather than a retained risk verdict', () => {
  const r = riskResearch(10, -100);
  r.facts = [];
  const signal = workspaceGuidance(r, true, Date.parse(r.retrievedAt));
  const row = decisionAttention({ symbols: ['MSFT'], held: ['MSFT'],
    rows: { MSFT: { signal } } })[0];
  assert.equal(row.action, 'Review');
  assert.equal(row.assessmentAvailable, false);
});
